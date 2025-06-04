# Testing Guide

This document describes the testing setup and how to run tests for the Figma MCP Pro server.

## Test Structure

The project includes comprehensive tests covering:

### 🧪 Test Suites

1. **Framework Configuration Tests** (`src/__tests__/framework.test.ts`)
   - Validates all 10 supported frameworks
   - Tests framework rule loading
   - Verifies AI optimization settings
   - Checks framework-specific configurations

2. **URL Parsing Tests** (`src/__tests__/url-parsing.test.ts`)
   - Tests Figma URL parsing functionality
   - Validates file key extraction
   - Tests node ID parsing and conversion
   - Handles edge cases and invalid URLs

3. **Utility Function Tests** (`src/__tests__/utils.test.ts`)
   - String manipulation utilities (PascalCase, camelCase, kebab-case)
   - Array utilities (chunking, deduplication)
   - Object utilities (deep cloning, property omission)
   - Validation utilities (URLs, emails, hex colors)

4. **Configuration Tests** (`src/__tests__/config.test.ts`)
   - Tests configuration rule structures
   - Validates AI optimization settings
   - Checks framework optimization configurations
   - Ensures type safety

5. **Server Functionality Tests** (`src/__tests__/server.test.ts`)
   - Environment variable validation
   - Tool definition verification
   - Framework support validation
   - Error handling tests
   - Configuration validation

## Running Tests

### Quick Test (Recommended)
```bash
npm run test:quick
```
This runs the complete test suite including:
- Type checking
- Linting (with warnings)
- All unit tests
- Project build verification

### Individual Test Commands

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Type checking only
npm run type-check

# Linting only
npm run lint
```

### Test Environment

Tests run with the following environment configuration:
- `NODE_ENV=test`
- Mock Figma API key
- Cache and rate limiting settings
- 10-second timeout for long-running tests

## Test Coverage

The test suite covers:

✅ **Framework Support**: All 10 frameworks (React, Vue, Angular, Svelte, HTML, SwiftUI, UIKit, Electron, Tauri, NW.js)  
✅ **URL Parsing**: Figma URL extraction and validation  
✅ **Configuration**: Rule validation and type safety  
✅ **Utilities**: Common helper functions  
✅ **Environment**: Server configuration and setup  

## Test Results

When all tests pass, you should see:
```
Test Suites: 5 passed, 5 total
Tests:       51 passed, 51 total
Snapshots:   0 total
Time:        ~6s
```

## Continuous Integration

The test suite is designed to:
- Run quickly (under 10 seconds)
- Validate core functionality without external dependencies
- Ensure type safety and configuration correctness
- Verify framework support and URL parsing

## Adding New Tests

When adding new functionality:

1. Create test files in `src/__tests__/`
2. Follow the naming convention: `*.test.ts`
3. Use descriptive test names and group related tests
4. Mock external dependencies
5. Test both success and error cases

## Troubleshooting

### Common Issues

**ESLint Configuration Error**: The linting step may show warnings about missing ESLint configs, but tests will continue to run.

**Import Errors**: Ensure all imports use the `.js` extension for ES modules compatibility.

**Timeout Issues**: Tests have a 10-second timeout. Long-running tests should be mocked or optimized.

### Test Debugging

```bash
# Run specific test file
npx jest src/__tests__/framework.test.ts

# Run tests with verbose output
npx jest --verbose

# Run tests with debugging
npx jest --detectOpenHandles
```

## Performance

The test suite is optimized for speed:
- No external API calls
- Minimal file system operations
- Efficient mocking strategies
- Parallel test execution where possible

Total test execution time: **~6 seconds** 