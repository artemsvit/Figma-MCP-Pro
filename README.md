# Figma MCP Pro

A powerful, professional Model Context Protocol (MCP) server that provides AI-optimized access to Figma design data. This server enhances the standard Figma API responses with intelligent context processing, semantic analysis, and framework-specific optimizations to help AI coding agents generate better code from design files.

## 🚀 Features

### Core Capabilities
- **Enhanced Context Processing**: Intelligent analysis and enhancement of Figma design data
- **AI-Optimized Output**: Structured data specifically formatted for AI code generation
- **Custom Rules Engine**: Configurable rules for context enhancement and data transformation
- **Framework Optimization**: Tailored output for React, Vue, Angular, Svelte, and HTML
- **Semantic Analysis**: Automatic detection of UI patterns, components, and accessibility requirements
- **Design Token Extraction**: Automatic extraction of colors, typography, spacing, and other design tokens

### Advanced Features
- **CSS Generation**: Automatic CSS property generation from Figma properties
- **Accessibility Enhancement**: ARIA labels, roles, and accessibility information
- **Component Variant Detection**: Automatic detection of component states and variants
- **Interaction State Generation**: Hover, focus, and active state definitions
- **Responsive Breakpoint Analysis**: Detection and optimization for different screen sizes
- **Performance Optimization**: Caching, rate limiting, and request optimization

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

#### Cursor
Add to your Cursor MCP configuration:

```json
{
  "mcpServers": {
    "figma-mcp-pro": {
      "command": "npx",
      "args": ["figma-mcp-pro", "--figma-api-key", "YOUR_API_KEY", "--stdio"],
      "env": {
        "FIGMA_API_KEY": "your_figma_api_key_here"
      }
    }
  }
}
```

#### Claude Desktop
Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "figma-mcp-pro": {
      "command": "node",
      "args": ["/absolute/path/to/figma-mcp-pro/dist/index.js", "--figma-api-key", "YOUR_API_KEY"],
      "env": {
        "FIGMA_API_KEY": "your_figma_api_key_here"
      }
    }
  }
}
```

## 🛠️ Usage

### Available Tools

#### 1. `get_figma_data`
Fetch and process Figma design data with AI-optimized context enhancement.

**Parameters:**
- `fileKey` (string): The Figma file key
- `nodeId` (string, optional): Specific node ID to fetch
- `depth` (number, 1-10, default: 5): Maximum depth to traverse
- `framework` (enum, optional): Target framework ('react', 'vue', 'angular', 'svelte', 'html')
- `includeImages` (boolean, default: false): Whether to include image URLs
- `customRules` (object, optional): Custom processing rules

**Example:**
```javascript
{
  "fileKey": "ABC123DEF456",
  "nodeId": "123:456",
  "framework": "react",
  "includeImages": true,
  "customRules": {
    "aiOptimization": {
      "enableCSSGeneration": true,
      "enableSemanticAnalysis": true
    }
  }
}
```

#### 2. `download_figma_images`
Download images from Figma nodes to local directory.

**Parameters:**
- `fileKey` (string): The Figma file key
- `nodeIds` (array): Array of node IDs to download as images
- `localPath` (string): Local directory path to save images
- `scale` (number, 0.5-4, default: 2): Export scale for images
- `format` (enum, default: 'png'): Image format ('png', 'jpg', 'svg', 'pdf')

#### 3. `extract_url_info`
Extract file key and node ID from Figma URLs.

**Parameters:**
- `url` (string): Figma URL to extract information from

#### 4. `get_server_stats`
Get server performance and usage statistics.

#### 5. `clear_cache`
Clear the API response cache.

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

### CSS Generation
Converts Figma properties to CSS:
- Layout properties (width, height, position)
- Flexbox and Grid layouts
- Colors and backgrounds
- Typography styles
- Shadows and effects
- Border radius and borders

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
- Shadow definitions
- Border radius values

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