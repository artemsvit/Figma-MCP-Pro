import axios, { AxiosInstance, AxiosResponse } from 'axios';
import NodeCache from 'node-cache';
import pRetry from 'p-retry';
import pLimit from 'p-limit';
import fs from 'fs/promises';
import * as fsSync from 'fs';
import path from 'path';
import os from 'os';
import {
  FigmaFileResponse,
  FigmaNodeResponse,
  FigmaImageResponse,
  FigmaError,
  FigmaNode,
  FigmaExportSetting,
  FigmaCommentsResponse
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
        console.error(`[Figma API] ${config.method?.toUpperCase()} ${config.url}`);
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
        console.error(`[Figma API] Response ${response.status} for ${response.config.url}`);
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
        console.error(`[Figma API] Cache hit for ${endpoint}`);
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
    console.error('[Figma API] Cache cleared');
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
    console.error('[Figma API] API key updated');
  }





  /**
   * Robust IDE-aware path resolution for universal compatibility
   */
  private static resolvePath(inputPath: string): string {
    // Normalize input path - remove encoding issues
    const normalizedPath = inputPath.trim().replace(/[^\x20-\x7E]/g, '');
    
    console.error(`[Figma API] Input path: "${inputPath}" -> normalized: "${normalizedPath}"`);
    
    // Handle absolute paths - if it's already absolute and valid, use as-is (but validate safety)
    if (path.isAbsolute(normalizedPath) && !this.isSystemRoot(normalizedPath) && normalizedPath.length > 1) {
      // Still validate it's not a dangerous system path using cross-platform logic
      if (!this.isDangerousPath(normalizedPath)) {
        console.error(`[Figma API] Using safe absolute path: ${normalizedPath}`);
        return normalizedPath;
      } else {
        console.error(`[Figma API] ⚠️ Absolute path is dangerous, switching to relative: ${normalizedPath}`);
        // Fall through to relative path handling
      }
    }
    
    // ENHANCED CURSOR IDE FIX: Use comprehensive workspace detection
    const workspaceInfo = this.getActualWorkspaceDirectory();
    
    console.error(`[Figma API] Using workspace directory: ${workspaceInfo.workspaceDir} (${workspaceInfo.confidence} confidence from ${workspaceInfo.source})`);
    
    // CRITICAL CURSOR BUG PREVENTION: If workspace directory is still dangerous, force safe fallback
    if (this.isDangerousPath(workspaceInfo.workspaceDir) || this.isSystemRoot(workspaceInfo.workspaceDir)) {
      console.error(`[Figma API] 🚨 CRITICAL: Workspace directory is dangerous/root: ${workspaceInfo.workspaceDir}`);
      const userHome = os.homedir();
      const safeFallbackWorkspace = path.join(userHome, 'figma-mcp-workspace');
      console.error(`[Figma API] 🛡️ Using bulletproof safe workspace: ${safeFallbackWorkspace}`);
      
      // Override workspace info with safe fallback
      workspaceInfo.workspaceDir = safeFallbackWorkspace;
      workspaceInfo.confidence = 'low';
      workspaceInfo.source = 'Emergency Safe Fallback';
    }
    
    // Clean the path for consistent relative path handling
    let cleanPath = normalizedPath;
    
    // Handle various relative path formats consistently
    if (cleanPath.startsWith('./')) {
      cleanPath = cleanPath.substring(2); // Remove './'
    } else if (cleanPath.startsWith('../')) {
      // Handle parent directory references
      cleanPath = cleanPath; // Keep as-is, path.resolve will handle it
    } else if (cleanPath.startsWith('/')) {
      // Remove leading slash to make it relative
      cleanPath = cleanPath.substring(1);
    }
    
    // Ensure we have a valid path
    if (!cleanPath || cleanPath === '.' || cleanPath === '') {
      cleanPath = 'figma-assets'; // Default directory name
    }
    
    // Use path.resolve with workspace directory as base for consistent cross-platform path resolution
    const resolvedPath = path.resolve(workspaceInfo.workspaceDir, cleanPath);
    
    // FINAL BULLETPROOF SAFETY CHECK - Absolutely prevent any dangerous path resolution
    if (this.isDangerousPath(resolvedPath) || this.isSystemRoot(path.dirname(resolvedPath))) {
      console.error(`[Figma API] 🚨 EMERGENCY BLOCK: Resolved path is still dangerous: ${resolvedPath}`);
      console.error(`[Figma API] 🚨 This indicates a severe Cursor IDE workspace detection failure`);
      
      // Force ultra-safe fallback that cannot possibly be system root
      const userHome = os.homedir();
      const emergencyPath = path.resolve(userHome, 'figma-emergency-downloads', cleanPath);
      console.error(`[Figma API] 🛡️ Using emergency safe path: ${emergencyPath}`);
      
      // Triple-check the emergency path is safe (this should never fail)
      if (this.isDangerousPath(emergencyPath)) {
        console.error(`[Figma API] 💥 CRITICAL SYSTEM ERROR: Even emergency path is dangerous!`);
        throw new FigmaApiError(`System error: Cannot create safe download path. Emergency path ${emergencyPath} is dangerous. Please check your system configuration.`);
      }
      
      return emergencyPath;
    }
    
    console.error(`[Figma API] ✅ Path resolution: "${normalizedPath}" -> "${resolvedPath}"`);
    console.error(`[Figma API] Environment: workspace="${workspaceInfo.workspaceDir}", PWD="${process.env.PWD}", resolved="${resolvedPath}"`);
    
    return resolvedPath;
  }



  /**
   * Enhanced project directory detection by looking for common project markers
   * Specifically optimized for Cursor IDE environment
   */
  private static findProjectDirectoryByMarkers(): string[] {
    const candidates: string[] = [];
    
    // Enhanced project markers with scoring for better detection
    const projectMarkers = [
      { file: 'package.json', score: 10 },
      { file: '.git', score: 8 },
      { file: 'tsconfig.json', score: 7 },
      { file: 'yarn.lock', score: 6 },
      { file: 'package-lock.json', score: 6 },
      { file: 'pnpm-lock.yaml', score: 6 },
      { file: 'node_modules', score: 5 },
      { file: 'src', score: 4 },
      { file: 'dist', score: 3 },
      { file: 'README.md', score: 2 },
      { file: '.gitignore', score: 3 },
      { file: 'index.js', score: 2 },
      { file: 'index.ts', score: 2 }
    ];
    
    // Multiple starting points for comprehensive search
    const startingPoints: string[] = [];
    
    // Add environment-based starting points
    if (process.env.PWD && !this.isSystemRoot(process.env.PWD)) {
      startingPoints.push(process.env.PWD);
    }
    if (process.env.INIT_CWD && !this.isSystemRoot(process.env.INIT_CWD)) {
      startingPoints.push(process.env.INIT_CWD);
    }
    
    // Add process.cwd() if it's not system root
    if (!this.isSystemRoot(process.cwd())) {
      startingPoints.push(process.cwd());
    }
    
    // Fallback to user directories
    const userDirs = [
      path.join(os.homedir(), 'Desktop'),
      path.join(os.homedir(), 'Documents'),
      path.join(os.homedir(), 'Projects'),
      path.join(os.homedir(), 'Development'),
      path.join(os.homedir(), 'Code'),
      os.homedir()
    ];
    startingPoints.push(...userDirs);
    
    // Remove duplicates
    const uniqueStartingPoints = [...new Set(startingPoints)];
    
    console.error(`[Figma API] 🔍 Project marker search starting from ${uniqueStartingPoints.length} locations`);
    
    for (const startDir of uniqueStartingPoints) {
      try {
        console.error(`[Figma API] 🔍 Searching from: ${startDir}`);
        
        // Search upward for project markers
        let currentDir = startDir;
        const maxLevels = 8; // Prevent infinite loops
        
        for (let level = 0; level < maxLevels; level++) {
          let totalScore = 0;
          
          for (const marker of projectMarkers) {
            const markerPath = path.join(currentDir, marker.file);
            try {
              fsSync.accessSync(markerPath);
              totalScore += marker.score;
              
              // Special handling for key markers
              if (marker.file === 'package.json') {
                try {
                  const packageContent = fsSync.readFileSync(markerPath, 'utf8');
                  const packageJson = JSON.parse(packageContent);
                  if (packageJson.name && !packageJson.name.startsWith('figma-mcp-workspace')) {
                    totalScore += 5; // Bonus for real projects
                  }
                } catch {
                  // Invalid package.json, but still counts
                }
              }
            } catch {
              // Marker not found
            }
          }
          
          // If we found enough markers, consider this a project directory
          if (totalScore >= 10 && !candidates.includes(currentDir)) {
            candidates.push(currentDir);
            console.error(`[Figma API] ✅ Project found with score ${totalScore}: ${currentDir}`);
          }
          
          const parentDir = path.dirname(currentDir);
          if (parentDir === currentDir) break; // Reached root
          currentDir = parentDir;
        }
        
        // Also search one level down in the starting directory
        if (startDir !== os.homedir()) { // Don't search all of home directory
          try {
            const entries = fsSync.readdirSync(startDir, { withFileTypes: true });
            for (const entry of entries.slice(0, 20)) { // Limit to first 20 entries
              if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
                const subDir = path.join(startDir, entry.name);
                
                let totalScore = 0;
                for (const marker of projectMarkers) {
                  const markerPath = path.join(subDir, marker.file);
                  try {
                    fsSync.accessSync(markerPath);
                    totalScore += marker.score;
                  } catch {
                    // Marker not found
                  }
                }
                
                if (totalScore >= 10 && !candidates.includes(subDir)) {
                  candidates.push(subDir);
                  console.error(`[Figma API] ✅ Project found (subdirectory) with score ${totalScore}: ${subDir}`);
                }
              }
            }
          } catch {
            // Directory not readable
          }
        }
      } catch (error) {
        console.error(`[Figma API] ⚠️ Error searching from ${startDir}:`, error);
      }
    }
    
    console.error(`[Figma API] 📊 Project marker search found ${candidates.length} candidates`);
    return candidates;
  }

  /**
   * Check if a directory looks like a valid project directory
   */
  private static isValidProjectDirectory(dir: string): boolean {
    const projectIndicators = [
      'package.json',
      'tsconfig.json',
      '.git',
      'src',
      'node_modules'
    ];
    
    let indicatorCount = 0;
    for (const indicator of projectIndicators) {
      try {
        fsSync.accessSync(path.join(dir, indicator));
        indicatorCount++;
      } catch {
        // Indicator not found
      }
    }
    
    // Consider it a project directory if it has at least 2 indicators
    return indicatorCount >= 2;
  }

  /**
   * Create directory with enhanced verification and universal IDE compatibility
   */
  private static async createDirectorySafely(resolvedPath: string, originalPath: string): Promise<void> {
    // Validate the resolved path
    if (!resolvedPath || resolvedPath.length === 0) {
      throw new Error('Invalid or empty path after resolution');
    }
    
    // Enhanced safety check: prevent creating directories at dangerous locations (cross-platform)
    if (this.isDangerousPath(resolvedPath)) {
      console.error(`[Figma API] SAFETY BLOCK: Refusing to create directory at dangerous location: ${resolvedPath}`);
      throw new FigmaApiError(`Blocked dangerous directory creation at: ${resolvedPath}. Original path: ${originalPath}`);
    }
    
    console.error(`[Figma API] Creating directory: "${originalPath}" -> "${resolvedPath}"`);
    
    try {
      // Create directory with full permissions for universal compatibility
      await fs.mkdir(resolvedPath, { recursive: true, mode: 0o755 });
      
      // Verify directory was created and is accessible
      const stats = await fs.stat(resolvedPath);
      if (!stats.isDirectory()) {
        throw new Error('Path exists but is not a directory');
      }
      
      // Test write permissions by creating a temporary file
      const testFile = path.join(resolvedPath, '.figma-test-write');
      try {
        await fs.writeFile(testFile, 'test');
        await fs.unlink(testFile); // Clean up test file
      } catch (writeError) {
        throw new Error(`Directory exists but is not writable: ${writeError instanceof Error ? writeError.message : String(writeError)}`);
      }
      
      console.error(`[Figma API] ✅ Directory verified: ${resolvedPath}`);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`[Figma API] ❌ Directory creation failed:`, { 
        originalPath, 
        resolvedPath,
        cwd: process.cwd(),
        environment: {
          PWD: process.env.PWD,
          INIT_CWD: process.env.INIT_CWD,
          PROJECT_ROOT: process.env.PROJECT_ROOT,
          WORKSPACE_ROOT: process.env.WORKSPACE_ROOT
        },
        error: errorMessage 
      });
      throw new FigmaApiError(`Failed to create/verify directory: ${errorMessage}`);
    }
  }

  /**
   * Verify that assets exist in the expected location (universal IDE compatibility)
   */
  private static async verifyAssetsLocation(expectedPaths: string[]): Promise<{
    verified: Array<{ path: string; exists: boolean; size?: number; relativePath?: string }>;
    summary: { total: number; found: number; missing: number };
  }> {
    const verified: Array<{ path: string; exists: boolean; size?: number; relativePath?: string }> = [];
    
    for (const expectedPath of expectedPaths) {
      try {
        const stat = await fs.stat(expectedPath);
        const relativePath = path.relative(process.cwd(), expectedPath);
        verified.push({
          path: expectedPath,
          exists: true,
          size: stat.size,
          relativePath: relativePath.startsWith('..') ? expectedPath : relativePath
        });
      } catch (error) {
        verified.push({
          path: expectedPath,
          exists: false
        });
      }
    }
    
    const summary = {
      total: verified.length,
      found: verified.filter(v => v.exists).length,
      missing: verified.filter(v => !v.exists).length
    };
    
    return { verified, summary };
  }

  /**
   * Advanced asset recovery system for IDE compatibility issues
   * Searches common alternative download locations and recovers assets to project folder
   */
  private static async findAndRecoverMissingAssets(
    expectedResults: Array<{ nodeId: string; nodeName: string; filePath: string; success: boolean }>,
    targetDirectory: string
  ): Promise<{
    recovered: Array<{ nodeId: string; nodeName: string; oldPath: string; newPath: string; success: boolean }>;
    summary: { total: number; found: number; recovered: number; failed: number };
  }> {
    const recovered: Array<{ nodeId: string; nodeName: string; oldPath: string; newPath: string; success: boolean }> = [];
    const missingAssets = expectedResults.filter(r => r.success); // Only check supposedly successful downloads
    
    console.error(`[Figma API] 🔍 Searching for ${missingAssets.length} potentially misplaced assets...`);
    
    // Common alternative locations where files might have been downloaded (cross-platform)
    const searchLocations = this.getAssetSearchLocations();
    
    // Remove duplicates and ensure target directory isn't in search list
    const uniqueSearchLocations = [...new Set(searchLocations)].filter(loc => loc !== targetDirectory);
    
    // Also search recursively in some key directories
    const recursiveSearchDirs = [
      path.join(os.homedir(), 'figma-workspace'),
      os.homedir()
    ];
    
    for (const asset of missingAssets) {
      const expectedPath = asset.filePath;
      const filename = path.basename(expectedPath);
      
      // First verify it's actually missing from expected location
      try {
        await fs.access(expectedPath);
        // File exists where expected, no recovery needed
        continue;
      } catch {
        // File is missing, proceed with search
      }
      
      console.error(`[Figma API] 🔍 Searching for missing file: ${filename}`);
      
      let foundPath: string | null = null;
      
      // First, search direct locations
      for (const searchLoc of uniqueSearchLocations) {
        try {
          const candidatePath = path.join(searchLoc, filename);
          await fs.access(candidatePath);
          
          // Found the file! Verify it's a reasonable size (not empty)
          const stat = await fs.stat(candidatePath);
          if (stat.size > 0) {
            foundPath = candidatePath;
            console.error(`[Figma API] ✅ Found ${filename} at: ${candidatePath} (${(stat.size / 1024).toFixed(1)}KB)`);
            break;
          }
        } catch {
          // File not found in this location, continue searching
        }
      }
      
      // If not found in direct locations, search recursively in key directories
      if (!foundPath) {
        foundPath = await this.searchFileRecursively(filename, recursiveSearchDirs);
      }
      
      if (foundPath) {
        // Attempt to move the file to the correct location
        try {
          // Ensure target directory exists
          await FigmaApiService.createDirectorySafely(targetDirectory, targetDirectory);
          
          // Move the file
          await fs.rename(foundPath, expectedPath);
          
          recovered.push({
            nodeId: asset.nodeId,
            nodeName: asset.nodeName,
            oldPath: foundPath,
            newPath: expectedPath,
            success: true
          });
          
          console.error(`[Figma API] ✅ Recovered ${filename}: ${foundPath} → ${expectedPath}`);
          
        } catch (moveError) {
          // If move fails, try copy and delete
          try {
            await fs.copyFile(foundPath, expectedPath);
            await fs.unlink(foundPath);
            
            recovered.push({
              nodeId: asset.nodeId,
              nodeName: asset.nodeName,
              oldPath: foundPath,
              newPath: expectedPath,
              success: true
            });
            
            console.error(`[Figma API] ✅ Recovered ${filename} via copy: ${foundPath} → ${expectedPath}`);
            
          } catch (copyError) {
            recovered.push({
              nodeId: asset.nodeId,
              nodeName: asset.nodeName,
              oldPath: foundPath,
              newPath: expectedPath,
              success: false
            });
            
            console.error(`[Figma API] ❌ Failed to recover ${filename}:`, copyError);
          }
        }
      } else {
        console.error(`[Figma API] ❌ Could not locate missing file: ${filename}`);
      }
    }
    
    const summary = {
      total: missingAssets.length,
      found: recovered.length,
      recovered: recovered.filter(r => r.success).length,
      failed: recovered.filter(r => !r.success).length
    };
    
    if (summary.recovered > 0) {
      console.error(`[Figma API] 🎉 Recovery completed: ${summary.recovered}/${summary.total} assets recovered to project folder`);
    } else if (summary.total > 0) {
      console.error(`[Figma API] ⚠️  No assets recovered - files may have been downloaded to an unknown location`);
    }
    
    return { recovered, summary };
  }

  /**
   * Search for a file recursively in given directories (limited depth)
   */
  private static async searchFileRecursively(filename: string, searchDirs: string[], maxDepth: number = 3): Promise<string | null> {
    for (const searchDir of searchDirs) {
      try {
        const found = await this.searchInDirectory(searchDir, filename, maxDepth);
        if (found) {
          return found;
        }
      } catch (error) {
        console.error(`[Figma API] Error searching in ${searchDir}:`, error);
      }
    }
    return null;
  }

  /**
   * Search for a file in a specific directory with depth limit
   */
  private static async searchInDirectory(dir: string, filename: string, maxDepth: number, currentDepth: number = 0): Promise<string | null> {
    if (currentDepth >= maxDepth) {
      return null;
    }
    
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      // First, check if the file is directly in this directory
      for (const entry of entries) {
        if (entry.isFile() && entry.name === filename) {
          const filePath = path.join(dir, entry.name);
          const stat = await fs.stat(filePath);
          if (stat.size > 0) {
            return filePath;
          }
        }
      }
      
      // Then, search subdirectories
      for (const entry of entries) {
        if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
          const subDir = path.join(dir, entry.name);
          const found = await this.searchInDirectory(subDir, filename, maxDepth, currentDepth + 1);
          if (found) {
            return found;
          }
        }
      }
    } catch (error) {
      // Directory not accessible, skip
    }
    
    return null;
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
      skipWorkspaceEnforcement?: boolean;
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
    workspaceEnforcement?: {
      finalLocation: string;
      moved: number;
      workspaceSource: string;
      confidence: 'high' | 'medium' | 'low';
    } | null;
  }> {
    // Resolve and ensure local directory exists
    const resolvedPath = FigmaApiService.resolvePath(localPath);
    await FigmaApiService.createDirectorySafely(resolvedPath, localPath);

    const results: Array<{
      nodeId: string;
      nodeName: string;
      filePath: string;
      success: boolean;
      error?: string;
    }> = [];

    // INTELLIGENT ASSET DEDUPLICATION: Handle both filename and content duplicates
    const usedFilenames = new Set<string>();
    const filenameCounters = new Map<string, number>();
    const contentHashes = new Map<string, { filename: string; nodeId: string; nodeName: string }>();

    // Pre-populate with existing files in target directory
    try {
      const existingFiles = await fs.readdir(resolvedPath);
      existingFiles.forEach(file => {
        usedFilenames.add(file);
        console.error(`[Figma API] 📁 Existing file detected: ${file}`);
      });
    } catch (error) {
      // Directory doesn't exist yet or can't read it - that's fine
      console.error(`[Figma API] 📁 Target directory empty or doesn't exist yet`);
    }

    /**
     * Generate content hash for asset deduplication (simplified for downloadImages)
     */
    const generateContentHash = (node: FigmaNode, format: string, scale: number): string => {
      const hashComponents = [
        node.type,
        format,
        scale.toString(),
        JSON.stringify(node.fills || []),
        JSON.stringify(node.strokes || []),
        JSON.stringify(node.effects || []),
        node.cornerRadius || 0,
        node.strokeWeight || 0,
        node.type === 'TEXT' ? node.characters || '' : '',
        node.absoluteBoundingBox ? `${Math.round(node.absoluteBoundingBox.width)}x${Math.round(node.absoluteBoundingBox.height)}` : ''
      ];
      
      return hashComponents.join('|').replace(/[^a-zA-Z0-9]/g, '').substring(0, 16);
    };

    /**
     * Check if asset should be treated as reusable (icons, logos, etc.)
     */
    const isReusableAsset = (node: FigmaNode, sanitizedName: string): boolean => {
      const name = sanitizedName.toLowerCase();
      const size = node.absoluteBoundingBox;
      
      // Only treat as reusable if it has very specific characteristics
      // This prevents different icons from being treated as the same content
      
      // Must have identical name AND identical content to be considered reusable
      // This is much more conservative than before
      const isExactDuplicate = false; // We'll let the content hash handle this
      
      // For now, disable content-based deduplication for icons to prevent overwrites
      // Each icon should get its own file even if they look similar
      return false;
    };

    /**
     * Enhanced filename generation with content-based deduplication
     */
    const generateUniqueFilename = (node: FigmaNode, baseName: string, extension: string, format: string, scale: number): string => {
      // Always add scale to filename for consistency with export settings
      const baseNameWithScale = scale === 1 ? `${baseName}-x1` : `${baseName}-x${scale}`;
      const baseFilename = `${baseNameWithScale}.${extension}`;
      
      // Check if this is a reusable asset type
      if (isReusableAsset(node, baseName)) {
        // Generate content hash for deduplication
        const contentHash = generateContentHash(node, format, scale);
        
        // Check if we already have an asset with identical content
        if (contentHashes.has(contentHash)) {
          const existingAsset = contentHashes.get(contentHash)!;
          console.error(`[Figma API] 🔗 Content duplicate detected: "${baseName}" → reusing "${existingAsset.filename}" (same as ${existingAsset.nodeName})`);
          return existingAsset.filename;
        }
        
        // New unique content - register it for future deduplication
        contentHashes.set(contentHash, { filename: baseFilename, nodeId: node.id, nodeName: baseName });
      }
      
      // Standard filename uniqueness check
      if (!usedFilenames.has(baseFilename)) {
        usedFilenames.add(baseFilename);
        return baseFilename;
      }
      
      // Generate incremental filename for true duplicates
      const counter = filenameCounters.get(baseNameWithScale) || 1;
      let uniqueFilename: string;
      let currentCounter = counter + 1;
      
      do {
        uniqueFilename = `${baseNameWithScale}-${currentCounter}.${extension}`;
        currentCounter++;
      } while (usedFilenames.has(uniqueFilename));
      
      // Update counter and mark as used
      filenameCounters.set(baseNameWithScale, currentCounter - 1);
      usedFilenames.add(uniqueFilename);
      
      console.error(`[Figma API] 🔄 Filename duplicate resolved: "${baseFilename}" → "${uniqueFilename}"`);
      return uniqueFilename;
    };

    try {
      // First, get the nodes to get their names
      const nodeResponse = await this.getFileNodes(fileKey, nodeIds, {
        depth: 1,
        use_absolute_bounds: true
      });

      // Get image URLs for all nodes
      const format = (options.format || 'png').toLowerCase();
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
            nodeName: nodeWrapper.document?.name || 'Unknown',
            filePath: '',
            success: false,
            error: 'No image URL returned from Figma API'
          });
          continue;
        }

        // Use the actual node name as filename (preserve original name)
        const nodeName = nodeWrapper.document?.name || `node-${nodeId}`;
        // Sanitize filename to remove/replace problematic characters
        const sanitizedNodeName = nodeName
          .replace(/[/\\:*?"<>|]/g, '-') // Replace problematic characters with dash
          .replace(/\s+/g, ' ') // Normalize spaces
          .trim();
        const extension = format;
        
        // Generate unique filename to prevent overwrites
        const filename = generateUniqueFilename(nodeWrapper.document!, sanitizedNodeName, extension, format, scale);
        const filePath = path.join(resolvedPath, filename);

        // Debug logging to understand the filename issue
        console.error(`[Figma API] Debug - Node ID: ${nodeId}, Node Name: "${nodeName}", Filename: "${filename}"`);

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
          await fs.writeFile(filePath, Buffer.from(downloadResponse.data));

          results.push({
            nodeId,
            nodeName: sanitizedNodeName,
            filePath,
            success: true
          });

          console.error(`[Figma API] Downloaded: ${filename} (${(downloadResponse.data.byteLength / 1024).toFixed(1)}KB)`);

        } catch (downloadError) {
          results.push({
            nodeId,
            nodeName: sanitizedNodeName,
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

    // Calculate summary
    const summary = {
      total: results.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length
    };

    console.error(`[Figma API] Download completed: ${summary.successful}/${summary.total} successful`);

    // WORKSPACE ENFORCEMENT: Ensure all assets end up in the actual IDE workspace (can be skipped)
    let workspaceEnforcement = null;
    if (summary.successful > 0 && !options.skipWorkspaceEnforcement) {
      try {
        workspaceEnforcement = await FigmaApiService.enforceWorkspaceLocation(results, localPath);
        console.error(`[Figma API] 🎯 Workspace enforcement: ${workspaceEnforcement.summary.moved} moved, ${workspaceEnforcement.summary.alreadyCorrect} already correct`);
      } catch (enforcementError) {
        console.error(`[Figma API] ⚠️ Workspace enforcement failed, falling back to recovery:`, enforcementError);
        
        // Fallback to original recovery system
        const expectedPaths = results.filter(r => r.success).map(r => r.filePath);
        if (expectedPaths.length > 0) {
          const verification = await FigmaApiService.verifyAssetsLocation(expectedPaths);
          
          if (verification.summary.missing > 0) {
            console.error(`[Figma API] ⚠️ ${verification.summary.missing} assets missing from expected location, attempting recovery...`);
            
            const recovery = await FigmaApiService.findAndRecoverMissingAssets(results, resolvedPath);
            
            if (recovery.summary.recovered > 0) {
              console.error(`[Figma API] 🎉 Successfully recovered ${recovery.summary.recovered} assets to project directory!`);
              
              for (const recoveredAsset of recovery.recovered) {
                const resultIndex = results.findIndex(r => r.nodeId === recoveredAsset.nodeId);
                if (resultIndex !== -1 && recoveredAsset.success && results[resultIndex]) {
                  results[resultIndex].filePath = recoveredAsset.newPath;
                  results[resultIndex].success = true;
                }
              }
            }
          }
        }
      }
    }

    return { 
      downloaded: results, 
      summary,
      workspaceEnforcement: workspaceEnforcement ? {
        finalLocation: workspaceEnforcement.finalLocation,
        moved: workspaceEnforcement.summary.moved,
        workspaceSource: workspaceEnforcement.workspaceInfo.source,
        confidence: workspaceEnforcement.workspaceInfo.confidence
      } : null
    };
  }

  /**
   * Download images to local directory based on export settings
   */
  async downloadImagesWithExportSettings(
    fileKey: string,
    nodes: FigmaNode[],
    localPath: string,
    options: {
      skipWorkspaceEnforcement?: boolean;
    } = {}
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
    workspaceEnforcement?: {
      finalLocation: string;
      moved: number;
      workspaceSource: string;
      confidence: 'high' | 'medium' | 'low';
    } | null;
  }> {
    // Resolve and ensure local directory exists
    const resolvedPath = FigmaApiService.resolvePath(localPath);
    await FigmaApiService.createDirectorySafely(resolvedPath, localPath);

    const results: Array<{
      nodeId: string;
      nodeName: string;
      filePath: string;
      exportSetting: FigmaExportSetting;
      success: boolean;
      error?: string;
    }> = [];

    // INTELLIGENT ASSET DEDUPLICATION: Handle both filename and content duplicates
    const usedFilenames = new Set<string>();
    const filenameCounters = new Map<string, number>();
    const contentHashes = new Map<string, { filename: string; nodeId: string; nodeName: string }>();

    // Pre-populate with existing files in target directory
    try {
      const existingFiles = await fs.readdir(resolvedPath);
      existingFiles.forEach(file => {
        usedFilenames.add(file);
        console.error(`[Figma API] 📁 Existing file detected: ${file}`);
      });
    } catch (error) {
      // Directory doesn't exist yet or can't read it - that's fine
      console.error(`[Figma API] 📁 Target directory empty or doesn't exist yet`);
    }

    /**
     * Generate content hash for asset deduplication
     */
    const generateContentHash = (node: FigmaNode, exportSetting: FigmaExportSetting): string => {
      const hashComponents = [
        node.type,
        node.id, // Add unique node ID to prevent different nodes from having same hash
        node.name, // Add node name for additional uniqueness
        exportSetting.format,
        exportSetting.constraint?.type || 'none',
        exportSetting.constraint?.value || 1,
        exportSetting.suffix || '',
        JSON.stringify(node.fills || []),
        JSON.stringify(node.strokes || []),
        JSON.stringify(node.effects || []),
        node.cornerRadius || 0,
        node.strokeWeight || 0,
        node.type === 'TEXT' ? node.characters || '' : '',
        node.absoluteBoundingBox ? `${Math.round(node.absoluteBoundingBox.width)}x${Math.round(node.absoluteBoundingBox.height)}` : '',
        // Add more specific properties for better differentiation
        node.blendMode || '',
        node.opacity || 1,
        JSON.stringify(node.strokeDashes || [])
      ];
      
      // Create a more robust hash that includes node identity
      const hashString = hashComponents.join('|');
      return hashString.replace(/[^a-zA-Z0-9]/g, '').substring(0, 32); // Increased length for better uniqueness
    };

    /**
     * Check if asset should be treated as reusable (icons, logos, etc.)
     */
    const isReusableAsset = (node: FigmaNode, sanitizedName: string): boolean => {
      const name = sanitizedName.toLowerCase();
      const size = node.absoluteBoundingBox;
      
      // Only treat as reusable if it has very specific characteristics
      // This prevents different icons from being treated as the same content
      
      // Must have identical name AND identical content to be considered reusable
      // This is much more conservative than before
      const isExactDuplicate = false; // We'll let the content hash handle this
      
      // For now, disable content-based deduplication for icons to prevent overwrites
      // Each icon should get its own file even if they look similar
      return false;
    };

    /**
     * Enhanced filename generation with content-based deduplication
     */
    const generateUniqueFilename = (node: FigmaNode, baseName: string, extension: string, exportSetting: FigmaExportSetting): string => {
      const baseFilename = `${baseName}.${extension}`;
      
      // Check if this is a reusable asset type
      if (isReusableAsset(node, baseName)) {
        // Generate content hash for deduplication
        const contentHash = generateContentHash(node, exportSetting);
        
        // Check if we already have an asset with identical content
        if (contentHashes.has(contentHash)) {
          const existingAsset = contentHashes.get(contentHash)!;
          console.error(`[Figma API] 🔗 Content duplicate detected: "${baseName}" → reusing "${existingAsset.filename}" (same as ${existingAsset.nodeName})`);
          return existingAsset.filename;
        }
        
        // New unique content - register it for future deduplication
        contentHashes.set(contentHash, { filename: baseFilename, nodeId: node.id, nodeName: baseName });
      }
      
      // Standard filename uniqueness check
      if (!usedFilenames.has(baseFilename)) {
        usedFilenames.add(baseFilename);
        return baseFilename;
      }
      
      // Generate incremental filename for true duplicates
      const counter = filenameCounters.get(baseName) || 1;
      let uniqueFilename: string;
      let currentCounter = counter + 1;
      
      do {
        uniqueFilename = `${baseName}-${currentCounter}.${extension}`;
        currentCounter++;
      } while (usedFilenames.has(uniqueFilename));
      
      // Update counter and mark as used
      filenameCounters.set(baseName, currentCounter - 1);
      usedFilenames.add(uniqueFilename);
      
      console.error(`[Figma API] 🔄 Filename duplicate resolved: "${baseFilename}" → "${uniqueFilename}"`);
      return uniqueFilename;
    };

    // Find all nodes with export settings
    const nodesToExport: Array<{ node: FigmaNode; exportSetting: FigmaExportSetting }> = [];
    
    const findExportableNodes = (node: FigmaNode) => {
      // Enhanced debugging for icon detection
      const nodeName = node.name.toLowerCase();
      const isIconName = ['uis:', 'dashicons:', 'ci:', 'icon', 'svg'].some(keyword => nodeName.includes(keyword));
      
      if (isIconName) {
        console.error(`[Figma API] 🔍 DEBUG: Found potential icon "${node.name}" (${node.type})`);
        console.error(`[Figma API]   📋 Export settings: ${node.exportSettings ? node.exportSettings.length : 0} found`);
        if (node.exportSettings && node.exportSettings.length > 0) {
          node.exportSettings.forEach((setting, index) => {
            const scale = setting.constraint?.type === 'SCALE' ? setting.constraint.value : 1;
            console.error(`[Figma API]   📄 Setting ${index}: format=${setting.format}, scale=${scale}x, suffix=${setting.suffix || 'none'}`);
          });
        } else {
          console.error(`[Figma API]   ⚠️ No export settings found for icon "${node.name}"`);
        }
      }
      
      if (node.exportSettings && node.exportSettings.length > 0) {
        // Add each export setting as a separate export task
        for (const exportSetting of node.exportSettings) {
          nodesToExport.push({ node, exportSetting });
          console.error(`[Figma API] ✅ Added to export queue: "${node.name}" as ${exportSetting.format}`);
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
    console.error(`[Figma API] 🔍 Scanning ${nodes.length} root nodes for export settings...`);
    for (const node of nodes) {
      console.error(`[Figma API] 📁 Scanning node: "${node.name}" (${node.type})`);
      findExportableNodes(node);
    }

    if (nodesToExport.length === 0) {
      console.error(`[Figma API] ❌ No nodes with export settings found!`);
      console.error(`[Figma API] 💡 Make sure your icons have export settings configured in Figma:`);
      console.error(`[Figma API]    1. Select the icon in Figma`);
      console.error(`[Figma API]    2. In the right panel, scroll to "Export" section`);
      console.error(`[Figma API]    3. Click "+" to add export settings`);
      console.error(`[Figma API]    4. Choose SVG format for icons`);
      return {
        downloaded: [],
        summary: { total: 0, successful: 0, failed: 0, skipped: 0 }
      };
    }

    console.error(`[Figma API] ✅ Found ${nodesToExport.length} export tasks from ${nodes.length} nodes`);

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

    console.error(`[Figma API] Grouped exports into ${exportGroups.size} batches by format/scale`);

    // Process each group
    for (const [groupKey, groupItems] of exportGroups) {
      const [format, scaleStr] = groupKey.split('_');
      const scale = parseFloat(scaleStr || '1');
      
      console.error(`[Figma API] Processing group: ${format} at ${scale}x scale (${groupItems.length} items)`);
      
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
                nodeName: node.name.replace(/[/\\:*?"<>|]/g, '-').replace(/\s+/g, ' ').trim(),
                filePath: '',
                exportSetting,
                success: false,
                error: 'No image URL returned from Figma API'
              });
              continue;
            }

            // Generate filename based on export settings with proper sanitization
            const rawNodeName = node.name;
            // Sanitize filename to remove/replace problematic characters
            const sanitizedNodeName = rawNodeName
              .replace(/[/\\:*?"<>|]/g, '-') // Replace problematic characters with dash
              .replace(/\s+/g, ' ') // Normalize spaces
              .trim();
            
            const suffix = exportSetting.suffix || '';
            const extension = exportSetting.format.toLowerCase();
            
            // Build base filename with proper suffix and scale handling
            let baseFilename: string;
            if (suffix) {
              // If there's a custom suffix, use it as-is
              baseFilename = `${sanitizedNodeName}${suffix}`;
            } else {
              // Always add scale to filename for clarity and consistency
              if (scale === 1) {
                baseFilename = `${sanitizedNodeName}-x1`;
              } else {
                baseFilename = `${sanitizedNodeName}-x${scale}`;
              }
            }
            
            // Generate unique filename to prevent overwrites
            const filename = generateUniqueFilename(node, baseFilename, extension, exportSetting);
            const filePath = path.join(resolvedPath, filename);

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
                nodeName: sanitizedNodeName,
                filePath,
                exportSetting,
                success: true
              });

              console.error(`[Figma API] Downloaded: ${filename} (${(downloadResponse.data.byteLength / 1024).toFixed(1)}KB)`);

            } catch (downloadError) {
              results.push({
                nodeId: node.id,
                nodeName: sanitizedNodeName,
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
              nodeName: node.name.replace(/[/\\:*?"<>|]/g, '-').replace(/\s+/g, ' ').trim(),
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

    console.error(`[Figma API] Download completed: ${summary.successful}/${summary.total} successful`);

    // WORKSPACE ENFORCEMENT: Ensure all export assets end up in the actual IDE workspace (can be skipped)
    let workspaceEnforcement = null;
    if (summary.successful > 0 && !options.skipWorkspaceEnforcement) {
      console.error(`[Figma API] 🔄 Starting workspace enforcement for ${summary.successful} successful downloads...`);
      try {
        workspaceEnforcement = await FigmaApiService.enforceWorkspaceLocation(results, localPath);
        console.error(`[Figma API] 🎯 Export workspace enforcement completed successfully!`);
        console.error(`[Figma API]   ✅ ${workspaceEnforcement.summary.alreadyCorrect} already in correct location`);
        console.error(`[Figma API]   📦 ${workspaceEnforcement.summary.moved} moved to workspace`);
        console.error(`[Figma API]   ❌ ${workspaceEnforcement.summary.failed} failed to move`);
        console.error(`[Figma API]   📁 Final location: ${workspaceEnforcement.finalLocation}`);
      } catch (enforcementError) {
        console.error(`[Figma API] ❌ Export workspace enforcement failed completely:`, enforcementError);
        console.error(`[Figma API] 🔄 Falling back to legacy recovery system...`);
        
        // Fallback to original recovery system
        const expectedPaths = results.filter(r => r.success).map(r => r.filePath);
        if (expectedPaths.length > 0) {
          console.error(`[Figma API] 🔍 Verifying ${expectedPaths.length} expected paths...`);
          const verification = await FigmaApiService.verifyAssetsLocation(expectedPaths);
          
          console.error(`[Figma API] 📊 Verification results: ${verification.summary.found} found, ${verification.summary.missing} missing`);
          
          if (verification.summary.missing > 0) {
            console.error(`[Figma API] ⚠️ ${verification.summary.missing} export assets missing from expected location, attempting recovery...`);
            
            const recovery = await FigmaApiService.findAndRecoverMissingAssets(results, resolvedPath);
            
            console.error(`[Figma API] 📊 Recovery results: ${recovery.summary.recovered}/${recovery.summary.total} recovered`);
            
            if (recovery.summary.recovered > 0) {
              console.error(`[Figma API] 🎉 Successfully recovered ${recovery.summary.recovered} export assets to project directory!`);
              
              for (const recoveredAsset of recovery.recovered) {
                const resultIndex = results.findIndex(r => r.nodeId === recoveredAsset.nodeId);
                if (resultIndex !== -1 && recoveredAsset.success && results[resultIndex]) {
                  results[resultIndex].filePath = recoveredAsset.newPath;
                  results[resultIndex].success = true;
                  console.error(`[Figma API] 📦 Updated result path: ${recoveredAsset.oldPath} → ${recoveredAsset.newPath}`);
                }
              }
            } else {
              console.error(`[Figma API] ⚠️ Recovery system could not locate missing assets`);
            }
          } else {
            console.error(`[Figma API] ✅ All assets verified at expected locations`);
          }
        }
      }
    } else {
      console.error(`[Figma API] ⏭️ Skipping workspace enforcement - no successful downloads`);
    }

    return { 
      downloaded: results, 
      summary,
      workspaceEnforcement: workspaceEnforcement ? {
        finalLocation: workspaceEnforcement.finalLocation,
        moved: workspaceEnforcement.summary.moved,
        workspaceSource: workspaceEnforcement.workspaceInfo.source,
        confidence: workspaceEnforcement.workspaceInfo.confidence
      } : null
    };
  }

  /**
   * Get comments for a Figma file
   */
  async getComments(fileKey: string): Promise<FigmaCommentsResponse> {
    if (!fileKey || typeof fileKey !== 'string') {
      throw new FigmaApiError('File key is required and must be a string');
    }

    try {
      return await this.makeRequest<FigmaCommentsResponse>(`/files/${fileKey}/comments`);
    } catch (error) {
      if (error instanceof FigmaApiError) {
        throw error;
      }
      throw new FigmaApiError(`Failed to get comments from file ${fileKey}: ${error}`);
    }
  }



  /**
   * Get OS-specific dangerous paths that should never be used for asset downloads
   */
  private static getDangerousPaths(): string[] {
    const platform = os.platform();
    
    switch (platform) {
      case 'win32':
        // Windows dangerous paths
        return [
          'C:\\',
          'C:\\Windows',
          'C:\\Program Files',
          'C:\\Program Files (x86)',
          'C:\\System32',
          'C:\\Users\\Public',
          'D:\\',
          'E:\\',
          // Also check for drive letters generically
          ...Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i) + ':\\')
        ];
      
      case 'darwin':
        // macOS dangerous paths
        return [
          '/',
          '/System',
          '/Library',
          '/usr',
          '/bin',
          '/sbin',
          '/etc',
          '/var',
          '/tmp',
          '/Applications',
          '/private'
        ];
      
      default:
        // Linux and other Unix-like systems
        return [
          '/',
          '/bin',
          '/usr',
          '/etc',
          '/root',
          '/var',
          '/sys',
          '/proc',
          '/boot',
          '/dev',
          '/lib',
          '/sbin',
          '/tmp'
        ];
    }
  }

  /**
   * Check if a path is considered dangerous/system path for the current OS
   */
  private static isDangerousPath(checkPath: string): boolean {
    const dangerousPaths = this.getDangerousPaths();
    const normalizedCheckPath = path.normalize(checkPath);
    
    return dangerousPaths.some(dangerous => {
      const normalizedDangerous = path.normalize(dangerous);
      return normalizedCheckPath === normalizedDangerous || 
             normalizedCheckPath.startsWith(normalizedDangerous + path.sep);
    });
  }

  /**
   * Check if current working directory indicates a system root (cross-platform)
   */
  private static isSystemRoot(dir: string): boolean {
    const normalizedDir = path.normalize(dir);
    const platform = os.platform();
    
    switch (platform) {
      case 'win32':
        // Windows: Check for drive root (C:\, D:\, etc.)
        return /^[A-Z]:\\?$/i.test(normalizedDir);
      
      default:
        // Unix-like systems: Check for root directory
        return normalizedDir === path.sep || normalizedDir.length <= 1;
    }
  }

  /**
   * Get OS-appropriate search locations for missing assets
   */
  private static getAssetSearchLocations(): string[] {
    const platform = os.platform();
    const homeDir = os.homedir();
    const cwd = process.cwd();
    
    const commonLocations = [
      homeDir,
      path.join(homeDir, 'figma-workspace'),
      path.join(homeDir, 'figma-workspace', 'assets'),
      cwd,
      path.join(cwd, '..'),
      path.join(cwd, 'assets'),
      path.join(cwd, 'figma-assets')
    ];
    
    switch (platform) {
      case 'win32':
        return [
          ...commonLocations,
          path.join(homeDir, 'Downloads'),
          path.join(homeDir, 'Desktop'),
          path.join(homeDir, 'Documents'),
          'C:\\temp',
          'C:\\tmp',
          // Don't search system roots on Windows
        ];
      
      case 'darwin':
        return [
          ...commonLocations,
          path.join(homeDir, 'Downloads'),
          path.join(homeDir, 'Desktop'),
          path.join(homeDir, 'Documents'),
          '/tmp',
          // macOS specific locations
          path.join(homeDir, 'Library', 'Application Support'),
        ];
      
      default:
        // Linux and other Unix-like systems
        return [
          ...commonLocations,
          path.join(homeDir, 'Downloads'),
          path.join(homeDir, 'Desktop'),
          path.join(homeDir, 'Documents'),
          '/tmp',
          // Only add root if we're not running as root user
          ...(process.getuid && process.getuid() !== 0 ? ['/'] : []),
          '/assets',
          '/figma-assets'
        ];
    }
  }

  /**
   * Enhanced workspace detection specifically designed for Cursor IDE compatibility
   * This addresses the known Cursor bug where process.cwd() returns wrong directories
   */
  private static getActualWorkspaceDirectory(): { workspaceDir: string; confidence: 'high' | 'medium' | 'low'; source: string } {
    console.error(`[Figma API] 🎯 Enhanced workspace detection starting...`);
    console.error(`[Figma API] 📊 Initial context: process.cwd()="${process.cwd()}", PWD="${process.env.PWD}"`);
    
    const candidates: Array<{ dir: string; confidence: 'high' | 'medium' | 'low'; source: string }> = [];
    
    // Detect if we're in Cursor IDE environment
    const isCursorIDE = 
      process.env.CURSOR_USER_DATA_DIR ||
      process.env.CURSOR_CONFIG_DIR ||
      process.env.VSCODE_IPC_HOOK_CLI ||
      process.argv.some(arg => arg.includes('cursor')) ||
      !!process.env.CURSOR_DEBUG;
    
    if (isCursorIDE) {
      console.error(`[Figma API] 🎯 Cursor IDE detected - applying enhanced detection`);
    }
    
    // HIGHEST PRIORITY: Cursor-specific workspace variables
    const cursorSpecificSources = [
      { env: 'WORKSPACE_FOLDER_PATHS', label: 'Cursor Workspace Folders', priority: 'ultra-high' },
      { env: 'CURSOR_WORKSPACE_ROOT', label: 'Cursor Workspace Root', priority: 'high' },
      { env: 'VSCODE_WORKSPACE_ROOT', label: 'VS Code Workspace Root', priority: 'high' }
    ];
    
    for (const source of cursorSpecificSources) {
      const envValue = process.env[source.env];
      if (envValue) {
        // Handle multiple workspace paths (WORKSPACE_FOLDER_PATHS can contain multiple paths)
        const workspacePaths = envValue.includes(';') ? envValue.split(';') : [envValue];
        
        for (const dir of workspacePaths) {
          const cleanDir = dir.trim();
          if (cleanDir && !this.isSystemRoot(cleanDir)) {
            try {
              fsSync.accessSync(cleanDir);
              if (this.isValidProjectDirectory(cleanDir)) {
                const confidence = source.priority === 'ultra-high' ? 'high' : 'high';
                candidates.push({ dir: cleanDir, confidence, source: source.label });
                console.error(`[Figma API] ✅ Found ${source.label}: ${cleanDir}`);
              }
            } catch {
              console.error(`[Figma API] ⚠️ ${source.label} not accessible: ${cleanDir}`);
            }
          }
        }
      }
    }
    
    // High confidence candidates - standard workspace detection
    const highConfidenceSources = [
      { env: 'PROJECT_ROOT', label: 'Project Root' },
      { env: 'WORKSPACE_ROOT', label: 'Workspace Root' },
      { env: 'npm_config_prefix', label: 'NPM Project Root' },
      { env: 'INIT_CWD', label: 'Initial Working Directory' }
    ];
    
    for (const source of highConfidenceSources) {
      const dir = process.env[source.env];
      if (dir && !this.isSystemRoot(dir)) {
        try {
          fsSync.accessSync(dir);
          if (this.isValidProjectDirectory(dir)) {
            candidates.push({ dir, confidence: 'high', source: source.label });
            console.error(`[Figma API] ✅ Found ${source.label}: ${dir}`);
          }
        } catch {
          console.error(`[Figma API] ⚠️ ${source.label} not accessible: ${dir}`);
        }
      }
    }
    
    // Medium confidence - process working directory sources
    const mediumConfidenceSources = [
      { env: 'PWD', label: 'Shell Working Directory' },
      { env: 'OLDPWD', label: 'Previous Working Directory' }
    ];
    
    for (const source of mediumConfidenceSources) {
      const dir = process.env[source.env];
      if (dir && !this.isSystemRoot(dir)) {
        try {
          fsSync.accessSync(dir);
          if (this.isValidProjectDirectory(dir)) {
            candidates.push({ dir, confidence: 'medium', source: source.label });
            console.error(`[Figma API] ✅ Found ${source.label}: ${dir}`);
          }
        } catch {
          console.error(`[Figma API] ⚠️ ${source.label} not accessible: ${dir}`);
        }
      }
    }
    
    // Project marker-based detection (medium confidence) - enhanced for Cursor
    console.error(`[Figma API] 🔍 Searching for project markers...`);
    const markerBasedDirs = this.findProjectDirectoryByMarkers();
    for (const dir of markerBasedDirs) {
      if (!candidates.some(c => c.dir === dir)) {
        candidates.push({ dir, confidence: 'medium', source: 'Project Markers' });
        console.error(`[Figma API] ✅ Found via project markers: ${dir}`);
      }
    }
    
    // Special handling for Cursor: if process.cwd() is system root, skip it entirely
    const processCwd = process.cwd();
    if (isCursorIDE && this.isSystemRoot(processCwd)) {
      console.error(`[Figma API] 🚨 Cursor bug detected: process.cwd() is system root (${processCwd}), ignoring`);
    } else if (!this.isSystemRoot(processCwd) && this.isValidProjectDirectory(processCwd)) {
      if (!candidates.some(c => c.dir === processCwd)) {
        candidates.push({ dir: processCwd, confidence: 'low', source: 'Process Working Directory' });
        console.error(`[Figma API] ✅ Valid process.cwd(): ${processCwd}`);
      }
    } else {
      console.error(`[Figma API] ❌ Invalid process.cwd(): ${processCwd}`);
    }
    
    // Sort by confidence and prefer high confidence results
    candidates.sort((a, b) => {
      const confidenceOrder = { 'high': 3, 'medium': 2, 'low': 1 };
      return confidenceOrder[b.confidence] - confidenceOrder[a.confidence];
    });
    
    console.error(`[Figma API] 🔍 Workspace detection found ${candidates.length} candidates:`);
    candidates.forEach((candidate, index) => {
      console.error(`[Figma API]   ${index + 1}. ${candidate.dir} (${candidate.confidence} confidence, ${candidate.source})`);
    });
    
    // Return the best candidate or intelligent fallback
    if (candidates.length > 0) {
      const best = candidates[0]!; // Safe because we checked length > 0
      console.error(`[Figma API] ✅ Selected workspace: ${best.dir} (${best.confidence} confidence)`);
      return { workspaceDir: best.dir, confidence: best.confidence, source: best.source };
    }
    
    // For Cursor IDE: try to find the actual project directory in common locations
    if (isCursorIDE) {
      console.error(`[Figma API] 🎯 Cursor IDE fallback: searching common project locations`);
      
      const commonProjectLocations = [
        path.join(os.homedir(), 'Desktop'),
        path.join(os.homedir(), 'Documents'),
        path.join(os.homedir(), 'Projects'),
        path.join(os.homedir(), 'Development'),
        path.join(os.homedir(), 'Code'),
        os.homedir()
      ];
      
      for (const baseDir of commonProjectLocations) {
        try {
          const entries = fsSync.readdirSync(baseDir, { withFileTypes: true });
          for (const entry of entries.slice(0, 10)) { // Limit search to first 10 entries
            if (entry.isDirectory()) {
              const projectCandidate = path.join(baseDir, entry.name);
              if (this.isValidProjectDirectory(projectCandidate)) {
                console.error(`[Figma API] 🎯 Found potential Cursor project: ${projectCandidate}`);
                return { workspaceDir: projectCandidate, confidence: 'medium', source: 'Cursor Project Search' };
              }
            }
          }
        } catch {
          // Directory not accessible
        }
      }
    }
    
    // Last resort fallback - but create a proper project structure
    const fallback = path.join(os.homedir(), 'figma-mcp-workspace');
    console.error(`[Figma API] 🔧 No valid workspace found, using enhanced fallback: ${fallback}`);
    
    // Try to create the fallback directory structure
    try {
      fsSync.mkdirSync(fallback, { recursive: true });
      // Create a package.json to make it look like a proper project
      const packageJsonPath = path.join(fallback, 'package.json');
      if (!fsSync.existsSync(packageJsonPath)) {
        fsSync.writeFileSync(packageJsonPath, JSON.stringify({
          name: 'figma-mcp-workspace',
          version: '1.0.0',
          description: 'Workspace for Figma MCP assets',
          private: true
        }, null, 2));
      }
      console.error(`[Figma API] ✅ Created fallback workspace with package.json`);
    } catch (error) {
      console.error(`[Figma API] ⚠️ Could not enhance fallback workspace:`, error);
    }
    
    return { workspaceDir: fallback, confidence: 'low', source: 'Enhanced Fallback' };
  }

  /**
   * Enforce assets are in the actual IDE workspace - move them if needed
   */
  private static async enforceWorkspaceLocation(
    downloadResults: Array<{ nodeId: string; nodeName: string; filePath: string; success: boolean; error?: string }>,
    requestedPath: string
  ): Promise<{
    finalLocation: string;
    moved: Array<{ nodeId: string; nodeName: string; oldPath: string; newPath: string; success: boolean }>;
    summary: { total: number; alreadyCorrect: number; moved: number; failed: number };
    workspaceInfo: { dir: string; confidence: 'high' | 'medium' | 'low'; source: string };
  }> {
    console.error(`[Figma API] 🎯 Enforcing workspace location for assets...`);
    console.error(`[Figma API] 📥 Input: ${downloadResults.length} download results, requested path: "${requestedPath}"`);
    
    // Get the actual workspace directory
    const workspaceInfo = this.getActualWorkspaceDirectory();
    console.error(`[Figma API] 🏠 Detected workspace: "${workspaceInfo.workspaceDir}" (${workspaceInfo.confidence} confidence from ${workspaceInfo.source})`);
    
    // Determine the final target directory in the workspace
    const requestedBasename = path.basename(requestedPath);
    const workspaceTargetDir = path.resolve(workspaceInfo.workspaceDir, requestedBasename);
    
    console.error(`[Figma API] 📁 Target workspace location: ${workspaceTargetDir}`);
    console.error(`[Figma API] 🔄 Assets to process: ${downloadResults.filter(r => r.success).length} successful downloads`);
    
    const moved: Array<{ nodeId: string; nodeName: string; oldPath: string; newPath: string; success: boolean }> = [];
    const successfulDownloads = downloadResults.filter(r => r.success);
    
    let alreadyCorrect = 0;
    let movedCount = 0;
    let failed = 0;
    
    for (const result of successfulDownloads) {
      const currentPath = result.filePath;
      const filename = path.basename(currentPath);
      const targetPath = path.join(workspaceTargetDir, filename);
      
      console.error(`[Figma API] 🔍 Processing asset: ${result.nodeName}`);
      console.error(`[Figma API]   📁 Current path: ${currentPath}`);
      console.error(`[Figma API]   🎯 Target path: ${targetPath}`);
      console.error(`[Figma API]   📋 Filename: ${filename}`);
      
      // Check if file is already in the correct workspace location
      if (path.normalize(currentPath) === path.normalize(targetPath)) {
        console.error(`[Figma API] ✅ Already in workspace: ${filename}`);
        alreadyCorrect++;
        continue;
      }
      
      // Check if file actually exists at current location
      try {
        await fs.access(currentPath);
      } catch {
        console.error(`[Figma API] ⚠️ File not found at reported location: ${currentPath}`);
        
        // Try to find it using our search system
        const searchLocations = this.getAssetSearchLocations();
        let foundPath: string | null = null;
        
        for (const searchLoc of searchLocations) {
          try {
            const candidatePath = path.join(searchLoc, filename);
            await fs.access(candidatePath);
            const stat = await fs.stat(candidatePath);
            if (stat.size > 0) {
              foundPath = candidatePath;
              console.error(`[Figma API] 🔍 Found ${filename} at: ${candidatePath}`);
              break;
            }
          } catch {
            // Continue searching
          }
        }
        
        if (!foundPath) {
          console.error(`[Figma API] ❌ Could not locate ${filename} for workspace enforcement`);
          moved.push({
            nodeId: result.nodeId,
            nodeName: result.nodeName,
            oldPath: currentPath,
            newPath: targetPath,
            success: false
          });
          failed++;
          continue;
        }
        
        // Update current path to found location
        result.filePath = foundPath;
      }
      
      // Ensure target directory exists
      try {
        await this.createDirectorySafely(workspaceTargetDir, requestedPath);
      } catch (dirError) {
        console.error(`[Figma API] ❌ Failed to create workspace directory: ${dirError}`);
        moved.push({
          nodeId: result.nodeId,
          nodeName: result.nodeName,
          oldPath: result.filePath,
          newPath: targetPath,
          success: false
        });
        failed++;
        continue;
      }
      
            // Move/copy the file to workspace with robust cross-filesystem support
      try {
        const originalPath = result.filePath; // Save original path before moving
        
        console.error(`[Figma API] 🔄 Attempting to move: ${filename}`);
        console.error(`[Figma API]   📤 From: ${originalPath}`);
        console.error(`[Figma API]   📥 To: ${targetPath}`);
        
        // Check source file exists and get stats
        let sourceStats;
        try {
          sourceStats = await fs.stat(originalPath);
          console.error(`[Figma API]   📊 Source file: ${Math.round(sourceStats.size / 1024)}KB`);
        } catch (statError) {
          throw new Error(`Source file does not exist: ${originalPath}`);
        }
        
        // Ensure target directory exists
        const targetDir = path.dirname(targetPath);
        try {
          await fs.mkdir(targetDir, { recursive: true });
        } catch (mkdirError) {
          console.error(`[Figma API] ⚠️ Target directory creation failed:`, mkdirError);
        }
        
        let moveSuccess = false;
        let moveMethod = '';
        
        // Method 1: Try atomic rename (fastest, works on same filesystem)
        try {
          await fs.rename(originalPath, targetPath);
          moveSuccess = true;
          moveMethod = 'atomic rename';
          console.error(`[Figma API] ✅ Success via atomic rename: ${filename}`);
                 } catch (renameError) {
           console.error(`[Figma API] ⚠️ Atomic rename failed (likely cross-filesystem):`, renameError instanceof Error ? renameError.message : String(renameError));
          
          // Method 2: Copy + verify + delete (cross-filesystem safe)
          try {
            console.error(`[Figma API] 🔄 Trying copy + delete method...`);
            
            // Copy the file
            await fs.copyFile(originalPath, targetPath);
            
            // Verify the copy was successful
            const targetStats = await fs.stat(targetPath);
            if (targetStats.size !== sourceStats.size) {
              throw new Error(`Copy verification failed: size mismatch (${sourceStats.size} vs ${targetStats.size})`);
            }
            
            console.error(`[Figma API] ✅ Copy verified: ${Math.round(targetStats.size / 1024)}KB`);
            
            // Only delete original after successful copy verification
            await fs.unlink(originalPath);
            
            moveSuccess = true;
            moveMethod = 'copy + delete';
            console.error(`[Figma API] ✅ Success via copy + delete: ${filename}`);
            
                     } catch (copyError) {
             console.error(`[Figma API] ❌ Copy + delete failed:`, copyError instanceof Error ? copyError.message : String(copyError));
             
             // Method 3: Last resort - streaming copy (handles large files and permission issues)
             try {
               console.error(`[Figma API] 🔄 Trying streaming copy method...`);
               
               const readStream = (await import('fs')).createReadStream(originalPath);
               const writeStream = (await import('fs')).createWriteStream(targetPath);
               
               await new Promise<void>((resolve, reject) => {
                 readStream.pipe(writeStream);
                 writeStream.on('finish', () => resolve());
                 writeStream.on('error', reject);
                 readStream.on('error', reject);
               });
               
               // Verify streaming copy
               const streamTargetStats = await fs.stat(targetPath);
               if (streamTargetStats.size !== sourceStats.size) {
                 throw new Error(`Streaming copy verification failed: size mismatch`);
               }
               
               // Delete original
               await fs.unlink(originalPath);
               
               moveSuccess = true;
               moveMethod = 'streaming copy';
               console.error(`[Figma API] ✅ Success via streaming copy: ${filename}`);
               
             } catch (streamError) {
               const streamErrorMsg = streamError instanceof Error ? streamError.message : String(streamError);
               console.error(`[Figma API] ❌ All move methods failed for ${filename}:`, streamErrorMsg);
               throw new Error(`All move methods failed: ${streamErrorMsg}`);
             }
          }
        }
        
        if (moveSuccess) {
          // Final verification
          try {
            const finalStats = await fs.stat(targetPath);
            console.error(`[Figma API] 🎉 Move completed via ${moveMethod}: ${filename} (${Math.round(finalStats.size / 1024)}KB)`);
            
            // Update the result with new path
            result.filePath = targetPath;
            
            moved.push({
              nodeId: result.nodeId,
              nodeName: result.nodeName,
              oldPath: originalPath,
              newPath: targetPath,
              success: true
            });
            movedCount++;
            
                     } catch (verifyError) {
             throw new Error(`Move appeared successful but target file verification failed: ${verifyError instanceof Error ? verifyError.message : String(verifyError)}`);
          }
        } else {
          throw new Error('Unknown move failure - none of the methods succeeded');
        }

      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error(`[Figma API] ❌ Failed to move ${filename} to workspace: ${errorMsg}`);
        console.error(`[Figma API] 🔍 This usually indicates a filesystem or permission issue`);
        
        moved.push({
          nodeId: result.nodeId,
          nodeName: result.nodeName,
          oldPath: result.filePath,
          newPath: targetPath,
          success: false
        });
        failed++;
      }
    }
    
    const summary = {
      total: successfulDownloads.length,
      alreadyCorrect,
      moved: movedCount,
      failed
    };
    
    console.error(`[Figma API] 🎯 Workspace enforcement completed:`);
    console.error(`[Figma API]   📊 ${summary.alreadyCorrect} already correct, ${summary.moved} moved, ${summary.failed} failed`);
    console.error(`[Figma API]   📁 Final location: ${workspaceTargetDir}`);
    
    return {
      finalLocation: workspaceTargetDir,
      moved,
      summary,
      workspaceInfo: { dir: workspaceInfo.workspaceDir, confidence: workspaceInfo.confidence, source: workspaceInfo.source }
    };
  }
} 