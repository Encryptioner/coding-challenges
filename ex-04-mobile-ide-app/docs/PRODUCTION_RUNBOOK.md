# Mobile IDE Production Runbook

**Version**: 1.0.0
**Last Updated**: 2025-11-16

This runbook provides operational procedures for running Mobile IDE in production.

---

## Table of Contents

1. [Quick Reference](#quick-reference)
2. [Common Operations](#common-operations)
3. [Troubleshooting](#troubleshooting)
4. [Incident Response](#incident-response)
5. [Maintenance](#maintenance)
6. [Performance Tuning](#performance-tuning)
7. [Security Incidents](#security-incidents)

---

## Quick Reference

### Essential Commands

```bash
# Build for production
pnpm run build:prod

# Run tests
pnpm run test:ci

# Lint and fix
pnpm run lint:fix

# Security audit
pnpm run security:audit

# Analyze bundle size
pnpm run analyze:bundle

# Build mobile apps
pnpm run build:android  # Android APK
pnpm run build:ios      # iOS IPA (macOS only)
```

### Important URLs

- **Production**: https://encryptioner.github.io/acmp-4.0-for-engineers/
- **Repository**: https://github.com/Encryptioner/acmp-4.0-for-engineers
- **GitHub Actions**: https://github.com/Encryptioner/acmp-4.0-for-engineers/actions
- **Issues**: https://github.com/Encryptioner/acmp-4.0-for-engineers/issues

### Key Metrics

- **Error Rate**: < 0.1%
- **FCP**: < 1.5s
- **LCP**: < 2.5s
- **CLS**: < 0.1
- **Uptime**: > 99.9%

---

## Common Operations

### Deploying a New Version

#### 1. Prepare Release

```bash
# Checkout main branch
git checkout main
git pull origin main

# Create release branch
git checkout -b release/v1.1.0

# Update version in package.json
# Edit manually or use npm version
npm version minor  # or patch, major

# Commit changes
git add package.json
git commit -m "Bump version to 1.1.0"

# Push release branch
git push origin release/v1.1.0
```

#### 2. Create Pull Request

- Create PR from `release/v1.1.0` to `main`
- Wait for CI checks to pass
- Get required approvals
- Merge to main

#### 3. Create Git Tag

```bash
# Tag the release
git tag v1.1.0

# Push tag (triggers deployment)
git push origin v1.1.0
```

#### 4. Monitor Deployment

- Go to GitHub Actions
- Watch deployment workflow
- Verify completion

#### 5. Verify Deployment

```bash
# Check production URL
curl -I https://encryptioner.github.io/acmp-4.0-for-engineers/

# Test critical features
# - Open application
# - Create/edit file
# - Test git operations
# - Test project runner
```

### Rolling Back a Deployment

#### Option 1: Revert via Git

```bash
# Find last good commit
git log --oneline

# Create rollback branch
git checkout -b rollback/v1.0.0 <commit-hash>

# Force push to main
git push origin rollback/v1.0.0:main --force

# Monitor deployment
```

#### Option 2: Redeploy Previous Tag

```bash
# Delete current tag
git push origin :refs/tags/v1.1.0
git tag -d v1.1.0

# Re-push previous tag
git push origin v1.0.0 --force
```

### Updating Dependencies

```bash
# Check for outdated packages
pnpm outdated

# Update specific package
pnpm update <package-name>

# Update all packages (careful!)
pnpm update

# Run security audit
pnpm run security:audit

# Run tests
pnpm run test:ci

# Commit and push
git add package.json pnpm-lock.yaml
git commit -m "Update dependencies"
git push
```

### Clearing Caches

#### Service Worker Cache

```javascript
// In browser console
navigator.serviceWorker.getRegistrations().then(registrations => {
    registrations.forEach(registration => registration.unregister());
});
```

#### Browser Cache

- Chrome: DevTools → Application → Clear Storage
- Safari: Settings → Clear History and Website Data
- Firefox: Settings → Privacy & Security → Clear Data

---

## Troubleshooting

### Application Not Loading

**Symptoms**: Blank page, 404 error, loading spinner forever

**Diagnosis**:

```bash
# Check GitHub Pages status
curl -I https://encryptioner.github.io/acmp-4.0-for-engineers/

# Check GitHub Actions
# Go to: https://github.com/Encryptioner/acmp-4.0-for-engineers/actions

# Check browser console
# Open DevTools → Console for errors
```

**Solutions**:

1. **404 Error**:
   - Verify GitHub Pages is enabled
   - Check deployment completed successfully
   - Verify correct branch/folder configured

2. **Blank Page**:
   - Check browser console for JavaScript errors
   - Verify service worker registered correctly
   - Clear browser cache and reload

3. **Loading Forever**:
   - Check network tab for failed requests
   - Verify API endpoints accessible
   - Check CORS configuration

### Performance Issues

**Symptoms**: Slow loading, laggy interactions, freezing

**Diagnosis**:

```bash
# Run Lighthouse audit
# Chrome DevTools → Lighthouse → Run Audit

# Check performance metrics
# DevTools → Performance → Record
```

**Solutions**:

1. **Slow Initial Load**:
   - Analyze bundle size: `pnpm run analyze:bundle`
   - Check for large dependencies
   - Implement code splitting

2. **Laggy Scrolling**:
   - Disable GPU acceleration in DevTools to test
   - Check for CSS animations causing repaints
   - Reduce JavaScript execution on scroll

3. **Memory Leaks**:
   - DevTools → Memory → Take heap snapshot
   - Look for detached DOM nodes
   - Check event listeners not cleaned up

### Error Tracking Issues

**Symptoms**: Errors not appearing in Sentry/error tracker

**Diagnosis**:

```bash
# Check Sentry DSN configured
echo $SENTRY_DSN

# Check error tracking enabled
echo $ENABLE_ERROR_TRACKING

# Test error reporting
# In browser console:
throw new Error('Test error');
```

**Solutions**:

1. **No Errors Logged**:
   - Verify `SENTRY_DSN` set in environment
   - Check `ENABLE_ERROR_TRACKING=true`
   - Verify Sentry SDK initialized

2. **Source Maps Missing**:
   - Upload source maps to Sentry
   - Verify `SOURCE_MAPS=true` during build
   - Check Sentry release configured

### Git Operations Failing

**Symptoms**: Cannot clone, push, or fetch repositories

**Diagnosis**:

```javascript
// Check GitHub token
console.log(localStorage.getItem('mobile-ide-tokens'));

// Check rate limit
fetch('https://api.github.com/rate_limit')
    .then(r => r.json())
    .then(console.log);
```

**Solutions**:

1. **Authentication Failed**:
   - Verify GitHub token configured
   - Check token has required permissions
   - Regenerate token if expired

2. **Rate Limit Exceeded**:
   - Wait for rate limit reset
   - Use authenticated requests (higher limit)
   - Implement request caching

### Mobile-Specific Issues

#### Keyboard Not Showing

**Diagnosis**:
- Check Capacitor keyboard plugin installed
- Verify keyboard permissions granted

**Solution**:
```javascript
// Force show keyboard
import { Keyboard } from '@capacitor/keyboard';
await Keyboard.show();
```

#### Touch Gestures Not Working

**Diagnosis**:
- Check `touch-action` CSS property
- Verify gesture library initialized

**Solution**:
- Ensure `touch-action: none` on gesture containers
- Check for conflicting event listeners

---

## Incident Response

### Severity Levels

- **P0 (Critical)**: Complete outage, data loss, security breach
- **P1 (High)**: Major feature broken, affecting >50% users
- **P2 (Medium)**: Minor feature broken, affecting <50% users
- **P3 (Low)**: Cosmetic issue, no functional impact

### Incident Response Process

#### 1. Detection (0-5 minutes)

- Monitor alerts (error rate, performance metrics)
- User reports
- Automated monitoring triggers

#### 2. Assessment (5-15 minutes)

```bash
# Check application health
curl https://encryptioner.github.io/acmp-4.0-for-engineers/

# Check GitHub Actions
# Visit: https://github.com/Encryptioner/acmp-4.0-for-engineers/actions

# Check error logs
# - Browser console
# - Sentry dashboard
# - GitHub Pages logs

# Determine severity
# - How many users affected?
# - What functionality impacted?
# - Is data at risk?
```

#### 3. Communication (Immediately)

- Notify team in Slack/Teams
- Create incident channel
- Update status page (if applicable)
- Notify affected users (if P0/P1)

#### 4. Mitigation (15-60 minutes)

**P0 - Complete Outage**:
```bash
# Immediate rollback
git checkout -b rollback $(git describe --tags --abbrev=0)
git push origin rollback:main --force
```

**P1 - Major Feature Broken**:
- Quick fix if possible (<30 min)
- Otherwise, rollback affected feature
- Deploy hotfix

**P2/P3**:
- Schedule fix in next release
- Document workaround

#### 5. Resolution

- Verify fix deployed
- Test affected functionality
- Monitor error rates
- Confirm with users

#### 6. Post-Mortem

- Write incident report
- Document timeline
- Identify root cause
- Create action items
- Update runbook

---

## Maintenance

### Weekly Tasks

- [ ] Review error logs
- [ ] Check performance metrics
- [ ] Review security alerts
- [ ] Update dependencies (if needed)
- [ ] Check disk usage (if applicable)

### Monthly Tasks

- [ ] Full security audit
- [ ] Performance audit
- [ ] Dependency updates
- [ ] Review access controls
- [ ] Test backup/restore (if applicable)
- [ ] Review and update documentation

### Quarterly Tasks

- [ ] Disaster recovery drill
- [ ] Security penetration test
- [ ] Capacity planning review
- [ ] Architecture review
- [ ] Update runbook and checklist

---

## Performance Tuning

### Analyzing Bundle Size

```bash
# Build and analyze
pnpm run build:prod
pnpm run analyze:bundle

# Look for:
# - Large dependencies (>100KB)
# - Duplicate code
# - Unused code
```

### Optimizing Images

```bash
# Install optimization tools
npm install -g imagemin-cli

# Optimize images
imagemin public/*.png --out-dir=public/optimized
imagemin public/*.jpg --out-dir=public/optimized --plugin=mozjpeg
```

### Lazy Loading

```typescript
// Lazy load heavy components
const HeavyComponent = React.lazy(() => import('./HeavyComponent'));

// Use with Suspense
<Suspense fallback={<Loading />}>
    <HeavyComponent />
</Suspense>
```

### Caching Strategy

```javascript
// Adjust service worker cache
const CACHE_MAX_AGE = 3600000; // 1 hour

// Add to cache on install
cache.addAll([
    '/',
    '/static/css/main.css',
    '/static/js/main.js'
]);
```

---

## Security Incidents

### Suspected Security Breach

**Immediate Actions**:

1. **Isolate**: Disable affected functionality
2. **Assess**: Determine scope of breach
3. **Notify**: Inform security team and management
4. **Investigate**: Review logs, access patterns

### Vulnerability Disclosure

```bash
# Check for vulnerabilities
pnpm audit

# Fix automatically if possible
pnpm audit --fix

# For manual fixes:
# - Review CVE details
# - Test fix in development
# - Deploy urgently if critical
```

### API Key Leaked

1. **Revoke** immediately
2. **Rotate** to new key
3. **Update** environment variables
4. **Deploy** new version
5. **Review** logs for unauthorized usage

---

## Appendix

### Useful Scripts

#### Check Application Health

```bash
#!/bin/bash
URL="https://encryptioner.github.io/acmp-4.0-for-engineers/"

# Check HTTP status
STATUS=$(curl -s -o /dev/null -w "%{http_code}" $URL)

if [ $STATUS -eq 200 ]; then
    echo "✓ Application is healthy"
else
    echo "✗ Application returned $STATUS"
    exit 1
fi
```

#### Monitor Error Rate

```bash
#!/bin/bash
# Query Sentry API for error rate
# Requires: SENTRY_AUTH_TOKEN

curl -H "Authorization: Bearer $SENTRY_AUTH_TOKEN" \
     "https://sentry.io/api/0/organizations/YOUR_ORG/stats/" \
     | jq '.errors'
```

---

*This runbook is a living document. Update it as you learn new operational procedures.*
