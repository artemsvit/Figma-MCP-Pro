#!/bin/bash

# Quick publish script for fixes - no tests, no dependency install
# Usage: ./scripts/publish-fix.sh

set -e

echo "🚀 Quick Fix Publish Script"
echo "=========================="

# Get current version from package.json
CURRENT_VERSION=$(node -p "require('./package.json').version")
echo "📦 Current version: $CURRENT_VERSION"

# Split version into parts (e.g., "3.2.9" -> "3" "2" "9")
IFS='.' read -ra VERSION_PARTS <<< "$CURRENT_VERSION"
MAJOR=${VERSION_PARTS[0]}
MINOR=${VERSION_PARTS[1]}
PATCH=${VERSION_PARTS[2]}

# Increment patch version
NEW_PATCH=$((PATCH + 1))
NEW_VERSION="$MAJOR.$MINOR.$NEW_PATCH"

echo "⬆️  Incrementing to: $NEW_VERSION"

# Update package.json version
sed -i '' "s/\"version\": \"$CURRENT_VERSION\"/\"version\": \"$NEW_VERSION\"/" package.json

# Update CHANGELOG.md - replace the first occurrence of current version with new version
# and update the date to today
TODAY=$(date +"%Y-%m-%d")
sed -i '' "s/## \[$CURRENT_VERSION\] - [0-9-]*/## [$NEW_VERSION] - $TODAY/" CHANGELOG.md

echo "📝 Updated package.json and CHANGELOG.md"

# Build and publish (skip tests and dependency checks)
echo "🔨 Building..."
npm run build

echo "📤 Publishing to npm..."
npm publish

echo "✅ Successfully published figma-mcp-pro@$NEW_VERSION"
echo "🎉 Users can update with: npm install -g figma-mcp-pro@latest" 