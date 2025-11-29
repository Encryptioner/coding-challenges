# 🚀 Deployment Guide for Browser IDE

This guide will walk you through deploying Browser IDE to GitHub Pages.

## Prerequisites

- GitHub account
- Git installed locally
- Node.js 18+ installed

## Step 1: Prepare Your Repository

1. Create a new repository on GitHub:
   - Go to https://github.com/new
   - Name it `browser-ide` (or any name you prefer)
   - Make it public (required for free GitHub Pages)
   - Don't initialize with README (we already have one)

2. Push the code to your repository:

```bash
cd browser-ide
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/browser-ide.git
git push -u origin main
```

## Step 2: Configure GitHub Pages

### Option A: Using GitHub Actions (Recommended)

1. Go to your repository on GitHub
2. Click **Settings** → **Pages**
3. Under "Source", select **GitHub Actions**
4. The workflow is already configured in `.github/workflows/deploy.yml`
5. Push any commit to trigger deployment:

```bash
git commit --allow-empty -m "Trigger deployment"
git push
```

6. Wait for the action to complete (check the **Actions** tab)
7. Your site will be live at: `https://YOUR_USERNAME.github.io/browser-ide/`

### Option B: Using npm deploy command

1. Install gh-pages:
```bash
npm install -g gh-pages
```

2. Update `vite.config.js` base path:
```js
base: '/browser-ide/', // Your repo name
```

3. Deploy:
```bash
npm run deploy
```

4. Enable GitHub Pages:
   - Go to Settings → Pages
   - Source: Deploy from branch
   - Branch: `gh-pages` / `root`
   - Save

5. Your site will be live at: `https://YOUR_USERNAME.github.io/browser-ide/`

## Step 3: Verify Deployment

1. Visit your site URL
2. Check for these headers (required for WebContainers):
   - `Cross-Origin-Embedder-Policy: require-corp`
   - `Cross-Origin-Opener-Policy: same-origin`

3. Test basic functionality:
   - Open the site
   - Try to clone a repository (you'll need to add GitHub token in settings)
   - Check if files load
   - Try editing a file

## Step 4: Configure for Your Needs

### Update Site Metadata

Edit `index.html`:
```html
<title>Your IDE Name</title>
<meta name="description" content="Your description" />
```

Edit `vite.config.js` for your repo name:
```js
base: '/your-repo-name/',
```

Edit `public/manifest.json`:
```json
{
  "name": "Your IDE Name",
  "short_name": "Your IDE"
}
```

### Custom Domain (Optional)

1. Add a CNAME file to `public/`:
```bash
echo "ide.yourdomain.com" > public/CNAME
```

2. Configure DNS:
   - Add a CNAME record pointing to `YOUR_USERNAME.github.io`

3. In GitHub:
   - Settings → Pages → Custom domain
   - Enter `ide.yourdomain.com`
   - Enable HTTPS

## Step 5: Post-Deployment

### Add Required Headers

GitHub Pages should automatically set the required headers. If WebContainers don't work:

1. Check browser console for COOP/COEP errors
2. Verify headers using browser DevTools (Network tab)
3. If headers are missing, you may need to use a different hosting service

### Alternative Hosting Options

If GitHub Pages doesn't work for WebContainers:

#### Vercel
```bash
npm install -g vercel
vercel --prod
```

Vercel automatically sets correct headers for WebContainers.

#### Netlify
```bash
npm install -g netlify-cli
netlify deploy --prod
```

Add `_headers` file to public/:
```
/*
  Cross-Origin-Embedder-Policy: require-corp
  Cross-Origin-Opener-Policy: same-origin
```

#### Cloudflare Pages

1. Connect your GitHub repo to Cloudflare Pages
2. Build command: `npm run build`
3. Output directory: `dist`
4. Add required headers in Cloudflare dashboard

## Troubleshooting

### Build Fails

**Error:** `Cannot find module '@webcontainer/api'`

**Solution:**
```bash
npm install
npm run build
```

### WebContainers Don't Work

**Error:** "SharedArrayBuffer is not defined"

**Solution:**
- Ensure COOP and COEP headers are set
- Check browser console for specific errors
- Try using Vercel instead of GitHub Pages

### Assets Not Loading

**Error:** 404 on CSS/JS files

**Solution:**
- Check `vite.config.js` base path matches your repo name
- Should be `/browser-ide/` not `/`

### PWA Not Installing

**Error:** No install prompt appears

**Solution:**
- Ensure site is served over HTTPS
- Check manifest.json is accessible
- Verify service worker is registered
- Test in Chrome/Edge (better PWA support)

## Performance Optimization

### Enable Caching

Service worker already caches assets for offline use.

### Optimize Bundle Size

Already configured with code splitting in `vite.config.js`:
- Monaco Editor (separate chunk)
- Git operations (separate chunk)
- Terminal (separate chunk)

### Compress Assets

Enable Gzip/Brotli compression in hosting:

**Netlify:** Automatic
**Vercel:** Automatic
**GitHub Pages:** Limited (consider using Cloudflare)

## Security Considerations

### API Keys

- All keys stored in browser localStorage/IndexedDB
- Never committed to repository
- Each user must add their own keys

### Content Security Policy

Consider adding CSP headers for production:

```html
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; 
               script-src 'self' 'unsafe-eval' 'unsafe-inline';
               connect-src 'self' https://api.anthropic.com https://api.github.com;">
```

## Monitoring

### Analytics

Add Google Analytics or Plausible:

```html
<!-- Add to index.html -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
```

### Error Tracking

Consider adding Sentry for error monitoring:

```bash
npm install @sentry/react
```

## Updates

### Automatic Updates

Service worker automatically checks for updates.

### Manual Updates

Users can:
1. Clear browser cache
2. Hard refresh (Ctrl+Shift+R)
3. Reinstall PWA

## Backup Strategy

### User Data

Since all data is in browser:
1. Users should regularly push to GitHub
2. Consider adding export/import functionality
3. Use browser's backup tools (Chrome Sync, etc.)

## Next Steps

1. ✅ Deploy to GitHub Pages
2. ✅ Test all functionality
3. ✅ Add your GitHub token in settings
4. ✅ Add Anthropic API key
5. ✅ Clone your first repository
6. ✅ Start coding!

## Support

If you encounter issues:
1. Check the troubleshooting section
2. Review browser console for errors
3. Open an issue on GitHub
4. Check WebContainers documentation

## Resources

- [GitHub Pages Documentation](https://docs.github.com/en/pages)
- [WebContainers API](https://webcontainers.io)
- [Vite PWA Plugin](https://vite-pwa-org.netlify.app/)
- [Monaco Editor](https://microsoft.github.io/monaco-editor/)

---

Happy Coding! 🎉
