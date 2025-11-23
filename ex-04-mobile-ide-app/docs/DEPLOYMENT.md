# 🚀 Deployment Guide

> **From Code to Production in One Push** 🌐
>
> You've built something amazing. Now it's time to get it into people's hands. This isn't just a deployment guide—it's your complete CI/CD pipeline blueprint for getting the Mobile Code IDE deployed to GitHub Pages, published to app stores, and automated so thoroughly that releases happen with a single git tag.
>
> **What's covered here:**
> - **Zero-config GitHub Pages deployment** (yes, really—enable it once and forget about it)
> - **Automated CI/CD workflows** that build APKs, test code, and create releases on every push
> - **Production-ready builds** optimized for performance, cached for offline use, and distributed globally via CDN
> - **Release management** that turns `git tag v1.0.0` into downloadable APKs and web bundles
>
> **The best part?** Most of this is already configured. You're literally 5 minutes away from having your IDE live on the internet, accessible from any device with a browser. And another 10 minutes from having automated Android builds on every commit.
>
> No complicated deployment scripts. No manual builds. No "works on my machine" nonsense. Just **push, build, deploy, done**.
>
> Ready to ship? Let's go.

Complete guide for deploying Mobile Code IDE to GitHub Pages, creating releases, and automating builds.

---

## 📋 Table of Contents

- [GitHub Pages Deployment](#github-pages-deployment)
- [Automated CI/CD Workflows](#automated-cicd-workflows)
- [Creating Releases](#creating-releases)
- [Manual Deployment](#manual-deployment)
- [Configuration](#configuration)
- [Troubleshooting](#troubleshooting)

---

## 🌐 GitHub Pages Deployment

The Mobile Code IDE can be deployed to GitHub Pages for free hosting accessible from any device.

### One-Time Setup

1. **Enable GitHub Pages**
   - Go to your repository on GitHub
   - Click **Settings** → **Pages**
   - Under "Build and deployment":
     - Source: **GitHub Actions**
   - Save the settings

2. **That's it!** The workflow will deploy automatically on every push to `main` branch.

### Access Your Deployment

Once deployed, your IDE will be available at:
```
https://<your-username>.github.io/<repository-name>/
```

For example:
```
https://Encryptioner.github.io/acmp-4.0-for-engineers/
```

### Using the Web IDE

**On Desktop:**
- Open in browser (Chrome, Firefox, Safari, Edge)
- Works like a desktop app
- Install as PWA (Progressive Web App) for app-like experience

**On Mobile:**
- Open in mobile browser (Safari on iOS, Chrome on Android)
- **iOS:** Tap Share → Add to Home Screen
- **Android:** Tap menu → Install App or Add to Home Screen
- Behaves like a native app once installed!

---

## ⚙️ Automated CI/CD Workflows

Three GitHub Actions workflows are configured to automate everything:

### 1. GitHub Pages Deployment (`deploy-pages.yml`)

**Triggers:**
- Push to `main` or `master` branch
- Manual trigger via Actions tab

**What it does:**
1. Checks out code
2. Installs dependencies
3. Builds Theia in production mode
4. Creates SPA routing files (404.html, .nojekyll)
5. Deploys to GitHub Pages
6. Outputs deployment URL

**Access:**
- Go to **Actions** tab → **Deploy to GitHub Pages** workflow
- Click **Run workflow** to trigger manually

### 2. CI/CD Pipeline (`ci.yml`)

**Triggers:**
- Push to any branch
- Pull requests
- Manual trigger

**Jobs:**
1. **Lint and Test** - Runs linter and tests
2. **Build Web** - Creates production web build
3. **Build Android** - Generates APK file
4. **Build iOS** - Generates IPA file (macOS runner, manual trigger only)
5. **Status Check** - Summary of all builds

**Artifacts:**
- Production web build (30 days)
- Android APK (90 days)
- Development build (7 days)

**Download artifacts:**
- Go to **Actions** tab
- Click on a workflow run
- Scroll to **Artifacts** section
- Download APK or web bundle

### 3. Release Workflow (`release.yml`)

**Triggers:**
- Push tags starting with `v` (e.g., `v1.0.0`)
- Manual trigger with version input

**What it does:**
1. Creates GitHub Release with changelog
2. Builds web bundle (tar.gz & zip)
3. Builds Android APK
4. Builds iOS IPA (if triggered manually)
5. Uploads all artifacts to the release

**Assets in each release:**
- `mobile-code-ide-web-vX.X.X.tar.gz` - Web bundle
- `mobile-code-ide-web-vX.X.X.zip` - Web bundle (Windows-friendly)
- `mobile-code-ide-vX.X.X.apk` - Android APK

---

## 📦 Creating Releases

### Method 1: Git Tag (Automated)

```bash
# Create and push a version tag
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin v1.0.0

# GitHub Actions will automatically:
# - Create a release
# - Build all assets
# - Upload to the release page
```

### Method 2: GitHub UI (Manual)

1. Go to **Actions** tab
2. Select **Create Release** workflow
3. Click **Run workflow**
4. Enter version (e.g., `v1.0.0`)
5. Click **Run workflow**

The workflow will create the release and build all assets.

### Method 3: GitHub CLI

```bash
# Install GitHub CLI
# https://cli.github.com/

# Create release
gh release create v1.0.0 \
  --title "Mobile Code IDE v1.0.0" \
  --notes "Release notes here"

# This triggers the release workflow
```

### Viewing Releases

Releases are available at:
```
https://github.com/<username>/<repo>/releases
```

Users can download:
- APK for Android
- Web bundle for self-hosting
- Source code

---

## 🛠️ Manual Deployment

### Deploy to GitHub Pages Manually

If you prefer manual control:

```bash
# 1. Build the project
cd mobile-ide-app
pnpm install
pnpm run build:prod

# 2. The build output is in mobile-ide-app/lib/

# 3. Deploy using gh-pages branch
git checkout --orphan gh-pages
git rm -rf .
cp -r mobile-ide-app/lib/* .
echo "Mobile Code IDE" > README.md
touch .nojekyll
git add .
git commit -m "Deploy to GitHub Pages"
git push origin gh-pages --force

# 4. In GitHub Settings → Pages:
#    Source: Deploy from branch
#    Branch: gh-pages, folder: / (root)
```

### Build APK Manually

```bash
cd mobile-ide-app
./scripts/build-android.sh

# APK location: output/android/mobile-code-ide.apk
```

### Build IPA Manually (macOS)

```bash
cd mobile-ide-app
./scripts/build-ios.sh

# IPA location: output/ios/mobile-code-ide.ipa
```

---

## ⚙️ Configuration

### Environment Variables

Set these in **Settings → Secrets and variables → Actions**:

**Optional (for advanced features):**
```
ANDROID_SIGNING_KEY          # Base64 encoded keystore for signed APKs
ANDROID_KEY_ALIAS            # Keystore alias
ANDROID_KEY_PASSWORD         # Keystore password
ANDROID_STORE_PASSWORD       # Store password

IOS_CERTIFICATE_P12          # iOS signing certificate
IOS_CERTIFICATE_PASSWORD     # Certificate password
IOS_PROVISIONING_PROFILE     # Provisioning profile
IOS_TEAM_ID                  # Apple Developer Team ID
```

### Customizing Workflows

**Change deployment branch:**
Edit `.github/workflows/deploy-pages.yml`:
```yaml
on:
  push:
    branches: [ your-branch-name ]  # Change here
```

**Disable iOS builds** (to save CI minutes):
In `.github/workflows/ci.yml`, remove or comment out the `build-ios` job.

**Change artifact retention:**
```yaml
- uses: actions/upload-artifact@v4
  with:
    retention-days: 90  # Change this number
```

### Custom Domain

To use a custom domain with GitHub Pages:

1. **Add CNAME file:**
```bash
echo "your-domain.com" > mobile-ide-app/lib/CNAME
```

2. **Configure DNS:**
Add these DNS records:
```
Type: A
Name: @
Value: 185.199.108.153
       185.199.109.153
       185.199.110.153
       185.199.111.153

Type: CNAME
Name: www
Value: <username>.github.io
```

3. **Enable in GitHub:**
Settings → Pages → Custom domain → Enter your domain → Save

---

## 🔍 Monitoring Deployments

### Check Workflow Status

**Via GitHub UI:**
1. Go to **Actions** tab
2. See all workflow runs
3. Click on a run to see details
4. Check job logs for errors

**Via GitHub CLI:**
```bash
# List recent workflow runs
gh run list

# View specific run
gh run view <run-id>

# Watch current run
gh run watch
```

### View Build Logs

Each job has detailed logs:
1. Click on a workflow run
2. Click on a job (e.g., "Build Android APK")
3. Expand steps to see detailed output

### Download Build Artifacts

**Via UI:**
1. Go to workflow run
2. Scroll to **Artifacts** section
3. Click to download

**Via CLI:**
```bash
# List artifacts
gh run view <run-id> --log

# Download artifact
gh run download <run-id>
```

---

## 🐛 Troubleshooting

### GitHub Pages Not Deploying

**Check:**
1. GitHub Pages is enabled (Settings → Pages)
2. Source is set to "GitHub Actions"
3. Workflow completed successfully (Actions tab)
4. No errors in workflow logs

**Common fixes:**
```bash
# Ensure main branch is up to date
git pull origin main
git push origin main

# Trigger workflow manually
# Actions → Deploy to GitHub Pages → Run workflow
```

### Build Fails with "Out of Memory"

**Solution:** Workflows already set `NODE_OPTIONS=--max-old-space-size=8192`

If still failing, reduce parallel builds:
```yaml
# In workflow file
env:
  NODE_OPTIONS: '--max-old-space-size=6144'  # Reduce this
```

### Android Build Fails

**Common issues:**
1. **Java version:** Workflows use Java 17 (correct version)
2. **Gradle issues:** Check `mobile-ide-app/android/gradle/wrapper/gradle-wrapper.properties`
3. **Capacitor not synced:** Workflow runs `cap sync android`

**Debug locally:**
```bash
cd mobile-ide-app
pnpm run build:prod
npx cap sync android
cd android
./gradlew assembleRelease --stacktrace
```

### iOS Build Fails

**Common issues:**
1. **macOS runner:** iOS builds require `runs-on: macos-latest` ✅
2. **CocoaPods:** Workflows install automatically
3. **Signing:** Unsigned builds work for testing

**Note:** iOS builds cost 10x GitHub Actions minutes (macOS runners are expensive)

### Artifacts Not Appearing

**Check:**
1. Workflow completed successfully
2. `upload-artifact` step succeeded
3. Artifacts are retained (default: 90 days for APKs)

### GitHub Pages Shows 404

**Fixes:**
1. Check file structure in deployment
2. Ensure `index.html` exists in root
3. Add `.nojekyll` file (workflow does this)
4. Check that `404.html` exists (for SPA routing)

---

## 📊 Workflow Status Badges

Add these to your README.md:

```markdown
![Deploy to GitHub Pages](https://github.com/username/repo/actions/workflows/deploy-pages.yml/badge.svg)

![CI/CD Pipeline](https://github.com/username/repo/actions/workflows/ci.yml/badge.svg)

![Create Release](https://github.com/username/repo/actions/workflows/release.yml/badge.svg)
```

---

## 🎯 Best Practices

### Branch Strategy

```
main (or master)
├── Production deployments (auto-deploy to GitHub Pages)
├── Releases created from tags
└── CI/CD runs on every push

develop
├── Development builds
├── Feature integration
└── Pre-release testing

feature/*
└── Feature development (CI only)
```

### Release Versioning

Follow [Semantic Versioning](https://semver.org/):
- `v1.0.0` - Major release
- `v1.1.0` - Minor release (new features)
- `v1.1.1` - Patch release (bug fixes)
- `v1.0.0-beta.1` - Pre-release

### Workflow Optimization

**Save CI minutes:**
1. Don't run iOS builds on every commit (expensive)
2. Use workflow conditions: `if: github.ref == 'refs/heads/main'`
3. Cache dependencies (workflows already do this)

**Faster builds:**
1. Use pnpm (faster than npm) ✅
2. Cache node_modules ✅
3. Run jobs in parallel ✅

---

## 📚 Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [GitHub Pages Documentation](https://docs.github.com/en/pages)
- [Capacitor Documentation](https://capacitorjs.com/docs)
- [Theia Documentation](https://theia-ide.org/docs/)

---

## 🆘 Getting Help

If you encounter issues:

1. **Check workflow logs** (Actions tab → Click run → View logs)
2. **Search existing issues** on GitHub
3. **Create an issue** with:
   - Workflow run link
   - Error message
   - Steps to reproduce

---

## 🎉 Quick Start Checklist

- [ ] Enable GitHub Pages (Settings → Pages → GitHub Actions)
- [ ] Push to main branch (triggers deployment)
- [ ] Wait ~5 minutes for deployment
- [ ] Visit `https://<username>.github.io/<repo>/`
- [ ] Test on mobile device
- [ ] Add to Home Screen (optional)
- [ ] Create a release tag when ready (`git tag v1.0.0`)
- [ ] Download APK from Releases page

---

**Congratulations! Your Mobile IDE is now deployed and accessible worldwide! 🌍📱**
