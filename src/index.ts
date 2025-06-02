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
  customRules: z.record(z.any()).optional().describe('Custom processing rules')
});

const DownloadFigmaImagesSchema = z.object({
  fileKey: z.string().describe('The Figma file key'),
  nodeIds: z.array(z.string()).describe('Array of node IDs to download as images'),
  localPath: z.string().describe('Local directory path to save images'),
  scale: z.number().min(0.5).max(4).default(2).describe('Export scale for images'),
  format: z.enum(['png', 'jpg', 'svg', 'pdf']).default('png').describe('Image format')
});

const ExtractUrlInfoSchema = z.object({
  url: z.string().describe('Figma URL to extract information from')
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
        version: '1.2.1',
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

  private setupToolHandlers(): void {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'get_figma_data',
            description: 'Fetch and process Figma design data with AI-optimized context enhancement. Use nodeId from a Figma selection link to analyze only the selected element, or omit nodeId to analyze the full document.',
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
                  description: 'Target framework for optimization'
                },
                includeImages: {
                  type: 'boolean',
                  default: false,
                  description: 'Whether to include image URLs'
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
            description: 'Download images from Figma nodes to local directory',
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
                  description: 'Local directory path to save images'
                },
                scale: {
                  type: 'number',
                  minimum: 0.5,
                  maximum: 4,
                  default: 2,
                  description: 'Export scale for images'
                },
                format: {
                  type: 'string',
                  enum: ['png', 'jpg', 'svg', 'pdf'],
                  default: 'png',
                  description: 'Image format'
                }
              },
              required: ['fileKey', 'nodeIds', 'localPath']
            },
          },
          {
            name: 'extract_url_info',
            description: 'Extract file key and node ID from Figma URLs',
            inputSchema: {
              type: 'object',
              properties: {
                url: {
                  type: 'string',
                  description: 'Figma URL to extract information from'
                }
              },
              required: ['url']
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
          case 'get_figma_data':
            return await this.handleGetFigmaData(args);
          case 'download_figma_images':
            return await this.handleDownloadFigmaImages(args);
          case 'extract_url_info':
            return await this.handleExtractUrlInfo(args);
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
        
        console.error(`Error in tool ${name}:`, error);
        throw new McpError(
          ErrorCode.InternalError,
          `Tool execution failed: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    });
  }

  private async handleGetFigmaData(args: any) {
    console.log(chalk.blue(`[Figma MCP] Received args:`, JSON.stringify(args, null, 2)));
    
    let parsed;
    try {
      parsed = GetFigmaDataSchema.parse(args);
    } catch (error) {
      console.error(chalk.red(`[Figma MCP] Schema validation error:`, error));
      throw new McpError(
        ErrorCode.InvalidParams,
        `Invalid parameters: ${error instanceof Error ? error.message : String(error)}`
      );
    }
    
    const { fileKey, nodeId, framework, includeImages, customRules } = parsed;
    const depth = parsed.depth || 5;

    console.log(chalk.blue(`[Figma MCP] Fetching data for file: ${fileKey} (depth: ${depth})`));
    if (nodeId) {
      console.log(chalk.blue(`[Figma MCP] Target node: ${nodeId}`));
    }
    
    try {
      // Update processor rules if custom rules provided
      if (customRules) {
        this.contextProcessor.updateRules(customRules);
      }

      let figmaData;
      let isSpecificNode = false;
      
      if (nodeId) {
        // Fetch specific node with depth - this is what user selected
        console.log(chalk.blue(`[Figma MCP] Fetching specific node: ${nodeId}`));
        try {
          const nodeResponse = await this.figmaApi.getFileNodes(fileKey, [nodeId], {
            depth: depth,
            use_absolute_bounds: true
          });
          console.log(chalk.green(`[Figma MCP] Node response received, keys:`, Object.keys(nodeResponse.nodes)));
          const nodeWrapper = nodeResponse.nodes[nodeId];
          if (!nodeWrapper) {
            throw new Error(`Node ${nodeId} not found in file ${fileKey}. Available nodes: ${Object.keys(nodeResponse.nodes).join(', ')}`);
          }
          figmaData = nodeWrapper.document;
          isSpecificNode = true;
        } catch (apiError) {
          console.error(chalk.red(`[Figma MCP] API error fetching node ${nodeId}:`, apiError));
          throw apiError;
        }
      } else {
        // Fetch entire file with depth - fallback when no specific selection
        console.log(chalk.blue(`[Figma MCP] Fetching entire document (no specific selection)`));
        try {
          const fileResponse = await this.figmaApi.getFile(fileKey, {
            depth: depth,
            use_absolute_bounds: true
          });
          console.log(chalk.green(`[Figma MCP] File response received for document:`, fileResponse.document?.name));
          figmaData = fileResponse.document;
        } catch (apiError) {
          console.error(chalk.red(`[Figma MCP] API error fetching file ${fileKey}:`, apiError));
          throw apiError;
        }
      }

      // Debug: Log the structure we received
      if (this.config.debug) {
        console.log(chalk.yellow(`[Figma MCP] Raw data structure (${isSpecificNode ? 'SPECIFIC SELECTION' : 'FULL DOCUMENT'}):`));
        console.log(chalk.yellow(`- Node ID: ${figmaData.id}`));
        console.log(chalk.yellow(`- Node Name: ${figmaData.name}`));
        console.log(chalk.yellow(`- Node Type: ${figmaData.type}`));
        console.log(chalk.yellow(`- Has Children: ${figmaData.children ? figmaData.children.length : 0}`));
        if (figmaData.children && figmaData.children.length > 0) {
          const maxChildren = isSpecificNode ? figmaData.children.length : Math.min(5, figmaData.children.length);
                     for (let i = 0; i < maxChildren; i++) {
             const child = figmaData.children[i];
             if (child) {
               console.log(chalk.yellow(`  - Child ${i}: ${child.name} (${child.type}) - Children: ${child.children ? child.children.length : 0}`));
             }
           }
          if (!isSpecificNode && figmaData.children.length > 5) {
            console.log(chalk.yellow(`  - ... and ${figmaData.children.length - 5} more children`));
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

      const enhancedData = await this.contextProcessor.processNode(figmaData, processingContext);

      // Get processing stats
      const stats = this.contextProcessor.getStats();
      
      // Include images if requested
      let imageUrls: Record<string, string> = {};
      if (includeImages && enhancedData.children) {
        const nodeIds = this.extractNodeIds(enhancedData);
        if (nodeIds.length > 0) {
          try {
            const imageResponse = await this.figmaApi.getImages(fileKey, nodeIds, {
              format: 'png',
              scale: 2
            });
            imageUrls = imageResponse.images;
          } catch (error) {
            console.warn('Failed to fetch images:', error);
          }
        }
      }

      console.log(chalk.green(`[Figma MCP] Successfully processed ${stats.nodesProcessed} nodes`));

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              data: enhancedData,
              images: imageUrls,
              metadata: {
                fileKey,
                nodeId,
                framework,
                isSpecificSelection: isSpecificNode,
                selectionType: isSpecificNode ? 'user_selection' : 'full_document',
                processingStats: stats,
                timestamp: new Date().toISOString()
              }
            }, null, 2)
          }
        ]
      };

    } catch (error) {
      console.error(chalk.red(`[Figma MCP] Error fetching data:`, error));
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to fetch Figma data: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  private async handleDownloadFigmaImages(args: any) {
    const parsed = DownloadFigmaImagesSchema.parse(args);
    const { fileKey, nodeIds, localPath, scale, format } = parsed;

    console.log(chalk.blue(`[Figma MCP] Downloading ${nodeIds.length} images to ${localPath}`));

    try {
      // Get image URLs from Figma
      const imageResponse = await this.figmaApi.getImages(fileKey, nodeIds, {
        format,
        scale
      });

      // This would typically involve downloading the images to the local path
      // For now, we'll return the URLs and let the client handle the download
      const results = Object.entries(imageResponse.images).map(([nodeId, url]) => ({
        nodeId,
        url,
        localPath: `${localPath}/${nodeId}.${format}`,
        status: url ? 'available' : 'failed'
      }));

      console.log(chalk.green(`[Figma MCP] Generated ${results.length} image URLs`));

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              results,
              summary: {
                total: nodeIds.length,
                successful: results.filter(r => r.status === 'available').length,
                failed: results.filter(r => r.status === 'failed').length
              }
            }, null, 2)
          }
        ]
      };

    } catch (error) {
      console.error(chalk.red(`[Figma MCP] Error downloading images:`, error));
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to download images: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  private async handleExtractUrlInfo(args: any) {
    const parsed = ExtractUrlInfoSchema.parse(args);
    const { url } = parsed;

    try {
      const fileKey = FigmaApiService.extractFileKeyFromUrl(url);
      const nodeId = FigmaApiService.extractNodeIdFromUrl(url);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              url,
              fileKey,
              nodeId,
              isValidFileKey: fileKey ? FigmaApiService.isValidFileKey(fileKey) : false,
              isValidNodeId: nodeId ? FigmaApiService.isValidNodeId(nodeId) : false
            }, null, 2)
          }
        ]
      };

    } catch (error) {
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to extract URL info: ${error instanceof Error ? error.message : String(error)}`
      );
    }
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

  private extractNodeIds(node: any): string[] {
    const nodeIds: string[] = [];
    
    if (node.id) {
      nodeIds.push(node.id);
    }
    
    if (node.children) {
      for (const child of node.children) {
        nodeIds.push(...this.extractNodeIds(child));
      }
    }
    
    return nodeIds;
  }

  private setupErrorHandling(): void {
    this.server.onerror = (error) => {
      console.error(chalk.red('[Figma MCP] Server error:'), error);
    };

    process.on('SIGINT', async () => {
      console.log(chalk.yellow('\n[Figma MCP] Shutting down server...'));
      await this.server.close();
      process.exit(0);
    });
  }

  async start(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    
    if (this.config.debug) {
      console.log(chalk.blue('[Figma MCP] Debug mode enabled'));
    }
    
    console.log(chalk.green('[Figma MCP] Server started successfully'));
  }
}

// CLI setup
const program = new Command();

program
  .name('figma-mcp-pro')
  .description('Professional Figma MCP Server with enhanced AI context processing')
  .version('1.2.1')
  .requiredOption('--figma-api-key <key>', 'Figma API key', process.env.FIGMA_API_KEY)
  .option('--port <port>', 'Server port', process.env.PORT)
  .option('--debug', 'Enable debug mode', process.env.DEBUG === 'true')
  .option('--stdio', 'Use stdio transport (default)', true)
  .action(async (options) => {
    if (!options.figmaApiKey) {
      console.error(chalk.red('Error: Figma API key is required'));
      console.log(chalk.yellow('Set FIGMA_API_KEY environment variable or use --figma-api-key option'));
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
      console.error(chalk.red('Failed to start server:'), error);
      process.exit(1);
    }
  });

// Handle unhandled rejections
process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  console.error(chalk.red('Unhandled Rejection at:'), promise, chalk.red('reason:'), reason);
  process.exit(1);
});

process.on('uncaughtException', (error: Error) => {
  console.error(chalk.red('Uncaught Exception:'), error);
  process.exit(1);
});

// Start the CLI
program.parse(); 