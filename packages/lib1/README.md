# @raisin/lib1 - Shared Components Library

## Overview

`@raisin/lib1` is an internal shared component library designed to provide reusable UI components for various projects within our monorepo. It ensures consistency and reduces redundancy across different applications.

## Installation

To add this library to your project, include it as a dependency in your `package.json`:

```json
{
  "dependencies": {
    "@raisin/lib1": "workspace:*"
  }
}
```

This setup assumes you're using `pnpm` with workspace support.

## Usage

To use a component from this library, simply import it into your project like this:

```javascript
import { Button } from '@raisin/lib1';

const MyComponent = () => <Button onClick={handleClick}>Click Me</Button>;
```

## Development

### Building the Library

To build the library, run the following command:

```bash
pnpm run build:library
```

This command will clean the previous build and compile the TypeScript source files into the `lib` directory.

### Local Development

1. **Linting:**
   Ensure code quality by running the linter:

   ```bash
   pnpm run lint
   ```

2. **Prettify Code:**
   Format the codebase:
   ```bash
   pnpm run prettify
   ```

### Adding New Components

1. **Create the Component:**

   - Add a new component in the `src/components/` directory.
   - Ensure it follows the project's structure and coding standards.

2. **Update Exports:**

   - Export your component in the library’s main export file (`src/index.ts`).
