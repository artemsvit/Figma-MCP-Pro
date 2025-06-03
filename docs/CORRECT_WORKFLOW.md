# Correct MCP Workflow

## 🎯 **The CORRECT Workflow (What Should Happen)**

### **Step 1: User Provides Figma URL**
```
User: "Analyze this Figma design: https://www.figma.com/design/ZVn..."
User: "Get this design for React: https://www.figma.com/design/ZVn..."
User: "Check this component: https://www.figma.com/design/ZVn..."
```

### **Step 2: AI Framework Detection**

**If framework mentioned:**
```
User: "Analyze this for React: [URL]"
AI: [Immediately calls analyze_figma_url with framework="react"]
```

**If NO framework mentioned:**
```
User: "Analyze this design: [URL]"
AI: "What framework would you like me to optimize this for? (React, Vue, Angular, Svelte, or HTML)"
User: "React please"
AI: [Calls analyze_figma_url with framework="react"]
```

### **Step 3: Single Integrated Tool Call**
```
✅ CORRECT: analyze_figma_url (includes image downloads)
❌ WRONG: get_figma_data + download_figma_images (separate calls)
```

### **Step 4: Return Optimized Data + Downloaded Images**
- Framework-specific CSS (camelCase for React, kebab-case for others)
- Comments mapped to specific elements
- Clean, AI-optimized structure
- **Automatically downloaded images/icons** from the design

## 🚫 **The BROKEN Workflow (What's Currently Happening)**

### **❌ WRONG Steps:**
1. User pastes Figma URL
2. **AI doesn't ask about framework** ❌
3. **AI calls `get_figma_data` directly** ❌  
4. **AI calls `download_figma_images` separately** ❌
5. User gets generic HTML + separate downloads

### **❌ Why This Is Wrong:**
- No framework selection upfront
- Using legacy `get_figma_data` instead of `analyze_figma_url`
- Separate tool calls instead of integrated workflow
- Generic HTML output instead of framework-specific

## ✅ **Tool Usage Rules**

### **🎯 `analyze_figma_url` (PRIMARY)**
**WHEN TO USE:**
- User provides any Figma URL
- User wants design analysis
- First-time analysis

**HOW TO USE:**
1. Detect framework from user message
2. If no framework → Ask user
3. Call with URL + framework

### **⚠️ `get_figma_data` (LEGACY)**
**WHEN TO USE:**
- Direct API access with manual fileKey/nodeId
- Advanced use cases only
- NOT for URL analysis

**DO NOT USE:**
- When user provides URLs (use analyze_figma_url)
- For normal design analysis

### **🔄 `optimize_for_framework` (SECONDARY)**
**WHEN TO USE:**
- User wants to change framework AFTER initial analysis
- "Convert this to React" after getting HTML data

**DO NOT USE:**
- For initial URL analysis
- When user provides URLs first time

### **📁 `download_figma_images` (ADDITIONAL DOWNLOADS)**
**WHEN TO USE:**
- User wants specific additional nodes downloaded
- User wants different formats (PNG instead of SVG)
- User wants different scales or resolutions
- Additional downloads beyond what analyze_figma_url provides

**NOTE:**
- analyze_figma_url already downloads images automatically
- This tool is for extra/specific downloads only

## 📝 **Example Conversations**

### **✅ CORRECT Behavior:**

```
User: "Analyze this Figma design: [URL]"

AI: "What framework would you like me to optimize this for? (React, Vue, Angular, Svelte, or HTML)"

User: "React"

AI: [Calls analyze_figma_url with framework="react"]
"Here's your React-optimized design with camelCase CSS properties and downloaded images..."
```

### **❌ WRONG Behavior (Current):**

```
User: "Analyze this Figma design: [URL]"

AI: [Calls get_figma_data immediately without asking framework]
    [Automatically calls download_figma_images]
"Here's the design data and I've downloaded the images too!"

User: "I didn't want the images..."
```

## 🔧 **How to Fix**

The tool descriptions now have **strong guidance**:

- **🎯 analyze_figma_url**: "PRIMARY TOOL - ALWAYS use this when user provides a Figma URL!"
- **⚠️ get_figma_data**: "LEGACY TOOL - Use analyze_figma_url instead when user provides Figma URLs!"
- **🚫 download_figma_images**: "MANUAL TOOL ONLY - Never call automatically!"

## 🎉 **Expected Result**

**User Experience:**
1. Paste Figma URL
2. Choose framework when asked
3. Get perfectly optimized design data
4. **Automatic image downloads included**
5. Framework-specific output

**AI Behavior:**
1. Detect Figma URL
2. Ask for framework preference
3. Call analyze_figma_url once (includes image downloads)
4. Return clean, optimized data + downloaded images
5. Complete workflow in single tool call

**Perfect workflow with no surprises! 🚀** 