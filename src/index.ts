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
                  enum: ['react', 'vue', 'angular', 'svelte', 'html'],
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

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            STOP_AND_WAIT: '🛑 CRITICAL: User must choose framework before proceeding',
            message: 'Choose your framework:',
            frameworks: {
              'React': 'TypeScript, Hooks, CSS Modules',
              'Vue': 'Composition API, TypeScript, Scoped Styles', 
              'Angular': 'TypeScript, Components, Services',
              'Svelte': 'TypeScript, Reactive, Scoped Styles',
              'HTML/CSS/JS': 'Semantic HTML, Pure CSS, Vanilla JS'
            },
            USER_ACTION_REQUIRED: 'Tell me which framework you want to use',
            EXAMPLES: [
              'I want to use React',
              'Let\'s go with Vue', 
              'I choose HTML/CSS/JS',
              'Use Angular please',
              'Svelte would be perfect'
            ],
            workflow: 'Framework Choice → Design Data → Comments → Assets → Code'
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
          author: comment.user?.handle || 'Designer',
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
              nodeContext: nodeId ? `Comments for node: ${nodeId}` : 'Comments for entire file'
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
    
    const { assetsPath, framework } = parsed;

    try {
      // Resolve the assets path using robust path resolution
      // Normalize and validate the input path to prevent encoding issues
      const normalizedPath = assetsPath.trim().replace(/[^\x20-\x7E]/g, ''); // Remove non-ASCII characters
      
      let resolvedPath: string;
      if (path.isAbsolute(normalizedPath)) {
        resolvedPath = normalizedPath;
      } else {
        const cwd = process.cwd();
        // Clean the relative path and resolve it properly
        const cleanPath = normalizedPath
          .replace(/^\.\//, '') // Remove leading ./
          .replace(/^\//, ''); // Remove leading / if accidentally added
        resolvedPath = path.resolve(cwd, cleanPath);
      }
      
      // Validate the resolved path
      if (!resolvedPath || resolvedPath.length === 0) {
        throw new Error('Invalid or empty path after resolution');
      }
      
      // Check if reference.png exists
      const referencePath = path.join(resolvedPath, 'reference.png');
      
      let referenceExists = false;
      let fileStats = null;
      try {
        fileStats = await fs.stat(referencePath);
        referenceExists = fileStats.isFile();
      } catch (error) {
        // File doesn't exist
      }

      if (!referenceExists) {
        const expectedPath = path.join(assetsPath, 'reference.png');
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                status: 'error',
                message: 'reference.png not found in assets folder',
                expectedPath: expectedPath,
                suggestion: 'Run download_design_assets first to generate reference.png'
              }, null, 2)
            }
          ]
        };
      }

      // Get file information
      const fileSizeKB = Math.round(fileStats!.size / 1024);
      
      // Generate design analysis guidance
      const analysisGuidance = this.generateDesignAnalysisGuidance(framework);

      // Use relative path for response
      const relativePath = path.join(assetsPath, 'reference.png');

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              status: 'success',
              message: `Please inspect the reference.png file at ${relativePath} for complete design context`,
              reference: {
                path: relativePath,
                size: `${fileSizeKB} KB`
              },
              analysisGuidance: analysisGuidance,
              framework: framework || 'not specified',
              instruction: 'Open reference.png to understand the complete design layout and visual hierarchy before implementing code'
            }, null, 2)
          }
        ]
      };

    } catch (error) {
      this.logError(`[Figma MCP] Error checking reference:`, error);
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to check reference: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Generate design analysis guidance based on framework
   */
  private generateDesignAnalysisGuidance(framework?: string): string[] {
    const guidance = [
      'Main layout structure (header, main content, sidebar, footer)',
      'Responsive breakpoints and grid systems', 
      'Color palette and theme consistency',
      'Typography hierarchy (headings, body text, captions)',
      'Component boundaries and groupings',
      'Interactive elements (buttons, forms, navigation)',
      'Spacing patterns and alignment',
      'Visual hierarchy and emphasis'
    ];
    
    switch (framework) {
      case 'react':
        guidance.push('React component boundaries and prop flow');
        break;
      case 'vue':
        guidance.push('Vue component composition and reactive patterns');
        break;
      case 'angular':
        guidance.push('Angular component architecture and services');
        break;
      case 'svelte':
        guidance.push('Svelte component boundaries and reactive statements');
        break;
      case 'html':
        guidance.push('Semantic HTML structure and CSS Grid/Flexbox');
        break;
    }

    return guidance;
  }

  private async handleDownloadDesignAssets(args: any) {
    const parsed = DownloadFigmaImagesSchema.parse(args);
    const { localPath } = parsed;

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

      // Download the reference as PNG with good resolution for overview
      const referenceDownload = await this.figmaApi.downloadImages(
        fileKey,
        [referenceNodeId],
        localPath,
        {
          scale: 2, // Good resolution for PNG reference
          format: 'png'
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

             // Rename to reference.png
       const originalFile = referenceDownload.downloaded[0];
       if (originalFile && originalFile.success) {
         const referenceFilePath = path.join(localPath, 'reference.png');
         
         try {
           // Rename/copy to reference.png
           await fs.rename(originalFile.filePath, referenceFilePath);
           
           this.log(`[Figma MCP] Created visual reference: reference.png`);
           
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
      instructions.push(`   📄 reference.png → Shows ${referenceResult.contextType} context: "${referenceResult.contextName}"`);
      instructions.push(`   💡 Use this reference to understand how downloaded assets fit in the overall design`);
      instructions.push(`   🔍 Open reference.png to see layout, positioning, and relationship between elements`);
      instructions.push('');
    }

    instructions.push(`🛠️ Development Workflow:`);
    instructions.push(`   1. Open reference.png to understand the design context and layout`);
    instructions.push(`   2. Use individual asset files for implementation`);
    instructions.push(`   3. Reference the PNG for accurate positioning and relationships`);
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