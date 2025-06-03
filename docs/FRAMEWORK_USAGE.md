# Framework Usage Guide

## Overview

The MCP server generates **framework-optimized** CSS and component structure. You specify the target framework as a parameter when calling the tool.

## 🎯 **How to Specify Framework**

### **Default Behavior:**
```json
{
  "fileKey": "ZVnXdidh7cqIeJuI8e4c6g",
  "nodeId": "1530-166"
}
```
**Result**: `framework: "html"` (default)

### **Specify Framework:**
```json
{
  "fileKey": "ZVnXdidh7cqIeJuI8e4c6g", 
  "nodeId": "1530-166",
  "framework": "react"
}
```
**Result**: `framework: "react"` (optimized for React)

## 🚀 **Supported Frameworks**

| Framework | Value | CSS Output | Component Style |
|-----------|-------|------------|-----------------|
| **HTML** | `"html"` | Standard CSS | Generic HTML elements |
| **React** | `"react"` | CSS-in-JS friendly | JSX components |
| **Vue** | `"vue"` | Scoped CSS | Vue SFC components |
| **Angular** | `"angular"` | Angular CSS | Angular components |
| **Svelte** | `"svelte"` | Svelte CSS | Svelte components |

## 📋 **Usage Examples**

### **React Development:**
```json
{
  "fileKey": "YOUR_FILE_KEY",
  "nodeId": "YOUR_NODE_ID", 
  "framework": "react",
  "includeComments": true
}
```

### **Vue Development:**
```json
{
  "fileKey": "YOUR_FILE_KEY",
  "nodeId": "YOUR_NODE_ID",
  "framework": "vue",
  "includeComments": true
}
```

### **Full Document (any framework):**
```json
{
  "fileKey": "YOUR_FILE_KEY",
  "framework": "angular"
}
```

## 🔍 **What Changes Per Framework?**

### **CSS Generation:**
- **HTML**: Standard CSS properties
- **React**: camelCase properties (`backgroundColor` vs `background-color`)
- **Vue**: Scoped CSS with proper selectors
- **Angular**: Component-scoped styling
- **Svelte**: Svelte-specific CSS patterns

### **Component Structure:**
- **HTML**: Generic `<div>`, `<span>`, `<button>`
- **React**: JSX-friendly component hierarchy  
- **Vue**: Template-compatible structure
- **Angular**: Angular component patterns
- **Svelte**: Svelte component structure

### **Semantic Roles:**
- Framework-specific component recommendations
- Accessibility patterns per framework
- Event handling patterns

## 💡 **Pro Tips**

### **For AI Code Generation:**
1. **Always specify framework** for your target technology
2. **Use comments** (`includeComments: true`) for design instructions
3. **Framework affects CSS format** - React uses camelCase, others use kebab-case

### **Quick Reference:**
```bash
# React developers
"framework": "react"

# Vue developers  
"framework": "vue"

# Angular developers
"framework": "angular"

# Svelte developers
"framework": "svelte"

# Plain HTML/CSS
"framework": "html"  # or omit (default)
```

## 📊 **New Clean Metadata**

With framework specified, you get clean metadata:

```json
{
  "data": { /* your optimized design data */ },
  "metadata": {
    "framework": "react",
    "source": "selection", 
    "processed": 7,
    "comments": 1
  }
}
```

**Clean and focused on what developers need!** 🎯 