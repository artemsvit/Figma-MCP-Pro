# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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