# OPC UA Modeler

A web-based OPC UA modeler built with React, TypeScript, and Siemens IX framework. 
Currently this application allows you to import and view OPC UA nodeset XML files in an intuitive interface similar to other desktop versions of OPC-UA Modeling Editor.

## Features

- 📁 **File Import**: 
  - Drag-and-drop XML file upload with validation
  - Recent files history with quick access
  - Multiple file support with required model detection
  - Namespace conflict resolution strategies (reject, rename, merge, warn)
  - Progress tracking for large files
  - File size validation and error handling
- 🌳 **Tree Navigation**: 
  - Hierarchical view of OPC UA nodes with expandable/collapsible structure
  - Expand All / Collapse All functionality
  - Keyboard navigation (Arrow keys, Enter)
  - Node type filtering (Object, Variable, Method, etc.)
  - Auto-scroll to selected node
- 📊 **Enhanced Data Grid**: 
  - Hierarchical display with expandable parent nodes
  - Multi-column sorting (Shift+Click for multiple columns)
  - Advanced filtering and search with column-specific filters
  - Resizable columns with persistent widths
  - Toggle between flat and hierarchical views
  - Node type multi-select filtering
- 🔄 **View Mode Toggle**: Seamlessly switch between Tree and Grid views
- 🔍 **Search**: Quick search across node properties (Display Name, Browse Name, Node ID, Description)
- 📋 **Detail Panel**: 
  - Comprehensive node information display
  - Copy to clipboard functionality for Node IDs and properties
  - Reference navigation with grouping by type
  - Hierarchy view (Parent, Type Definition, Base Type)
  - Collapsible sections for organized viewing
- 🌓 **Theme Toggle**: Light/dark mode support with system preference detection
- 🎨 **Siemens IX Design**: Professional UI using Siemens IX component library
- 📱 **Responsive**: Resizable split-pane layout with persistent preferences
- ✅ **Validation**: XML validation, file size checks, and namespace conflict detection

## Supported Features

The viewer displays comprehensive node information including:

**Basic Properties:**
- Display Name
- Browse Name
- Node ID
- Node Class
- Description

**Type Information:**
- Data Type
- Value Rank
- Is Mandatory
- Type Definition
- Base Type / Derived From

**Relationships:**
- References (grouped by type: HasComponent, HasProperty, HasTypeDefinition, etc.)
- Forward and backward references
- Parent/Child hierarchy
- Clickable reference navigation

**Additional Features:**
- Namespace information
- Required models detection
- Node counts and statistics

## Technology Stack

- **React 18** - UI framework
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool
- **Siemens IX** - Enterprise UI component library
- **xml2js** - XML parsing
- **vis-network** - Optional graph visualization support
- **Vitest** - Unit/integration testing
- **ESLint** - Linting and code quality checks

## Getting Started

### Prerequisites

- Node.js 18 or higher
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd OPC-UA-Modeler
```

2. Install dependencies:
```bash
npm install
```

For a clean, reproducible install (recommended in CI), use:

```bash
npm ci
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

## Running Tests

Run the concise commands below to execute the project's Vitest tests.

- Run all tests:

```bash
npm run test
```

- Run a single test file:

```bash
npx vitest run src/services/file-import.service.test.ts
```

- Run tests interactively (UI):

```bash
npm run test:ui
```

Notes:
- Use `npx vitest run --dir src/services --reporter verbose` for verbose output while developing service tests.
- The test environment includes `jsdom`, so browser-like APIs such as `File` and `DOMParser` are available.

## Usage

1. **Import a Nodeset**: 
   - Click the upload button or drag-and-drop an OPC UA nodeset XML file
   - Access recently imported files from the dropdown
   - Import multiple related nodesets (handles required models)
   - Choose namespace conflict resolution strategy if needed

2. **Switch Views**: Toggle between Tree and Grid views using the view switcher button in the header

3. **Navigate Tree View**: 
   - Expand/collapse individual nodes or use Expand All / Collapse All buttons
   - Filter by node type using the checkboxes
   - Use keyboard navigation:
     - ↑↓ arrows to move between nodes
     - →← arrows to expand/collapse nodes
     - Enter to select a node
   - Search across all node properties

4. **Navigate Grid View**: 
   - Toggle hierarchical/flat display
   - Expand/collapse parent nodes to show children
   - Resize columns by dragging column borders (saved automatically)
   - Multi-sort by Shift+clicking column headers
   - Filter individual columns using the filter inputs
   - Filter by node type using the multi-select dropdown

5. **View Details**: 
   - Select any node to view comprehensive details in the detail panel (Tree view) or bottom panel
   - Click "Copy" buttons to copy Node IDs and properties to clipboard
   - Navigate relationships by clicking on reference links
   - Expand/collapse sections for organized viewing

6. **Change Theme**: Click the theme toggle button to switch between light and dark modes (preference saved)

7. **Clear**: Use the Clear button to reset the viewer and start over

## Scripts

- `npm run dev` - start Vite dev server
- `npm run build` - typecheck + production build (outputs `dist/`)
- `npm run preview` - serve the production build via Vite
- `npm test` - run tests once (CI-friendly)
- `npm run test:watch` - run tests in watch mode
- `npm run test:ui` - run tests with the Vitest UI
- `npm run test:coverage` - run tests with coverage
- `npm run lint` - run ESLint

## Build for Production

```bash
npm run build
```

The built files will be in the `dist` directory (generated output; it is not committed).

To preview the production build locally:

```bash
npm run preview
```

Alternatively, you can serve `dist/` using the bundled CLI (see below).


## Deploy to GitHub Pages

This repo includes a GitHub Actions workflow that builds the app and deploys the `dist/` folder to GitHub Pages.

1. In your GitHub repo go to **Settings → Pages**
2. Under **Build and deployment**, set **Source** to **GitHub Actions**
3. Push to `main` (or run the workflow manually via **Actions → Deploy to GitHub Pages**)

Your site will be available at:

`https://<owner>.github.io/<repo>/`

Note: GitHub Pages project sites are served from `/<repo>/`, so the workflow builds with Vite `--base=/<repo>/` to ensure assets load correctly.

## CLI (serve `dist/`)

This repo ships a small Node.js CLI named `opc-ua-modeler` that serves the built site over HTTP.

If you cloned the repo:

```bash
npm run build
node ./bin/opc-ua-modeler.mjs --port 5173
```

If you installed the package globally from a tarball, you can just run:

```bash
opc-ua-modeler --help
opc-ua-modeler --port 5173
```

Defaults: host `127.0.0.1`, port `4173`, directory `./dist`.

## Project Structure

```
.
├── .github/workflows/ci.yml     # GitHub Actions CI (lint/test/build)
├── bin/opc-ua-modeler.mjs       # CLI to serve the built app (dist/)
├── src/
│   ├── components/              # UI components
│   ├── services/                # Nodeset parsing + file import logic
│   ├── types/                   # Shared TypeScript types
│   ├── App.tsx                  # Main application component
│   └── main.tsx                 # Application entry point
└── vite.config.ts               # Vite + Vitest config
```

## CI

GitHub Actions runs on pull requests and pushes to `main` and executes:

- `npm ci`
- `npm run lint`
- `npm test`
- `npm run build`

Workflow file: `.github/workflows/ci.yml`.

## OPC UA Nodeset Format

This viewer supports OPC UA Nodeset2 XML format with the following node types:
- Object
- Variable
- Method
- ObjectType
- VariableType
- ReferenceType
- DataType
- View

## Contributing

Contributions are welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for setup, testing, and PR guidelines.

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for notable changes.

## Packaging / Distribution

This project can be packaged as an npm tarball (useful for sharing a reproducible release artifact):

```bash
npm pack
```

`npm pack` will run the `prepack` script first, which builds the project so the tarball includes `dist/` and the `opc-ua-modeler` CLI.

### Publish to npmjs.com (Public npm Registry)

This package is published to the public npm registry at [npmjs.com](https://www.npmjs.com/package/@industrialsoftwares/opc-ua-modeler).

**Install from npm (Recommended):**

```bash
npm install -g @industrialsoftwares/opc-ua-modeler
opc-ua-modeler --port 5173
```

**Publishing to npm:**

To publish to npm, you need to use the npm-specific configuration files:

1. **Replace configuration files:**
   ```bash
   cp package_npm.json package.json
   cp .npmrc_npm .npmrc
   ```

2. **Login to npm:**
   ```bash
   npm login
   # Use your npm username and a granular access token with 2FA bypass enabled
   ```

3. **Publish:**
   ```bash
   npm publish --access public
   ```

**Note:** The package name must be lowercase (`@industrialsoftwares/opc-ua-modeler`) as npm doesn't allow capital letters in scoped package names.

**Configuration Files:**
- `package_npm.json` - Package configuration for npmjs.com with lowercase scope
- `.npmrc_npm` - npm registry configuration pointing to `https://registry.npmjs.org`

### Publish to GitHub Packages (npm)

This repo can also be configured to publish to GitHub Packages under the scope `@IndustrialSoftwares`.

After you create a GitHub Release, the workflow `.github/workflows/publish.yml` can publish the npm package to GitHub Packages.
Once published, a **Packages** link appears on the repo home page.

Install from GitHub Packages:

```bash
npm install @IndustrialSoftwares/opc-ua-modeler
```

Note: consumers need authentication for GitHub Packages. They must create an `~/.npmrc` with a GitHub token:

```ini
@IndustrialSoftwares:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=YOUR_GITHUB_TOKEN
```

### Install from Local Tarball

This produces a `*.tgz` file which can be installed locally, for example:

```bash
npm pack
npm install -g ./industrialsoftwares-opc-ua-modeler-1.0.0.tgz
opc-ua-modeler --port 5173
```


## Acknowledgments

- Built with [Siemens IX](https://ix.siemens.io/)
- OPC UA specification by [OPC Foundation](https://opcfoundation.org/)
