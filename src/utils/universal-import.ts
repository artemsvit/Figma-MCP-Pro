import { pathToFileURL } from 'url';
import { platform } from 'os';
import { isAbsolute, resolve } from 'path';

/**
 * Universal cross-platform ES module utilities
 * Handles Windows ESM URL scheme issues and ensures compatibility
 * across macOS, Windows, and Linux
 */
export class UniversalESM {
  
  /**
   * Universal dynamic import that works on all platforms
   * Automatically handles Windows file:// URL requirements
   */
  static async universalImport<T = any>(modulePath: string): Promise<T> {
    try {
      // Convert to absolute path first
      const absolutePath = isAbsolute(modulePath) ? modulePath : resolve(modulePath);
      
      // Convert to file:// URL for ES module compatibility
      // This is required on Windows and safe on all platforms
      const fileUrl = pathToFileURL(absolutePath).href;
      
      console.error(`[Universal ESM] Importing: ${absolutePath} -> ${fileUrl}`);
      
      return await import(fileUrl);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error(`[Universal ESM] Import failed for ${modulePath}:`, error);
      
      // Fallback: try direct import (for URLs or special cases)
      try {
        console.error(`[Universal ESM] Trying direct import fallback`);
        return await import(modulePath);
      } catch (fallbackError) {
        const fallbackMsg = fallbackError instanceof Error ? fallbackError.message : String(fallbackError);
        console.error(`[Universal ESM] All import attempts failed:`, fallbackError);
        throw new Error(`Failed to import module: ${modulePath}. Primary error: ${errorMsg}, Fallback error: ${fallbackMsg}`);
      }
    }
  }

  /**
   * Convert any path to a proper ES module URL
   * Works universally across all platforms
   */
  static pathToESMUrl(filePath: string): string {
    const absolutePath = isAbsolute(filePath) ? filePath : resolve(filePath);
    return pathToFileURL(absolutePath).href;
  }

  /**
   * Check if current platform has known ES module issues
   */
  static hasESMPathIssues(): boolean {
    return platform() === 'win32';
  }

  /**
   * Get platform-specific debugging info
   */
  static getPlatformInfo(): {
    platform: string;
    nodeVersion: string;
    esmIssues: boolean;
    architecture: string;
  } {
    return {
      platform: platform(),
      nodeVersion: process.version,
      esmIssues: this.hasESMPathIssues(),
      architecture: process.arch
    };
  }

  /**
   * Universal require/import that works in both CommonJS and ES module contexts
   */
  static async universalRequire<T = any>(modulePath: string): Promise<T> {
    // Try ES module import first
    try {
      return await this.universalImport<T>(modulePath);
    } catch (esmError) {
      const esmErrorMsg = esmError instanceof Error ? esmError.message : String(esmError);
      // Fallback to CommonJS require if available
      if (typeof require !== 'undefined') {
        try {
          console.error(`[Universal ESM] ESM import failed, trying CommonJS require`);
          return require(modulePath);
        } catch (cjsError) {
          const cjsErrorMsg = cjsError instanceof Error ? cjsError.message : String(cjsError);
          throw new Error(`Both ESM and CommonJS import failed for ${modulePath}. ESM: ${esmErrorMsg}, CJS: ${cjsErrorMsg}`);
        }
      } else {
        throw esmError;
      }
    }
  }
}

/**
 * Convenience function for quick universal imports
 */
export const universalImport = UniversalESM.universalImport;

/**
 * Convenience function for path to ESM URL conversion
 */
export const pathToESMUrl = UniversalESM.pathToESMUrl;

/**
 * Platform detection utilities
 */
export const isWindows = () => platform() === 'win32';
export const isMacOS = () => platform() === 'darwin';
export const isLinux = () => platform() === 'linux';

/**
 * Get comprehensive platform info for debugging
 */
export const getPlatformDebugInfo = () => ({
  ...UniversalESM.getPlatformInfo(),
  cwd: process.cwd(),
  env: {
    HOME: process.env.HOME,
    USERPROFILE: process.env.USERPROFILE,
    PWD: process.env.PWD,
    INIT_CWD: process.env.INIT_CWD
  }
}); 