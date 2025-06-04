#!/bin/bash

# Figma MCP Asset Recovery Script
# Use this if assets get stuck in the temporary workspace location

SOURCE_DIR="$HOME/figma-mcp-workspace/assets"
TARGET_DIR="./assets"

echo "🔍 Checking for assets in temporary workspace..."

if [ -d "$SOURCE_DIR" ]; then
    echo "📁 Found temporary workspace: $SOURCE_DIR"
    
    # Create target directory if it doesn't exist
    mkdir -p "$TARGET_DIR"
    
    # Count files to move
    FILE_COUNT=$(find "$SOURCE_DIR" -type f | wc -l)
    echo "📊 Found $FILE_COUNT files to recover"
    
    if [ $FILE_COUNT -gt 0 ]; then
        echo "🔄 Moving assets to project directory..."
        
        # Move all files from source to target
        find "$SOURCE_DIR" -type f -exec mv {} "$TARGET_DIR/" \;
        
        echo "✅ Asset recovery completed!"
        echo "📁 Assets are now in: $TARGET_DIR"
        
        # Clean up empty directories
        find "$SOURCE_DIR" -type d -empty -delete 2>/dev/null
        
        # List recovered files
        echo "📋 Recovered files:"
        ls -la "$TARGET_DIR"
    else
        echo "ℹ️  No files found to recover"
    fi
else
    echo "ℹ️  No temporary workspace found at: $SOURCE_DIR"
fi 