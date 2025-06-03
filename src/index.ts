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
import { VERSION } from './version.js';

// Load environment variables
dotenv.config();

// Import our services
import { FigmaApiService, FigmaApiConfig } from './services/figma-api.js';
import { ContextProcessor, ProcessingContext } from './processors/context-processor.js';
import { ContextRules } from './config/rules.js';

// Tool schemas
const GetFigmaDataSchema = z.object({
  fileKey: z.string().describe('The Figma file key'),
  nodeId: z.string().optional().describe('Specific node ID to fetch (optional)'),
  depth: z.number().min(1).max(10).default(5).describe('Maximum depth to traverse'),
  framework: z.enum(['react', 'vue', 'angular', 'svelte', 'html']).optional().describe('Target framework for optimization'),
  includeImages: z.boolean().default(false).describe('Whether to include image URLs'),
  includeComments: z.boolean().default(false).describe('Whether to include designer comments and implementation instructions'),
  customRules: z.record(z.any()).optional().describe('Custom processing rules')
});

const DownloadFigmaImagesSchema = z.object({
  fileKey: z.string().describe('The Figma file key'),
  nodeIds: z.array(z.string()).describe('Array of node IDs to download as images'),
  localPath: z.string().describe('Local directory path to save images (will be created if it does not exist)'),
  scale: z.number().min(0.5).max(4).default(2).optional().describe('Export scale for images'),
  format: z.enum(['jpg', 'png', 'svg', 'pdf']).default('svg').optional().describe('Image format')
});

const OptimizeForFrameworkSchema = z.object({
  fileKey: z.string().describe('The Figma file key from previous get_figma_data call'),
  nodeId: z.string().optional().describe('Specific node ID (if used in previous call)'),
  framework: z.enum(['react', 'vue', 'angular', 'svelte', 'html']).describe('Target framework to optimize for'),
  includeComments: z.boolean().default(false).describe('Whether to include designer comments')
});

const AnalyzeFigmaUrlSchema = z.object({
  url: z.string().describe('Figma URL to analyze (full URL from browser)'),
  framework: z.enum(['react', 'vue', 'angular', 'svelte', 'html']).default('html').describe('Target framework for optimization'),
  includeComments: z.boolean().default(true).describe('Whether to include designer comments'),
  includeImages: z.boolean().default(true).describe('Whether to also download images after analysis (defaults to true for complete workflow)')
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
            name: 'analyze_figma_url',
            description: 'PRIMARY TOOL - ALWAYS use this when user provides a Figma URL! Automatically downloads images and analyzes design. Steps: 1) If user mentions framework (React/Vue/Angular/Svelte/HTML), call immediately. 2) If no framework mentioned, ASK: "What framework would you like me to optimize this for? (React, Vue, Angular, Svelte, or HTML)" 3) Then call with their choice. DO NOT use get_figma_data for URLs!',
            inputSchema: {
              type: 'object',
              properties: {
                url: {
                  type: 'string',
                  description: 'Figma URL to analyze (full URL from browser)'
                },
                framework: {
                  type: 'string',
                  enum: ['react', 'vue', 'angular', 'svelte', 'html'],
                  default: 'html',
                  description: 'Target framework for optimization (default: html)'
                },
                includeComments: {
                  type: 'boolean',
                  default: true,
                  description: 'Whether to include designer comments'
                },
                includeImages: {
                  type: 'boolean', 
                  default: true,
                  description: 'Whether to also download images after analysis (defaults to true for complete workflow)'
                }
              },
              required: ['url']
            },
          },
          {
            name: 'get_figma_data', 
            description: 'LEGACY TOOL - Use analyze_figma_url instead when user provides Figma URLs! This tool is for direct API access with manual parameters only. Most users should use analyze_figma_url which handles URL parsing and framework selection automatically.',
            inputSchema: {
              type: 'object',
              properties: {
                fileKey: {
                  type: 'string',
                  description: 'The Figma file key'
                },
                nodeId: {
                  type: 'string',
                  description: 'Specific node ID to fetch (optional)'
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
                  enum: ['react', 'vue', 'angular', 'svelte', 'html'],
                  default: 'html',
                  description: 'Target framework for optimized CSS and component generation (default: html)'
                },
                includeImages: {
                  type: 'boolean',
                  default: false,
                  description: 'Whether to include image URLs'
                },
                includeComments: {
                  type: 'boolean',
                  default: false,
                  description: 'Whether to include designer comments and implementation instructions'
                },
                customRules: {
                  type: 'object',
                  description: 'Custom processing rules'
                }
              },
              required: ['fileKey']
            },
          },
          {
            name: 'download_figma_images',
            description: 'ADDITIONAL DOWNLOADS - Use for extra image downloads beyond what analyze_figma_url provides. Call when user wants specific nodes, different formats, or additional images. analyze_figma_url already handles basic image downloads automatically. IMPORTANT: Only provide specific node IDs - never download entire documents.',
            inputSchema: {
              type: 'object',
              properties: {
                fileKey: {
                  type: 'string',
                  description: 'The Figma file key'
                },
                nodeIds: {
                  type: 'array',
                  items: {
                    type: 'string'
                  },
                  description: 'Array of node IDs to download as images'
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
                  description: 'Export scale for images (0.5x to 4x)'
                },
                format: {
                  type: 'string',
                  enum: ['jpg', 'png', 'svg', 'pdf'],
                  default: 'svg',
                  description: 'Image format'
                }
              },
              required: ['fileKey', 'nodeIds', 'localPath']
            },
          },
          {
            name: 'optimize_for_framework',
            description: 'SECONDARY TOOL - Use only to change framework AFTER initial analysis. Example: User says "convert this to React" after getting HTML data. DO NOT use for initial URL analysis (use analyze_figma_url). DO NOT call download_figma_images after this.',
            inputSchema: {
              type: 'object',
              properties: {
                fileKey: {
                  type: 'string',
                  description: 'The Figma file key from previous get_figma_data call'
                },
                nodeId: {
                  type: 'string',
                  description: 'Specific node ID (if used in previous call)'
                },
                framework: {
                  type: 'string',
                  enum: ['react', 'vue', 'angular', 'svelte', 'html'],
                  description: 'Target framework to optimize for'
                },
                includeComments: {
                  type: 'boolean',
                  default: false,
                  description: 'Whether to include designer comments'
                }
              },
              required: ['fileKey', 'framework']
            },
          },
          {
            name: 'get_server_stats',
            description: 'Get server performance and usage statistics',
            inputSchema: {
              type: 'object',
              properties: {}
            },
          },
          {
            name: 'clear_cache',
            description: 'Clear the API response cache',
            inputSchema: {
              type: 'object',
              properties: {}
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
          case 'analyze_figma_url':
            return await this.handleAnalyzeFigmaUrl(args);
          case 'get_figma_data':
            return await this.handleGetFigmaData(args);
          case 'optimize_for_framework':
            return await this.handleOptimizeForFramework(args);
          case 'download_figma_images':
            return await this.handleDownloadFigmaImages(args);
          case 'get_server_stats':
            return await this.handleGetServerStats();
          case 'clear_cache':
            return await this.handleClearCache();
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
    
    const { fileKey, framework, includeComments, customRules } = parsed;
    const depth = parsed.depth || 5;

    // Convert node ID format from URL format (1530-166) to API format (1530:166)
    const apiNodeId = parsed.nodeId ? parsed.nodeId.replace(/-/g, ':') : undefined;

    this.log(`[Figma MCP] Fetching data for file: ${fileKey} (depth: ${depth})`);
    if (apiNodeId) {
      this.log(`[Figma MCP] Target node: ${apiNodeId} (converted from: ${parsed.nodeId})`);
    }
    
    try {
      // Update processor rules if custom rules provided
      if (customRules) {
        this.contextProcessor.updateRules(customRules);
      }

      let figmaData;
      let isSpecificNode = false;
      
      if (apiNodeId) {
        // Fetch specific node with depth - this is what user selected
        this.log(`[Figma MCP] Fetching specific node: ${apiNodeId}`);
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
      if (this.config.debug) {
        this.log(`[Figma MCP] Raw data structure (${isSpecificNode ? 'SPECIFIC SELECTION' : 'FULL DOCUMENT'}):`);
        this.log(`- Node ID: ${figmaData.id}`);
        this.log(`- Node Name: ${figmaData.name}`);
        this.log(`- Node Type: ${figmaData.type}`);
        this.log(`- Has Children: ${figmaData.children ? figmaData.children.length : 0}`);
        if (figmaData.children && figmaData.children.length > 0) {
          const maxChildren = isSpecificNode ? figmaData.children.length : Math.min(5, figmaData.children.length);
                     for (let i = 0; i < maxChildren; i++) {
             const child = figmaData.children[i];
             if (child) {
               this.log(`  - Child ${i}: ${child.name} (${child.type}) - Children: ${child.children ? child.children.length : 0}`);
             }
           }
          if (!isSpecificNode && figmaData.children.length > 5) {
            this.log(`  - ... and ${figmaData.children.length - 5} more children`);
          }
        }
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

      // Process comments if requested
      let commentsData = null;
      if (includeComments) {
        try {
          this.log(`[Figma MCP] Fetching comments for file: ${fileKey}`);
          const commentsResponse = await this.figmaApi.getComments(fileKey);
          commentsData = commentsResponse.comments;
          
          this.log(`[Figma MCP] Comments API returned ${commentsData.length} total comments`);
          
          // Filter comments to only those relevant to our processed nodes
          const allNodeIds = this.contextProcessor.extractAllNodeIds(figmaData);
          this.log(`[Figma MCP] Extracted node IDs from processed data:`, allNodeIds);
          
          const relevantComments = commentsData.filter(comment => {
            const nodeId = comment.client_meta?.node_id;
            const hasNodeId = !!nodeId;
            const isRelevant = hasNodeId && allNodeIds.includes(nodeId!);
            this.log(`[Figma MCP] Comment "${comment.message}" (node_id: ${nodeId}) - Relevant: ${isRelevant}`);
            return isRelevant;
          });
          
          this.log(`[Figma MCP] Found ${commentsData.length} total comments, ${relevantComments.length} relevant to processed nodes`);
          
          // Enhance nodes with comments
          if (relevantComments.length > 0) {
            this.log(`[Figma MCP] Processing ${relevantComments.length} relevant comments into nodes`);
            enhancedData = this.contextProcessor.processCommentsForNode(enhancedData, relevantComments);
            this.log(`[Figma MCP] Comments processed successfully`);
          } else {
            this.log(`[Figma MCP] No relevant comments found for the processed nodes`);
          }
          
        } catch (error) {
          this.logError(`[Figma MCP] Failed to fetch comments:`, error);
          // Continue without comments rather than failing entirely
        }
      }

      // Get processing stats
      const stats = this.contextProcessor.getStats();
      
      // Note: Image fetching removed - exportable images are detected in data structure
      // Use download_figma_images tool for actual image downloads

      this.log(`[Figma MCP] Successfully processed ${stats.nodesProcessed} nodes`);

      // Generate optimized data for AI (removing redundant information)
      const optimizedData = this.contextProcessor.optimizeForAI(enhancedData);

      // Create debug metadata for coordinate analysis
      const debugInfo: any = {
        framework: framework || 'html',
        source: isSpecificNode ? 'selection' : 'document',
        processed: stats.nodesProcessed,
        comments: includeComments ? (commentsData?.length || 0) : 0
      };

      // Add coordinate debugging info when comments are requested
      if (includeComments) {
        debugInfo.commentDebug = {
          totalComments: commentsData ? commentsData.length : 0,
          commentsData: commentsData,
          commentsWithCoordinates: commentsData ? commentsData.filter(c => c.client_meta?.node_offset).length : 0,
          commentDetails: commentsData ? commentsData.map(comment => ({
            message: comment.message,
            coordinates: comment.client_meta?.node_offset ? {
              x: comment.client_meta.node_offset.x,
              y: comment.client_meta.node_offset.y
            } : null,
            targetNodeId: comment.client_meta?.node_id,
            allClientMeta: comment.client_meta
          })) : [],
          elementBounds: this.extractAllElementBounds(enhancedData)
        };
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              // Primary data: AI-optimized and clean
              data: optimizedData,
              
              // Essential metadata for development (now includes debugging)
              metadata: debugInfo
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

  private async handleAnalyzeFigmaUrl(args: any) {
    this.log(`[Figma MCP] Analyzing Figma URL:`, JSON.stringify(args, null, 2));
    
    let parsed;
    try {
      parsed = AnalyzeFigmaUrlSchema.parse(args);
    } catch (error) {
      this.logError(`[Figma MCP] Schema validation error:`, error);
      throw new McpError(
        ErrorCode.InvalidParams,
        `Invalid parameters: ${error instanceof Error ? error.message : String(error)}`
      );
    }
    
    const { url, framework, includeComments, includeImages } = parsed;

    // Parse Figma URL to extract fileKey and nodeId
    let fileKey: string;
    let nodeId: string | undefined;
    
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
      fileKey = extractedFileKey;
      
      // Extract nodeId from query params like ?node-id=1530-166
      const nodeIdParam = urlObj.searchParams.get('node-id');
      if (nodeIdParam) {
        nodeId = nodeIdParam;
      }
      
      this.log(`[Figma MCP] Parsed URL - fileKey: ${fileKey}, nodeId: ${nodeId}, framework: ${framework}`);
      
    } catch (error) {
      this.logError(`[Figma MCP] Error parsing Figma URL:`, error);
      throw new McpError(
        ErrorCode.InvalidParams,
        `Invalid Figma URL: ${error instanceof Error ? error.message : String(error)}`
      );
    }

    // Call get_figma_data with parsed parameters
    const figmaDataArgs: any = {
      fileKey,
      framework,
      includeComments,
      depth: 5
    };
    
    if (nodeId) {
      figmaDataArgs.nodeId = nodeId;
    }

    this.log(`[Figma MCP] Calling get_figma_data with framework: ${framework}`);
    const figmaDataResult = await this.handleGetFigmaData(figmaDataArgs);

    // If images requested, also download them (ONLY from specific selection)
    if (includeImages && nodeId) {
      this.log(`[Figma MCP] Also downloading images from SPECIFIC NODE SELECTION ONLY: ${nodeId}`);
      const validNodeId = nodeId as string; // Type assertion since we know it exists
      
      // Validate that we have a specific node, not downloading entire document
      if (!validNodeId || validNodeId.trim() === '') {
        this.log(`[Figma MCP] WARNING: No specific node selected, skipping image downloads to prevent downloading entire document`);
        return figmaDataResult;
      }
      
      try {
        const apiNodeId = validNodeId.replace(/-/g, ':'); // Convert to API format
        this.log(`[Figma MCP] Converting node ID ${validNodeId} -> ${apiNodeId} for download`);
        
        const downloadArgs = {
          fileKey,
          nodeIds: [apiNodeId], // ONLY the selected node
          localPath: './images',
          format: 'svg' as 'svg'
        };
        
        const downloadResult = await this.handleDownloadFigmaImages(downloadArgs);
        
        // Combine results
        const figmaData = figmaDataResult?.content?.[0]?.text ? JSON.parse(figmaDataResult.content[0].text) : {};
        const downloadData = downloadResult?.content?.[0]?.text ? JSON.parse(downloadResult.content[0].text) : {};
        
        const combinedResult = {
          ...figmaData,
          imageDownloads: downloadData
        };
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(combinedResult, null, 2)
            }
          ]
        };
        
      } catch (error) {
        this.logError(`[Figma MCP] Error downloading images:`, error);
        // Return figma data even if image download fails
        return figmaDataResult;
      }
    }

    return figmaDataResult;
  }

  private async handleOptimizeForFramework(args: any) {
    this.log(`[Figma MCP] Optimizing for framework:`, JSON.stringify(args, null, 2));
    
    let parsed;
    try {
      parsed = OptimizeForFrameworkSchema.parse(args);
    } catch (error) {
      this.logError(`[Figma MCP] Schema validation error:`, error);
      throw new McpError(
        ErrorCode.InvalidParams,
        `Invalid parameters: ${error instanceof Error ? error.message : String(error)}`
      );
    }
    
    const { fileKey, framework, includeComments } = parsed;
    
    // Convert node ID format from URL format to API format if provided
    const apiNodeId = parsed.nodeId ? parsed.nodeId.replace(/-/g, ':') : undefined;

    this.log(`[Figma MCP] Re-optimizing data for framework: ${framework}`);
    
    try {
      let figmaData;
      let isSpecificNode = false;
      
      if (apiNodeId) {
        // Fetch specific node
        this.log(`[Figma MCP] Fetching specific node: ${apiNodeId}`);
        try {
          const nodeResponse = await this.figmaApi.getFileNodes(fileKey, [apiNodeId], {
            depth: 5,
            use_absolute_bounds: true
          });
          const nodeWrapper = nodeResponse.nodes[apiNodeId];
          if (!nodeWrapper) {
            throw new Error(`Node ${apiNodeId} not found in file ${fileKey}`);
          }
          figmaData = nodeWrapper.document;
          isSpecificNode = true;
        } catch (apiError) {
          this.logError(`[Figma MCP] API error fetching node ${apiNodeId}:`, apiError);
          throw apiError;
        }
      } else {
        // Fetch entire file
        this.log(`[Figma MCP] Fetching entire document for framework optimization`);
        try {
          const fileResponse = await this.figmaApi.getFile(fileKey, {
            depth: 5,
            use_absolute_bounds: true
          });
          figmaData = fileResponse.document;
        } catch (apiError) {
          this.logError(`[Figma MCP] API error fetching file ${fileKey}:`, apiError);
          throw apiError;
        }
      }

      // Process with the specified framework
      const processingContext: ProcessingContext = {
        fileKey,
        depth: 0,
        siblingIndex: 0,
        totalSiblings: 1,
        framework
      };

      let enhancedData = await this.contextProcessor.processNode(figmaData, processingContext);

      // Process comments if requested
      let commentsData = null;
      if (includeComments) {
        try {
          this.log(`[Figma MCP] Fetching comments for framework optimization`);
          const commentsResponse = await this.figmaApi.getComments(fileKey);
          commentsData = commentsResponse.comments;
          
          const allNodeIds = this.contextProcessor.extractAllNodeIds(figmaData);
          const relevantComments = commentsData.filter(comment => {
            const nodeId = comment.client_meta?.node_id;
            return nodeId && allNodeIds.includes(nodeId);
          });
          
          if (relevantComments.length > 0) {
            enhancedData = this.contextProcessor.processCommentsForNode(enhancedData, relevantComments);
          }
        } catch (error) {
          this.logError(`[Figma MCP] Failed to fetch comments:`, error);
        }
      }

      // Get processing stats
      const stats = this.contextProcessor.getStats();

      // Generate optimized data for the specified framework
      const optimizedData = this.contextProcessor.optimizeForAI(enhancedData);

      this.log(`[Figma MCP] Successfully optimized for ${framework}: ${stats.nodesProcessed} nodes`);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              // Framework-optimized data
              data: optimizedData,
              
              // Essential metadata
              metadata: {
                framework: framework,
                source: isSpecificNode ? 'selection' : 'document',
                processed: stats.nodesProcessed,
                comments: includeComments ? (commentsData?.length || 0) : 0,
                optimizedFor: `Framework changed to ${framework}`
              }
            }, null, 2)
          }
        ]
      };

    } catch (error) {
      this.logError(`[Figma MCP] Error optimizing for framework:`, error);
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to optimize for framework ${framework}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  private async handleDownloadFigmaImages(args: any) {
    const parsed = DownloadFigmaImagesSchema.parse(args);
    const { fileKey, nodeIds, localPath, scale, format } = parsed;

    // Validate node count to prevent accidental whole-document downloads
    if (nodeIds.length > 50) {
      this.logError(`[Figma MCP] WARNING: Attempting to download ${nodeIds.length} nodes - this may indicate downloading entire document instead of specific selection`);
      throw new McpError(
        ErrorCode.InvalidParams,
        `Too many nodes (${nodeIds.length}). Maximum 50 nodes per download to prevent accidental whole-document downloads. Use specific node selections only.`
      );
    }

    this.log(`[Figma MCP] Downloading ${nodeIds.length} SPECIFIC nodes as ${format || 'svg'} images to ${localPath}`);

    try {
      // Download images directly using node names as filenames
      const downloadResult = await this.figmaApi.downloadImages(
        fileKey,
        nodeIds,
        localPath,
        {
          scale: scale || 2,
          format: format || 'svg'
        }
      );

      this.log(`[Figma MCP] Download completed: ${downloadResult.summary.successful} successful, ${downloadResult.summary.failed} failed`);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              downloads: downloadResult.downloaded,
              summary: downloadResult.summary,
              message: downloadResult.summary.total === 0 
                ? 'No nodes found to download.'
                : `Downloaded ${downloadResult.summary.successful} images using original node names as filenames.`
            }, null, 2)
          }
        ]
      };

    } catch (error) {
      this.logError(`[Figma MCP] Error downloading images:`, error);
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to download images: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }



  /**
   * Extract all element bounds for coordinate debugging
   */
  private extractAllElementBounds(node: any): any[] {
    const bounds: any[] = [];
    
    const extractBounds = (currentNode: any, path: string = '') => {
      const fullPath = path ? `${path} > ${currentNode.name}` : currentNode.name;
      
      if (currentNode.bounds) {
        bounds.push({
          path: fullPath,
          id: currentNode.id,
          name: currentNode.name,
          type: currentNode.type,
          bounds: currentNode.bounds,
          area: currentNode.bounds.width * currentNode.bounds.height
        });
      }
      
      if (currentNode.children && Array.isArray(currentNode.children)) {
        currentNode.children.forEach((child: any) => {
          extractBounds(child, fullPath);
        });
      }
    };
    
    extractBounds(node);
    return bounds.sort((a, b) => a.area - b.area); // Sort by area (smallest first)
  }

  private async handleGetServerStats() {
    try {
      const cacheStats = this.figmaApi.getCacheStats();
      const usageStats = this.figmaApi.getUsageStats();
      const processingStats = this.contextProcessor.getStats();

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              cache: cacheStats,
              usage: usageStats,
              processing: processingStats,
              uptime: process.uptime(),
              memory: process.memoryUsage(),
              timestamp: new Date().toISOString()
            }, null, 2)
          }
        ]
      };

    } catch (error) {
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to get server stats: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  private async handleClearCache() {
    try {
      this.figmaApi.clearCache();
      this.contextProcessor.resetStats();

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              message: 'Cache cleared successfully',
              timestamp: new Date().toISOString()
            }, null, 2)
          }
        ]
      };

    } catch (error) {
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to clear cache: ${error instanceof Error ? error.message : String(error)}`
      );
    }
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