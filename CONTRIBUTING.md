# Contributing to OPC UA Modeler

Thank you for your interest in contributing to OPC UA Modeler! This document provides guidelines and instructions for contributing to this project.

## Table of Contents

- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [Testing](#testing)
- [Code Style](#code-style)
- [Pull Request Process](#pull-request-process)
- [Reporting Issues](#reporting-issues)

## Getting Started

Before you begin:
- Make sure you have Node.js 18 or higher installed
- Familiarize yourself with React, TypeScript, and the Siemens IX component library
- Read the [README.md](README.md) to understand the project's purpose and features

## Development Setup

1. **Fork the repository** on GitHub

2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR-USERNAME/OPC-UA-Modeler.git
   cd OPC-UA-Modeler
   ```

3. **Add the upstream repository**:
   ```bash
   git remote add upstream https://github.com/IndustrialSoftwares/OPC-UA-Modeler.git
   ```

4. **Install dependencies**:
   ```bash
   npm install
   ```

5. **Start the development server**:
   ```bash
   npm run dev
   ```

6. **Open your browser** and navigate to `http://localhost:5173`

## Project Structure

```
src/
├── components/          # React components
│   ├── DetailPanel/     # Details panel component
│   ├── FileImport/      # File upload component
│   ├── NodeDetails/     # Node details view
│   ├── NodeGraph/       # Graph visualization
│   ├── NodeTree/        # Tree view component
│   └── VisualizationOptions/  # Visualization controls
├── services/            # Business logic and services
│   ├── file-import.service.ts     # File import handling
│   └── nodeset-parser.service.ts  # XML parsing logic
├── types/               # TypeScript type definitions
│   ├── opcua.types.ts   # OPC UA specific types
│   └── import.types.ts  # Import related types
├── test/                # Test utilities
└── App.tsx              # Main application component
```

## Development Workflow

1. **Create a new branch** for your feature or bugfix:
   ```bash
   git checkout -b feature/your-feature-name
   ```
   or
   ```bash
   git checkout -b fix/your-bugfix-name
   ```

2. **Make your changes** following the code style guidelines

3. **Test your changes** thoroughly (see [Testing](#testing) section)

4. **Commit your changes** with clear, descriptive commit messages:
   ```bash
   git add .
   git commit -m "feat: add new feature description"
   ```
   
   Follow conventional commit format:
   - `feat:` for new features
   - `fix:` for bug fixes
   - `docs:` for documentation changes
   - `style:` for code style changes (formatting, etc.)
   - `refactor:` for code refactoring
   - `test:` for adding or updating tests
   - `chore:` for maintenance tasks

5. **Keep your fork updated**:
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

6. **Push your changes**:
   ```bash
   git push origin feature/your-feature-name
   ```

## Testing

### Running Tests

Run all tests:
```bash
npm test
```

Run tests with UI:
```bash
npm run test:ui
```

Run tests with coverage report:
```bash
npm run test:coverage
```

### Writing Tests

- Write unit tests for all new features and bug fixes
- Place test files next to the component/service they test (e.g., `NodeTree.test.tsx`)
- Use React Testing Library for component tests
- Aim for meaningful test coverage, not just high percentages
- Test user interactions and edge cases

Example test structure:
```typescript
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import YourComponent from './YourComponent';

describe('YourComponent', () => {
  it('should render correctly', () => {
    render(<YourComponent />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });
});
```

## Code Style

### Linting

Run the linter to check for code style issues:
```bash
npm run lint
```

### TypeScript

- Use TypeScript for all new files
- Define proper types for all props, state, and function parameters
- Avoid using `any` type; use `unknown` or proper types instead
- Keep type definitions in the `types/` directory for shared types

### React Components

- Use functional components with hooks
- Keep components small and focused on a single responsibility
- Extract reusable logic into custom hooks
- Use meaningful component and prop names

### File Naming

- Components: PascalCase (e.g., `NodeTree.tsx`)
- Services: kebab-case with `.service.ts` suffix (e.g., `nodeset-parser.service.ts`)
- Types: kebab-case with `.types.ts` suffix (e.g., `opcua.types.ts`)
- Tests: Same as the file being tested with `.test.ts(x)` suffix

## Pull Request Process

1. **Ensure your code passes all checks**:
   - All tests pass (`npm test`)
   - No linting errors (`npm run lint`)
   - Code builds successfully (`npm run build`)

2. **Update documentation** if needed:
   - Update README.md for new features or changed behavior
   - Add JSDoc comments for public APIs
   - Update CHANGELOG.md following the Keep a Changelog format

3. **Create a Pull Request**:
   - Use a clear and descriptive title
   - Reference any related issues (e.g., "Fixes #123")
   - Provide a detailed description of the changes
   - Include screenshots for UI changes
   - List any breaking changes

4. **PR Template**:
   ```markdown
   ## Description
   Brief description of what this PR does

   ## Related Issue
   Fixes #(issue number)

   ## Type of Change
   - [ ] Bug fix
   - [ ] New feature
   - [ ] Breaking change
   - [ ] Documentation update

   ## Testing
   - [ ] Tests pass locally
   - [ ] Added new tests for new features
   - [ ] Manual testing completed

   ## Screenshots (if applicable)
   Add screenshots here

   ## Checklist
   - [ ] Code follows the project's style guidelines
   - [ ] Self-review completed
   - [ ] Documentation updated
   - [ ] No new warnings generated
   ```

5. **Code Review**:
   - Address review comments promptly
   - Be open to feedback and suggestions
   - Update your branch if requested
   - Once approved, a maintainer will merge your PR

## Reporting Issues

### Before Creating an Issue

- Check if the issue already exists in the issue tracker
- Verify the issue occurs with the latest version
- Collect relevant information (browser, Node.js version, etc.)

### Creating an Issue

Use the appropriate issue template and provide:

**For Bug Reports**:
- Clear, descriptive title
- Steps to reproduce the issue
- Expected behavior
- Actual behavior
- Screenshots or error messages
- Environment details (OS, browser, Node.js version)

**For Feature Requests**:
- Clear description of the feature
- Use case and benefits
- Possible implementation approach
- Any alternatives considered

## Code of Conduct

- Be respectful and inclusive
- Welcome newcomers and help them get started
- Focus on constructive feedback
- Respect differing viewpoints and experiences

## Questions?

If you have questions about contributing, feel free to:
- Open a discussion on GitHub
- Reach out to the maintainers
- Check existing documentation and issues

Thank you for contributing to OPC UA Modeler! 🎉
