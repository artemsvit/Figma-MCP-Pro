# Version Management

## Overview

This project uses a centralized version management system where **`package.json` is the single source of truth** for the version number.

## How It Works

1. **Single Source of Truth**: The version is defined only in `package.json`
2. **Automatic Reading**: `src/version.ts` reads the version from `package.json` at runtime
3. **Consistent Usage**: All parts of the application import and use this centralized version

## Files Involved

- `package.json` - The single source of truth for version
- `src/version.ts` - Utility that reads version from package.json
- `src/index.ts` - Uses imported VERSION for both MCP server and CLI

## Usage

```typescript
import { VERSION } from './version.js';

console.log(`Current version: ${VERSION}`);
```

## Benefits

✅ **Single Update Point**: Change version only in `package.json`
✅ **No Sync Issues**: All components always use the same version
✅ **Automatic**: No manual updates needed in source code
✅ **Build Integration**: Works with `npm version` commands

## Updating the Version

Just use npm's built-in version commands:

```bash
# Patch version (1.5.0 → 1.5.1)
npm version patch

# Minor version (1.5.0 → 1.6.0)
npm version minor

# Major version (1.5.0 → 2.0.0)
npm version major
```

The version will automatically be reflected everywhere in the codebase!

## Previous Issues Solved

- ❌ **Before**: Version scattered across multiple files
- ❌ **Before**: Manual updates required in `src/index.ts` (server and CLI)
- ❌ **Before**: Versions getting out of sync
- ✅ **Now**: Single source of truth with automatic propagation 