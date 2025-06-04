# Figma MCP Pro

Professional Model Context Protocol (MCP) server for AI-optimized Figma design analysis. Clean 5-step workflow for comprehensive design-to-code conversion with smart comment processing and asset downloads.

## 🚀 Key Features

- **5-Step Workflow**: Framework selection → Design data → Comments → Assets → Reference analysis
- **AI-Optimized**: Structured data specifically formatted for AI code generation  
- **10 Framework Support**: React, Vue, Angular, Svelte, HTML/CSS/JS, SwiftUI, UIKit, Electron, Tauri, NW.js
- **Smart Comments**: Coordinate-based matching of designer comments to UI elements
- **Asset Downloads**: Batch download with original Figma export settings
- **CSS Generation**: Automatic CSS from Figma properties (padding, margins, borders, effects)

## 📦 Installation

```bash
npm install -g figma-mcp-pro
```

## ⚙️ Configuration

### Get Figma API Key
1. Go to [Figma Account Settings](https://www.figma.com/settings)  
2. Generate a new personal access token
3. Copy the token for configuration

### MCP Client Setup

#### Claude Desktop
Add to `claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "figma-mcp-pro": {
      "command": "npx",
      "args": ["figma-mcp-pro@latest", "--figma-api-key", "your-api-key-here"],
      "env": {
        "DEBUG": "true"
      }
    }
  }
}
```

#### Claude Code (VS Code Extension)  
Add to VS Code MCP settings:
```json
{
  "mcpServers": {
    "figma-mcp-pro": {
      "command": "npx",
      "args": ["figma-mcp-pro@latest", "--figma-api-key", "your-api-key-here"],
      "env": {
        "DEBUG": "true"
      }
    }
  }
}
```

#### Cursor, Windsurf, TRAE
Add to MCP configuration in application settings:
```json
{
  "mcpServers": {
    "figma-mcp-pro": {
      "command": "npx",
      "args": ["figma-mcp-pro@latest", "--figma-api-key", "your-api-key-here"],
      "env": {
        "DEBUG": "true"
      }
    }
  }
}
```

## 📝 Tool Reference

### Core Tools

#### `show_frameworks`
Shows available frameworks. Call first to choose target framework.

#### `get_figma_data` 
Extracts AI-optimized design data with framework-specific processing.
- **Input**: Figma URL + framework
- **Output**: Design structure, CSS properties, layout data

#### `process_design_comments`
Matches designer comments to design elements with AI implementation prompts.
- **Input**: Figma URL + framework  
- **Output**: Comment-to-element mapping with actionable instructions

#### `download_design_assets`
Downloads export-ready assets with original Figma settings + reference image.
- **Input**: Figma URL + local path
- **Output**: Asset files + reference.png for visual context

#### `check_reference`
Analyzes reference.png for design understanding and development guidance.
- **Input**: Assets folder path + framework
- **Output**: Design analysis and framework-specific development recommendations

## 🎯 What You Get

### Design Data
- **Layout**: Padding, margins, gaps, auto-layout properties
- **Styling**: Colors, borders, shadows, effects, typography  
- **Structure**: Component hierarchy, semantic roles
- **Responsive**: Flexible sizing, constraints, breakpoints

### Smart Comments
- **Coordinate Matching**: Comments linked to specific design elements
- **AI Instructions**: "Add hover animation to Button component"
- **Implementation Context**: Element details + positioning

### Asset Downloads  
- **Export Settings**: Respects Figma's configured export settings
- **Original Names**: Uses actual node names as filenames
- **Visual Reference**: reference.png shows complete design context
- **Multiple Formats**: SVG, PNG, JPG, PDF support

## 🌟 Framework Optimizations

- **React**: TypeScript, Hooks, Custom Hooks, Performance optimization
- **Vue**: Composition API, TypeScript, Pinia stores, Composables  
- **Angular**: Standalone components, Signals, Modern templates, TypeScript
- **Svelte**: Svelte 5 runes, TypeScript, SvelteKit, Stores
- **HTML/CSS/JS**: Design tokens, Modern CSS, Accessibility-first
- **SwiftUI**: State management, MVVM, Accessibility, Modern patterns
- **UIKit**: Modern concurrency, SwiftUI interop, Auto Layout
- **Electron**: Security hardening, IPC patterns, Native integration
- **Tauri**: Rust commands, Event system, Security, WebView
- **NW.js**: Unified context, Node.js integration, Chromium APIs

## 📄 License

MIT License

## 🆘 Support

- **Issues**: [GitHub Issues](https://github.com/artemsvit/Figma-MCP-Pro/issues)
- **NPM**: [figma-mcp-pro](https://www.npmjs.com/package/figma-mcp-pro)