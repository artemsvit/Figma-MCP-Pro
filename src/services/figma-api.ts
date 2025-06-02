import axios, { AxiosInstance, AxiosResponse } from 'axios';
import NodeCache from 'node-cache';
import pRetry from 'p-retry';
import pLimit from 'p-limit';
import {
  FigmaFileResponse,
  FigmaNodeResponse,
  FigmaImageResponse,
  FigmaProjectFilesResponse,
  FigmaError
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
} 