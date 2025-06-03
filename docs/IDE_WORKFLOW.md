# IDE Workflow Guide

## Overview

Perfect workflow for IDE users (Windsurf, Cursor, etc.) who paste Figma URLs and want framework-specific optimization.

## 🚀 **Two-Step Workflow**

### **Step 1: Paste Figma URL** (AI handles automatically)
User: "Analyze this Figma design: https://www.figma.com/design/ZVnXdidh7cqIeJuI8e4c6g/CV-Artem-Svitelskyi?node-id=1530-166"

**AI automatically calls:**
```json
{
  "fileKey": "ZVnXdidh7cqIeJuI8e4c6g",
  "nodeId": "1530-166", 
  "framework": "html",  // Default
  "includeComments": true
}
```

**Result**: Clean design data with HTML-optimized CSS

### **Step 2: Specify Framework** (User choice)
User: "Convert this to React components"

**AI calls:**
```json
{
  "fileKey": "ZVnXdidh7cqIeJuI8e4c6g",
  "nodeId": "1530-166",
  "framework": "react"
}
```

**Result**: Same design data but optimized for React!

## 💬 **Natural Conversation Examples**

### **React Development:**
```
User: "Analyze this Figma design: [URL]"
AI: [Calls get_figma_data with HTML default]

User: "Make this React-ready"
AI: [Calls optimize_for_framework with "react"]
```

### **Vue Development:**
```
User: "Get this design data: [URL]"
AI: [Gets HTML-optimized data]

User: "I need this for Vue.js"
AI: [Re-optimizes for Vue with camelCase CSS -> kebab-case]
```

### **Compare Frameworks:**
```
User: "Show me this design: [URL]"
AI: [Gets HTML version]

User: "How would this look in Angular?"
AI: [Re-optimizes for Angular]

User: "What about React?"
AI: [Re-optimizes for React]
```

## 🎯 **What Changes Between Frameworks**

### **CSS Properties:**

#### **HTML/Vue/Angular/Svelte:**
```json
{
  "css": {
    "background-color": "rgb(255, 255, 255)",
    "font-size": "18px",
    "flex-direction": "column"
  }
}
```

#### **React:**
```json
{
  "css": {
    "backgroundColor": "rgb(255, 255, 255)", 
    "fontSize": "18px",
    "flexDirection": "column"
  }
}
```

### **Component Structure:**
- **HTML**: Generic `<div>`, `<button>` elements
- **React**: JSX-optimized component hierarchy
- **Vue**: Template-compatible structure  
- **Angular**: Component-scoped patterns
- **Svelte**: Svelte-specific optimizations

## ⚡ **Performance Benefits**

### **Smart Caching:**
- First call fetches and processes Figma data
- Framework optimization reuses cached data
- No redundant API calls to Figma

### **Fast Framework Switching:**
- Switch between React/Vue/Angular instantly
- Compare framework outputs quickly
- No need to re-paste URLs

## 🛠 **Available Tools**

### **`get_figma_data`** (Primary)
- Fetches design from Figma
- Defaults to HTML optimization
- AI calls this automatically when user pastes URL

### **`optimize_for_framework`** (Follow-up)
- Re-optimizes existing data for specific framework
- AI calls this when user specifies framework preference
- Fast framework switching

### **`download_figma_images`** (Assets)
- Downloads exportable images/icons
- Uses detected image info from data structure
- Separate tool for asset management

## 📋 **Complete Example Conversation**

```
User: "Analyze this Figma component: https://www.figma.com/design/..."

AI: "I'll analyze that Figma design for you."
[Calls get_figma_data automatically]

"Here's the design structure with HTML-optimized CSS. I found:
- 1 main container with flexbox layout
- 3 text elements with Inter font family  
- 1 button component with hover states
- 1 icon element (exportable as SVG)
- 1 design comment: 'Jumping animation on hover'"

User: "Perfect! Can you make this React-ready?"

AI: "I'll optimize this for React components with JSX-friendly CSS."
[Calls optimize_for_framework with "react"]

"Here's the React-optimized version:
- CSS properties now use camelCase (backgroundColor, fontSize)
- Component structure optimized for JSX
- Hover states ready for React event handlers
- Same design data, React-optimized!"

User: "How about Vue?"

AI: "Converting to Vue.js optimization..."
[Calls optimize_for_framework with "vue"]

"Vue version ready:
- Scoped CSS with kebab-case properties
- Template-compatible structure
- Vue-specific component patterns"
```

## 🎉 **Result: Perfect IDE Experience**

✅ **Natural**: Paste URL, get data, specify framework in chat
✅ **Fast**: Cached data, quick framework switching
✅ **Flexible**: Compare multiple frameworks easily  
✅ **Clean**: No manual JSON parameter editing
✅ **Smart**: AI automatically chooses the right tool

**Perfect for developers using AI assistants in their IDE!** 🚀 