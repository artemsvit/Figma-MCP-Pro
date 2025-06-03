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
import { Framework, frameworkDescriptions, getFrameworkRules, isValidFramework } from './config/frameworks/index.js';

// Tool schemas  
const ShowFrameworksSchema = z.object({});

const GetFigmaDataSchema = z.object({
  fileKey: z.string().optional().describe('The Figma file key (optional if url provided)'),
  url: z.string().optional().describe('Full Figma URL with file and node selection (alternative to fileKey + nodeId)'),
  nodeId: z.string().optional().describe('Specific node ID to fetch (optional, extracted from url if provided)'),
  depth: z.number().min(1).max(10).default(5).describe('Maximum depth to traverse'),
  framework: z.enum(['react', 'vue', 'angular', 'svelte', 'html']).describe('Target framework - REQUIRED (use select_framework first)'),
  includeImages: z.boolean().default(false).describe('Whether to include image URLs'),
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
            description: 'STEP 2: Get well-structured, AI-optimized Figma design data with framework-specific optimizations. Analyzes layout, components, coordinates, visual effects (shadows, borders), design tokens. PURE DESIGN DATA ONLY - no comments. Use AFTER user chooses framework. Can accept full Figma URL to automatically extract file and node selection.',
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
                  enum: ['react', 'vue', 'angular', 'svelte', 'html'],
                  default: 'html',
                  description: 'Target framework for optimized CSS and component generation (default: html)'
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
                  enum: ['react', 'vue', 'angular', 'svelte', 'html'],
                  description: 'Target framework for code suggestions'
                }
              },
              required: ['url', 'framework']
            },
          },
          {
            name: 'download_design_assets',
            description: 'STEP 4: Automatically scan selected area for ALL export-ready assets and download them with reference.svg. Takes Figma URL, finds all nodes with export settings in selected area, downloads them with Figma export settings, plus creates reference.svg of whole selection.',
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
    
    let parsed;
    try {
      // Handle both undefined and empty object cases
      parsed = ShowFrameworksSchema.parse(args || {});
    } catch (error) {
      this.logError(`[Figma MCP] Schema validation error for args:`, args);
      this.logError(`[Figma MCP] Schema validation error:`, error);
      throw new McpError(
        ErrorCode.InvalidParams,
        `Invalid parameters: ${error instanceof Error ? error.message : String(error)}`
      );
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            STOP_AND_WAIT: '🛑 CRITICAL: User must choose framework before proceeding',
            message: 'Available frameworks for code generation:',
            availableFrameworks: frameworkDescriptions,
            USER_ACTION_REQUIRED: 'Tell me which framework you want to use',
            INSTRUCTIONS: 'After you choose, I will proceed directly to get_figma_data with your selected framework',
            EXAMPLES: [
              'I want to use React',
              'Let\'s go with Vue',
              'I choose HTML/CSS/JS',
              'Use Angular please',
              'Svelte would be perfect'
            ],
            workflow: 'show_frameworks ✅ → USER CHOICE → get_figma_data → process_design_comments → download_design_assets'
          }, null, 2)
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
    
    const { framework, customRules } = parsed;
    const depth = parsed.depth || 5;

    // Extract fileKey and nodeId from URL if provided, otherwise use direct parameters
    let fileKey: string;
    let nodeId: string | undefined;

    if (parsed.url) {
      this.log(`[Figma MCP] Parsing URL: ${parsed.url}`);
      try {
        const urlObj = new URL(parsed.url);
        
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
        
        this.log(`[Figma MCP] Extracted from URL - fileKey: ${fileKey}, nodeId: ${nodeId}`);
        
      } catch (error) {
        this.logError(`[Figma MCP] Error parsing Figma URL:`, error);
        throw new McpError(
          ErrorCode.InvalidParams,
          `Invalid Figma URL: ${error instanceof Error ? error.message : String(error)}`
        );
      }
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
        IMPORTANT_NEXT_STEPS: {
          FOR_COMMENTS: 'STEP 3: Use process_design_comments tool if there are designer comments in Figma',
          FOR_IMAGES: 'STEP 4: Use download_design_assets tool if you need images',
          WORKFLOW: 'show_frameworks → User choice → Design data ✅ → Comments analysis → Image downloads → THEN generate code'
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
                nodeSelection: nodeId ? `Checked for comments on node: ${nodeId}` : 'Checked entire file'
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

      // Process each comment and match with elements
      const processedComments = [];
      
      this.log(`[Figma MCP] Debug - Relevant comments structure:`, JSON.stringify(relevantComments, null, 2));
      this.log(`[Figma MCP] Debug - Elements with bounds:`, elementsWithBounds.length);
      this.log(`[Figma MCP] Debug - Sample elements:`, JSON.stringify(elementsWithBounds.slice(0, 3), null, 2));

      for (const comment of relevantComments) {
        this.log(`[Figma MCP] Debug - Processing comment:`, JSON.stringify(comment, null, 2));
        try {
          const commentData = this.processComment(comment, elementsWithBounds, framework);
          if (commentData) {
            processedComments.push(commentData);
            this.log(`[Figma MCP] Successfully processed comment: "${comment.message}"`);
          } else {
            this.log(`[Figma MCP] Debug - Comment processing returned null for:`, comment.message);
            // Force process even if null returned
            const fallbackData = {
              comment: {
                id: comment.id || 'unknown',
                message: comment.message || 'No message',
                author: comment.user?.handle || 'Unknown',
                timestamp: comment.created_at || new Date().toISOString(),
                coordinates: null
              },
              targetElement: null,
              matching: {
                method: 'fallback-processing',
                reason: 'processComment returned null'
              },
              instruction: this.analyzeCommentInstruction(comment.message || ''),
              aiPrompt: `Please implement: "${comment.message}" using ${framework}`
            };
            processedComments.push(fallbackData);
            this.log(`[Figma MCP] Used fallback processing for comment: "${comment.message}"`);
          }
        } catch (error) {
          this.logError(`[Figma MCP] Error processing comment "${comment.message}":`, error);
          // Create error fallback
          const errorData = {
            comment: {
              id: comment.id || 'unknown',
              message: comment.message || 'No message',
              author: comment.user?.handle || 'Unknown',
              timestamp: comment.created_at || new Date().toISOString(),
              coordinates: null
            },
            targetElement: null,
            matching: {
              method: 'error-fallback',
              reason: `Processing error: ${error instanceof Error ? error.message : String(error)}`
            },
            instruction: { type: 'general', keywords: [], confidence: 0.1, actionable: false },
            aiPrompt: `Please implement: "${comment.message}" using ${framework}`
          };
          processedComments.push(errorData);
        }
      }

      this.log(`[Figma MCP] Processed ${processedComments.length} comments with element matches`);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              summary: {
                totalComments: relevantComments.length,
                processedComments: processedComments.length,
                elementsFound: elementsWithBounds.length
              },
              comments: processedComments,
              framework: framework,
              nodeSelection: nodeId ? `Processed comments for node: ${nodeId}` : 'Processed comments for entire file'
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
   * Process a single comment and match it with design elements
   */
  private processComment(
    comment: any, 
    elements: Array<{
      id: string;
      name: string;
      type: string;
      bounds: { x: number; y: number; width: number; height: number };
      path: string;
    }>, 
    framework: string
  ): any {
    this.log(`[Figma MCP] Debug - Comment full structure:`, JSON.stringify(comment, null, 2));
    
    // Get comment coordinates from Figma API structure
    let commentX = null;
    let commentY = null;
    
    // Primary source: client_meta.node_offset (standard Figma comment positioning)
    if (comment.client_meta?.node_offset?.x !== undefined && comment.client_meta?.node_offset?.y !== undefined) {
      commentX = comment.client_meta.node_offset.x;
      commentY = comment.client_meta.node_offset.y;
      this.log(`[Figma MCP] Found coordinates in client_meta.node_offset: (${commentX}, ${commentY})`);
    }
    // Fallback: check if coordinates are at client_meta level  
    else if (comment.client_meta?.x !== undefined && comment.client_meta?.y !== undefined) {
      commentX = comment.client_meta.x;
      commentY = comment.client_meta.y;
      this.log(`[Figma MCP] Found coordinates in client_meta: (${commentX}, ${commentY})`);
    }
    // Last fallback: root level coordinates (rare)
    else if (comment.x !== undefined && comment.y !== undefined) {
      commentX = comment.x;
      commentY = comment.y;
      this.log(`[Figma MCP] Found coordinates at root level: (${commentX}, ${commentY})`);
    }
    
    if (commentX === null || commentY === null) {
      this.log(`[Figma MCP] No coordinates found for comment "${comment.message}"`);
      this.log(`[Figma MCP] Comment structure:`, JSON.stringify(comment, null, 2));
      this.log(`[Figma MCP] Available fields:`, Object.keys(comment));
      if (comment.client_meta) {
        this.log(`[Figma MCP] client_meta fields:`, Object.keys(comment.client_meta));
      }
    }
    
    if (commentX === null || commentY === null) {
      this.log(`[Figma MCP] Comment "${comment.message}" has no coordinates, processing without coordinates`);
      // Create a simple AI prompt even without coordinates
      const instruction = this.analyzeCommentInstruction(comment.message);
      const simplePrompt = this.generateSimpleAIPrompt(comment, framework);
      
      this.log(`[Figma MCP] Generated fallback prompt for comment: "${comment.message}"`);
      
      return {
        comment: {
          id: comment.id,
          message: comment.message,
          author: comment.user?.handle || 'Unknown',
          timestamp: comment.created_at,
          coordinates: null
        },
        targetElement: null,
        matching: {
          method: 'no-coordinates',
          reason: 'No coordinates found in comment data'
        },
        instruction: instruction,
        aiPrompt: simplePrompt
      };
    }

    this.log(`[Figma MCP] Processing comment at (${commentX}, ${commentY}): "${comment.message}"`);

    // Find elements that could be targeted by this comment
    // Strategy: Find elements that contain the comment point or are close to it
    const candidateElements = elements.filter(element => {
      const bounds = element.bounds;
      
      // Check if comment is inside the element
      const isInside = commentX >= bounds.x && 
                      commentX <= bounds.x + bounds.width &&
                      commentY >= bounds.y && 
                      commentY <= bounds.y + bounds.height;

      // Check if comment is near the element (within 50px)
      const centerX = bounds.x + bounds.width / 2;
      const centerY = bounds.y + bounds.height / 2;
      const distance = Math.sqrt(Math.pow(commentX - centerX, 2) + Math.pow(commentY - centerY, 2));
      const isNear = distance <= 100; // 100px tolerance

      return isInside || isNear;
    });

    // Sort by proximity (closest first)
    candidateElements.sort((a, b) => {
      const distA = Math.sqrt(
        Math.pow(commentX - (a.bounds.x + a.bounds.width / 2), 2) + 
        Math.pow(commentY - (a.bounds.y + a.bounds.height / 2), 2)
      );
      const distB = Math.sqrt(
        Math.pow(commentX - (b.bounds.x + b.bounds.width / 2), 2) + 
        Math.pow(commentY - (b.bounds.y + b.bounds.height / 2), 2)
      );
      return distA - distB;
    });

    if (candidateElements.length === 0) {
      this.log(`[Figma MCP] No elements found near comment "${comment.message}"`);
      return null;
    }

    // Take the closest element as the target
    const targetElement = candidateElements[0];
    if (!targetElement) {
      this.log(`[Figma MCP] No valid target element found for comment "${comment.message}"`);
      return null;
    }

    const distance = Math.sqrt(
      Math.pow(commentX - (targetElement.bounds.x + targetElement.bounds.width / 2), 2) + 
      Math.pow(commentY - (targetElement.bounds.y + targetElement.bounds.height / 2), 2)
    );

    this.log(`[Figma MCP] Matched comment to element "${targetElement.name}" (${targetElement.type}) at distance ${Math.round(distance)}px`);

    // Analyze comment for implementation instructions
    const instruction = this.analyzeCommentInstruction(comment.message);

    // Generate AI prompt
    const aiPrompt = this.generateAIPrompt(comment, targetElement, instruction, framework);

    return {
      comment: {
        id: comment.id,
        message: comment.message,
        author: comment.user.handle,
        timestamp: comment.created_at,
        coordinates: { x: commentX, y: commentY }
      },
      targetElement: {
        id: targetElement.id,
        name: targetElement.name,
        type: targetElement.type,
        bounds: targetElement.bounds,
        path: targetElement.path
      },
      matching: {
        distance: Math.round(distance),
        method: distance === 0 ? 'exact' : (distance <= 100 ? 'proximity' : 'fallback')
      },
      instruction: instruction,
      aiPrompt: aiPrompt
    };
  }

  /**
   * Analyze comment message for implementation instructions
   */
  private analyzeCommentInstruction(message: string): {
    type: 'animation' | 'interaction' | 'behavior' | 'style' | 'general';
    keywords: string[];
    confidence: number;
    actionable: boolean;
  } {
    const lowerMessage = message.toLowerCase();
    
    const animationKeywords = ['animate', 'animation', 'transition', 'fade', 'slide', 'bounce', 'scale', 'rotate', 'duration', 'easing', 'hover', 'jumping'];
    const interactionKeywords = ['click', 'tap', 'focus', 'active', 'disabled', 'press', 'interaction', 'state', 'hover'];
    const behaviorKeywords = ['should', 'when', 'if', 'then', 'toggle', 'show', 'hide', 'open', 'close'];
    const styleKeywords = ['color', 'background', 'border', 'shadow', 'opacity', 'size', 'font', 'margin', 'padding'];

    let type: 'animation' | 'interaction' | 'behavior' | 'style' | 'general' = 'general';
    let foundKeywords: string[] = [];
    let confidence = 0.1;

    // Check for different types of instructions
    const animationMatches = animationKeywords.filter(keyword => lowerMessage.includes(keyword));
    const interactionMatches = interactionKeywords.filter(keyword => lowerMessage.includes(keyword));
    const behaviorMatches = behaviorKeywords.filter(keyword => lowerMessage.includes(keyword));
    const styleMatches = styleKeywords.filter(keyword => lowerMessage.includes(keyword));

    if (animationMatches.length > 0) {
      type = 'animation';
      foundKeywords = animationMatches;
      confidence += animationMatches.length * 0.3;
    } else if (interactionMatches.length > 0) {
      type = 'interaction';
      foundKeywords = interactionMatches;
      confidence += interactionMatches.length * 0.25;
    } else if (behaviorMatches.length > 0) {
      type = 'behavior';
      foundKeywords = behaviorMatches;
      confidence += behaviorMatches.length * 0.2;
    } else if (styleMatches.length > 0) {
      type = 'style';
      foundKeywords = styleMatches;
      confidence += styleMatches.length * 0.2;
    }

    // Boost confidence for imperative language
    if (lowerMessage.includes('should') || lowerMessage.includes('must') || lowerMessage.includes('need')) {
      confidence += 0.3;
    }

    confidence = Math.min(confidence, 1.0);
    const actionable = confidence >= 0.3;

    return {
      type,
      keywords: foundKeywords,
      confidence,
      actionable
    };
  }

  /**
   * Generate AI prompt for implementing the comment instruction
   */
  private generateAIPrompt(
    comment: any, 
    element: any, 
    instruction: any, 
    framework: string
  ): string {
    const frameworkMap = {
      'react': 'React/JSX',
      'vue': 'Vue.js',
      'angular': 'Angular',
      'svelte': 'Svelte',
      'html': 'HTML/CSS/JavaScript'
    };

    const frameworkName = frameworkMap[framework as keyof typeof frameworkMap] || framework;

    // Simple, direct prompt as requested by user
    let prompt = `Please add "${comment.message}" to ${element.name} element (${element.type}).

**Framework**: ${frameworkName}
**Element Path**: ${element.path}
**Element Position**: x=${element.bounds.x}, y=${element.bounds.y} (${element.bounds.width}×${element.bounds.height}px)
**Comment Author**: ${comment.user?.handle || 'Designer'}

**Implementation Details**:`;

    if (instruction.actionable) {
      switch (instruction.type) {
        case 'animation':
          prompt += `
- Add smooth animations/transitions as specified
- Consider hover states, timing, and easing functions
- Ensure performance optimization`;
          break;
        case 'interaction':
          prompt += `
- Add interactive behaviors as specified
- Handle user events (click, hover, focus) appropriately
- Ensure accessibility compliance`;
          break;
        case 'behavior':
          prompt += `
- Implement the specified behavior logic
- Consider state management and user flow
- Follow ${frameworkName} best practices`;
          break;
        case 'style':
          prompt += `
- Apply the specified visual styling
- Use appropriate CSS properties and values
- Consider responsive design`;
          break;
        default:
          prompt += `
- Implement the designer's instruction as specified
- Follow ${frameworkName} best practices
- Ensure code quality and maintainability`;
      }
    } else {
      prompt += `
- Consider this as informational context for the design intent
- Apply general improvements if applicable`;
    }

    prompt += `

**Instruction Type**: ${instruction.type} (${Math.round(instruction.confidence * 100)}% confidence)
**Keywords Found**: ${instruction.keywords.join(', ')}`;

    return prompt;
  }

  /**
   * Generate simple AI prompt when no coordinates are available
   */
  private generateSimpleAIPrompt(comment: any, framework: string): string {
    const frameworkMap = {
      'react': 'React/JSX',
      'vue': 'Vue.js',
      'angular': 'Angular',
      'svelte': 'Svelte',
      'html': 'HTML/CSS/JavaScript'
    };

    const frameworkName = frameworkMap[framework as keyof typeof frameworkMap] || framework;
    const instruction = this.analyzeCommentInstruction(comment.message);

    let prompt = `## Designer Comment Implementation

**Comment**: "${comment.message}"
**Author**: ${comment.user?.handle || 'Unknown'}
**Framework**: ${frameworkName}
**Note**: No specific element coordinates available - apply to relevant design elements

**Analysis**:
- Instruction Type: ${instruction.type}
- Confidence: ${Math.round(instruction.confidence * 100)}%
- Keywords Found: ${instruction.keywords.join(', ')}
- Actionable: ${instruction.actionable ? 'Yes' : 'No'}

**Implementation Task**:
Please implement the designer's instruction "${comment.message}" using ${frameworkName}.
`;

    if (instruction.actionable) {
      switch (instruction.type) {
        case 'animation':
          prompt += `
Focus on:
- Creating smooth animations/transitions
- Considering hover states and timing
- Using appropriate easing functions
- Ensuring performance optimization`;
          break;
        case 'interaction':
          prompt += `
Focus on:
- Adding interactive behaviors
- Handling user events (click, hover, focus)
- Managing component state changes
- Ensuring accessibility`;
          break;
        case 'style':
          prompt += `
Focus on:
- Visual styling and appearance
- CSS properties and values
- Responsive design considerations
- Design system consistency`;
          break;
        default:
          prompt += `
Focus on:
- Understanding the designer's intent
- Implementing appropriate solution
- Following ${frameworkName} best practices
- Ensuring code quality and maintainability`;
      }
    } else {
      prompt += `
**Note**: This comment appears to be informational rather than actionable. Consider it as context for understanding the design intent.`;
    }

    return prompt;
  }



  private async handleDownloadDesignAssets(args: any) {
    const parsed = DownloadFigmaImagesSchema.parse(args);
    const { localPath, scale, format } = parsed;

    // Extract fileKey and nodeId from URL if provided, otherwise use direct parameters
    let fileKey: string;
    let nodeId: string | undefined;

    if (parsed.url) {
      this.log(`[Figma MCP] Parsing URL: ${parsed.url}`);
      try {
        const urlObj = new URL(parsed.url);
        
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
        
        this.log(`[Figma MCP] Extracted from URL - fileKey: ${fileKey}, nodeId: ${nodeId}`);
        
      } catch (error) {
        this.logError(`[Figma MCP] Error parsing Figma URL:`, error);
        throw new McpError(
          ErrorCode.InvalidParams,
          `Invalid Figma URL: ${error instanceof Error ? error.message : String(error)}`
        );
      }
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
        
        // Still create reference.svg of the selected area
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
                message: 'No export settings found in selected area. Only reference.svg created.',
                instructions: this.generateDownloadInstructions([], referenceResult)
              }, null, 2)
            }
          ]
        };
      }

      // Step 3: Download all exportable assets with their Figma export settings
      this.log(`[Figma MCP] Downloading ${exportableNodes.length} export-ready assets...`);
      const downloadResult = await this.figmaApi.downloadImagesWithExportSettings(
        fileKey,
        exportableNodes,
        localPath
      );

      this.log(`[Figma MCP] Export download completed: ${downloadResult.summary.successful} successful, ${downloadResult.summary.failed} failed`);

      // Step 4: Create visual context reference of the selected area
      let referenceResult = null;
      try {
        this.log(`[Figma MCP] Creating visual reference of selected area...`);
        referenceResult = await this.createVisualReference(fileKey, apiNodeId ? [apiNodeId] : [], localPath);
      } catch (referenceError) {
        this.logError(`[Figma MCP] Failed to create reference:`, referenceError);
        // Don't fail the entire download if reference creation fails
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              downloads: downloadResult.downloaded,
              summary: downloadResult.summary,
              reference: referenceResult,
              exportSettings: {
                found: exportableNodes.length,
                downloaded: downloadResult.summary.successful,
                scope: apiNodeId ? `Selected area: ${nodeId}` : 'Entire file'
              },
              message: downloadResult.summary.total === 0 
                ? 'No export assets found to download.'
                : `Downloaded ${downloadResult.summary.successful} export-ready assets with Figma export settings, plus reference.svg of selected area.`,
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
   * Extract nodes that have explicit export settings configured in Figma
   */
  private extractNodesWithExportSettings(node: any): string[] {
    const nodeIds: string[] = [];
    
    const extractIds = (currentNode: any) => {
      // Only collect nodes marked as exportable by detectExportableImage (which now only detects nodes with export settings)
      if (currentNode.image?.isExportable === true) {
        nodeIds.push(currentNode.id);
      }
      
      // Recursively check children
      if (currentNode.children && Array.isArray(currentNode.children)) {
        currentNode.children.forEach((child: any) => {
          extractIds(child);
        });
      }
    };
    
    if (node) {
      extractIds(node);
    }
    
    return [...new Set(nodeIds)]; // Remove duplicates
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

      // Download the reference as SVG with lower resolution for overview
      const referenceDownload = await this.figmaApi.downloadImages(
        fileKey,
        [referenceNodeId],
        localPath,
        {
          scale: 1, // Lower resolution for reference
          format: 'svg'
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

             // Rename to reference.svg
       const originalFile = referenceDownload.downloaded[0];
       if (originalFile && originalFile.success) {
         const path = await import('path');
         const fs = await import('fs/promises');
         
         const referenceFilePath = path.join(localPath, 'reference.svg');
         
         try {
           // Rename/copy to reference.svg
           await fs.rename(originalFile.filePath, referenceFilePath);
           
           this.log(`[Figma MCP] Created visual reference: reference.svg`);
           
           return {
             success: true,
             filePath: referenceFilePath,
             contextType,
             contextName
           };
         } catch (renameError) {
           this.logError(`[Figma MCP] Failed to rename reference file:`, renameError);
           return {
             success: false,
             contextType,
             contextName,
             error: 'Could not rename reference file'
           };
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
   * Generate instructions for using downloaded assets and reference
   */
  private generateDownloadInstructions(downloads: any[], referenceResult: any): string[] {
    const instructions: string[] = [];
    
    if (downloads.length > 0) {
      instructions.push(`📁 Asset Files Downloaded:`);
      downloads.forEach(download => {
        if (download.success) {
          instructions.push(`   ✅ ${download.nodeName} → ${download.filePath.split('/').pop()}`);
        } else {
          instructions.push(`   ❌ ${download.nodeId} → Failed: ${download.error}`);
        }
      });
      instructions.push('');
    }

    if (referenceResult?.success) {
      instructions.push(`🎯 Visual Context Reference:`);
      instructions.push(`   📄 reference.svg → Shows ${referenceResult.contextType} context: "${referenceResult.contextName}"`);
      instructions.push(`   💡 Use this reference to understand how downloaded assets fit in the overall design`);
      instructions.push(`   🔍 Open reference.svg to see layout, positioning, and relationship between elements`);
      instructions.push('');
    }

    instructions.push(`🛠️ Development Workflow:`);
    instructions.push(`   1. Open reference.svg to understand the design context and layout`);
    instructions.push(`   2. Use individual asset files for implementation`);
    instructions.push(`   3. Reference the SVG for accurate positioning and relationships`);
    instructions.push(`   4. Maintain design consistency using the visual context`);

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