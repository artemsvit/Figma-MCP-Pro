# AI Behavior Guide

## 🤖 **How AI Should Use Figma MCP Tools**

This guide ensures the AI behaves correctly and doesn't automatically call unwanted tools.

## ✅ **Correct AI Behavior**

### **1. Framework Question When Unclear**
When user provides Figma URL without specifying framework:

```
User: "Analyze this design: [URL]"

✅ CORRECT AI Response:
"What framework would you like me to optimize this for? (React, Vue, Angular, Svelte, or HTML)"

❌ WRONG: Immediately calling analyze_figma_url with HTML default
```

### **2. Single Tool Calls (No Auto-Extras)**
When user requests one tool, only call that tool:

```
User: "Optimize this for React" 

✅ CORRECT AI: Calls optimize_for_framework only
❌ WRONG AI: Calls optimize_for_framework + download_figma_images automatically
```

### **3. Explicit Image Requests Only**
Only download images when explicitly requested:

```
User: "Analyze this for React: [URL]"
✅ CORRECT AI: Calls analyze_figma_url with includeImages=false

User: "Analyze this for React and download the images: [URL]"  
✅ CORRECT AI: Calls analyze_figma_url with includeImages=true

User: "Optimize for Vue and also download images"
✅ CORRECT AI: Calls optimize_for_framework + download_figma_images separately
```

## 🚫 **What AI Should NOT Do**

### **❌ Automatic "Helpful" Behavior**
- Don't automatically download images unless explicitly requested
- Don't call multiple tools when user asks for one
- Don't assume user wants all possible data

### **❌ Silent Defaults**  
- Don't silently default to HTML framework
- Don't skip asking for framework preference
- Don't assume image downloads are wanted

## 📝 **Tool Descriptions with AI Guidance**

### **`analyze_figma_url`**
- **When to use**: User provides Figma URL AND specifies framework
- **When to ask**: User provides URL but no framework → Ask for framework choice
- **Images**: Only set `includeImages=true` if user explicitly mentions images

### **`optimize_for_framework`** 
- **When to use**: User wants to change framework of existing data
- **What NOT to do**: Don't automatically call `download_figma_images` after this
- **Standalone**: This tool is complete by itself

### **`download_figma_images`**
- **When to use**: ONLY when user explicitly requests image downloads
- **Never**: Don't call automatically as "helpful extra"
- **Separate**: This is a separate action, not part of analysis

## 🎯 **Perfect AI Conversations**

### **Example 1: Framework Question**
```
User: "Analyze this Figma design: [URL]"

AI: "What framework would you like me to optimize this for? (React, Vue, Angular, Svelte, or HTML)"

User: "React please"

AI: [Calls analyze_figma_url with framework="react", includeImages=false]
```

### **Example 2: Clear Framework**
```
User: "Get this design for Vue development: [URL]"

AI: [Calls analyze_figma_url with framework="vue", includeImages=false]
```

### **Example 3: Framework + Images**
```
User: "Analyze this for React and download the icons: [URL]"

AI: [Calls analyze_figma_url with framework="react", includeImages=true]
```

### **Example 4: Framework Change Only**
```
User: "Convert this to Angular instead"

AI: [Calls optimize_for_framework with framework="angular"]
// NO automatic download_figma_images call!
```

### **Example 5: Manual Tool Call**
```
User: [Manually calls optimize_for_framework in MCP]

AI: [Processes the tool call, returns optimized data]
// NO automatic download_figma_images call!
```

## 🔧 **Technical Implementation**

The tool descriptions now include explicit AI guidance:

- **"ASK: What framework..."** - Forces AI to ask when unclear
- **"DO NOT automatically call download_figma_images"** - Prevents auto-behavior  
- **"ONLY call this tool when user EXPLICITLY requests"** - Clear boundaries
- **"only set true if user explicitly requests images"** - Parameter guidance

## 🎉 **Result: Perfect User Experience**

✅ **Predictable**: AI only does what user asks for
✅ **Clear**: AI asks for clarification when needed  
✅ **Efficient**: No unwanted extra tool calls
✅ **Controlled**: User decides what tools to use

**The broken auto-behavior is fixed! 🚀** 