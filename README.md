# Figma MCP Pro

A powerful, professional Model Context Protocol (MCP) server that provides AI-optimized access to Figma design data. Features a clean 4-step workflow for comprehensive design analysis, comment processing, and asset downloads. This server enhances the standard Figma API responses with intelligent context processing, semantic analysis, and framework-specific optimizations to help AI coding agents generate better code from design files.

## 🚀 Features

### 🎯 Clean 4-Step Workflow
1. **Framework Selection**: Choose your target framework (React, Vue, Angular, Svelte, HTML)
2. **Design Analysis**: AI-optimized design structure analysis with framework-specific processing
3. **Comment Processing**: Smart matching of designer comments to design elements with AI prompts
4. **Asset Downloads**: Batch download of exportable images and assets

### Core Capabilities
- **Enhanced Context Processing**: Intelligent analysis and enhancement of Figma design data
- **AI-Optimized Output**: Structured data specifically formatted for AI code generation
- **Framework Optimization**: Tailored output for React, Vue, Angular, Svelte, and HTML
- **Semantic Analysis**: Automatic detection of UI patterns, components, and accessibility requirements
- **Design Token Extraction**: Automatic extraction of colors, typography, spacing, and other design tokens

### Advanced Features
- **Smart Comment Processing**: Coordinate-based matching of designer comments to UI elements
- **AI Prompt Generation**: Framework-specific implementation prompts from designer instructions
- **CSS Generation**: Automatic CSS property generation from Figma properties with comprehensive effects support
- **Accessibility Enhancement**: ARIA labels, roles, and accessibility information
- **Component Variant Detection**: Automatic detection of component states and variants
- **Interaction State Generation**: Hover, focus, and active state definitions
- **Performance Optimization**: Caching, rate limiting, and request optimization

### Latest Updates

#### v2.5.0 - Clean 4-Step Workflow & Smart Comments 🚀
- **NEW**: Clean 4-step workflow replacing chaotic mixed operations
- **NEW**: `analyze_figma_design` - Pure design analysis (Step 2)
- **NEW**: `process_design_comments` - Smart comment-to-element matching (Step 3)
- **NEW**: `download_design_assets` - Dedicated asset downloads (Step 4)
- **IMPROVED**: Comment coordinate matching with 100px proximity tolerance
- **IMPROVED**: AI prompt generation for designer instructions
- **IMPROVED**: Framework-specific processing from step 1
- **FIXED**: Path resolution issues for relative and absolute paths

#### v2.4.2 - Path Fixes & Stability
- **FIXED**: Directory creation issues with relative paths (`./images`)
- **IMPROVED**: Path resolution logging for debugging
- **ENHANCED**: Error handling for edge cases

## 📦 Installation

### Prerequisites
- Node.js 18.x or higher
- Figma API access token
- MCP-compatible client (Cursor, Claude Desktop, etc.)

### Install from NPM
```bash
npm install -g figma-mcp-pro
```

Or use directly with npx:
```bash
npx figma-mcp-pro --figma-api-key YOUR_API_KEY
```

### Development Installation
```bash
# Clone the repository
git clone https://github.com/artemsvit/Figma-MCP-Pro.git
cd Figma-MCP-Pro

# Install dependencies
npm install

# Build the project
npm run build
```

## ⚙️ Configuration

### Environment Variables
Create a `.env` file based on `env.example`:

```bash
# Figma API Configuration
FIGMA_API_KEY=your_figma_api_key_here

# Server Configuration
PORT=3000
NODE_ENV=development

# Cache Configuration
CACHE_TTL=300000
CACHE_MAX_SIZE=1000

# Rate Limiting
RATE_LIMIT_REQUESTS_PER_MINUTE=60
RATE_LIMIT_BURST_SIZE=10

# Context Rules Configuration
ENABLE_ENHANCED_CONTEXT=true
MAX_CONTEXT_DEPTH=5
INCLUDE_DESIGN_TOKENS=true
INCLUDE_COMPONENT_VARIANTS=true
INCLUDE_LAYOUT_CONSTRAINTS=true
INCLUDE_INTERACTION_DETAILS=true

# AI Optimization Settings
OPTIMIZE_FOR_CODE_GENERATION=true
INCLUDE_CSS_PROPERTIES=true
INCLUDE_RESPONSIVE_BREAKPOINTS=true
SIMPLIFY_COMPLEX_PATHS=true
```

### MCP Client Configuration

#### Cursor, Windsurf, TRAE, and Claude Desktop
Add to your MCP configuration file:

```json
{
  "mcpServers": {
    "Figma MCP PRO": {
      "command": "npx",
      "args": ["figma-mcp-pro@latest", "--figma-api-key", "your-api-key-here"],
      "env": {
        "DEBUG": "true"
      }
    }
  }
}
```

**Configuration file locations:**
- **Cursor**: MCP settings in the application
- **Windsurf**: MCP settings in the application  
- **TRAE**: MCP settings in the application
- **Claude Desktop**: `claude_desktop_config.json`

## 🛠️ Usage

### 🎯 The Clean 4-Step Workflow

Follow this clean, predictable workflow for best results:

#### **Step 1: Framework Selection** 
Choose your target framework before starting. This optimizes all subsequent processing:
- React/JSX
- Vue.js  
- Angular
- Svelte
- HTML/CSS/JavaScript

#### **Step 2: Design Analysis** 
Use `analyze_figma_design` to get AI-optimized design structure:

```json
{
  "url": "https://www.figma.com/design/ABC123DEF456/My-Design?node-id=123-456",
  "framework": "react"
}
```

#### **Step 3: Comment Processing** 
Use `process_design_comments` to match designer comments to elements:

```json
{
  "fileKey": "ABC123DEF456",
  "analysisData": "...(output from step 2)...",
  "framework": "react"
}
```

#### **Step 4: Asset Downloads**
Use `download_design_assets` to get exportable images:

```json
{
  "fileKey": "ABC123DEF456", 
  "nodeIds": ["1417:681", "1417:695"],
  "localPath": "./images"
}
```

### Available Tools

#### 1. `analyze_figma_design` (Step 2)
Pure design analysis with framework-specific optimization. Analyzes Figma URL and extracts AI-optimized structure.

**Parameters:**
- `url` (string): Full Figma URL from browser (handles file extraction automatically)
- `framework` (enum): Target framework ('react', 'vue', 'angular', 'svelte', 'html') - **REQUIRED**
- `includeComments` (boolean, default: false): Include basic comment data (use Step 3 for detailed processing)

**Example:**
```json
{
  "url": "https://www.figma.com/design/ZVnXdidh7cqIeJuI8e4c6g/CV-Artem-Svitelskyi?node-id=1410-165",
  "framework": "react"
}
```

**Output:**
- AI-optimized design structure
- CSS properties and design tokens
- Framework-specific component suggestions
- Accessibility metadata
- Exportable node identification for Step 4

#### 2. `process_design_comments` (Step 3)
Smart processing of designer comments with coordinate-based element matching. Generates actionable AI prompts.

**Parameters:**
- `fileKey` (string): The Figma file key from Step 2
- `analysisData` (object): The analyzed design data from Step 2
- `framework` (enum): Target framework for code suggestions

**Example:**
```json
{
  "fileKey": "ZVnXdidh7cqIeJuI8e4c6g",
  "analysisData": { "...output from analyze_figma_design..." },
  "framework": "react"
}
```

**Smart Features:**
- **Coordinate Matching**: Matches comment positions to design elements (100px tolerance)
- **Intent Analysis**: Detects animation, interaction, behavior, and style instructions
- **Confidence Scoring**: Rates actionable vs informational comments
- **AI Prompt Generation**: Creates framework-specific implementation prompts
- **Context Awareness**: Includes element details and positioning

#### 3. `download_design_assets` (Step 4)
Dedicated asset downloading with smart path resolution. Downloads exportable images identified in Step 2.

**Parameters:**
- `fileKey` (string): The Figma file key
- `nodeIds` (array): Array of node IDs to download (from Step 2 metadata)
- `localPath` (string): Local directory path (supports both `./images` and absolute paths)
- `scale` (number, 0.5-4, default: 2): Export scale for images
- `format` (enum, default: 'svg'): Image format ('jpg', 'png', 'svg', 'pdf')

**Example:**
```json
{
  "fileKey": "ZVnXdidh7cqIeJuI8e4c6g",
  "nodeIds": ["1417:681", "1417:695", "1488:167"],
  "localPath": "./images",
  "format": "svg"
}
```

**Key Features:**
- **Path Resolution**: Fixed handling of relative (`./images`) and absolute paths
- **Original Naming**: Uses actual node names as filenames with sanitization
- **Batch Processing**: Efficiently processes multiple nodes in parallel
- **Export Settings Aware**: Respects Figma export configurations when available
- **Error Recovery**: Robust error handling with detailed reporting

#### 4. Legacy Tools
- `get_figma_data`: Legacy tool - use `analyze_figma_design` instead
- `optimize_for_framework`: Legacy tool - framework selection now happens in Step 1
- `get_server_stats`: Get server performance and usage statistics
- `clear_cache`: Clear the API response cache

### Custom Rules Configuration

The server supports extensive customization through rules configuration:

```typescript
interface ContextRules {
  maxDepth: number;
  includeHiddenNodes: boolean;
  includeLockedNodes: boolean;
  
  nodeTypeFilters: {
    include: FigmaNodeType[];
    exclude: FigmaNodeType[];
    prioritize: FigmaNodeType[];
  };
  
  aiOptimization: {
    enableCSSGeneration: boolean;
    enableSemanticAnalysis: boolean;
    enableAccessibilityInfo: boolean;
    enableResponsiveBreakpoints: boolean;
    enableDesignTokens: boolean;
    enableComponentVariants: boolean;
    enableInteractionStates: boolean;
    simplifyComplexPaths: boolean;
    optimizeForCodeGeneration: boolean;
  };
  
  // ... more configuration options
}
```

### Framework-Specific Optimizations

The server provides tailored output for different frameworks:

#### React
- JSX component generation
- TypeScript support
- Styled Components or Tailwind CSS
- React Hooks generation
- Component prop types

#### Vue
- Single File Component (SFC) generation
- Composition API support
- Scoped styles
- TypeScript support

#### Angular
- Component generation
- Standalone components
- Angular Signals
- TypeScript support

#### Svelte
- Svelte component generation
- TypeScript support
- Stores integration

#### HTML
- Semantic HTML generation
- Modern CSS
- Accessibility markup
- Tailwind CSS support

## 🎯 AI Optimization Features

### Semantic Analysis
Automatically detects and categorizes UI elements:
- Buttons and interactive elements
- Input fields and forms
- Navigation components
- Text hierarchy (h1-h6)
- Images and media
- Containers and layout elements

### Enhanced CSS Generation
Converts Figma properties to CSS with comprehensive effects support:
- Layout properties (width, height, position)
- Flexbox and Grid layouts
- Colors and backgrounds
- Typography styles
- **Advanced Effects Support**:
  - Multiple drop shadows and inner shadows
  - Layer blur and background blur effects
  - Individual corner radius per corner
  - Stroke alignment (inside/center/outside)
  - Individual stroke weights per side
  - Stroke dash patterns

### Accessibility Enhancement
Generates accessibility information:
- ARIA labels and roles
- Tab index and focus management
- Alt text for images
- Semantic HTML structure

### Design Token Extraction
Automatically extracts design tokens:
- Color palettes
- Typography scales
- Spacing systems
- Shadow definitions (including inner shadows)
- Border radius values
- Border/stroke properties

### Component Variant Detection
Identifies component states:
- Default state
- Hover states
- Active states
- Disabled states
- Focus states

## 🔧 Development

### Scripts
```bash
# Development with auto-rebuild
npm run dev

# Build for production
npm run build

# Run tests
npm run test

# Lint code
npm run lint

# Format code
npm run format

# Type checking
npm run type-check
```

### Project Structure
```
src/
├── config/
│   └── rules.ts          # Custom rules configuration
├── processors/
│   └── context-processor.ts  # Context enhancement processor
├── services/
│   └── figma-api.ts      # Figma API service
├── types/
│   └── figma.ts          # TypeScript type definitions
├── docs/
│   └── FIGMA_EFFECTS_HANDLING.md  # Effects handling documentation
└── index.ts              # Main server entry point
```

### Adding Custom Rules

Create custom rules to enhance specific node types:

```typescript
const customRule: CustomRule = {
  name: 'Custom Button Enhancement',
  description: 'Enhance button components with custom properties',
  condition: {
    nodeType: ['COMPONENT', 'INSTANCE'],
    nodeName: 'button',
    hasChildren: true
  },
  action: {
    type: 'enhance',
    parameters: {
      semanticRole: { type: 'button' },
      cssProperties: {
        cursor: 'pointer',
        userSelect: 'none'
      },
      interactionStates: [
        {
          trigger: 'hover',
          changes: { opacity: '0.8' },
          animation: { duration: '0.2s', easing: 'ease-in-out' }
        }
      ]
    }
  },
  priority: 10,
  enabled: true
};
```

## 📊 Performance & Monitoring

### Caching
- LRU cache with configurable TTL
- Request deduplication
- Cache statistics and monitoring

### Rate Limiting
- Configurable requests per minute
- Burst request handling
- Automatic retry with exponential backoff

### Monitoring
- Processing statistics
- Cache hit rates
- Error tracking and reporting
- Performance metrics

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes with tests
4. Submit a pull request

### Coding Standards
- TypeScript strict mode
- ESLint configuration
- Prettier formatting
- Jest for testing
- Comprehensive error handling

## 📄 License

MIT License - See LICENSE file for details

## 🆘 Support

- **Issues**: [GitHub Issues](https://github.com/artemsvit/Figma-MCP-Pro/issues)
- **Documentation**: [Wiki](https://github.com/artemsvit/Figma-MCP-Pro/wiki)
- **Discussions**: [GitHub Discussions](https://github.com/artemsvit/Figma-MCP-Pro/discussions)

## 🙏 Acknowledgments

- [Framelink](https://framelink.ai) for inspiration and reference implementation
- [Model Context Protocol](https://modelcontextprotocol.io) for the MCP specification
- [Figma API](https://www.figma.com/developers/api) for the design data access
- The open-source community for tools and libraries

## 🔗 Related Projects

- [GLips/Figma-Context-MCP](https://github.com/GLips/Figma-Context-MCP) - Original Framelink implementation
- [TimHolden/figma-mcp-server](https://github.com/TimHolden/figma-mcp-server) - Alternative MCP server
- [MatthewDailey/figma-mcp](https://github.com/MatthewDailey/figma-mcp) - Another Figma MCP implementation