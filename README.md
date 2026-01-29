# OPC UA Modeler

A web-based OPC UA modeler built with React, TypeScript, and Siemens IX framework. 
Currently this application allows you to import and view OPC UA nodeset XML files in an intuitive interface similar to other desktop versions of OPC-UA Modeling Editor.

## Features

- 📁 **File Import**: Drag-and-drop XML file upload with validation
- 🌳 **Tree Navigation**: Hierarchical view of OPC UA nodes with expandable/collapsible structure
- 📊 **Data Grid**: Comprehensive table view with sorting and filtering capabilities
- 🔍 **Search**: Quick search across node properties
- 🎨 **Siemens IX Design**: Professional UI using Siemens IX component library
- 📱 **Responsive**: Resizable split-pane layout

## Supported Features

The viewer displays the following node information:
- Display Name
- Node Class
- Data Type
- Value Rank
- Is Mandatory
- Type
- Derived From
- Description

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

1. **Import a Nodeset**: Click the upload area or drag-and-drop an OPC UA nodeset XML file
2. **Navigate**: Use the tree view on the left to explore the node hierarchy
3. **View Details**: Select nodes to view their details in the data grid
4. **Search**: Use the search box to filter nodes by name or properties
5. **Sort**: Click column headers to sort the data

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

### Publish to GitHub Packages (npm)

This repo is configured to publish to GitHub Packages under the scope `@IndustrialSoftwares`.

After you create a GitHub Release, the workflow `.github/workflows/publish.yml` publishes the npm package.
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

This produces a `*.tgz` file which can be installed locally, for example:

```bash
npm install -g ./IndustrialSoftwares-opc-ua-modeler-0.1.0.tgz
opc-ua-modeler --port 5173
```


## Acknowledgments

- Built with [Siemens IX](https://ix.siemens.io/)
- OPC UA specification by [OPC Foundation](https://opcfoundation.org/)
