#!/usr/bin/env node

import { fileURLToPath, pathToFileURL } from 'url';
import { dirname, join } from 'path';
import { platform } from 'os';

/**
 * Universal cross-platform ES module importer
 * Fixes Windows ESM URL scheme issues while maintaining compatibility
 * with macOS, Linux, and Windows
 */
function universalImport(modulePath) {
  // On Windows, absolute paths must be converted to file:// URLs for ES modules
  // On macOS and Linux, this conversion is also safe and recommended
  try {
    const fileUrl = pathToFileURL(modulePath).href;
    return import(fileUrl);
  } catch (error) {
    // Fallback: try direct import (for edge cases)
    console.error(`[Universal Import] Primary import failed, trying fallback: ${error.message}`);
    return import(modulePath);
  }
}

// Universal __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Cross-platform entry point resolution
const entryPoint = join(__dirname, '../dist/index.js');

console.error(`[Figma MCP Pro] Starting on ${platform()} platform`);
console.error(`[Figma MCP Pro] Entry point: ${entryPoint}`);

// Universal ES module import that works on all platforms
universalImport(entryPoint)
  .catch(error => {
    console.error(`[Figma MCP Pro] Failed to start:`, error);
    console.error(`[Figma MCP Pro] Platform: ${platform()}`);
    console.error(`[Figma MCP Pro] Node version: ${process.version}`);
    console.error(`[Figma MCP Pro] Entry point: ${entryPoint}`);
    process.exit(1);
  }); 