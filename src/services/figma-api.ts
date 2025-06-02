import axios, { AxiosInstance, AxiosResponse } from 'axios';
import NodeCache from 'node-cache';
import pRetry from 'p-retry';
import pLimit from 'p-limit';
import fs from 'fs/promises';
import path from 'path';
import {
  FigmaFileResponse,
  FigmaNodeResponse,
  FigmaImageResponse,
  FigmaProjectFilesResponse,
  FigmaError,
  FigmaNode,
  FigmaExportSetting
} from '../types/figma.js';

export interface FigmaApiConfig {
  apiKey: string;
  baseUrl?: string;
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
  cacheConfig?: {
    ttl: number;
    maxSize: number;
  };
  rateLimitConfig?: {
    requestsPerMinute: number;
    burstSize: number;
  };
}

export interface FigmaApiOptions {
  version?: string;
  ids?: string[];
  depth?: number;
  geometry?: 'paths' | 'vector';
  plugin_data?: string;
  branch_data?: boolean;
  use_absolute_bounds?: boolean;
}

export class FigmaApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'FigmaApiError';
  }
}

export class FigmaApiService {
  private client: AxiosInstance;
  private cache: NodeCache;
  private rateLimiter: ReturnType<typeof pLimit>;
  private config: Required<FigmaApiConfig>;

  constructor(config: FigmaApiConfig) {
    this.config = {
      baseUrl: 'https://api.figma.com/v1',
      timeout: 30000,
      retryAttempts: 3,
      retryDelay: 1000,
      cacheConfig: {
        ttl: 300, // 5 minutes
        maxSize: 1000
      },
      rateLimitConfig: {
        requestsPerMinute: 60,
        burstSize: 10
      },
      ...config
    };

    this.client = axios.create({
      baseURL: this.config.baseUrl,
      timeout: this.config.timeout,
      headers: {
        'X-Figma-Token': this.config.apiKey,
        'Content-Type': 'application/json',
        'User-Agent': 'Custom-Figma-MCP-Server/1.0.0'
      }
    });

    this.cache = new NodeCache({
      stdTTL: this.config.cacheConfig.ttl,
      maxKeys: this.config.cacheConfig.maxSize,
      useClones: false
    });

    // Rate limiter: allow burst of requests, then throttle
    this.rateLimiter = pLimit(this.config.rateLimitConfig.burstSize);

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor for logging and rate limiting
    this.client.interceptors.request.use(
      (config) => {
        console.log(`[Figma API] ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('[Figma API] Request error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => {
        console.log(`[Figma API] Response ${response.status} for ${response.config.url}`);
        return response;
      },
      (error) => {
        if (error.response) {
          const { status, data } = error.response;
          const figmaError = data as FigmaError;
          
          throw new FigmaApiError(
            figmaError.err || `HTTP ${status} error`,
            status,
            figmaError.err,
            data
          );
        } else if (error.request) {
          throw new FigmaApiError(
            'Network error: No response received',
            0,
            'NETWORK_ERROR',
            error.request
          );
        } else {
          throw new FigmaApiError(
            `Request setup error: ${error.message}`,
            0,
            'REQUEST_ERROR',
            error
          );
        }
      }
    );
  }

  private async makeRequest<T>(
    endpoint: string,
    options: FigmaApiOptions = {},
    useCache = true
  ): Promise<T> {
    const cacheKey = `${endpoint}:${JSON.stringify(options)}`;
    
    // Check cache first
    if (useCache) {
      const cached = this.cache.get<T>(cacheKey);
      if (cached) {
        console.log(`[Figma API] Cache hit for ${endpoint}`);
        return cached;
      }
    }

    // Rate limit the request
    return this.rateLimiter(async () => {
      const response = await pRetry(
        async () => {
          const response: AxiosResponse<T> = await this.client.get(endpoint, {
            params: this.buildParams(options)
          });
          return response;
        },
        {
          retries: this.config.retryAttempts,
          minTimeout: this.config.retryDelay,
          factor: 2,
          onFailedAttempt: (error) => {
            console.warn(
              `[Figma API] Attempt ${error.attemptNumber} failed for ${endpoint}. ${error.retriesLeft} retries left.`
            );
          }
        }
      );

      const data = response.data;
      
      // Cache successful responses
      if (useCache) {
        this.cache.set(cacheKey, data);
      }

      return data;
    });
  }

  private buildParams(options: FigmaApiOptions): Record<string, string> {
    const params: Record<string, string> = {};

    if (options.version) params.version = options.version;
    if (options.ids) params.ids = options.ids.join(',');
    if (options.depth !== undefined) params.depth = options.depth.toString();
    if (options.geometry) params.geometry = options.geometry;
    if (options.plugin_data) params.plugin_data = options.plugin_data;
    if (options.branch_data) params.branch_data = 'true';
    if (options.use_absolute_bounds) params.use_absolute_bounds = 'true';

    return params;
  }

  /**
   * Get a Figma file by its key
   */
  async getFile(fileKey: string, options: FigmaApiOptions = {}): Promise<FigmaFileResponse> {
    if (!fileKey || typeof fileKey !== 'string') {
      throw new FigmaApiError('File key is required and must be a string');
    }

    try {
      return await this.makeRequest<FigmaFileResponse>(`/files/${fileKey}`, options);
    } catch (error) {
      if (error instanceof FigmaApiError) {
        throw error;
      }
      throw new FigmaApiError(`Failed to get file ${fileKey}: ${error}`);
    }
  }

  /**
   * Get specific nodes from a Figma file
   */
  async getFileNodes(
    fileKey: string,
    nodeIds: string[],
    options: FigmaApiOptions = {}
  ): Promise<FigmaNodeResponse> {
    if (!fileKey || typeof fileKey !== 'string') {
      throw new FigmaApiError('File key is required and must be a string');
    }

    if (!nodeIds || !Array.isArray(nodeIds) || nodeIds.length === 0) {
      throw new FigmaApiError('Node IDs are required and must be a non-empty array');
    }

    try {
      return await this.makeRequest<FigmaNodeResponse>(
        `/files/${fileKey}/nodes`,
        { ...options, ids: nodeIds }
      );
    } catch (error) {
      if (error instanceof FigmaApiError) {
        throw error;
      }
      throw new FigmaApiError(`Failed to get nodes from file ${fileKey}: ${error}`);
    }
  }

  /**
   * Get images for specific nodes
   */
  async getImages(
    fileKey: string,
    nodeIds: string[],
    options: {
      scale?: number;
      format?: 'jpg' | 'png' | 'svg' | 'pdf';
      svg_include_id?: boolean;
      svg_simplify_stroke?: boolean;
      use_absolute_bounds?: boolean;
      version?: string;
    } = {}
  ): Promise<FigmaImageResponse> {
    if (!fileKey || typeof fileKey !== 'string') {
      throw new FigmaApiError('File key is required and must be a string');
    }

    if (!nodeIds || !Array.isArray(nodeIds) || nodeIds.length === 0) {
      throw new FigmaApiError('Node IDs are required and must be a non-empty array');
    }

    try {
      const params: Record<string, string> = {
        ids: nodeIds.join(','),
        format: options.format || 'png'
      };

      if (options.scale) params.scale = options.scale.toString();
      if (options.svg_include_id) params.svg_include_id = 'true';
      if (options.svg_simplify_stroke) params.svg_simplify_stroke = 'true';
      if (options.use_absolute_bounds) params.use_absolute_bounds = 'true';
      if (options.version) params.version = options.version;

      const response: AxiosResponse<FigmaImageResponse> = await this.client.get(
        `/images/${fileKey}`,
        { params }
      );

      return response.data;
    } catch (error) {
      if (error instanceof FigmaApiError) {
        throw error;
      }
      throw new FigmaApiError(`Failed to get images from file ${fileKey}: ${error}`);
    }
  }

  /**
   * Get files from a project
   */
  async getProjectFiles(projectId: string): Promise<FigmaProjectFilesResponse> {
    if (!projectId || typeof projectId !== 'string') {
      throw new FigmaApiError('Project ID is required and must be a string');
    }

    try {
      return await this.makeRequest<FigmaProjectFilesResponse>(`/projects/${projectId}/files`);
    } catch (error) {
      if (error instanceof FigmaApiError) {
        throw error;
      }
      throw new FigmaApiError(`Failed to get files from project ${projectId}: ${error}`);
    }
  }

  /**
   * Extract file key from Figma URL
   */
  static extractFileKeyFromUrl(url: string): string | null {
    if (!url || typeof url !== 'string') {
      return null;
    }

    // Match various Figma URL patterns
    const patterns = [
      /figma\.com\/(?:file|design)\/([a-zA-Z0-9]+)/,
      /figma\.com\/proto\/([a-zA-Z0-9]+)/,
      /figma\.com\/board\/([a-zA-Z0-9]+)/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }

    return null;
  }

  /**
   * Extract node ID from Figma URL
   */
  static extractNodeIdFromUrl(url: string): string | null {
    if (!url || typeof url !== 'string') {
      return null;
    }

    const match = url.match(/node-id=([^&]+)/);
    if (match && match[1]) {
      // Decode URL-encoded node ID and convert format
      let nodeId = decodeURIComponent(match[1]);
      nodeId = nodeId.replace(/%3A/g, ':');
      // Convert dash format to colon format (1459-57 -> 1459:57)
      nodeId = nodeId.replace(/-/g, ':');
      return nodeId;
    }

    return null;
  }

  /**
   * Validate file key format
   */
  static isValidFileKey(fileKey: string): boolean {
    if (!fileKey || typeof fileKey !== 'string') {
      return false;
    }

    // Figma file keys are typically alphanumeric strings
    return /^[a-zA-Z0-9]+$/.test(fileKey);
  }

  /**
   * Validate node ID format
   */
  static isValidNodeId(nodeId: string): boolean {
    if (!nodeId || typeof nodeId !== 'string') {
      return false;
    }

    // Figma node IDs are in format "123:456"
    return /^\d+:\d+$/.test(nodeId);
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    keys: number;
    hits: number;
    misses: number;
    size: number;
  } {
    const stats = this.cache.getStats();
    return {
      keys: stats.keys,
      hits: stats.hits,
      misses: stats.misses,
      size: stats.ksize + stats.vsize
    };
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.flushAll();
    console.log('[Figma API] Cache cleared');
  }

  /**
   * Update API key
   */
  updateApiKey(apiKey: string): void {
    if (!apiKey || typeof apiKey !== 'string') {
      throw new FigmaApiError('API key is required and must be a string');
    }

    this.config.apiKey = apiKey;
    this.client.defaults.headers['X-Figma-Token'] = apiKey;
    console.log('[Figma API] API key updated');
  }

  /**
   * Test API connection
   */
  async testConnection(): Promise<boolean> {
    try {
      // Try to get a minimal response to test the connection
      await this.client.get('/files/test', {
        validateStatus: (status) => status === 404 || status === 403 || status === 200
      });
      return true;
    } catch (error) {
      console.error('[Figma API] Connection test failed:', error);
      return false;
    }
  }

  /**
   * Get API usage statistics
   */
  getUsageStats(): {
    totalRequests: number;
    cacheHitRate: number;
    averageResponseTime: number;
  } {
    const cacheStats = this.getCacheStats();
    const totalRequests = cacheStats.hits + cacheStats.misses;
    const cacheHitRate = totalRequests > 0 ? (cacheStats.hits / totalRequests) * 100 : 0;

    return {
      totalRequests,
      cacheHitRate,
      averageResponseTime: 0 // TODO: Implement response time tracking
    };
  }

  /**
   * Download images for specific nodes directly (without requiring export settings)
   */
  async downloadImages(
    fileKey: string,
    nodeIds: string[],
    localPath: string,
    options: {
      scale?: number;
      format?: 'jpg' | 'png' | 'svg' | 'pdf';
    } = {}
  ): Promise<{
    downloaded: Array<{
      nodeId: string;
      nodeName: string;
      filePath: string;
      success: boolean;
      error?: string;
    }>;
    summary: {
      total: number;
      successful: number;
      failed: number;
    };
  }> {
    // Ensure local directory exists
    try {
      await fs.mkdir(localPath, { recursive: true });
    } catch (error) {
      throw new FigmaApiError(`Failed to create directory ${localPath}: ${error}`);
    }

    const results: Array<{
      nodeId: string;
      nodeName: string;
      filePath: string;
      success: boolean;
      error?: string;
    }> = [];

    try {
      // First, get the nodes to get their names
      const nodeResponse = await this.getFileNodes(fileKey, nodeIds, {
        depth: 1,
        use_absolute_bounds: true
      });

      // Get image URLs for all nodes
      const format = (options.format || 'svg').toLowerCase();
      let scale = options.scale || 1;
      
      // SVG only supports 1x scale according to Figma documentation
      if (format === 'svg') {
        scale = 1;
      }
      
      const imageResponse = await this.getImages(fileKey, nodeIds, {
        format: format as 'jpg' | 'png' | 'svg' | 'pdf',
        scale: scale,
        use_absolute_bounds: true
      });

      // Download each image
      for (const nodeId of nodeIds) {
        const nodeWrapper = nodeResponse.nodes[nodeId];
        const imageUrl = imageResponse.images[nodeId];
        
        if (!nodeWrapper) {
          results.push({
            nodeId,
            nodeName: 'Unknown',
            filePath: '',
            success: false,
            error: `Node ${nodeId} not found`
          });
          continue;
        }

        if (!imageUrl) {
          results.push({
            nodeId,
            nodeName: nodeWrapper.document.name,
            filePath: '',
            success: false,
            error: 'No image URL returned from Figma API'
          });
          continue;
        }

        // Use the actual node name as filename (preserve original name)
        const nodeName = nodeWrapper.document.name;
        const extension = format;
        const filename = `${nodeName}.${extension}`;
        const filePath = path.join(localPath, filename);

        try {
          // Download the image
          const downloadResponse = await axios.get(imageUrl, {
            responseType: 'arraybuffer',
            timeout: 30000,
            headers: {
              'User-Agent': 'Custom-Figma-MCP-Server/1.0.0'
            }
          });

          // Write to file
          await fs.writeFile(filePath, downloadResponse.data);

          results.push({
            nodeId,
            nodeName,
            filePath,
            success: true
          });

          console.log(`[Figma API] Downloaded: ${filename} (${(downloadResponse.data.byteLength / 1024).toFixed(1)}KB)`);

        } catch (downloadError) {
          results.push({
            nodeId,
            nodeName,
            filePath: filePath,
            success: false,
            error: `Download failed: ${downloadError instanceof Error ? downloadError.message : String(downloadError)}`
          });
          console.error(`[Figma API] Failed to download ${filename}:`, downloadError);
        }
      }

    } catch (error) {
      // Mark all as failed if we can't get the basic data
      for (const nodeId of nodeIds) {
        results.push({
          nodeId,
          nodeName: 'Unknown',
          filePath: '',
          success: false,
          error: `Failed to fetch node data: ${error instanceof Error ? error.message : String(error)}`
        });
      }
    }

    const summary = {
      total: results.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length
    };

    console.log(`[Figma API] Download summary: ${summary.successful}/${summary.total} successful`);

    return { downloaded: results, summary };
  }

  /**
   * Download images to local directory based on export settings
   */
  async downloadImagesWithExportSettings(
    fileKey: string,
    nodes: FigmaNode[],
    localPath: string
  ): Promise<{
    downloaded: Array<{
      nodeId: string;
      nodeName: string;
      filePath: string;
      exportSetting: FigmaExportSetting;
      success: boolean;
      error?: string;
    }>;
    summary: {
      total: number;
      successful: number;
      failed: number;
      skipped: number;
    };
  }> {
    // Ensure local directory exists
    try {
      await fs.mkdir(localPath, { recursive: true });
    } catch (error) {
      throw new FigmaApiError(`Failed to create directory ${localPath}: ${error}`);
    }

    const results: Array<{
      nodeId: string;
      nodeName: string;
      filePath: string;
      exportSetting: FigmaExportSetting;
      success: boolean;
      error?: string;
    }> = [];

    // Find all nodes with export settings
    const nodesToExport: Array<{ node: FigmaNode; exportSetting: FigmaExportSetting }> = [];
    
    const findExportableNodes = (node: FigmaNode) => {
      if (node.exportSettings && node.exportSettings.length > 0) {
        // Add each export setting as a separate export task
        for (const exportSetting of node.exportSettings) {
          nodesToExport.push({ node, exportSetting });
        }
      }
      
      // Recursively check children
      if (node.children) {
        for (const child of node.children) {
          findExportableNodes(child);
        }
      }
    };

    // Find all exportable nodes
    for (const node of nodes) {
      findExportableNodes(node);
    }

    if (nodesToExport.length === 0) {
      return {
        downloaded: [],
        summary: { total: 0, successful: 0, failed: 0, skipped: 0 }
      };
    }

    console.log(`[Figma API] Found ${nodesToExport.length} export tasks from ${nodes.length} nodes`);

    // Group exports by format and scale to batch API calls efficiently
    const exportGroups = new Map<string, Array<{ node: FigmaNode; exportSetting: FigmaExportSetting }>>();
    
    for (const item of nodesToExport) {
      const { exportSetting } = item;
      let scale = 1;
      
      // Extract scale from constraint according to Figma API documentation
      if (exportSetting.constraint) {
        if (exportSetting.constraint.type === 'SCALE') {
          scale = exportSetting.constraint.value;
        }
        // For WIDTH/HEIGHT constraints, we'll use scale 1 and let Figma handle the sizing
        // The API will respect the width/height values from the constraint
      }
      
      // SVG only supports 1x scale according to Figma documentation
      const format = exportSetting.format.toLowerCase();
      if (format === 'svg') {
        scale = 1;
      }
      
      const groupKey = `${format}_${scale}`;
      
      if (!exportGroups.has(groupKey)) {
        exportGroups.set(groupKey, []);
      }
      exportGroups.get(groupKey)!.push(item);
    }

    console.log(`[Figma API] Grouped exports into ${exportGroups.size} batches by format/scale`);

    // Process each group
    for (const [groupKey, groupItems] of exportGroups) {
      const [format, scaleStr] = groupKey.split('_');
      const scale = parseFloat(scaleStr);
      
      console.log(`[Figma API] Processing group: ${format} at ${scale}x scale (${groupItems.length} items)`);
      
      // Process in smaller batches to avoid API limits
      const batchSize = 10;
      for (let i = 0; i < groupItems.length; i += batchSize) {
        const batch = groupItems.slice(i, i + batchSize);
        const nodeIds = batch.map(item => item.node.id);
        
        try {
          // Get image URLs for this batch with the specific format and scale
          const imageResponse = await this.getImages(fileKey, nodeIds, {
            format: format as 'jpg' | 'png' | 'svg' | 'pdf',
            scale: scale,
            use_absolute_bounds: true
          });

          // Download each image in the batch
          for (const { node, exportSetting } of batch) {
            const imageUrl = imageResponse.images[node.id];
            
            if (!imageUrl) {
              results.push({
                nodeId: node.id,
                nodeName: node.name,
                filePath: '',
                exportSetting,
                success: false,
                error: 'No image URL returned from Figma API'
              });
              continue;
            }

            // Generate filename based on export settings - preserve original node name
            const nodeName = node.name; // Use original name, don't sanitize
            const suffix = exportSetting.suffix || '';
            const extension = exportSetting.format.toLowerCase();
            
            // Build filename with proper suffix handling
            let filename: string;
            if (suffix) {
              filename = `${nodeName}${suffix}.${extension}`;
            } else {
              // If no suffix but scale > 1, add scale suffix
              if (scale > 1) {
                filename = `${nodeName}@${scale}x.${extension}`;
              } else {
                filename = `${nodeName}.${extension}`;
              }
            }
            
            const filePath = path.join(localPath, filename);

            try {
              // Download the image
              const downloadResponse = await axios.get(imageUrl, {
                responseType: 'arraybuffer',
                timeout: 30000,
                headers: {
                  'User-Agent': 'Custom-Figma-MCP-Server/1.0.0'
                }
              });

              // Write to file
              await fs.writeFile(filePath, downloadResponse.data);

              results.push({
                nodeId: node.id,
                nodeName: node.name,
                filePath,
                exportSetting,
                success: true
              });

              console.log(`[Figma API] Downloaded: ${filename} (${(downloadResponse.data.byteLength / 1024).toFixed(1)}KB)`);

            } catch (downloadError) {
              results.push({
                nodeId: node.id,
                nodeName: node.name,
                filePath: filePath,
                exportSetting,
                success: false,
                error: `Download failed: ${downloadError instanceof Error ? downloadError.message : String(downloadError)}`
              });
              console.error(`[Figma API] Failed to download ${filename}:`, downloadError);
            }
          }

        } catch (batchError) {
          // Mark all items in this batch as failed
          console.error(`[Figma API] Batch failed for group ${groupKey}:`, batchError);
          for (const { node, exportSetting } of batch) {
            results.push({
              nodeId: node.id,
              nodeName: node.name,
              filePath: '',
              exportSetting,
              success: false,
              error: `Batch API call failed: ${batchError instanceof Error ? batchError.message : String(batchError)}`
            });
          }
        }
        
        // Add a small delay between batches to be respectful to the API
        if (i + batchSize < groupItems.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
    }

    const summary = {
      total: results.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      skipped: 0 // We process all nodes with export settings
    };

    console.log(`[Figma API] Download summary: ${summary.successful}/${summary.total} successful`);

    return { downloaded: results, summary };
  }
} 