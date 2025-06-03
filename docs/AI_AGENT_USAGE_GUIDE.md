# Figma MCP Server - AI Agent Usage Guide

## Quick Start Workflow

### 1. When User Provides Figma URL
```
✅ ALWAYS use: analyze_figma_url
❌ NEVER use: get_figma_data for URLs
```

**Step 1:** Ask framework preference if not specified:
```
"What framework would you like me to optimize this for? (React, Vue, Angular, Svelte, or HTML)"
```

**Step 2:** Call analyze_figma_url with chosen framework:
```json
{
  "url": "https://www.figma.com/design/...",
  "framework": "react",
  "includeComments": true,
  "includeImages": true
}
```

### 2. Framework Conversion (Optional)
If user wants to change framework after initial analysis:
```json
{
  "tool": "optimize_for_framework",
  "fileKey": "extracted_from_previous_call",
  "framework": "vue"
}
```

### 3. Additional Image Downloads (Optional)
For specific nodes or different formats:
```json
{
  "tool": "download_figma_images",
  "fileKey": "file_key",
  "nodeIds": ["1530:168", "1530:171"],
  "localPath": "./assets",
  "format": "svg"
}
```

## Key Features You Get

### 🎯 **Smart Comment Positioning**
- Designer comments automatically placed on correct elements
- "Jumping animation on hover" → appears on the logo, not parent container
- Bottom-up coordinate matching for precision

### 🖼️ **Intelligent Image Detection**
- Logos/icons → `category: "icon"`, formats: `["svg", "png"]`
- Photos/images → `category: "image"`, formats: `["png", "jpg"]`
- Auto-detects exportable elements

### ⚡ **Framework Optimization**
- **React**: camelCase CSS properties (`backgroundColor`)
- **Vue/Angular/Svelte/HTML**: kebab-case properties (`background-color`)
- Framework-specific component suggestions

### 📊 **Clean Data Structure**
```json
{
  "data": {
    "id": "1530:168",
    "name": "SysIQ Commerce", 
    "type": "IMAGE",
    "bounds": { "x": -861, "y": 946, "width": 60, "height": 60 },
    "css": { "width": "60px", "height": "60px" },
    "image": { "category": "icon", "formats": ["svg", "png"] },
    "instructions": [
      { "type": "interaction", "instruction": "Jumping animation on hover" }
    ]
  }
}
```

## Best Practices

### ✅ DO
- Always ask for framework preference first
- Use `analyze_figma_url` for any Figma URL
- Include comments for implementation guidance
- Respect the specific node selection from URLs

### ❌ DON'T
- Use `get_figma_data` for URLs (it's legacy)
- Auto-download entire documents (max 50 nodes)
- Skip framework selection
- Ignore the comment instructions in responses

## Tool Descriptions

- **analyze_figma_url**: PRIMARY - Complete URL analysis with framework optimization
- **get_figma_data**: LEGACY - Direct API access only (manual parameters)
- **download_figma_images**: ADDITIONAL - Extra downloads beyond analyze_figma_url  
- **optimize_for_framework**: SECONDARY - Change framework after analysis

## Response Data Structure
- `data` → Optimized design structure for code generation
- `metadata` → Processing stats and framework info
- `instructions` → Designer comments mapped to specific elements
- `image` → Smart categorization with recommended export formats 