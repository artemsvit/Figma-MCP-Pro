# Publishing Guide for Custom Figma MCP Server

This guide walks you through the complete process of publishing your Custom Figma MCP Server to NPM.

## 📋 Prerequisites

### 1. NPM Account
- Create an account at [npmjs.com](https://www.npmjs.com/)
- Verify your email address
- Enable two-factor authentication (recommended)

### 2. Development Environment
- Node.js 18.x or higher
- Git repository with clean working directory
- All tests passing
- TypeScript compilation successful

## 🚀 Step-by-Step Publishing Process

### 1. **Prepare Your Package**

#### Update Package Information
Edit `package.json` and update these fields:

```json
{
  "name": "@your-npm-username/custom-figma-mcp-server",
  "version": "1.0.0",
  "description": "Your custom description",
  "author": "Your Name <your.email@example.com>",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/your-username/your-repo-name.git"
  },
  "bugs": {
    "url": "https://github.com/your-username/your-repo-name/issues"
  },
  "homepage": "https://github.com/your-username/your-repo-name#readme"
}
```

**Important Notes:**
- Replace `@your-npm-username` with your actual NPM username
- For scoped packages (starting with @), you need to set `"publishConfig": {"access": "public"}` for free accounts
- Update all GitHub URLs to match your repository

#### Choose Package Name
You have two options:

**Option 1: Scoped Package (Recommended)**
```json
"name": "@your-username/custom-figma-mcp-server"
```
- Avoids naming conflicts
- Can use any name under your scope
- Requires `"publishConfig": {"access": "public"}` for free accounts

**Option 2: Unscoped Package**
```json
"name": "your-unique-package-name"
```
- Must be globally unique on NPM
- Check availability: `npm view your-package-name`

### 2. **Login to NPM**

```bash
npm login
```

Enter your NPM credentials when prompted. Verify login:

```bash
npm whoami
```

### 3. **Pre-Publication Checks**

#### Run All Quality Checks
```bash
# Install dependencies
npm ci

# Run tests
npm test

# Lint code
npm run lint

# Type check
npm run type-check

# Build the project
npm run build
```

#### Verify Build Output
Check that the `dist/` directory contains:
- `index.js` - Main entry point
- `index.d.ts` - TypeScript declarations
- Source maps and other generated files

#### Preview Package Contents
```bash
npm pack --dry-run
```

This shows exactly what files will be included in your package.

### 4. **Version Management**

#### Semantic Versioning
Follow [semver](https://semver.org/) guidelines:
- **1.0.0** - Initial release
- **1.0.1** - Patch (bug fixes)
- **1.1.0** - Minor (new features, backward compatible)
- **2.0.0** - Major (breaking changes)

#### Update Version
```bash
# Patch version (1.0.0 -> 1.0.1)
npm version patch

# Minor version (1.0.0 -> 1.1.0)
npm version minor

# Major version (1.0.0 -> 2.0.0)
npm version major

# Specific version
npm version 1.2.3
```

This automatically:
- Updates `package.json`
- Creates a git commit
- Creates a git tag

### 5. **Publish to NPM**

#### Option A: Using the Publishing Script (Recommended)
```bash
npm run publish:script
```

This runs our custom script that:
- Verifies NPM login
- Checks git status
- Runs all tests and builds
- Shows preview of files
- Prompts for confirmation
- Publishes to NPM

#### Option B: Manual Publishing
```bash
# Final build
npm run build

# Publish
npm publish
```

For scoped packages on free accounts:
```bash
npm publish --access public
```

### 6. **Post-Publication**

#### Verify Publication
```bash
# Check your package on NPM
npm view @your-username/custom-figma-mcp-server

# Test installation
npm install @your-username/custom-figma-mcp-server
```

#### Update Documentation
- Update README.md with installation instructions
- Update CHANGELOG.md with release notes
- Create GitHub release with tag

#### Push to Git
```bash
git push origin main --tags
```

## 🔧 Troubleshooting

### Common Issues

#### 1. **Package Name Already Exists**
```
npm ERR! 403 Forbidden - PUT https://registry.npmjs.org/package-name - package name too similar to existing package
```

**Solution:** Choose a different name or use a scoped package.

#### 2. **Authentication Failed**
```
npm ERR! 401 Unauthorized - PUT https://registry.npmjs.org/@scope/package
```

**Solutions:**
- Run `npm login` again
- Check if 2FA is enabled and provide OTP
- Verify NPM token if using CI/CD

#### 3. **Access Denied for Scoped Package**
```
npm ERR! 402 Payment Required - PUT https://registry.npmjs.org/@scope/package
```

**Solution:** Add `"publishConfig": {"access": "public"}` to package.json

#### 4. **Build Failures**
```
Error: error occurred in dts build
```

**Solutions:**
- Fix TypeScript errors
- Check tsconfig.json configuration
- Ensure all dependencies are properly typed

### Validation Commands

```bash
# Check package.json syntax
npm pkg fix

# Validate package
npm pack --dry-run

# Test installation locally
npm install -g .
custom-figma-mcp --help
npm uninstall -g @your-username/custom-figma-mcp-server
```

## 📦 Package Configuration Reference

### Essential package.json Fields

```json
{
  "name": "@your-username/custom-figma-mcp-server",
  "version": "1.0.0",
  "description": "Custom Figma MCP Server with enhanced AI context processing",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "type": "module",
  "bin": {
    "custom-figma-mcp": "dist/index.js"
  },
  "files": [
    "dist",
    "README.md",
    "LICENSE",
    "ARCHITECTURE.md"
  ],
  "scripts": {
    "prepublishOnly": "npm run clean && npm run build && npm test"
  },
  "keywords": [
    "figma",
    "mcp",
    "model-context-protocol",
    "ai",
    "cursor",
    "design",
    "typescript"
  ],
  "author": "Your Name <email@example.com>",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/your-username/repo-name.git"
  },
  "bugs": {
    "url": "https://github.com/your-username/repo-name/issues"
  },
  "homepage": "https://github.com/your-username/repo-name#readme",
  "publishConfig": {
    "access": "public"
  }
}
```

### .npmignore Configuration

```
# Source files
src/
*.ts
!dist/**/*.d.ts

# Development files
.env*
.vscode/
.idea/
*.log
coverage/

# Test files
**/*.test.*
**/*.spec.*
__tests__/
jest.config.js

# Build tools
tsconfig.json
tsup.config.ts
.eslintrc.json
.prettierrc

# Git and OS files
.git/
.gitignore
.DS_Store
Thumbs.db
```

## 🎯 Best Practices

### 1. **Version Strategy**
- Start with 1.0.0 for initial stable release
- Use pre-release versions for testing: 1.0.0-beta.1
- Follow semantic versioning strictly

### 2. **Documentation**
- Keep README.md comprehensive and up-to-date
- Include installation and usage examples
- Document breaking changes in CHANGELOG.md

### 3. **Testing**
- Ensure 100% test coverage for critical paths
- Test installation in clean environment
- Verify CLI functionality after installation

### 4. **Security**
- Never include sensitive data in package
- Use .npmignore to exclude development files
- Enable 2FA on NPM account

### 5. **Maintenance**
- Respond to issues promptly
- Keep dependencies updated
- Monitor package download stats and feedback

## 🔄 Continuous Integration

### GitHub Actions Example

Create `.github/workflows/publish.yml`:

```yaml
name: Publish to NPM

on:
  release:
    types: [published]

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          registry-url: 'https://registry.npmjs.org'
      
      - run: npm ci
      - run: npm test
      - run: npm run build
      - run: npm publish
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

## 📈 Post-Publication Checklist

- [ ] Package appears on npmjs.com
- [ ] Installation works: `npm install @your-username/custom-figma-mcp-server`
- [ ] CLI command works: `npx @your-username/custom-figma-mcp-server --help`
- [ ] Documentation is accurate
- [ ] GitHub release created
- [ ] Social media announcement (optional)
- [ ] Update project status to "published"

## 🆘 Getting Help

- **NPM Support:** [npm.community](https://npm.community/)
- **Documentation:** [docs.npmjs.com](https://docs.npmjs.com/)
- **Package Issues:** Create issue in your GitHub repository
- **General Questions:** Stack Overflow with `npm` tag

---

**Congratulations!** 🎉 Your Custom Figma MCP Server is now published and available for the community to use! 