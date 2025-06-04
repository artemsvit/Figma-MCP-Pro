#!/bin/bash

# Quick Test Runner for Figma MCP Pro
# Runs essential tests to verify core functionality

echo "🧪 Running Quick Tests for Figma MCP Pro..."
echo "============================================"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run from project root."
    exit 1
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Run type checking first
echo "🔍 Type checking..."
npm run type-check
if [ $? -ne 0 ]; then
    echo "❌ Type checking failed!"
    exit 1
fi

# Run linting
echo "🔧 Linting..."
npm run lint
if [ $? -ne 0 ]; then
    echo "⚠️  Linting issues found, but continuing with tests..."
fi

# Run the tests
echo "🧪 Running tests..."
npm test
if [ $? -ne 0 ]; then
    echo "❌ Tests failed!"
    exit 1
fi

# Build the project
echo "🏗️  Building project..."
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

echo ""
echo "✅ All quick tests passed!"
echo "🎉 Project is ready for use!"
echo ""
echo "Next steps:"
echo "  • Run 'npm start' to start the server"
echo "  • Check INSTALL.md for setup instructions"
echo "  • Use with your favorite AI IDE (Cursor, Windsurf, etc.)" 