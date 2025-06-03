# Figma MCP Pro

Professional Model Context Protocol (MCP) server for AI-optimized Figma design analysis. Clean 5-step workflow for comprehensive design-to-code conversion with smart comment processing and asset downloads.

## 🚀 Key Features

- **5-Step Workflow**: Framework selection → Design data → Comments → Assets → Reference analysis
- **AI-Optimized**: Structured data specifically formatted for AI code generation  
- **Framework Support**: React, Vue, Angular, Svelte, HTML/CSS/JS
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

## 🛠️ Usage

### Perfect 5-Step Workflow

#### **Step 1: Show Frameworks**
```
Call: show_frameworks()
```
Choose your target framework (React, Vue, Angular, Svelte, HTML).

#### **Step 2: Get Design Data** 
```json
{
  "url": "https://figma.com/design/ABC123/Design?node-id=123-456",
  "framework": "react"
}
```
AI-optimized design structure with CSS properties and layout data.

#### **Step 3: Process Comments**
```json  
{
  "url": "https://figma.com/design/ABC123/Design?node-id=123-456",
  "framework": "react"
}
```
Smart matching of designer comments to specific design elements.

#### **Step 4: Download Assets**
```json
{
  "url": "https://figma.com/design/ABC123/Design?node-id=123-456", 
  "localPath": "./assets"
}
```
Downloads all export-ready assets plus reference.png for visual context.

#### **Step 5: Check Reference**
```json
{
  "assetsPath": "./assets",
  "framework": "react"
}
```
Analyze reference.png for design understanding before code development.

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

- **React**: TypeScript, Hooks, CSS Modules
- **Vue**: Composition API, TypeScript, Scoped Styles  
- **Angular**: TypeScript, Components, Services
- **Svelte**: TypeScript, Reactive, Scoped Styles
- **HTML/CSS/JS**: Semantic HTML, Pure CSS, Vanilla JS

## 📄 License

MIT License

## 🆘 Support

- **Issues**: [GitHub Issues](https://github.com/artemsvit/Figma-MCP-Pro/issues)
- **NPM**: [figma-mcp-pro](https://www.npmjs.com/package/figma-mcp-pro)