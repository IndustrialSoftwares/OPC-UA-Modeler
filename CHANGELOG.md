# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-01-31

First major release of OPC UA Modeler - a production-ready web-based tool for viewing and analyzing OPC UA nodeset XML files (viewer only option).

### Added
- Theme toggle functionality with light/dark mode support
- Enhanced NodeGrid component with hierarchical display capabilities
- Advanced column features for grid view including sorting and filtering
- Professional application header with logo and control buttons
- Comprehensive documentation for open-source release
- Production-ready packaging and distribution via npm
- CLI tool (`opc-ua-modeler`) for serving the built application
- GitHub Actions workflow for automated publishing to GitHub Packages
- Enhanced test coverage across components
- Project logo and branding assets

### Fixed
- Recent Files dropdown visibility and UX improvements in FileImport component
- IxEmptyState icon import path in DetailPanel component
- ESLint exhaustive-deps warnings for resize handlers in NodeGrid
- Production build optimization and asset handling

### Changed
- Enhanced localStorage mock implementation for better test coverage
- Updated project description for clarity and SEO
- Improved README with detailed installation and usage instructions
- Refined CONTRIBUTING guidelines for external contributors

### Contributors
- [@varun9619](https://github.com/varun9619)
- [@reddyshekharc55](https://github.com/reddyshekharc55)
- [@sojukrishna](https://github.com/sojukrishna)
- [@vineethwilson15](https://github.com/vineethwilson15)
- [@AmoghDeshmukh](https://github.com/AmoghDeshmukh)


## [0.2.1] - 2026-01-30

### Added
- Comprehensive test suite for NodeGraph component
- UI/UX improvements across the application

### Changed
- Updated test cases for better coverage and reliability

### Contributors
- [@varun9619](https://github.com/varun9619)
- [@reddyshekharc55](https://github.com/reddyshekharc55)

## [0.1.1] - 2026-01-28

### Added
- Publishing packages to GitHub Packages (npm registry)
- Package publishing workflow

## [0.1.0] - 2026-01-28

### Added
- CONTRIBUTING.md with setup, testing, and PR process guidelines
- CHANGELOG.md for tracking project changes
- File import functionality with drag-and-drop XML file upload
- Tree navigation view for hierarchical OPC UA nodes
- Data grid with comprehensive table view including sorting and filtering
- Quick search across node properties
- Responsive split-pane layout with resizable panels
- Support for OPC UA Nodeset2 XML format
- Display of node information including:
  - Display Name
  - Node Class
  - Data Type
  - Value Rank
  - Is Mandatory
  - Type
  - Derived From
  - Description
- Support for OPC UA node types:
  - Object
  - Variable
  - Method
  - ObjectType
  - VariableType
  - ReferenceType
  - DataType
  - View
- React 18 for UI framework
- TypeScript for type-safe development
- Vite as build tool
- Siemens IX component library for enterprise UI
- xml2js for XML parsing
- Vitest for testing
- ESLint for code quality
- DetailPanel component for node details display
- FileImport component for file upload handling
- NodeDetails component for detailed node information
- NodeGraph component for graph visualization
- NodeTree component for tree view navigation
- VisualizationOptions component for view controls
- file-import.service for file handling
- nodeset-parser.service for XML parsing logic

[Unreleased]: https://github.com/IndustrialSoftwares/OPC-UA-Modeler/compare/v0.2.1...HEAD
[0.2.1]: https://github.com/IndustrialSoftwares/OPC-UA-Modeler/compare/v0.1.1...v0.2.1
[0.1.1]: https://github.com/IndustrialSoftwares/OPC-UA-Modeler/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/IndustrialSoftwares/OPC-UA-Modeler/releases/tag/v0.1.0
