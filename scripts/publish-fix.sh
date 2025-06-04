#!/bin/bash

# Quick publish script for fixes - no tests, no dependency install
# Usage: ./scripts/publish-fix.sh

set -e

echo "🚀 Quick Fix Publish Script"
echo "=========================="

# Clean previous builds first
echo "🧹 Cleaning previous builds..."
npm run clean

# Get current version from package.json
CURRENT_VERSION=$(node -p "require('./package.json').version")
echo "📦 Current version: $CURRENT_VERSION"

# Split version into parts (e.g., "3.2.9" -> "3" "2" "9")
IFS='.' read -ra VERSION_PARTS <<< "$CURRENT_VERSION"
MAJOR=${VERSION_PARTS[0]}
MINOR=${VERSION_PARTS[1]}
PATCH=${VERSION_PARTS[2]}

# Increment MINOR version and reset patch to 0
NEW_MINOR=$((MINOR + 1))
NEW_PATCH=0
NEW_VERSION="$MAJOR.$NEW_MINOR.$NEW_PATCH"

echo "⬆️  Incrementing minor version to: $NEW_VERSION"

# Update package.json version
sed -i '' "s/\"version\": \"$CURRENT_VERSION\"/\"version\": \"$NEW_VERSION\"/" package.json

# Update CHANGELOG.md - replace the first occurrence of current version with new version
# and update the date to today
TODAY=$(date +"%Y-%m-%d")
sed -i '' "s/## \[$CURRENT_VERSION\] - [0-9-]*/## [$NEW_VERSION] - $TODAY/" CHANGELOG.md

echo "📝 Updated package.json and CHANGELOG.md"

# Build fresh (clean was already done above)
echo "🔨 Building fresh..."
npm run build

# Get actual package name from package.json for accurate messaging
PACKAGE_NAME=$(node -p "require('./package.json').name")

echo "📤 Publishing to npm..."
if npm publish; then
    echo "✅ Successfully published $PACKAGE_NAME@$NEW_VERSION"
    echo "🎉 Users can update with: npm install -g $PACKAGE_NAME@latest"
else
    echo "❌ Publish failed! Check npm permissions and package name availability."
    echo "💡 You may need to:"
    echo "   - Change package name in package.json (due to conflicts)"
    echo "   - Use scoped package: @artsvit/figma-mcp-server"
    echo "   - Or npm login with correct account"
    exit 1
fi 