import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { Command } from 'commander';
import dotenv from 'dotenv';
import chalk from 'chalk';
import path from 'path';
import fs from 'fs/promises';
import { VERSION } from './version.js';

// Load environment variables
dotenv.config();

// Import our services
import { FigmaApiService, FigmaApiConfig } from './services/figma-api.js';
import { ContextProcessor, ProcessingContext } from './processors/context-processor.js';
import { ContextRules } from './config/rules.js';
import { getFrameworkRules } from './config/frameworks/index.js';

// Tool schemas
const ShowFrameworksSchema = z.object({});

const GetFigmaDataSchema = z.object({
  fileKey: z.string().optional().describe('The Figma file key (optional if url provided)'),
  url: z.string().optional().describe('Full Figma URL with file and node selection (alternative to fileKey + nodeId)'),
  nodeId: z.string().optional().describe('Specific node ID to fetch (optional, extracted from url if provided)'),
  depth: z.number().min(1).max(10).default(5).describe('Maximum depth to traverse'),
  framework: z.enum(['react', 'vue', 'angular', 'svelte', 'html', 'swiftui', 'uikit', 'electron', 'tauri', 'nwjs']).describe('Target framework - REQUIRED (use select_framework first)'),
  includeImages: z.boolean().default(false).describe('Whether to include image URLs'),
  selectionOnly: z.boolean().default(false).describe('DEPRECATED: No longer needed. Select more specific elements in Figma if getting unintended content.'),
  customRules: z.record(z.any()).optional().describe('Custom processing rules')
}).refine(data => data.fileKey || data.url, {
  message: "Either fileKey or url must be provided"
});

const DownloadFigmaImagesSchema = z.object({
  fileKey: z.string().optional().describe('The Figma file key (optional if url provided)'),
  url: z.string().optional().describe('Full Figma URL with file and node selection - will scan selected area for ALL export assets'),
  nodeId: z.string().optional().describe('Specific node ID to scan for export assets (optional, extracted from url if provided)'),
  localPath: z.string().describe('Local directory path to save images (will be created if it does not exist)'),
  scale: z.number().min(0.5).max(4).default(2).optional().describe('Fallback export scale for images if no export settings found'),
  format: z.enum(['jpg', 'png', 'svg', 'pdf']).default('svg').optional().describe('Fallback image format if no export settings found')
}).refine(data => data.fileKey || data.url, {
  message: "Either fileKey or url must be provided"
});

const ProcessDesignCommentsSchema = z.object({
  url: z.string().describe('Figma URL to scan for comments (full URL from browser)'),
  framework: z.enum(['react', 'vue', 'angular', 'svelte', 'html']).describe('Target framework for code suggestions')
});

const CheckReferenceSchema = z.object({
  assetsPath: z.string().describe('Path to assets folder containing reference.png file'),
  framework: z.enum(['react', 'vue', 'angular', 'svelte', 'html']).optional().describe('Target framework for development context (optional)')
});



// Server configuration
interface ServerConfig {
  figmaApiKey: string;
  port?: number | undefined;
  debug?: boolean;
  customRules?: Partial<ContextRules>;
}

class CustomFigmaMcpServer {
  private server: Server;
  private figmaApi: FigmaApiService;
  private contextProcessor: ContextProcessor;
  private config: ServerConfig;

  // Centralized workflow constants
  private static readonly WORKFLOW_SEQUENCE = 'show_frameworks → Design data → Comments → Assets download → Reference analysis → Code generation';

  constructor(config: ServerConfig) {
    this.config = config;
    
    // Initialize Figma API service
    const apiConfig: FigmaApiConfig = {
      apiKey: config.figmaApiKey,
      cacheConfig: {
        ttl: parseInt(process.env.CACHE_TTL || '300'),
        maxSize: parseInt(process.env.CACHE_MAX_SIZE || '1000')
      },
      rateLimitConfig: {
        requestsPerMinute: parseInt(process.env.RATE_LIMIT_REQUESTS_PER_MINUTE || '60'),
        burstSize: parseInt(process.env.RATE_LIMIT_BURST_SIZE || '10')
      }
    };
    
    this.figmaApi = new FigmaApiService(apiConfig);
    this.contextProcessor = new ContextProcessor(config.customRules);
    
    // Initialize MCP server
    this.server = new Server(
      {
        name: 'figma-mcp-pro',
        version: VERSION,
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
    this.setupErrorHandling();
  }

  // Helper methods to reduce duplication
  private parseFigmaUrl(url: string): { fileKey: string; nodeId?: string } {
    try {
      const urlObj = new URL(url);
      
      // Extract fileKey from URL path like /design/ZVnXdidh7cqIeJuI8e4c6g/...
      const pathParts = urlObj.pathname.split('/');
      const designIndex = pathParts.findIndex(part => part === 'design' || part === 'file');
      
      if (designIndex === -1 || designIndex >= pathParts.length - 1) {
        throw new Error('Invalid Figma URL: could not extract file key');
      }
      
      const extractedFileKey = pathParts[designIndex + 1];
      if (!extractedFileKey) {
        throw new Error('Invalid Figma URL: file key not found after design path');
      }
      
      // Extract nodeId from query params like ?node-id=1530-166
      const nodeIdParam = urlObj.searchParams.get('node-id');
      
      return {
        fileKey: extractedFileKey,
        nodeId: nodeIdParam || undefined
      };
    } catch (error) {
      throw new McpError(
        ErrorCode.InvalidParams,
        `Invalid Figma URL: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  private generateWorkflowStatus(stepComplete: string, nextStep?: string): any {
    return {
      [`${stepComplete}_COMPLETE`]: `${stepComplete} completed successfully`,
      ...(nextStep && { NEXT_STEP: nextStep }),
      COMPLETE_WORKFLOW: CustomFigmaMcpServer.WORKFLOW_SEQUENCE
    };
  }

  private log(...args: any[]): void {
    if (this.config.debug) {
      console.error(chalk.blue(...args)); // Use stderr for logging to avoid interfering with MCP JSON
    }
  }

  private logError(...args: any[]): void {
    console.error(chalk.red(...args)); // Always log errors to stderr
  }

  private setupToolHandlers(): void {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'show_frameworks',
            description: 'STEP 1: Show available frameworks to user. Call with empty object {}. Shows options, then STOP and wait for user to tell you their choice. DO NOT make further tool calls until user provides their framework preference.',
            inputSchema: {
              type: 'object',
              properties: {},
              required: [],
              additionalProperties: false
            },
          },
          {
            name: 'get_figma_data',
            description: 'STEP 2: Get well-structured, AI-optimized Figma design data with framework-specific optimizations. Analyzes layout, components, coordinates, visual effects (shadows, borders), design tokens. PURE DESIGN DATA ONLY - no comments. Use AFTER user chooses framework. Can accept full Figma URL to automatically extract file and node selection. If getting unintended content, select a more specific element in Figma.',
            inputSchema: {
              type: 'object',
              properties: {
                fileKey: {
                  type: 'string',
                  description: 'The Figma file key (optional if url provided)'
                },
                url: {
                  type: 'string',
                  description: 'Full Figma URL with file and node selection (alternative to fileKey + nodeId)'
                },
                nodeId: {
                  type: 'string',
                  description: 'Specific node ID to fetch (optional, extracted from url if provided)'
                },
                depth: {
                  type: 'number',
                  minimum: 1,
                  maximum: 10,
                  default: 5,
                  description: 'Maximum depth to traverse'
                },
                framework: {
                  type: 'string',
                  enum: ['react', 'vue', 'angular', 'svelte', 'html', 'swiftui', 'uikit', 'electron', 'tauri', 'nwjs'],
                  default: 'html',
                  description: 'Target framework for optimized CSS and component generation (default: html)'
                },
                includeImages: {
                  type: 'boolean',
                  default: false,
                  description: 'Whether to include image URLs'
                },
                selectionOnly: {
                  type: 'boolean',
                  default: false,
                  description: 'DEPRECATED: This parameter is no longer needed. The API correctly fetches only the selected node and its contents. If you are getting unintended content, select a more specific element in Figma (the exact frame/component, not a parent container).'
                },
                customRules: {
                  type: 'object',
                  description: 'Custom processing rules'
                }
              },
              required: []
            },
          },
          {
            name: 'process_design_comments',
            description: 'STEP 3: Process designer comments with smart coordinate matching. Use AFTER get_figma_data when you want to analyze designer instructions. Converts comments into actionable AI prompts for implementation.',
            inputSchema: {
              type: 'object',
              properties: {
                url: {
                  type: 'string',
                  description: 'Figma URL to scan for comments (full URL from browser)'
                },
                framework: {
                  type: 'string',
                  enum: ['react', 'vue', 'angular', 'svelte', 'html', 'swiftui', 'uikit', 'electron', 'tauri', 'nwjs'],
                  description: 'Target framework for code suggestions'
                }
              },
              required: ['url', 'framework']
            },
          },
          {
            name: 'download_design_assets',
            description: 'STEP 4: Automatically scan selected area for ALL export-ready assets and download them with reference.png. Takes Figma URL, finds all nodes with export settings in selected area, downloads them with Figma export settings, plus creates reference.png of whole selection.',
            inputSchema: {
              type: 'object',
              properties: {
                fileKey: {
                  type: 'string',
                  description: 'The Figma file key (optional if url provided)'
                },
                url: {
                  type: 'string',
                  description: 'Full Figma URL with file and node selection - will scan selected area for ALL export assets'
                },
                nodeId: {
                  type: 'string',
                  description: 'Specific node ID to scan for export assets (optional, extracted from url if provided)'
                },
                localPath: {
                  type: 'string',
                  description: 'Local directory path to save images (will be created if it does not exist). Images will be saved with filenames based on the actual node names from Figma.'
                },
                scale: {
                  type: 'number',
                  minimum: 0.5,
                  maximum: 4,
                  default: 2,
                  description: 'Fallback export scale for images if no export settings found'
                },
                format: {
                  type: 'string',
                  enum: ['jpg', 'png', 'svg', 'pdf'],
                  default: 'svg',
                  description: 'Fallback image format if no export settings found'
                }
              },
              required: ['localPath']
            },
          },
          {
            name: 'check_reference',
            description: 'STEP 5: Analyze reference.png file for design understanding. Provides design context, layout analysis, component structure guidance, and framework-specific development recommendations before starting code implementation.',
            inputSchema: {
              type: 'object',
              properties: {
                assetsPath: {
                  type: 'string',
                  description: 'Path to assets folder containing reference.png file'
                },
                framework: {
                  type: 'string',
                  enum: ['react', 'vue', 'angular', 'svelte', 'html', 'swiftui', 'uikit', 'electron', 'tauri', 'nwjs'],
                  description: 'Target framework for development context (optional)'
                }
              },
              required: ['assetsPath']
            },
          }
        ],
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'show_frameworks':
            return await this.handleShowFrameworks(args);
          case 'get_figma_data':
            return await this.handleGetFigmaData(args);
          case 'process_design_comments':
            return await this.handleProcessDesignComments(args);
          case 'download_design_assets':
            return await this.handleDownloadDesignAssets(args);
          case 'check_reference':
            return await this.handleCheckReference(args);
          default:
            throw new McpError(
              ErrorCode.MethodNotFound,
              `Unknown tool: ${name}`
            );
        }
      } catch (error) {
        if (error instanceof McpError) {
          throw error;
        }
        
        this.logError(`Error in tool ${name}:`, error);
        throw new McpError(
          ErrorCode.InternalError,
          `Tool execution failed: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    });
  }

  private async handleShowFrameworks(args: any) {
    this.log(`[Figma MCP] Showing available frameworks, received args:`, JSON.stringify(args));
    this.log(`[Figma MCP] Args type:`, typeof args);
    
    try {
      // Handle both undefined and empty object cases
      ShowFrameworksSchema.parse(args || {});
    } catch (error) {
      this.logError(`[Figma MCP] Schema validation error for args:`, args);
      this.logError(`[Figma MCP] Schema validation error:`, error);
      throw new McpError(
        ErrorCode.InvalidParams,
        `Invalid parameters: ${error instanceof Error ? error.message : String(error)}`
      );
    }

    // Framework options
    const frameworks = [
      { id: 1, name: 'React', desc: 'Modern web framework with TypeScript and hooks' },
      { id: 2, name: 'Vue', desc: 'Progressive framework with Composition API' },
      { id: 3, name: 'Angular', desc: 'Full-featured framework with TypeScript' },
      { id: 4, name: 'Svelte', desc: 'Compile-time framework with reactive updates' },
      { id: 5, name: 'HTML/CSS/JS', desc: 'Vanilla web technologies, no framework' },
      { id: 6, name: 'SwiftUI', desc: 'Apple\'s declarative UI for iOS/macOS apps' },
      { id: 7, name: 'UIKit', desc: 'Traditional Apple framework for iOS development' },
      { id: 8, name: 'Electron', desc: 'Cross-platform desktop apps with web tech' },
      { id: 9, name: 'Tauri', desc: 'Lightweight desktop apps with Rust backend' },
      { id: 10, name: 'NW.js', desc: 'Desktop apps with Node.js and Chromium' }
    ];

    const frameworkText = `Choose your framework:

${frameworks.map(f => `${f.id}. ${f.name} - ${f.desc}`).join('\n')}

Type your choice (1-10):`;

    return {
      content: [
        {
          type: 'text',
          text: frameworkText
        },
        {
          type: 'text', 
          text: `

🚨 **CRITICAL AI INSTRUCTION**: 
- Stop here - DO NOT make any more tool calls
- Show framework options to user, short and clearly formatted, and wait for user to respond with framework number (1-10)
- Do NOT proceed to get_figma_data until user chooses
- STEP 1 COMPLETE - User must select framework first`
        }
      ]
    };
  }

  private async handleGetFigmaData(args: any) {
    this.log(`[Figma MCP] Received args:`, JSON.stringify(args, null, 2));
    
    let parsed;
    try {
      parsed = GetFigmaDataSchema.parse(args);
    } catch (error) {
      this.logError(`[Figma MCP] Schema validation error:`, error);
      throw new McpError(
        ErrorCode.InvalidParams,
        `Invalid parameters: ${error instanceof Error ? error.message : String(error)}`
      );
    }
    
    const { framework, customRules, selectionOnly } = parsed;
    const depth = parsed.depth || 5;

    // Extract fileKey and nodeId from URL if provided, otherwise use direct parameters
    let fileKey: string;
    let nodeId: string | undefined;

    if (parsed.url) {
      this.log(`[Figma MCP] Parsing URL: ${parsed.url}`);
      const urlData = this.parseFigmaUrl(parsed.url);
      fileKey = urlData.fileKey;
      nodeId = urlData.nodeId;
      this.log(`[Figma MCP] Extracted from URL - fileKey: ${fileKey}, nodeId: ${nodeId}`);
    } else {
      // Use direct parameters
      if (!parsed.fileKey) {
        throw new McpError(
          ErrorCode.InvalidParams,
          'fileKey is required when url is not provided'
        );
      }
      fileKey = parsed.fileKey;
      nodeId = parsed.nodeId;
      this.log(`[Figma MCP] Using direct parameters - fileKey: ${fileKey}, nodeId: ${nodeId}`);
    }

    // Convert node ID format from URL format (1530-166) to API format (1530:166)
    const apiNodeId = nodeId ? nodeId.replace(/-/g, ':') : undefined;

    // Load framework-specific rules
    const frameworkRules = getFrameworkRules(framework);
    this.log(`[Figma MCP] Using ${framework} framework with rules:`, frameworkRules);

    this.log(`[Figma MCP] Fetching data for file: ${fileKey} (depth: ${depth})`);
    if (apiNodeId) {
      this.log(`[Figma MCP] Target node: ${apiNodeId} (converted from: ${parsed.nodeId})`);
      this.log(`[Figma MCP] 📖 HOW FIGMA SELECTION WORKS:`);
      this.log(`[Figma MCP]    ✅ When you select a node in Figma, you get that node + ALL its contents`);
      this.log(`[Figma MCP]    ✅ This is correct - if you select a frame, you get the frame + all components inside`);
      this.log(`[Figma MCP]    ❌ If you're getting OTHER screens you didn't select, you selected a parent container`);
      this.log(`[Figma MCP]    💡 Solution: In Figma, select the SPECIFIC frame/component, not the page or parent`);
    }
    
    try {
      // Update processor rules with framework-specific rules and custom overrides
      const mergedRules = customRules ? { ...frameworkRules, ...customRules } : frameworkRules;
      this.contextProcessor.updateRules(mergedRules);

      let figmaData;
      let isSpecificNode = false;
      
      if (apiNodeId) {
        // Fetch specific node with depth - this is what user selected
        this.log(`[Figma MCP] Fetching specific node: ${apiNodeId}`);
        
        // Always use full depth to get complete content of selected node
        // The selectionOnly flag will be handled during processing, not during API fetch
        this.log(`[Figma MCP] Using depth ${depth} to get complete content of selected node`);
        if (selectionOnly) {
          this.log(`[Figma MCP] Selection-only mode: Will filter out sibling content during processing`);
        }
        
        try {
          const nodeResponse = await this.figmaApi.getFileNodes(fileKey, [apiNodeId], {
            depth: depth,
            use_absolute_bounds: true
          });
          this.log(`[Figma MCP] Node response received, keys:`, Object.keys(nodeResponse.nodes));
          const nodeWrapper = nodeResponse.nodes[apiNodeId];
          if (!nodeWrapper) {
            throw new Error(`Node ${apiNodeId} not found in file ${fileKey}. Available nodes: ${Object.keys(nodeResponse.nodes).join(', ')}`);
          }
          figmaData = nodeWrapper.document;
          isSpecificNode = true;
        } catch (apiError) {
          this.logError(`[Figma MCP] API error fetching node ${apiNodeId}:`, apiError);
          throw apiError;
        }
      } else {
        // Fetch entire file with depth - fallback when no specific selection
        this.log(`[Figma MCP] Fetching entire document (no specific selection)`);
        try {
          const fileResponse = await this.figmaApi.getFile(fileKey, {
            depth: depth,
            use_absolute_bounds: true
          });
          this.log(`[Figma MCP] File response received for document:`, fileResponse.document?.name);
          figmaData = fileResponse.document;
        } catch (apiError) {
          this.logError(`[Figma MCP] API error fetching file ${fileKey}:`, apiError);
          throw apiError;
        }
      }

      // Debug: Log the structure we received
      this.log(`[Figma MCP] Raw data structure (${isSpecificNode ? 'SPECIFIC SELECTION' : 'FULL DOCUMENT'}):`);
      this.log(`- Node ID: ${figmaData.id}`);
      this.log(`- Node Name: ${figmaData.name}`);
      this.log(`- Node Type: ${figmaData.type}`);
      this.log(`- Has Children: ${figmaData.children ? figmaData.children.length : 0}`);
      
      if (figmaData.children && figmaData.children.length > 0) {
        const maxChildren = isSpecificNode ? Math.min(10, figmaData.children.length) : Math.min(5, figmaData.children.length);
        this.log(`[Figma MCP] Showing ${maxChildren} of ${figmaData.children.length} children:`);
        for (let i = 0; i < maxChildren; i++) {
          const child = figmaData.children[i];
          if (child) {
            this.log(`  - Child ${i}: "${child.name}" (${child.type}) - Children: ${child.children ? child.children.length : 0}`);
            if (child.absoluteBoundingBox) {
              this.log(`    Bounds: ${Math.round(child.absoluteBoundingBox.x)}, ${Math.round(child.absoluteBoundingBox.y)} (${Math.round(child.absoluteBoundingBox.width)}x${Math.round(child.absoluteBoundingBox.height)})`);
            }
          }
        }
        if (figmaData.children.length > maxChildren) {
          this.log(`  - ... and ${figmaData.children.length - maxChildren} more children`);
        }
      }
      
      // Additional guidance for users about selection scope
      if (isSpecificNode && figmaData.children && figmaData.children.length > 1) {
        this.log(`[Figma MCP] ✅ SELECTION ANALYSIS: You selected "${figmaData.name}" (${figmaData.type}) which contains ${figmaData.children.length} child elements.`);
        this.log(`[Figma MCP] 📋 This is the correct behavior - you get the selected element AND all its contents.`);
        this.log(`[Figma MCP] 💡 If you're seeing content from OTHER screens you didn't select:`);
        this.log(`[Figma MCP]    - You may have selected a parent container (like a page or large frame)`);
        this.log(`[Figma MCP]    - In Figma, select the SPECIFIC frame/component you want, not its parent`);
        this.log(`[Figma MCP]    - Look for the exact screen/component in the layers panel and select that`);
      } else if (isSpecificNode) {
        this.log(`[Figma MCP] ✅ SELECTION ANALYSIS: You selected "${figmaData.name}" (${figmaData.type}) - single element with no children.`);
      }

      // Process the data with context enhancement
      const processingContext: ProcessingContext = {
        fileKey,
        depth: 0,
        siblingIndex: 0,
        totalSiblings: 1,
        framework
      };

      let enhancedData = await this.contextProcessor.processNode(figmaData, processingContext);

      // Get processing stats
      const stats = this.contextProcessor.getStats();
      
      // Note: Image fetching removed - exportable images are detected in data structure
      // Use download_figma_images tool for actual image downloads

      this.log(`[Figma MCP] Successfully processed ${stats.nodesProcessed} nodes`);

      // Generate optimized data for AI (removing redundant information)
      const optimizedData = this.contextProcessor.optimizeForAI(enhancedData);

      // Create clean metadata (design data only)
      const debugInfo: any = {
        framework: framework,
        frameworkRules: frameworkRules,
        source: isSpecificNode ? 'selection' : 'document',
        processed: stats.nodesProcessed,
        selectedNode: isSpecificNode ? { id: figmaData.id, name: figmaData.name, type: figmaData.type, childCount: figmaData.children?.length || 0 } : null,
                      IMPORTANT_NEXT_STEPS: {
                STEP_3: 'REQUIRED: Use process_design_comments tool to check for designer comments',
                STEP_4: 'Use download_design_assets tool to get images and visual reference',
                STEP_5: 'Use check_reference tool to analyze reference.png before development',
                COMPLETE_WORKFLOW: CustomFigmaMcpServer.WORKFLOW_SEQUENCE,
                CURRENT_STATUS: 'STEP 2 COMPLETE - Design data extracted successfully'
              }
      };

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              // Essential metadata FIRST - so AI sees guidance immediately
              metadata: debugInfo,
              
              // Primary data: AI-optimized and clean  
              data: optimizedData
            }, null, 2)
          }
        ]
      };

    } catch (error) {
      this.logError(`[Figma MCP] Error fetching data:`, error);
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to fetch Figma data: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }



  private async handleProcessDesignComments(args: any) {
    this.log(`[Figma MCP] Processing design comments:`, JSON.stringify(args, null, 2));
    
    let parsed;
    try {
      parsed = ProcessDesignCommentsSchema.parse(args);
    } catch (error) {
      this.logError(`[Figma MCP] Schema validation error:`, error);
      throw new McpError(
        ErrorCode.InvalidParams,
        `Invalid parameters: ${error instanceof Error ? error.message : String(error)}`
      );
    }
    
    const { url, framework } = parsed;

    // Parse Figma URL to extract fileKey and nodeId
    const urlData = this.parseFigmaUrl(url);
    const fileKey = urlData.fileKey;
    const nodeId = urlData.nodeId;
    
    this.log(`[Figma MCP] Parsed URL - fileKey: ${fileKey}, nodeId: ${nodeId}, framework: ${framework}`);

    try {
      // Fetch comments from Figma API
      this.log(`[Figma MCP] Fetching comments for file: ${fileKey}`);
      const commentsResponse = await this.figmaApi.getComments(fileKey);
      let relevantComments = commentsResponse.comments;
      
      // If specific node is selected, filter comments to only those related to the selection
      if (nodeId) {
        const apiNodeId = nodeId.replace(/-/g, ':');
        this.log(`[Figma MCP] Filtering comments for specific node: ${apiNodeId} (from ${nodeId})`);
        
        // Get the bounds of the selected node for coordinate-based filtering
        let selectedNodeBounds = null;
        try {
          const nodeResponse = await this.figmaApi.getFileNodes(fileKey, [apiNodeId], { depth: 1 });
          const selectedNode = nodeResponse.nodes[apiNodeId]?.document;
          if (selectedNode?.absoluteBoundingBox) {
            selectedNodeBounds = selectedNode.absoluteBoundingBox;
            this.log(`[Figma MCP] Selected node bounds:`, selectedNodeBounds);
          }
        } catch (boundsError) {
          this.log(`[Figma MCP] Could not get node bounds for filtering:`, boundsError);
        }
        
        // Filter comments that are related to the selected node
        const originalCount = relevantComments.length;
        relevantComments = relevantComments.filter(comment => {
          // Check if comment is directly on the selected node
          if (comment.client_meta?.node_id === apiNodeId) {
            this.log(`[Figma MCP] Comment directly on selected node: "${comment.message}"`);
            return true;
          }
          
          // Check if comment coordinates are within selected node bounds
          if (selectedNodeBounds) {
            const commentAny = comment as any; // Type cast to access coordinate properties
            const commentX = comment.client_meta?.node_offset?.x || (comment.client_meta as any)?.x || commentAny.x;
            const commentY = comment.client_meta?.node_offset?.y || (comment.client_meta as any)?.y || commentAny.y;
            
            if (commentX !== undefined && commentY !== undefined) {
              const isWithinBounds = commentX >= selectedNodeBounds.x && 
                                    commentX <= selectedNodeBounds.x + selectedNodeBounds.width &&
                                    commentY >= selectedNodeBounds.y && 
                                    commentY <= selectedNodeBounds.y + selectedNodeBounds.height;
              
              if (isWithinBounds) {
                this.log(`[Figma MCP] Comment within node bounds: "${comment.message}" at (${commentX}, ${commentY})`);
                return true;
              }
            }
          }
          
          return false; // Exclude comments not related to the selected node
        });
        
        this.log(`[Figma MCP] Comment filtering: ${originalCount} total → ${relevantComments.length} relevant to selected node`);
      }
      
      this.log(`[Figma MCP] Found ${relevantComments.length} comments to process${nodeId ? ' for selected node' : ' in file'}`);

      if (relevantComments.length === 0) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                message: nodeId ? 'No comments found for the selected node/section' : 'No comments found in this design',
                comments: [],
                aiPrompts: [],
                nodeSelection: nodeId ? `Checked for comments on node: ${nodeId}` : 'Checked entire file',
                WORKFLOW_STATUS: this.generateWorkflowStatus('STEP_3', 'STEP 4: Use download_design_assets tool to get images and reference.png')
              }, null, 2)
            }
          ]
        };
      }

      // Get design data to extract elements with bounds
      this.log(`[Figma MCP] Fetching design data for element analysis`);
      const figmaDataArgs: any = {
        fileKey,
        framework,
        includeComments: false,
        depth: 5
      };
      
      if (nodeId) {
        figmaDataArgs.nodeId = nodeId;
      }

      const figmaDataResult = await this.handleGetFigmaData(figmaDataArgs);
      const analysisData = figmaDataResult?.content?.[0]?.text ? JSON.parse(figmaDataResult.content[0].text) : {};
      
      // Extract all elements with bounds from analysis data
      const elementsWithBounds = this.extractElementsWithBounds(analysisData.data);
      this.log(`[Figma MCP] Extracted ${elementsWithBounds.length} elements with bounds for matching`);

      // Process each comment and create clean implementation instructions
      const implementations = [];
      
      this.log(`[Figma MCP] Debug - Relevant comments structure:`, JSON.stringify(relevantComments, null, 2));
      this.log(`[Figma MCP] Debug - Elements with bounds:`, elementsWithBounds.length);

      for (const comment of relevantComments) {
        this.log(`[Figma MCP] Debug - Processing comment:`, JSON.stringify(comment, null, 2));
        
        // Extract coordinates from comment structure
        let coordinates = null;
        if (comment.client_meta?.node_offset) {
          coordinates = {
            x: comment.client_meta.node_offset.x,
            y: comment.client_meta.node_offset.y
          };
          this.log(`[Figma MCP] Found coordinates: (${coordinates.x}, ${coordinates.y})`);
                 } else {
           this.log(`[Figma MCP] No coordinates in client_meta.node_offset`);
           this.log(`[Figma MCP] Available client_meta:`, comment.client_meta || 'null');
         }
        
        // Find target element if coordinates available
        let targetElement = null;
        if (coordinates) {
          // Find element containing or near the comment
          const candidateElements = elementsWithBounds.filter(element => {
            const bounds = element.bounds;
            const isInside = coordinates.x >= bounds.x && 
                            coordinates.x <= bounds.x + bounds.width &&
                            coordinates.y >= bounds.y && 
                            coordinates.y <= bounds.y + bounds.height;
            
            if (!isInside) {
              // Check if comment is near the element (within 100px)
              const centerX = bounds.x + bounds.width / 2;
              const centerY = bounds.y + bounds.height / 2;
              const distance = Math.sqrt(Math.pow(coordinates.x - centerX, 2) + Math.pow(coordinates.y - centerY, 2));
              return distance <= 100;
            }
            return true;
          });
          
          if (candidateElements.length > 0) {
            // Sort by proximity and take closest
            candidateElements.sort((a, b) => {
              const distA = Math.sqrt(
                Math.pow(coordinates.x - (a.bounds.x + a.bounds.width / 2), 2) + 
                Math.pow(coordinates.y - (a.bounds.y + a.bounds.height / 2), 2)
              );
              const distB = Math.sqrt(
                Math.pow(coordinates.x - (b.bounds.x + b.bounds.width / 2), 2) + 
                Math.pow(coordinates.y - (b.bounds.y + b.bounds.height / 2), 2)
              );
              return distA - distB;
            });
            targetElement = candidateElements[0]?.name;
            this.log(`[Figma MCP] Matched comment to element: ${targetElement}`);
          }
        }
        
        // Create clean implementation instruction
        const implementation = {
          instruction: comment.message,
          targetElement: targetElement || "Apply to relevant design element",
          coordinates: coordinates
        };
        
        implementations.push(implementation);
        this.log(`[Figma MCP] Added implementation: "${comment.message}" → ${targetElement || 'General'}`);
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              implementations: implementations,
              framework: framework,
              nodeContext: nodeId ? `Comments for node: ${nodeId}` : 'Comments for entire file',
              WORKFLOW_STATUS: this.generateWorkflowStatus('STEP_3', 'STEP 4: Use download_design_assets tool to get images and reference.png')
            }, null, 2)
          }
        ]
      };

    } catch (error) {
      this.logError(`[Figma MCP] Error processing comments:`, error);
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to process design comments: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Extract all elements with bounds from analysis data recursively
   */
  private extractElementsWithBounds(data: any): Array<{
    id: string;
    name: string;
    type: string;
    bounds: { x: number; y: number; width: number; height: number };
    path: string;
  }> {
    const elements: Array<{
      id: string;
      name: string;
      type: string;
      bounds: { x: number; y: number; width: number; height: number };
      path: string;
    }> = [];

    const traverse = (node: any, path: string = '') => {
      const fullPath = path ? `${path} > ${node.name}` : node.name;
      
      // Try multiple possible bounds field names
      let bounds = null;
      if (node.bounds) {
        bounds = node.bounds;
      } else if (node.absoluteBoundingBox) {
        bounds = {
          x: node.absoluteBoundingBox.x,
          y: node.absoluteBoundingBox.y,
          width: node.absoluteBoundingBox.width,
          height: node.absoluteBoundingBox.height
        };
      } else if (node.relativeTransform && node.size) {
        // Calculate bounds from transform and size
        bounds = {
          x: node.relativeTransform[0][2] || 0,
          y: node.relativeTransform[1][2] || 0,
          width: node.size.x || 0,
          height: node.size.y || 0
        };
      }
      
      if (bounds && node.id && node.name && node.type) {
        elements.push({
          id: node.id,
          name: node.name,
          type: node.type,
          bounds: bounds,
          path: fullPath
        });
        
                 this.log(`[DEBUG] Added element: ${node.name} (${node.type}) at (${bounds.x}, ${bounds.y}) size ${bounds.width}x${bounds.height}`);
       } else {
         this.log(`[DEBUG] Skipped element: ${node.name || 'unnamed'} - missing bounds or required fields`);
         this.log(`[DEBUG] Available node fields:`, Object.keys(node));
       }

      if (node.children && Array.isArray(node.children)) {
        for (const child of node.children) {
          traverse(child, fullPath);
        }
      }
    };

    traverse(data);
    return elements;
  }

  /**
   * Setup project assets directory and copy from Cursor fallback location
   * This handles the Cursor IDE working directory bug by copying assets from the fallback location
   */

  private async handleCheckReference(args: any) {
    this.log(`[Figma MCP] Checking reference image:`, JSON.stringify(args, null, 2));
    
    let parsed;
    try {
      parsed = CheckReferenceSchema.parse(args);
    } catch (error) {
      this.logError(`[Figma MCP] Schema validation error:`, error);
      throw new McpError(
        ErrorCode.InvalidParams,
        `Invalid parameters: ${error instanceof Error ? error.message : String(error)}`
      );
    }
    
    const { assetsPath, framework: _framework } = parsed;

    try {
      // Simple path resolution
      const resolvedPath = path.isAbsolute(assetsPath) 
        ? assetsPath 
        : path.resolve(process.cwd(), assetsPath);
      
      const referencePath = path.join(resolvedPath, 'reference.png');
      
      this.log(`[Figma MCP] Looking for reference.png at: ${referencePath}`);
      
      // Simple check - does reference.png exist?
      try {
        const fileStats = await fs.stat(referencePath);
        
        if (!fileStats.isFile() || fileStats.size === 0) {
          throw new Error('File exists but is invalid');
        }
        
        const fileSizeKB = Math.round(fileStats.size / 1024);
        const relativePath = path.relative(process.cwd(), referencePath);
        
        this.log(`[Figma MCP] ✅ Reference found: ${referencePath} (${fileSizeKB}KB)`);
        
        // Success - ready for next step
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                status: 'success',
                message: 'reference.png found and verified',
                reference: {
                  path: relativePath,
                  size: `${fileSizeKB} KB`,
                  verified: true
                },
                instruction: 'Analyze reference.png with all collected design data to understand layout, components, and visual context before code implementation',
                STEP_5_COMPLETE: true,
                NEXT_ACTION: 'Implement code using reference.png analysis + design data + downloaded assets',
                READY_FOR_DEVELOPMENT: true
              }, null, 2)
            }
          ]
        };
        
      } catch (statError) {
        // File doesn't exist - need to run download_design_assets first
        this.log(`[Figma MCP] ❌ reference.png not found at: ${referencePath}`);
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                status: 'error',
                message: 'reference.png not found in assets folder',
                expectedPath: referencePath,
                REQUIRED_ACTION: 'Run download_design_assets first to create reference.png',
                STEP_4_MISSING: 'download_design_assets must be completed before check_reference',
                NEXT_STEP: 'Call download_design_assets with your Figma URL to create reference.png'
              }, null, 2)
            }
          ]
        };
      }

    } catch (error) {
      this.logError(`[Figma MCP] Error checking reference:`, error);
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to check reference: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }



  private async handleDownloadDesignAssets(args: any) {
    const parsed = DownloadFigmaImagesSchema.parse(args);
    const { localPath } = parsed;

    // Add comprehensive debug logging for path resolution
    this.log(`[Figma MCP] 🔍 DEBUG: Download request analysis:`);
    this.log(`[Figma MCP] 📁 Requested localPath: "${localPath}"`);
    this.log(`[Figma MCP] 🌍 Environment context:`);
    this.log(`[Figma MCP]   - process.cwd(): "${process.cwd()}"`);
    this.log(`[Figma MCP]   - PWD: "${process.env.PWD || 'undefined'}"`);
    this.log(`[Figma MCP]   - INIT_CWD: "${process.env.INIT_CWD || 'undefined'}"`);
    this.log(`[Figma MCP]   - PROJECT_ROOT: "${process.env.PROJECT_ROOT || 'undefined'}"`);
    this.log(`[Figma MCP]   - WORKSPACE_ROOT: "${process.env.WORKSPACE_ROOT || 'undefined'}"`);

    // Extract fileKey and nodeId from URL if provided, otherwise use direct parameters
    let fileKey: string;
    let nodeId: string | undefined;

    if (parsed.url) {
      this.log(`[Figma MCP] Parsing URL: ${parsed.url}`);
      const urlData = this.parseFigmaUrl(parsed.url);
      fileKey = urlData.fileKey;
      nodeId = urlData.nodeId;
      this.log(`[Figma MCP] Extracted from URL - fileKey: ${fileKey}, nodeId: ${nodeId}`);
    } else {
      // Use direct parameters
      if (!parsed.fileKey) {
        throw new McpError(
          ErrorCode.InvalidParams,
          'fileKey is required when url is not provided'
        );
      }
      fileKey = parsed.fileKey;
      nodeId = parsed.nodeId;
      this.log(`[Figma MCP] Using direct parameters - fileKey: ${fileKey}, nodeId: ${nodeId}`);
    }

    // Convert node ID format from URL format (1530-166) to API format (1530:166)
    const apiNodeId = nodeId ? nodeId.replace(/-/g, ':') : undefined;

    this.log(`[Figma MCP] Scanning for export assets in ${apiNodeId ? `selected area: ${apiNodeId}` : 'entire file'}`);

    try {
      // Step 1: Get the selected area data to scan for export assets
      let targetNode;
      if (apiNodeId) {
        this.log(`[Figma MCP] Fetching selected node: ${apiNodeId}`);
        const nodeResponse = await this.figmaApi.getFileNodes(fileKey, [apiNodeId], {
          depth: 10, // Deep scan to find all export assets
          use_absolute_bounds: true
        });
        const nodeWrapper = nodeResponse.nodes[apiNodeId];
        if (!nodeWrapper) {
          throw new Error(`Node ${apiNodeId} not found in file ${fileKey}`);
        }
        targetNode = nodeWrapper.document;
      } else {
        this.log(`[Figma MCP] Fetching entire document for export scan`);
        const fileResponse = await this.figmaApi.getFile(fileKey, {
          depth: 10, // Deep scan to find all export assets
          use_absolute_bounds: true
        });
        targetNode = fileResponse.document;
      }

      // Step 2: Recursively scan for all nodes with export settings
      const exportableNodes = this.findNodesWithExportSettings(targetNode);
      this.log(`[Figma MCP] Found ${exportableNodes.length} nodes with export settings`);

      if (exportableNodes.length === 0) {
        this.log(`[Figma MCP] No export settings found in selected area`);
        
        // Still create reference.png of the selected area
        let referenceResult = null;
        try {
          this.log(`[Figma MCP] Creating visual reference of selected area...`);
          referenceResult = await this.createVisualReference(fileKey, apiNodeId ? [apiNodeId] : [], localPath);
        } catch (referenceError) {
          this.logError(`[Figma MCP] Failed to create reference:`, referenceError);
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                downloads: [],
                summary: { total: 0, successful: 0, failed: 0 },
                reference: referenceResult,
                message: 'No export settings found in selected area. Only reference.png created.',
                instructions: this.generateDownloadInstructions([], referenceResult)
              }, null, 2)
            }
          ]
        };
      }

      // Step 3: Download all exportable assets with their Figma export settings
      this.log(`[Figma MCP] 🔥 DEBUG: About to download ${exportableNodes.length} export-ready assets...`);
      this.log(`[Figma MCP] 📁 Target localPath: "${localPath}"`);
      
      const downloadResult = await this.figmaApi.downloadImagesWithExportSettings(
        fileKey,
        exportableNodes,
        localPath,
        { skipWorkspaceEnforcement: true, overwriteExisting: true }
      );

      this.log(`[Figma MCP] 🔥 DEBUG: Export download completed!`);
      this.log(`[Figma MCP] 📊 Summary: ${downloadResult.summary.successful} successful, ${downloadResult.summary.failed} failed`);
      this.log(`[Figma MCP] 📁 Workspace enforcement result:`, downloadResult.workspaceEnforcement || 'No enforcement info');
      
      // Debug: Log actual file locations
      if (downloadResult.downloaded.length > 0) {
        this.log(`[Figma MCP] 🔍 DEBUG: Actual download locations:`);
        downloadResult.downloaded.forEach((download, index) => {
          this.log(`[Figma MCP]   ${index + 1}. ${download.nodeName} → ${download.filePath} (success: ${download.success})`);
        });
      }

      // Step 4: Create visual context reference of the selected area
      let referenceResult = null;
      try {
        this.log(`[Figma MCP] Creating visual reference of selected area...`);
        referenceResult = await this.createVisualReference(fileKey, apiNodeId ? [apiNodeId] : [], localPath);
        
        if (referenceResult?.success) {
          this.log(`[Figma MCP] ✅ Reference created at: ${referenceResult.filePath}`);
        } else {
          this.log(`[Figma MCP] ⚠️ Reference creation failed:`, referenceResult?.error);
        }
      } catch (referenceError) {
        this.logError(`[Figma MCP] Failed to create reference:`, referenceError);
        // Don't fail the entire download if reference creation fails
      }

      // Step 5: Verify where files actually ended up
      this.log(`[Figma MCP] 🔍 DEBUG: Final verification of file locations:`);
      
      for (const download of downloadResult.downloaded) {
        if (download.success) {
          try {
            const stat = await fs.stat(download.filePath);
            const relativePath = path.relative(process.cwd(), download.filePath);
            this.log(`[Figma MCP] ✅ Verified: ${download.nodeName}`);
            this.log(`[Figma MCP]     📁 Absolute: ${download.filePath}`);
            this.log(`[Figma MCP]     📂 Relative: ${relativePath}`);
            this.log(`[Figma MCP]     📦 Size: ${Math.round(stat.size / 1024)}KB`);
          } catch (verifyError) {
            this.log(`[Figma MCP] ❌ NOT FOUND: ${download.nodeName} at ${download.filePath}`);
          }
        }
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              downloads: downloadResult.downloaded,
              summary: downloadResult.summary,
              reference: referenceResult,
              workspaceEnforcement: downloadResult.workspaceEnforcement,
              debug: {
                requestedPath: localPath,
                resolvedWorkspace: downloadResult.workspaceEnforcement?.finalLocation || 'No workspace info',
                actualPaths: downloadResult.downloaded.map(d => ({ 
                  name: d.nodeName, 
                  path: d.filePath, 
                  success: d.success 
                }))
              },
              exportSettings: {
                found: exportableNodes.length,
                downloaded: downloadResult.summary.successful,
                scope: apiNodeId ? `Selected area: ${nodeId}` : 'Entire file'
              },
              message: downloadResult.summary.total === 0 
                ? 'No export assets found to download.'
                : `Downloaded ${downloadResult.summary.successful} export-ready assets with Figma export settings, plus reference.png of selected area.`,
              instructions: this.generateDownloadInstructions(downloadResult.downloaded, referenceResult)
            }, null, 2)
          }
        ]
      };

    } catch (error) {
      this.logError(`[Figma MCP] Error downloading assets:`, error);
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to download assets: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }



  /**
   * Find all nodes with Figma export settings configured
   */
  private findNodesWithExportSettings(node: any): any[] {
    const exportableNodes: any[] = [];
    
    const scanNode = (currentNode: any) => {
      // Check if this node has export settings
      if (currentNode.exportSettings && Array.isArray(currentNode.exportSettings) && currentNode.exportSettings.length > 0) {
        this.log(`[Figma MCP] Found export settings on node: ${currentNode.name} (${currentNode.type}) - ${currentNode.exportSettings.length} settings`);
        exportableNodes.push(currentNode);
      }
      
      // Recursively check children
      if (currentNode.children && Array.isArray(currentNode.children)) {
        currentNode.children.forEach((child: any) => {
          scanNode(child);
        });
      }
    };
    
    if (node) {
      scanNode(node);
    }
    
    this.log(`[Figma MCP] Export scan complete: found ${exportableNodes.length} nodes with export settings`);
    return exportableNodes;
  }



  /**
   * Create visual context reference by finding and downloading the parent context
   */
  private async createVisualReference(fileKey: string, selectedNodeIds: string[], localPath: string): Promise<{
    success: boolean;
    filePath?: string;
    contextType: 'parent-frame' | 'page' | 'document';
    contextName?: string;
    error?: string;
  }> {
    try {
      // Strategy: Find the common parent or page context for visual reference
      let referenceNodeId: string | null = null;
      let contextType: 'parent-frame' | 'page' | 'document' = 'document';
      let contextName = 'Visual Context';

                   // Strategy: Use the actual selected node(s) for context, not parent/page
      if (selectedNodeIds.length === 1 && selectedNodeIds[0]) {
        // Single selection: use the selected node itself as reference
        const firstNodeId = selectedNodeIds[0];
        try {
          const nodeResponse = await this.figmaApi.getFileNodes(fileKey, [firstNodeId], { depth: 2 });
          const selectedNode = nodeResponse.nodes[firstNodeId]?.document;
          
          if (selectedNode) {
            referenceNodeId = selectedNode.id;
            contextType = selectedNode.type === 'CANVAS' ? 'page' : 'parent-frame';
            contextName = selectedNode.name;
            this.log(`[Figma MCP] Using selected node as reference: ${contextName} (${selectedNode.type})`);
          } else {
            this.log(`[Figma MCP] Selected node not found, trying page fallback`);
          }
        } catch (nodeError) {
          this.log(`[Figma MCP] Could not get selected node details:`, nodeError);
        }
      } else if (selectedNodeIds.length > 1 && selectedNodeIds[0]) {
        // Multiple selections: try to find common parent or use first node
        referenceNodeId = selectedNodeIds[0]; // Use first selection as context
        contextType = 'parent-frame';
        contextName = 'Multiple Selection Context';
        this.log(`[Figma MCP] Multiple selections, using first node as reference context`);
      }

      // Last resort fallback: Use first page as reference
      if (!referenceNodeId) {
        this.log(`[Figma MCP] No specific selection context, falling back to page`);
        try {
          const fileResponse = await this.figmaApi.getFile(fileKey, { depth: 2 });
          if (fileResponse.document?.children?.[0]) {
            referenceNodeId = fileResponse.document.children[0].id;
            contextType = 'page';
            contextName = fileResponse.document.children[0].name;
          }
        } catch (fileError) {
          return {
            success: false,
            contextType: 'document',
            error: 'Could not access file for reference context'
          };
        }
      }

      if (!referenceNodeId) {
        return {
          success: false,
          contextType: 'document',
          error: 'Could not determine reference context'
        };
      }

      this.log(`[Figma MCP] Creating reference from ${contextType}: "${contextName}" (${referenceNodeId})`);

      // Download the reference as PNG with 1x scale as requested
      const referenceDownload = await this.figmaApi.downloadImages(
        fileKey,
        [referenceNodeId],
        localPath,
        {
          scale: 1, // Use 1x scale as requested by user
          format: 'png',
          skipWorkspaceEnforcement: true
        }
      );

      if (referenceDownload.summary.successful === 0) {
        return {
          success: false,
          contextType,
          contextName,
          error: 'Failed to download reference image'
        };
      }

             // Force rename to reference.png with robust fallback handling
       const originalFile = referenceDownload.downloaded[0];
       if (originalFile && originalFile.success) {
         const referenceFilePath = path.join(localPath, 'reference.png');
         
         this.log(`[Figma MCP] 🔄 Converting "${path.basename(originalFile.filePath)}" → "reference.png"`);
         
         try {
           // Check if original file exists first
           await fs.access(originalFile.filePath);
           
           // Method 1: Try direct rename (fastest, works if same filesystem)
           await fs.rename(originalFile.filePath, referenceFilePath);
           this.log(`[Figma MCP] ✅ Successfully renamed to reference.png via fs.rename`);
           
           return {
             success: true,
             filePath: referenceFilePath,
             contextType,
             contextName
           };
         } catch (renameError) {
           this.log(`[Figma MCP] ⚠️ Direct rename failed (${renameError}), trying copy + delete...`);
           
           try {
             // Check if original file still exists
             await fs.access(originalFile.filePath);
             
             // Method 2: Copy + delete (works across filesystems, handles Cursor restrictions)
             await fs.copyFile(originalFile.filePath, referenceFilePath);
             
             // Verify the copy succeeded before deleting original
             const copyStats = await fs.stat(referenceFilePath);
             if (copyStats.size > 0) {
               // Delete original only after successful copy
               try {
                 await fs.unlink(originalFile.filePath);
                 this.log(`[Figma MCP] ✅ Successfully created reference.png via copy + delete`);
               } catch (deleteError) {
                 this.log(`[Figma MCP] ⚠️ Copy succeeded but original file deletion failed: ${deleteError}`);
                 // Continue anyway - we have reference.png
               }
               
               return {
                 success: true,
                 filePath: referenceFilePath,
                 contextType,
                 contextName
               };
             } else {
               throw new Error('Copy resulted in empty file');
             }
           } catch (copyError) {
             this.logError(`[Figma MCP] ❌ Both rename and copy failed:`, copyError);
             
             // Method 3: Create a symbolic link to reference.png
             try {
               // Check if original file still exists
               await fs.access(originalFile.filePath);
               
               // Create a hard link (works better than symlink for cross-platform)
               await fs.link(originalFile.filePath, referenceFilePath);
               this.log(`[Figma MCP] ✅ Successfully created reference.png via hard link`);
               
               return {
                 success: true,
                 filePath: referenceFilePath,
                 contextType,
                 contextName
               };
             } catch (linkError) {
               this.logError(`[Figma MCP] ❌ Hard link creation failed:`, linkError);
               
               // Method 4: Last resort - use the original file as reference but log the issue
               this.log(`[Figma MCP] 🔧 Using original file as reference: ${path.basename(originalFile.filePath)}`);
               
               return {
                 success: true,
                 filePath: originalFile.filePath, // Use original path
                 contextType,
                 contextName,
                 error: `Warning: Could not rename to reference.png, using original filename: ${path.basename(originalFile.filePath)}`
               };
             }
           }
         }
       }

      return {
        success: false,
        contextType,
        contextName,
        error: 'Reference download was not successful'
      };

    } catch (error) {
      this.logError(`[Figma MCP] Error creating visual reference:`, error);
      return {
        success: false,
        contextType: 'document',
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Generate instructions for using downloaded assets and reference (Universal IDE compatibility)
   */
  private generateDownloadInstructions(downloads: any[], referenceResult: any): string[] {
    const instructions: string[] = [];
    const workingDir = process.cwd();
    
    if (downloads.length > 0) {
      instructions.push(`📁 Asset Files Downloaded:`);
      downloads.forEach(download => {
        if (download.success) {
          // Show both filename and relative path for universal IDE compatibility
          const filename = download.filePath.split('/').pop() || 'unknown';
          const relativePath = download.relativePath || `./${filename}`;
          const fileSize = download.fileSize ? ` (${Math.round(download.fileSize / 1024)}KB)` : '';
          const verified = download.verified !== false ? '✅' : '⚠️';
          
          instructions.push(`   ${verified} ${download.nodeName}`);
          instructions.push(`      📁 File: ${filename}${fileSize}`);
          instructions.push(`      📂 Path: ${relativePath}`);
          if (download.verified === false) {
            instructions.push(`      ⚠️  File verification failed - check directory structure`);
          }
        } else {
          instructions.push(`   ❌ ${download.nodeId || download.nodeName} → Failed: ${download.error}`);
        }
      });
      instructions.push('');
    }

    if (referenceResult?.success) {
      const referenceRelativePath = referenceResult.filePath ? 
        path.relative(workingDir, referenceResult.filePath) : './reference.png';
      
      instructions.push(`🎯 Visual Context Reference:`);
      instructions.push(`   📄 reference.png → Shows ${referenceResult.contextType} context: "${referenceResult.contextName}"`);
      instructions.push(`   📂 Path: ${referenceRelativePath.startsWith('.') ? referenceRelativePath : `./${referenceRelativePath}`}`);
      instructions.push(`   💡 Use this reference to understand how downloaded assets fit in the overall design`);
      instructions.push(`   🔍 Open reference.png to see layout, positioning, and relationship between elements`);
      instructions.push('');
    }

    instructions.push(`🔄 NEXT STEP - CRITICAL FOR AI WORKFLOW:`);
    instructions.push(`   ⚡ Use check_reference tool to analyze reference.png before development`);
    instructions.push(`   📂 Pass the assets folder path to check_reference tool`);
    instructions.push(`   🎯 This provides design understanding and framework-specific guidance`);
    instructions.push(`   ✅ STEP 4 COMPLETE - Assets downloaded, proceed to STEP 5: check_reference`);
    instructions.push(``);
    instructions.push(`🛠️ Universal IDE Development Workflow:`);
    instructions.push(`   1. Assets are saved using relative paths (./assets/...) for cross-IDE compatibility`);
    instructions.push(`   2. reference.png shows the complete design context and layout`);
    instructions.push(`   3. Use individual asset files for implementation`);
    instructions.push(`   4. All paths are verified after download to ensure availability`);
    instructions.push(`   5. Files work consistently across Cursor, Windsurf, TRAE, and other IDEs`);

    return instructions;
  }





  private setupErrorHandling(): void {
    this.server.onerror = (error) => {
      this.logError('[Figma MCP] Server error:', error);
    };

    process.on('SIGINT', async () => {
      this.logError('\n[Figma MCP] Shutting down server...');
      await this.server.close();
      process.exit(0);
    });
  }

  async start(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    
    this.log('[Figma MCP] Debug mode enabled');
    this.logError('[Figma MCP] Server started successfully');
  }
}

// CLI setup
const program = new Command();

program
  .name('figma-mcp-pro')
  .description('Professional Figma MCP Server with enhanced AI context processing')
  .version(VERSION)
  .requiredOption('--figma-api-key <key>', 'Figma API key', process.env.FIGMA_API_KEY)
  .option('--port <port>', 'Server port', process.env.PORT)
  .option('--debug', 'Enable debug mode', process.env.DEBUG === 'true')
  .option('--stdio', 'Use stdio transport (default)', true)
  .action(async (options) => {
    if (!options.figmaApiKey) {
      console.error('Error: Figma API key is required');
      console.error('Set FIGMA_API_KEY environment variable or use --figma-api-key option');
      process.exit(1);
    }

    try {
      const server = new CustomFigmaMcpServer({
        figmaApiKey: options.figmaApiKey,
        port: options.port ? parseInt(options.port) : undefined,
        debug: options.debug
      });

      await server.start();
    } catch (error) {
      console.error('Failed to start server:', error);
      process.exit(1);
    }
  });

// Handle unhandled rejections
process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error: Error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Start the CLI
program.parse();