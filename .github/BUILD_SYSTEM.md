# Build System Documentation

## Overview

This repository uses an automated build system that compiles web challenges during deployment. Build artifacts are **NOT** committed to git - they are generated fresh during the CI/CD process.

## .gitignore Configuration

### Root Level (.gitignore)
The root `.gitignore` excludes:
- `node_modules/` - All dependency directories
- `package-lock.json`, `yarn.lock` - Non-pnpm lock files (use pnpm-lock.yaml only)
- `dist/`, `build/`, `out/` - Build output directories
- `.vite/`, `.next/`, `.cache/` - Framework-specific caches
- `.env*` - Environment files
- Python artifacts (`venv/`, `__pycache__/`)

### Challenge Level
Web challenges with build processes should have their own `.gitignore`:

**Template:** `.github/templates/.gitignore.web`

**Usage:**
```bash
# When creating a new web challenge
cp .github/templates/.gitignore.web my-new-challenge/.gitignore
```

## How The Build System Works

### Local Development

1. **Build the site:**
   ```bash
   source venv/bin/activate
   .github/scripts/build-site.sh
   ```

2. **Preview locally:**
   ```bash
   cd dist && python3 -m http.server 8000
   ```

3. **What happens:**
   - Detects web challenges from `INDEX.md`
   - For each challenge with `package.json`:
     - Auto-detects package manager (pnpm/yarn/npm)
     - Installs dependencies (if needed)
     - Runs `npm run build` (if build script exists)
   - Copies built files to `dist/challenge-name/`
   - Generates docs and preview pages

### GitHub Actions Deployment

**Workflow:** `.github/workflow-templates/deploy-pages.yml`

**On push to master:**
1. Checks out code (without build artifacts)
2. Sets up Node.js 20 + pnpm + Python 3.11
3. Installs Python dependencies
4. Runs `build-site.sh` - builds all web apps from source
5. Deploys `dist/` directory to GitHub Pages

**Key points:**
- ✅ Builds happen in CI/CD, not locally
- ✅ No build artifacts in git repository
- ✅ Clean, reproducible builds every time
- ✅ Smaller repository size

## File Structure

### Before Build (in git)
```
ex-07-challenge/
├── src/                 # Source code (tracked)
├── package.json         # Dependencies (tracked)
├── pnpm-lock.yaml      # Lock file (tracked)
├── vite.config.ts      # Build config (tracked)
├── .gitignore          # Ignore rules (tracked)
├── README.md           # Docs (tracked)
└── CHALLENGE.md        # Challenge spec (tracked)
```

### After Build (not in git)
```
dist/
└── ex-07-challenge/
    ├── docs.html           # Generated docs page
    ├── preview.html        # Generated preview page
    ├── app.html            # Built application
    ├── assets/             # Built assets
    │   ├── index-abc123.js
    │   └── index-def456.css
    └── docs/              # Converted markdown
        └── *.html
```

## Adding a New Web Challenge

1. **Create challenge directory:**
   ```bash
   mkdir my-challenge
   cd my-challenge
   ```

2. **Set up project (use pnpm):**
   ```bash
   pnpm init
   ```

3. **Add .gitignore:**
   ```bash
   cp ../.github/templates/.gitignore.web .gitignore
   ```

4. **Develop your app:**
   - Create `src/` directory
   - Add your source code
   - Configure build tool (Vite, Webpack, etc.)
   - Add `"build"` script to `package.json`

5. **Add to deployment:**
   - Update `INDEX.md` - add to "Web-Deployable Challenges" section
   - Commit source code (NOT build output)
   - Push to trigger deployment

## Package Manager Support

**Repository Standard: pnpm**

All projects in this repository use **pnpm** as the package manager for consistency and efficiency.

The build system auto-detects package managers for legacy compatibility:
- **pnpm** (if `pnpm-lock.yaml` exists) ✅ **Preferred**
- **yarn** (if `yarn.lock` exists)
- **npm** (if `package-lock.json` exists)

### Why pnpm?
- **Efficient disk usage:** Content-addressable storage, single copy of each package version
- **Fast installs:** Parallel installation, smart linking
- **Strict dependencies:** Better monorepo support, prevents phantom dependencies
- **GitHub Actions ready:** Works seamlessly with CI/CD workflows

## Build Script Detection

If `package.json` contains a `"build"` script:
```json
{
  "scripts": {
    "build": "vite build"
  }
}
```

The system will:
1. Install dependencies
2. Run the build script
3. Copy output from `dist/` or `build/` to deployment

## Troubleshooting

### Build fails in GitHub Actions
- ✅ Check that all dependencies are in `package.json`
- ✅ Ensure build script is defined
- ✅ Test locally with clean build: `rm -rf dist node_modules && .github/scripts/build-site.sh`

### Missing files in deployment
- ✅ Check that files are in `dist/` or `build/` after local build
- ✅ Verify build output directory name (should be `dist` or `build`)

### Large repository size
- ✅ Ensure `node_modules/` is in `.gitignore`
- ✅ Ensure `dist/` is in `.gitignore`
- ✅ Run: `git rm -r --cached node_modules dist` (if previously tracked)

## Best Practices

1. **Never commit build artifacts:**
   - Add to `.gitignore` immediately
   - Build in CI/CD only

2. **Use pnpm and commit lock files:**
   - Always use `pnpm` for new projects
   - Commit `pnpm-lock.yaml` for reproducible builds
   - Do NOT commit `package-lock.json` or `yarn.lock` (added to .gitignore)

3. **Test locally:**
   - Always test full build before pushing
   - Use: `rm -rf dist && .github/scripts/build-site.sh`

4. **Clean builds:**
   - CI always builds from scratch
   - No stale artifacts

## Related Files

- `.gitignore` - Root level ignore rules
- `.github/scripts/build-site.sh` - Build orchestration script
- `.github/workflow-templates/deploy-pages.yml` - GitHub Actions workflow
- `.github/templates/.gitignore.web` - Template for web challenges
- `INDEX.md` - Deployment configuration
