# 🚀 GitHub Pages Setup - Quick Guide

## Enable GitHub Pages in 3 Steps

### Step 1: Go to Repository Settings
1. Click on **Settings** tab (top of repository page)
2. Scroll down to **Pages** section (left sidebar)

### Step 2: Configure Source
Under "Build and deployment":
- **Source:** Select **GitHub Actions** (from dropdown)
- Click **Save** if prompted

![GitHub Pages Settings](https://docs.github.com/assets/cb-47267/mw-1440/images/help/pages/github-actions-source.webp)

### Step 3: Trigger Deployment
```bash
# Option 1: Push to master branch (triggers automatic deployment)
git push origin master

# Option 2: Manually trigger from Actions tab
# Go to Actions → Deploy to GitHub Pages → Run workflow
```

---

## ✅ Verify Deployment

After ~5 minutes, check:

1. **Actions tab** - Workflow should show green checkmark ✅
2. **Settings → Pages** - Should show:
   ```
   Your site is live at https://<username>.github.io/<repo>/
   ```
3. **Visit the URL** - Your Mobile IDE should load!

---

## 📱 Access Your IDE

### On Desktop Browser
```
https://<username>.github.io/<repo>/
```

### On Mobile Device

**iOS (Safari):**
1. Open the URL
2. Tap Share button (square with arrow)
3. Scroll and tap "Add to Home Screen"
4. Name it "Mobile IDE"
5. Tap "Add"
6. Now accessible from home screen like a native app!

**Android (Chrome):**
1. Open the URL
2. Tap menu (three dots)
3. Tap "Install app" or "Add to Home screen"
4. Confirm
5. Now accessible from app drawer!

---

## 🔧 Customization (Optional)

### Custom Domain

If you have a custom domain:

1. **Add CNAME file:**
   ```bash
   echo "your-domain.com" > mobile-ide-app/lib/CNAME
   git add mobile-ide-app/lib/CNAME
   git commit -m "Add custom domain"
   git push
   ```

2. **Configure DNS** (at your domain registrar):
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

### Change Deployment Branch

Edit `.github/workflows/deploy-pages.yml`:
```yaml
on:
  push:
    branches: [ your-branch-name ]  # Change 'master' to your branch
```

---

## 🎯 What Happens When You Push?

```mermaid
graph LR
    A[Push to master] --> B[GitHub Actions triggered]
    B --> C[Install dependencies]
    C --> D[Build Theia production]
    D --> E[Create SPA files]
    E --> F[Deploy to GitHub Pages]
    F --> G[Live at github.io URL]
```

**Timeline:**
- Install dependencies: ~2-3 minutes
- Build Theia: ~3-5 minutes
- Deploy: ~30 seconds
- **Total: ~5-8 minutes**

---

## 📊 Monitor Deployment Status

### Via GitHub UI
1. Go to **Actions** tab
2. Click on the latest "Deploy to GitHub Pages" run
3. Watch the progress in real-time
4. Green checkmark = Success!

### Via GitHub CLI
```bash
# Install GitHub CLI: https://cli.github.com/

# Watch the latest workflow
gh run watch

# View specific run
gh run view <run-id> --log
```

---

## 🐛 Troubleshooting

### Pages Not Showing

**Check:**
- [ ] GitHub Pages is enabled (Settings → Pages)
- [ ] Source is "GitHub Actions" (not "Deploy from branch")
- [ ] Workflow completed successfully (Actions tab)
- [ ] Waited at least 5 minutes after deployment

**Fix:**
```bash
# Trigger manual deployment
# Go to: Actions → Deploy to GitHub Pages → Run workflow
```

### Build Failed

**Common Issues:**

1. **Out of memory**
   - Workflow uses 8GB (`NODE_OPTIONS: '--max-old-space-size=8192'`)
   - Should be sufficient for most cases

2. **Dependencies failed**
   ```bash
   # Delete node_modules and reinstall locally to test
   cd mobile-ide-app
   rm -rf node_modules package-lock.json
   pnpm install
   pnpm run build:prod
   ```

3. **Check workflow logs**
   - Actions → Click failed run → Click job → Expand steps
   - Look for red X marks and error messages

### Site Shows 404

**Solutions:**
- Ensure `index.html` exists in build output
- Check that workflow creates `.nojekyll` file (it does)
- Verify `404.html` is created (for SPA routing)
- Wait a few minutes for GitHub's CDN to update

---

## 🎨 Customize Your IDE

Once deployed, you can customize:

**Via Repository:**
1. Edit `mobile-ide-app/package.json` - Change app name
2. Edit `mobile-ide-app/public/manifest.json` - PWA settings
3. Add your own themes/extensions
4. Push changes - Auto-deploys!

**Via GitHub Pages URL:**
- Share the link with your team
- Access from any device
- Works offline (PWA)
- No installation required (except "Add to Home Screen")

---

## 📈 Usage Statistics

GitHub Pages provides basic analytics:

1. Go to **Insights** tab
2. Click **Traffic**
3. View page views and unique visitors

For detailed analytics, add Google Analytics:
- Edit build output to include analytics script
- Or use GitHub Pages Jekyll integration

---

## 🔒 Security & Privacy

**Important Notes:**

- GitHub Pages is **public** by default
- Anyone with the URL can access your IDE
- Don't store sensitive code/credentials
- Use private repository + authentication if needed

**For Private Deployment:**
- Use GitHub Enterprise (supports private Pages)
- Or deploy to your own server (see DEPLOYMENT.md)
- Or use Cloudflare Pages / Vercel / Netlify with authentication

---

## 🎁 Bonus: Workflow Badges

Add build status badges to your README:

```markdown
![Deploy Status](https://github.com/username/repo/actions/workflows/deploy-pages.yml/badge.svg)
```

Renders as: ![Deploy Status](badge-image-here)

---

## 📚 Next Steps

After GitHub Pages is set up:

1. ✅ Test on desktop browser
2. ✅ Test on mobile device
3. ✅ Add to Home Screen
4. ✅ Create a release (`git tag v1.0.0`)
5. ✅ Share with others!

---

## 🆘 Need Help?

- **Workflow logs:** Actions tab → Click run → View details
- **GitHub Docs:** [GitHub Pages Documentation](https://docs.github.com/en/pages)
- **Deployment Guide:** See [DEPLOYMENT.md](../DEPLOYMENT.md) for advanced topics

---

**That's it! Your Mobile IDE is now live on GitHub Pages! 🎉**

Access it anytime from any device at:
```
https://<your-username>.github.io/<repository-name>/
```
