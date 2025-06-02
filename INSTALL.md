# Figma MCP Pro - Installation Guide

## Quick Setup for Cursor

1. **Get your Figma API Key**:
   - Go to [Figma Account Settings](https://www.figma.com/settings)
   - Generate a Personal Access Token
   - Copy the token (starts with `figd_`)

2. **Add to Cursor MCP Configuration**:
   
   Open your Cursor MCP settings and add:

   ```json
   {
     "mcpServers": {
       "figma-mcp-pro": {
         "command": "npx",
         "args": [
           "-y",
           "figma-mcp-pro",
           "--stdio"
         ],
         "env": {
           "FIGMA_API_KEY": "your_figma_api_key_here"
         }
       }
     }
   }
   ```

3. **Replace the API Key**:
   - Replace `"your_figma_api_key_here"` with your actual Figma API key

4. **Restart Cursor**:
   - Restart Cursor to load the new MCP server

5. **Test the Installation**:
   - Try using the `extract_url_info` tool with a Figma URL
   - Use `get_figma_data` to analyze Figma designs

## Available Tools

- `get_figma_data` - Analyze Figma designs with AI optimization
- `download_figma_images` - Download images from Figma
- `extract_url_info` - Parse Figma URLs for file keys and node IDs
- `get_server_stats` - View server performance statistics
- `clear_cache` - Clear the API cache

## Example Usage

1. **Extract info from a Figma URL**:
   ```
   Use extract_url_info with: https://www.figma.com/design/ABC123/My-Design?node-id=123-456
   ```

2. **Analyze a specific selection**:
   ```
   Use get_figma_data with the extracted fileKey and nodeId
   ```

## Troubleshooting

- **"Tool not found"**: Restart Cursor after adding the MCP configuration
- **"API key invalid"**: Check your Figma API key is correct and active
- **"JSON parsing error"**: Make sure you're using version 1.2.4 or later

For more details, see the [full README](README.md). 