#!/bin/bash

# Custom Figma MCP Server Installation Script

echo "🚀 Setting up Custom Figma MCP Server..."

# Check Node.js version
echo "📋 Checking Node.js version..."
node_version=$(node -v 2>/dev/null)
if [ $? -ne 0 ]; then
    echo "❌ Node.js is not installed. Please install Node.js 18.x or higher."
    exit 1
fi

echo "✅ Node.js version: $node_version"

# Install dependencies
echo "📦 Installing dependencies..."
npm install --no-optional

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cp env.example .env
    echo "⚠️  Please edit .env file and add your Figma API key"
fi

# Build the project (skip for now due to TypeScript errors)
echo "🔨 Building project..."
echo "⚠️  Skipping build due to TypeScript configuration issues"
echo "   You can fix the TypeScript errors and run 'npm run build' manually"

echo ""
echo "✅ Installation completed!"
echo ""
echo "📋 Next steps:"
echo "1. Edit the .env file and add your Figma API key"
echo "2. Fix TypeScript compilation errors in the source files"
echo "3. Run 'npm run build' to build the project"
echo "4. Configure your MCP client (Cursor, Claude Desktop, etc.)"
echo ""
echo "📖 For detailed setup instructions, see README.md"
echo ""
echo "🔧 Development commands:"
echo "  npm run dev     - Development with auto-rebuild"
echo "  npm run build   - Build for production"
echo "  npm run test    - Run tests"
echo "  npm run lint    - Lint code"
echo "" 