#!/bin/bash

# Figma MCP Download Monitor
# Run this in a separate terminal while doing Figma downloads to track file movements

TEMP_WORKSPACE="$HOME/figma-mcp-workspace/assets"
PROJECT_ASSETS="./assets"

echo "🔍 Figma MCP Download Monitor Started"
echo "📁 Monitoring temp workspace: $TEMP_WORKSPACE"
echo "📁 Monitoring project assets: $PROJECT_ASSETS"
echo "🔄 Press Ctrl+C to stop monitoring"
echo "=========================="

# Create directories if they don't exist for monitoring
mkdir -p "$PROJECT_ASSETS"

while true; do
    clear
    echo "🔍 Figma MCP Download Monitor - $(date '+%H:%M:%S')"
    echo "=========================="
    
    # Check temp workspace
    if [ -d "$TEMP_WORKSPACE" ]; then
        TEMP_COUNT=$(find "$TEMP_WORKSPACE" -type f 2>/dev/null | wc -l)
        echo "📦 Temp Workspace: $TEMP_COUNT files"
        if [ $TEMP_COUNT -gt 0 ]; then
            echo "   Files in temp:"
            find "$TEMP_WORKSPACE" -type f -exec basename {} \; 2>/dev/null | head -10
        fi
    else
        echo "📦 Temp Workspace: Not found"
    fi
    
    echo ""
    
    # Check project assets
    if [ -d "$PROJECT_ASSETS" ]; then
        PROJECT_COUNT=$(find "$PROJECT_ASSETS" -type f 2>/dev/null | wc -l)
        echo "🎯 Project Assets: $PROJECT_COUNT files"
        if [ $PROJECT_COUNT -gt 0 ]; then
            echo "   Files in project:"
            find "$PROJECT_ASSETS" -type f -exec basename {} \; 2>/dev/null | head -10
        fi
    else
        echo "🎯 Project Assets: Directory not found"
    fi
    
    echo ""
    echo "=========================="
    echo "🔄 Refreshing in 2 seconds... (Ctrl+C to stop)"
    
    sleep 2
done 