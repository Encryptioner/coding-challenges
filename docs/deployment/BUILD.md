# Build System Documentation

This document describes the build system for challenges that require compilation or bundling.

## Overview

Most challenges in this repository are standalone and don't require a build step. However, some modern web challenges use build tools like Vite, TypeScript, or React and need to be built before deployment.

## Challenges with Build Scripts

Currently, the following challenges require building:

| Challenge | Technology | Build Command |
|-----------|------------|---------------|
| ex-04-mobile-ide-app | Theia/TypeScript | `pnpm run build:ex-04` |
| ex-05-browser-ide-v1 | React/Vite | `pnpm run build:ex-05` |
| ex-07-photo-watermark-remover | TypeScript/React/Vite | `pnpm run build:ex-07` |

## Available Commands

### Install Commands

```bash
# Install dependencies for all buildable challenges
pnpm install:all

# Install dependencies for a specific challenge
pnpm install:ex-04
pnpm install:ex-05
pnpm install:ex-07
```

### Build Commands

```bash
# Build all challenges that require building
pnpm build

# Build a specific challenge (installs deps automatically)
pnpm build:ex-04
pnpm build:ex-05
pnpm build:ex-07

# Build all (same as pnpm build)
pnpm build:all
```

**Note:** Build commands automatically run `pnpm install` first, so you don't need to run `install:all` before building.

### Clean Commands

```bash
# Clean all build outputs and node_modules
pnpm clean

# Clean a specific challenge
pnpm clean:ex-04
pnpm clean:ex-05
pnpm clean:ex-07

# Clean all (same as pnpm clean)
pnpm clean:all
```

### Deployment Commands

```bash
# Deploy to GitHub Pages (builds everything first)
pnpm deploy

# Test deployment locally
pnpm deploy:local
```

### Preview Commands

```bash
# Build site and preview locally
pnpm site:preview

# Just preview (requires dist/ directory to exist)
pnpm preview

# Build site only (generates dist/ directory)
pnpm site:build
```

**Preview Workflow:**
1. Build the site: `pnpm site:build` or `pnpm site:preview`
2. Visit: http://localhost:8000
3. Stop server: Press Ctrl+C

## Build Process

Each buildable challenge follows this process:

1. **Install dependencies:** `pnpm install` in the challenge directory
2. **Run build script:** Executes the challenge's build script (e.g., `vite build`)
3. **Output:** Generates files in `dist/` or `build/` directory
4. **Deployment:** The deployment script automatically detects and copies built files

## Adding a New Buildable Challenge

When creating a new challenge that requires building:

### 1. Set Up the Challenge

Create your challenge with a `package.json` that includes:

```json
{
  "name": "your-challenge-name",
  "scripts": {
    "build": "vite build"  // or your build command
  }
}
```

Ensure build outputs to `dist/` or `build/` directory.

### 2. Create .gitignore

**CRITICAL:** Always create a `.gitignore` file to prevent committing build artifacts:

```gitignore
# Dependencies
node_modules/

# Build output
dist/
build/
lib/           # For Theia/compiled projects
src-gen/       # For generated sources

# Coverage
coverage/
.nyc_output/

# Environment files
.env
.env.local

# Logs
*.log

# Editor
.vscode/*
.idea
.DS_Store
```

**Why this matters:**
- Build artifacts can be 100MB+ and bloat git history
- Generated files should be recreated on each build
- Different machines may generate slightly different builds
- Secrets/env files must never be committed

**Reference templates:**
- `ex-05-browser-ide-v1/.gitignore` - Vite/React projects
- `ex-07-photo-watermark-remover/.gitignore` - TypeScript/Vite
- `ex-04-mobile-ide-app/.gitignore` - Theia projects

### 3. Update Main package.json

Add install, build, and clean scripts to the root `package.json`:

```json
{
  "scripts": {
    "install:all": "... && pnpm run install:your-challenge",
    "install:your-challenge": "cd your-challenge && pnpm install",
    "build:all": "... && pnpm run build:your-challenge",
    "build:your-challenge": "cd your-challenge && pnpm install && pnpm run build",
    "clean:all": "... && pnpm run clean:your-challenge",
    "clean:your-challenge": "rm -rf your-challenge/dist your-challenge/build your-challenge/node_modules"
  }
}
```

### 4. Update Documentation

- Add to `INDEX.md` in the "Web-Deployable Challenges" section (if it's a web challenge)
- Update `README.md` with the new challenge
- Update statistics in both files

### 5. Test

```bash
# Test individual build
pnpm build:your-challenge

# Test full deployment
pnpm deploy:local

# Verify dist/ directory is created
ls your-challenge/dist/
```

## Build Requirements

Challenges that typically need build scripts:

- **TypeScript projects** - Need compilation
- **React/Vue/Angular** - Need bundling
- **Vite/Webpack projects** - Need bundling and optimization
- **Sass/LESS** - Need CSS preprocessing
- **Modern JS with imports** - Need bundling for browser

Challenges that DON'T need build scripts:

- **Backend Node.js apps** - Run directly with `node server.js`
- **Static HTML/CSS/JS** - Already browser-ready
- **C/Go/Rust projects** - Have their own build systems (Makefile, go build, cargo)
- **Python projects** - Interpreted, no build needed

## Common Mistakes to Avoid

### ❌ Committing Build Artifacts

**Problem:** Generated files (`dist/`, `lib/`, `src-gen/`) committed to git

**Solution:**
```bash
# Remove from git but keep locally
git rm -r --cached dist/ lib/ src-gen/

# Ensure .gitignore includes these directories
echo "dist/" >> .gitignore
echo "lib/" >> .gitignore
echo "src-gen/" >> .gitignore

# Commit the fix
git add .gitignore
git commit -m "chore: add build artifacts to .gitignore"
```

### ❌ Missing .gitignore

**Problem:** No `.gitignore` file in buildable challenge

**Solution:** Copy from ex-05 or ex-07 and adjust for your build tool

### ❌ Build Output in Wrong Directory

**Problem:** Build creates `out/` instead of `dist/`

**Solution:** Update build tool config to output to `dist/` or update deployment script to recognize `out/`

## Troubleshooting

### Build Fails with "Module not found"

```bash
# Clean and rebuild
pnpm clean:challenge-name
pnpm build:challenge-name
```

### Dependencies Not Installing

```bash
# Update pnpm
npm install -g pnpm@latest

# Clear pnpm cache
pnpm store prune
```

### Deployment Not Including Built Files

1. Check that `dist/` or `build/` directory exists after building
2. Verify `package.json` has a `build` script
3. Ensure challenge is listed in `INDEX.md` "Web-Deployable Challenges" section

## Architecture

The build system is designed to be:

- **Minimal:** Only builds what's necessary
- **Independent:** Each challenge manages its own build
- **Extensible:** Easy to add new buildable challenges
- **Automated:** GitHub Actions runs builds on push
- **Consistent:** All challenges use the same patterns

## Related Documentation

- [CLAUDE.md](./CLAUDE.md) - Complete development guide
- [INDEX.md](./INDEX.md) - List of all challenges
- [DOCS/deployment/](./DOCS/deployment/) - Deployment documentation
