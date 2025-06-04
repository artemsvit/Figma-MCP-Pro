# Figma MCP Pro - Installation Guide

## 🚀 Quick Installation

```bash
npm install -g figma-mcp-pro@latest
```

## 🔑 Get Your Figma API Key

1. **Go to Figma Account Settings**: [https://www.figma.com/settings](https://www.figma.com/settings)
2. **Generate Personal Access Token**: 
   - Scroll to "Personal access tokens"
   - Click "Generate new token"
   - Give it a descriptive name like "MCP Server"
3. **Copy the Token**: Starts with `figd_` - save it securely

## ⚙️ Universal IDE Configuration

### Cursor IDE
Open Cursor Settings → MCP Servers, add:
```json
{
  "mcpServers": {
    "figma-mcp-pro": {
      "command": "npx",
      "args": ["figma-mcp-pro@latest", "--figma-api-key", "your-figma-api-key-here"],
      "env": {
        "DEBUG": "true"
      }
    }
  }
}
```

### Windsurf IDE  
Open Settings → Extensions → MCP Configuration:
```json
{
  "mcpServers": {
    "figma-mcp-pro": {
      "command": "npx", 
      "args": ["figma-mcp-pro@latest", "--figma-api-key", "your-figma-api-key-here"],
      "env": {
        "DEBUG": "true"
      }
    }
  }
}
```

### TRAE IDE
Add to MCP servers configuration:
```json
{
  "mcpServers": {
    "figma-mcp-pro": {
      "command": "npx",
      "args": ["figma-mcp-pro@latest", "--figma-api-key", "your-figma-api-key-here"],
      "env": {
        "DEBUG": "true"
      }
    }
  }
}
```

### Claude Desktop
Edit `~/.config/claude_desktop_config.json` (macOS/Linux) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows):
```json
{
  "mcpServers": {
    "figma-mcp-pro": {
      "command": "npx",
      "args": ["figma-mcp-pro@latest", "--figma-api-key", "your-figma-api-key-here"],
      "env": {
        "DEBUG": "true"
      }
    }
  }
}
```

### VS Code (Claude Extension)
Add to VS Code MCP settings:
```json
{
  "mcpServers": {
    "figma-mcp-pro": {
      "command": "npx",
      "args": ["figma-mcp-pro@latest", "--figma-api-key", "your-figma-api-key-here"],
      "env": {
        "DEBUG": "true"
      }
    }
  }
}
```

## 🛠️ Available Tools - Perfect 5-Step Workflow

### **Step 1: `show_frameworks`**
🎯 **Purpose**: Display available frameworks and get user choice  
📋 **Usage**: Call with empty parameters `{}`  
⚡ **Output**: List of supported frameworks (React, Vue, Angular, Svelte, HTML)

### **Step 2: `get_figma_data`** 
🎯 **Purpose**: Extract AI-optimized design data with framework-specific processing  
📋 **Input**: Figma URL + chosen framework  
⚡ **Output**: 
- Clean design structure and component hierarchy
- CSS properties (padding, margins, borders, effects)
- Layout data (auto-layout, constraints, responsive settings)
- Typography and color tokens

**Example**:
```json
{
  "url": "https://figma.com/design/ABC123/My-Design?node-id=123-456",
  "framework": "react"
}
```

### **Step 3: `process_design_comments`**
🎯 **Purpose**: Smart coordinate-based matching of designer comments to UI elements  
📋 **Input**: Figma URL + framework  
⚡ **Output**: 
- Comments linked to specific design elements
- AI-ready implementation instructions
- Contextual guidance for each UI component

**Example**:
```json
{
  "url": "https://figma.com/design/ABC123/My-Design?node-id=123-456",
  "framework": "react"
}
```

### **Step 4: `download_design_assets`**
🎯 **Purpose**: Auto-scan and download ALL export-ready assets + reference image  
📋 **Input**: Figma URL + local path  
⚡ **Output**: 
- All assets with Figma's configured export settings
- `reference.png` - visual context of entire selection
- Original node names as filenames

**Example**:
```json
{
  "url": "https://figma.com/design/ABC123/My-Design?node-id=123-456",
  "localPath": "./assets"
}
```

### **Step 5: `check_reference`**
🎯 **Purpose**: Analyze reference.png for design understanding and development guidance  
📋 **Input**: Assets folder path + framework  
⚡ **Output**: 
- Design analysis and component structure recommendations
- Framework-specific development guidance
- Layout and styling insights

**Example**:
```json
{
  "assetsPath": "./assets",
  "framework": "react"
}
```

## 🧪 Quick Test

1. **Restart your IDE** after adding the MCP configuration
2. **Test framework selection**:
   ```
   Call: show_frameworks()
   Expected: List of available frameworks
   ```
3. **Test design analysis**:
   ```
   Call: get_figma_data with any Figma URL
   Expected: Structured design data
   ```

## 🔧 Troubleshooting

### Common Issues

**❌ "Tool not found" or "MCP server not responding"**
- Restart your IDE completely
- Check that the API key is correctly set
- Verify internet connection

**❌ "Figma API key invalid"**
- Generate a new token at [Figma Settings](https://www.figma.com/settings)
- Make sure token starts with `figd_`
- Replace the placeholder in configuration

**❌ "Failed to create directory" (Windows)**
- This is automatically handled in v3.1.4+
- Use forward slashes in paths: `./assets` not `.\\assets`

**❌ "ES Module import error" (Windows)**
- Update to latest version: `npm install -g figma-mcp-pro@latest`
- This is fixed in v3.1.3+

### Debug Mode
Enable detailed logging by setting `"DEBUG": "true"` in the env configuration. This provides:
- API request/response details
- Path resolution information
- Step-by-step workflow progress

### Version Check
```bash
npx figma-mcp-pro@latest --version
```

## 🚀 What's Next?

1. **Follow the 5-step workflow** for any Figma design
2. **Use framework-specific optimizations** for better code generation
3. **Leverage comment analysis** for implementation guidance
4. **Download assets automatically** with proper export settings

For detailed examples and advanced usage, see the [main README](README.md).