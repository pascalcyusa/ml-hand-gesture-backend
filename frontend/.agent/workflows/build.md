---
description: How to build, run, and manage dependencies in this project. Always use bun, never npm/npx.
---

# Build & Dev Workflow

> **IMPORTANT**: This project uses **bun** as its package manager and script runner. **Never use npm, npx, or yarn.** All commands below use `bun`.

// turbo-all

## Install dependencies
```bash
bun install
```

## Run dev server
```bash
bun run dev
```

## Build for production
```bash
bun run build
```

## Add a dependency
```bash
bun add <package-name>
```

## Add a dev dependency
```bash
bun add -d <package-name>
```

## Run arbitrary scripts
```bash
bun run <script-name>
```
