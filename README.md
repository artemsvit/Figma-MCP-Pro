

[![MseeP.ai Security Assessment Badge](https://mseep.net/pr/artemsvit-figma-mcp-pro-badge.png)](https://mseep.ai/app/artemsvit-figma-mcp-pro)

# Figma MCP PRO

[![smithery badge](https://smithery.ai/badge/@artemsvit/figma-mcp-pro)](https://smithery.ai/server/@artemsvit/figma-mcp-pro)

Professional Model Context Protocol (MCP) server for AI-optimized Figma design analysis. Clean 5-step workflow for comprehensive design-to-code conversion with smart comment processing and asset downloads.

## 🚀 Key Features

- **5-Step Workflow**: Framework selection → Design data → Comments → Assets → Reference analysis
- **AI-Optimized**: Structured data specifically formatted for AI code generation  
- **10 Framework Support**: React, Vue, Angular, Svelte, HTML/CSS/JS, SwiftUI, UIKit, Electron, Tauri, NW.js
- **Smart Comments**: Coordinate-based matching of designer comments to UI elements
- **Asset Downloads**: Batch download with original Figma export settings
- **CSS Generation**: Automatic CSS from Figma properties (padding, margins, borders, effects)

## 📦 Installation

### Installing via Smithery

To install figma-mcp-pro for Claude Desktop automatically via [Smithery](https://smithery.ai/server/@artemsvit/figma-mcp-pro):

```bash
npx -y @smithery/cli install @artemsvit/figma-mcp-pro --client claude
```

### Manual Installation
```bash
npm install -g figma-mcp-pro
```

## ⚙️ Quick Setup

### 1. Get Your Figma API Key
Get your API token from [Figma Account Settings](https://www.figma.com/settings) → Personal access tokens

### 2. Copy & Paste MCP Configuration
**📋 Use the copy button on the code block below**, then replace `your-api-key-here` with your actual API key:

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

**Configuration File Locations:**
- **Claude Desktop**: `claude_desktop_config.json`
- **Claude Code (VS Code)**: VS Code MCP settings  
- **Cursor, Windsurf, TRAE**: Application MCP configuration settings

## 📝 Tool Reference

### Core Tools

#### `analyze_figma_url`
**PRIMARY** - Complete Figma URL analysis with framework-specific optimization.
- **Input**: Figma URL + framework + optional flags (`includeComments`, `includeImages`)
- **Output**: Optimized design structure, CSS properties, layout data, and AI-ready instructions

#### `download_figma_images`
**ADDITIONAL** - Downloads specific design assets beyond initial analysis.
- **Input**: Figma URL/file key + local path + optional node IDs/format
- **Output**: Exported asset files (SVG, PNG, JPG, PDF)

#### `optimize_for_framework`
**SECONDARY** - Re-optimizes previously analyzed data for a different framework.
- **Input**: File key + target framework
- **Output**: Framework-optimized design data

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
