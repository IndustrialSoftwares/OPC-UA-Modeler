# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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

### Technical Stack
- React 18 for UI framework
- TypeScript for type-safe development
- Vite as build tool
- Siemens IX component library for enterprise UI
- xml2js for XML parsing
- Vitest for testing
- ESLint for code quality

### Components
- DetailPanel component for node details display
- FileImport component for file upload handling
- NodeDetails component for detailed node information
- NodeGraph component for graph visualization
- NodeTree component for tree view navigation
- VisualizationOptions component for view controls

### Services
- file-import.service for file handling
- nodeset-parser.service for XML parsing logic
