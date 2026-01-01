# Quick Start Guide

## Prerequisites

```bash
# Ensure you're using Node 22+
nvm use 22

# Initialize root dependencies
pnpm install
```

## Common Commands

### Development Workflow

```bash
# Install dependencies for all buildable challenges
pnpm install:all

# Build all challenges
pnpm build

# Build and preview the GitHub Pages site
pnpm site:preview
```

### Preview Commands

| Command | Description |
|---------|-------------|
| `pnpm site:preview` | Build the site and start local server (one command) |
| `pnpm site:build` | Build the site only (generates `dist/`) |
| `pnpm preview` | Serve existing `dist/` on http://localhost:8000 |

### Build Commands

| Command | Description |
|---------|-------------|
| `pnpm build` | Build all challenges (ex-04, ex-05, ex-07) |
| `pnpm build:ex-04` | Build Mobile IDE App |
| `pnpm build:ex-05` | Build Browser IDE v1 |
| `pnpm build:ex-07` | Build Photo Watermark Remover |

### Clean Commands

| Command | Description |
|---------|-------------|
| `pnpm clean` | Clean all build outputs and node_modules |
| `pnpm clean:ex-04` | Clean ex-04 only |
| `pnpm clean:ex-05` | Clean ex-05 only |
| `pnpm clean:ex-07` | Clean ex-07 only |

## Typical Workflow

### 1. First Time Setup
```bash
# Use Node 22
nvm use 22

# Initialize root workspace (creates node_modules/)
pnpm install

# Alternative: Manually create if pnpm install doesn't
mkdir -p node_modules

# Install all challenge dependencies
pnpm install:all
```

### 2. Preview GitHub Pages Site
```bash
# Build and preview in one command
pnpm site:preview

# Visit http://localhost:8000
# Press Ctrl+C to stop
```

### 3. Deploy to GitHub Pages
```bash
# Test deployment locally first
pnpm deploy:local

# If successful, push to trigger GitHub Actions
git push origin master
```

## Fixing Common Issues

### "Local package.json exists, but node_modules missing"

**Solution:**
```bash
# Run this once after cloning
pnpm install
```

This creates the root `node_modules/` directory that pnpm expects.

### Build Failures

**Solution:**
```bash
# Clean everything and rebuild
pnpm clean
pnpm install:all
pnpm build
```

### Node Version Warnings

**Solution:**
```bash
# Use Node 22+ (required)
nvm use 22

# Or install Node 22
nvm install 22
nvm use 22
```

## Documentation

- [BUILD.md](./BUILD.md) - Comprehensive build system guide
- [.github/BUILD_SYSTEM.md](./.github/BUILD_SYSTEM.md) - Technical build documentation
- [CLAUDE.md](./CLAUDE.md) - Development guide for AI and developers
- [INDEX.md](./INDEX.md) - Complete list of challenges
