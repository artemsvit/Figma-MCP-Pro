# IDE Workflow Guide

## Overview

Perfect workflow for IDE users (Windsurf, Cursor, etc.) who paste Figma URLs and want framework-specific optimization.

## 🚀 **New Improved Workflow**

### **Step 1: Paste Figma URL + Choose Framework**
User: "Analyze this Figma design for React: https://www.figma.com/design/ZVnXdidh7cqIeJuI8e4c6g/CV-Artem-Svitelskyi?node-id=1530-166"

**AI automatically calls:**
```json
{
  "url": "https://www.figma.com/design/ZVnXdidh7cqIeJuI8e4c6g/CV-Artem-Svitelskyi?node-id=1530-166",
  "framework": "react",
  "includeComments": true,
  "includeImages": false
}
```

**Result**: Clean React-optimized design data (camelCase CSS, JSX structure)

### **Step 2: Optional Framework Change**
User: "Convert this to Vue instead"

**AI calls:**
```json
{
  "fileKey": "ZVnXdidh7cqIeJuI8e4c6g",
  "nodeId": "1530-166",
  "framework": "vue"
}
```

**Result**: Same design data but Vue-optimized!

## 💬 **Natural Conversation Examples**

### **Specify Framework Upfront:**
```
User: "Analyze this Figma design for React: [URL]"
AI: [Calls analyze_figma_url with "react"]

User: "Get this design for Vue: [URL]"  
AI: [Calls analyze_figma_url with "vue"]

User: "Analyze this for Angular development: [URL]"
AI: [Calls analyze_figma_url with "angular"]
```

### **Default to HTML if No Framework Mentioned:**
```
User: "Analyze this design: [URL]"
AI: [Calls analyze_figma_url with "html" default]

User: "Make this React-ready"
AI: [Calls optimize_for_framework with "react"]
```

### **Ask for Framework if Unclear:**
```
User: "Get this design data: [URL]"
AI: "What framework would you like me to optimize this for? (React, Vue, Angular, Svelte, or HTML)"

User: "React please"
AI: [Calls analyze_figma_url with "react"]
```

## ⚡ **Why This Is Better**

### **❌ Old Broken Flow:**
1. User pastes URL
2. AI immediately calls `get_figma_data` with HTML default
3. AI also calls `download_figma_images` automatically
4. User then has to say "make this React"
5. AI calls `optimize_for_framework` (double work!)

### **✅ New Fixed Flow:**
1. User specifies framework preference upfront
2. AI calls `analyze_figma_url` with chosen framework
3. Get perfectly optimized data in one step
4. Optional: framework switching if needed

## 🛠 **Available Tools**

### **`analyze_figma_url`** (NEW - Primary)
- Takes full Figma URL + framework preference
- Parses URL automatically (fileKey, nodeId)
- One-step analysis with framework optimization
- AI calls this when user provides URLs

### **`get_figma_data`** (Low-level)
- Direct API access with manual parameters
- For advanced use cases
- Usually called internally by analyze_figma_url

### **`optimize_for_framework`** (Follow-up)
- Re-optimizes existing data for different framework
- Fast framework switching without re-fetching
- For changing frameworks after initial analysis

### **`download_figma_images`** (Assets)
- Downloads exportable images/icons
- Separate tool for asset management
- Only called when specifically requested

## 📋 **Complete Example Conversation**

```
User: "Analyze this Figma component for React: https://www.figma.com/design/..."

AI: "I'll analyze that Figma design and optimize it for React development."
[Calls analyze_figma_url with framework="react"]

"Here's your React-optimized design structure:
- 1 main container with flexbox layout
- CSS properties in camelCase (backgroundColor, fontSize)
- JSX-friendly component hierarchy  
- 3 text elements with Inter font family
- 1 button component with hover states
- 1 icon element (exportable as SVG)
- 1 design comment: 'Jumping animation on hover'"

User: "Perfect! How would this look in Vue?"

AI: "I'll convert this to Vue.js optimization..."
[Calls optimize_for_framework with "vue"]

"Vue version ready:
- CSS properties now use kebab-case (background-color, font-size)  
- Template-compatible structure
- Vue-specific component patterns
- Same design data, Vue-optimized!"
```

## 🎯 **Framework Detection Keywords**

The AI automatically detects framework preference from natural language:

- **React**: "for React", "React component", "JSX", "React development"
- **Vue**: "for Vue", "Vue.js", "Vue component", "Vue development"  
- **Angular**: "for Angular", "Angular component", "Angular development"
- **Svelte**: "for Svelte", "Svelte component", "Svelte development"
- **HTML**: "HTML", "vanilla", "plain HTML", or no framework specified

## 🎉 **Result: Perfect IDE Experience**

✅ **Framework-first**: Choose framework before data fetching
✅ **One-step analysis**: URL + framework → optimized data
✅ **Natural language**: "Analyze this for React: [URL]"
✅ **Fast switching**: Change frameworks after analysis
✅ **No double work**: Direct optimization, no redundant calls
✅ **Smart defaults**: HTML fallback if no framework specified

**The broken workflow is fixed! 🚀** 