# @raisin/app3

## Overview

`@raisin/app3` is the third application in our monorepo. It is built with Next.js, TypeScript, and React, and leverages various modern tools and libraries to ensure a robust and scalable web application.

## Installation

To set up the project locally, ensure you have the required Node.js version and `pnpm` package manager installed:

```bash
# Ensure you're using the correct Node.js version
nvm use 18.20.2

# Install dependencies
pnpm install
```

## Development

### Running the Development Server

To start the development server on port 3002, run:

```bash
pnpm run dev
```

This will start Next.js in development mode with hot-reloading.

### Building the Application

To build the application for production, run:

```bash
pnpm run build
```

This command will create an optimized build in the `.next` directory.

### Production Start

To start the application in production mode, after building it, use:

```bash
pnpm run build:prod
```

This command will build the app and then start it on port 3002.

## Linting and Formatting

### Linting

To lint the code, use:

```bash
pnpm run lint
```

To automatically fix linting issues, use:

```bash
pnpm run lint:fix
```

### Prettify Code

To format the codebase according to the project's Prettier configuration:

```bash
pnpm run prettify
```

## Other Useful Commands

- **Minify SVGs**:

  ```bash
  pnpm run minify:svg
  ```

- **Check Types**:

  ```bash
  pnpm run check-types
  ```

- **Setup Project**:
  ```bash
  pnpm run setup
  ```

## Configuration

The project includes several configurable options, such as whether to analyze the build output, managed through the `config` field in `package.json`.
