#!/bin/bash

# NPM Publishing Script for Custom Figma MCP Server

set -e

echo "🚀 Preparing to publish Custom Figma MCP Server to NPM..."

# Check if we're logged in to npm
if ! npm whoami > /dev/null 2>&1; then
    echo "❌ You are not logged in to NPM. Please run 'npm login' first."
    exit 1
fi

echo "✅ NPM login verified"

# Check if git working directory is clean
if [ -n "$(git status --porcelain)" ]; then
    echo "❌ Git working directory is not clean. Please commit or stash your changes."
    exit 1
fi

echo "✅ Git working directory is clean"

# Install dependencies
echo "📦 Installing dependencies..."
npm ci

# Run tests
echo "🧪 Running tests..."
npm test

# Lint code
echo "🔍 Linting code..."
npm run lint

# Type check
echo "📝 Type checking..."
npm run type-check

# Build the project
echo "🔨 Building project..."
npm run build

# Check if dist directory exists
if [ ! -d "dist" ]; then
    echo "❌ Build failed - dist directory not found"
    exit 1
fi

echo "✅ Build successful"

# Show what will be published
echo "📋 Files that will be published:"
npm pack --dry-run

# Confirm publication
echo ""
read -p "🤔 Do you want to publish to NPM? (y/N): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "📤 Publishing to NPM..."
    npm publish
    
    echo ""
    echo "🎉 Successfully published to NPM!"
    echo "📦 Package: $(npm pkg get name | tr -d '"')"
    echo "🏷️  Version: $(npm pkg get version | tr -d '"')"
    echo ""
    echo "📖 Installation command:"
    echo "npm install $(npm pkg get name | tr -d '"')"
    echo ""
else
    echo "❌ Publication cancelled"
    exit 1
fi 