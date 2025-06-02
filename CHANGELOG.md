# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.3.4] - 2024-12-19

### Enhanced
- **Package Description**: Updated NPM package description to better reflect current capabilities
- **Keywords**: Added more relevant keywords for better discoverability (export-settings, image-download, design-tokens, code-generation, claude, context-processing)
- **Documentation**: Enhanced README with detailed export settings constraint handling documentation

### Verified
- **Export Settings Logic**: Confirmed correct handling of SCALE, WIDTH, and HEIGHT constraints
- **SVG Scale Limitation**: Verified proper handling of Figma's SVG 1x scale limitation
- **Filename Preservation**: Confirmed original node names are preserved (e.g., "EPAM Systems.svg")
- **Batch Processing**: Verified efficient API call grouping by format and scale

## [1.3.3] - 2024-12-19

### Fixed
- **CRITICAL**: Fixed MCP image download functionality that was not working properly
- **MAJOR**: Added direct node download capability without requiring export settings
- **MAJOR**: Fixed filename logic to use actual node names (e.g., "EPAM Systems.svg") instead of sanitized versions
- Resolved issue where download_figma_images tool reported success but didn't actually save files

### Added
- New `downloadImages` method for direct node downloads without export settings requirement
- Support for scale and format parameters in download_figma_images tool
- Proper filename preservation using original Figma node names

### Enhanced
- **Filename Logic**: Now uses actual node names as filenames, preserving original naming
- **Direct Downloads**: Can download any node as an image, not just those with export settings
- **Better Parameters**: Added scale (0.5x-4x) and format (jpg, png, svg, pdf) options
- **Improved Tool Description**: Updated to reflect actual functionality

### Changed
- download_figma_images tool now works for any node, not just those with export settings
- Tool description updated to clarify it uses original node names as filenames
- Default format changed to SVG for better scalability

## [1.3.2] - 2024-12-19

### Fixed
- **MAJOR**: Fixed image download functionality to properly respect Figma export settings
- Improved batch processing for downloads grouped by format and scale
- Enhanced filename generation with proper suffix handling and scale indicators
- Fixed TypeScript compilation errors in download implementation
- Resolved API batching issues that caused incorrect format/scale application

### Enhanced
- **Export Settings Respect**: Downloads now properly honor individual export settings per node
- **Batch Optimization**: Efficient grouping of downloads by format and scale for better API usage
- **Smart Naming**: Automatic filename generation with @2x scale suffixes when appropriate
- **Recursive Search**: Automatically finds export settings in child nodes
- **Better Error Handling**: Detailed error reporting for each download attempt with file sizes
- **Progress Logging**: Enhanced logging with download progress and file size information

### Changed
- Updated tool description to better reflect export settings functionality
- Improved README documentation for download_figma_images tool
- Enhanced error messages for better debugging

## [1.3.0] - 2024-06-02

### Added
- **MAJOR**: Proper export settings support - only downloads images marked for export in Figma
- **MAJOR**: Actual file downloads to local directory instead of just returning URLs
- **MAJOR**: Respects Figma export settings (format, scale, suffix) from the design file
- New `downloadImagesWithExportSettings` method in FigmaApiService
- Automatic directory creation for download paths
- Batch processing for efficient API usage

### Changed
- **BREAKING**: `download_figma_images` now requires nodes to have export settings configured in Figma
- **BREAKING**: Removed manual scale and format parameters - now uses Figma export settings
- **BREAKING**: Tool now actually downloads files instead of returning URLs
- Improved error handling and reporting for download operations
- Better filename generation based on node names and export suffixes

### Technical
- Added fs/promises for file system operations
- Enhanced batch processing with proper error handling
- Improved TypeScript type safety for export settings
- Added comprehensive logging for download operations

## [1.2.5] - 2024-06-02

### Fixed
- **CRITICAL**: Updated README.md with correct MCP configuration format
- Fixed Cursor and Claude Desktop installation instructions
- Removed duplicate API key configuration from documentation
- Updated INSTALL.md to use consistent server naming

### Documentation
- Corrected MCP configuration to use `npx -y figma-mcp-pro --stdio`
- Removed outdated node path references for Claude Desktop
- Updated troubleshooting section with correct version numbers

## [1.2.4] - 2024-06-02

### Fixed
- **CRITICAL**: Fixed bin script path resolution for npm package installation
- Improved executable wrapper script with proper __dirname resolution
- Fixed npx execution issues with relative path imports

### Technical
- Enhanced bin/figma-mcp-pro.js with fileURLToPath and proper path joining
- Resolved npm package structure for cross-platform compatibility

## [1.2.3] - 2024-06-02

### Fixed
- **CRITICAL**: Fixed ES module shebang syntax error that prevented npx execution
- Removed shebang from main ES module file to avoid Node.js import errors
- Created separate executable wrapper script in bin/ directory
- Fixed package.json bin configuration to use proper executable wrapper

### Technical
- Separated executable script from ES module to resolve import conflicts
- Updated package structure to include bin/ directory in published files
- Improved npm package executable handling

## [1.2.2] - 2024-06-02

### Fixed
- **CRITICAL**: Fixed MCP JSON protocol interference caused by console.log statements going to stdout
- **CRITICAL**: All logging now properly uses stderr to avoid corrupting MCP communication
- Added proper executable shebang for npm binary
- Improved error handling and logging strategy

### Technical
- Implemented separate log() and logError() methods using stderr
- Only MCP JSON responses now use stdout
- Debug logging only enabled when DEBUG environment variable is set
- Better separation of concerns for MCP protocol compliance

## [1.2.1] - 2024-06-02

### Fixed
- Enhanced error handling and debugging output for better troubleshooting
- Improved API error messages with more detailed information
- Better validation error reporting for invalid requests

### Improved
- Added comprehensive debug logging for request processing
- Enhanced error context for Figma API failures
- Better identification of authentication vs validation issues

## [1.2.0] - 2024-06-02

### Fixed
- **CRITICAL**: Fixed URL extraction for Figma node IDs with dash format (1459-57 → 1459:57)
- **CRITICAL**: Fixed selection handling to properly analyze specific Figma elements instead of entire documents
- Removed unused TypeScript imports to eliminate compilation warnings
- Fixed ES module compatibility issues in context processor

### Improved
- Enhanced URL parsing to handle all Figma URL formats correctly
- Better error handling and validation for node ID formats
- Improved selection detection logic with clear metadata indicators
- Added comprehensive test scripts for URL extraction and selection handling
- Optimized processing for specific node selections vs full document analysis

### Added
- Test scripts for validating URL extraction and selection functionality
- Better debugging output for selection vs full document processing
- Enhanced metadata in responses to clearly indicate selection type

### Technical
- Fixed TypeScript strict mode compliance
- Improved code organization and removed dead code
- Enhanced type safety throughout the codebase

## [1.1.1] - 2024-01-XX

### Fixed
- ES module import issues
- Build process improvements
- CLI execution fixes

## [1.0.0] - 2024-01-XX

### Added
- Initial release of Custom Figma MCP Server
- Enhanced context processing with AI optimization
- Custom rules engine for data transformation
- Framework-specific optimizations (React, Vue, Angular, Svelte, HTML)
- Semantic analysis for UI component detection
- CSS property generation from Figma properties
- Accessibility information enhancement
- Design token extraction
- Component variant detection
- Interaction state generation
- Comprehensive caching and rate limiting
- TypeScript support with full type definitions
- MCP tools for Figma data access and image download
- Extensive configuration options
- Performance monitoring and statistics
- CLI interface with environment variable support

### Features
- **get_figma_data**: Fetch and process Figma design data with AI optimization
- **download_figma_images**: Download images from Figma nodes
- **extract_url_info**: Parse Figma URLs for file keys and node IDs
- **get_server_stats**: Performance and usage statistics
- **clear_cache**: Cache management

### Technical
- Built with TypeScript and modern ES modules
- Comprehensive test suite with Jest
- ESLint and Prettier configuration
- Automated build and publishing pipeline
- Docker support (planned)
- Extensive documentation and examples

## [Unreleased]

### Planned
- Real-time Figma webhook integration
- Advanced machine learning for component detection
- Distributed caching support
- Plugin system for custom processors
- Web dashboard for monitoring and configuration
- Docker container distribution
- GitHub Actions CI/CD pipeline 