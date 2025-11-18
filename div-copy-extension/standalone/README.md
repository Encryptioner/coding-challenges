# TextCopy - Standalone JavaScript Library

Add one-click copy functionality to any website with just a single `<script>` tag. No dependencies, no build tools, works everywhere.

## ⚡ Quick Start

### Option 1: CDN (Recommended)

```html
<!DOCTYPE html>
<html>
<head>
  <title>My Website</title>
</head>
<body>
  <div>Click or long-press any element to copy its content!</div>

  <!-- Add TextCopy -->
  <script src="https://cdn.example.com/textcopy.min.js"></script>
  <script>
    TextCopy.init();
  </script>
</body>
</html>
```

### Option 2: Self-Hosted

1. Download `textcopy.js` or `textcopy.min.js`
2. Add to your website:

```html
<script src="/path/to/textcopy.min.js"></script>
<script>
  TextCopy.init();
</script>
```

That's it! 🎉

## 📱 Features

### Works on All Devices
- **Desktop**: Right-click context menu + hover highlighting
- **Mobile**: Long-press with touch-friendly menu
- **Tablets**: Automatically detects and adapts

### Copy Formats
1. **Plain Text** - Clean text without formatting
2. **HTML** - Raw HTML structure
3. **Styled HTML** - HTML with inline CSS
4. **CSS Selector** - Unique element selector

### Responsive & Accessible
- ✅ Works on all screen sizes (320px to 4K)
- ✅ Dark mode support
- ✅ High contrast mode support
- ✅ Reduced motion support
- ✅ Screen reader friendly
- ✅ Touch and mouse support
- ✅ Keyboard accessible

## ⚙️ Configuration

### Basic Configuration

```html
<script>
  TextCopy.init({
    mode: 'auto',              // 'auto', 'desktop', 'mobile'
    showTooltips: true,
    copyFormat: 'text',        // 'text', 'html', 'styled', 'selector'
    highlightColor: '#4CAF50'
  });
</script>
```

### Advanced Configuration

```html
<script>
  TextCopy.init({
    mode: 'auto',              // Force desktop/mobile mode, or auto-detect
    showTooltips: true,        // Show "click to copy" tooltips
    copyFormat: 'text',        // Default copy format
    highlightColor: '#4CAF50', // Highlight color (any CSS color)
    longPressDuration: 500,    // Long-press duration in ms (mobile)
    toastDuration: 2000,       // Toast notification duration in ms
    mobileBreakpoint: 768,     // Mobile detection breakpoint in px
    enableStats: true,         // Enable copy statistics
    excludeSelectors: [        // Elements to exclude
      '.no-copy',
      '#footer',
      'button',
      'input'
    ],
    onCopy: function(data) {   // Callback when content is copied
      console.log('Copied:', data.format, data.length, 'chars');
      // Send to analytics, etc.
    }
  });
</script>
```

## 📖 Usage Examples

### Example 1: Blog Website

```html
<!DOCTYPE html>
<html>
<head>
  <title>My Blog</title>
</head>
<body>
  <article>
    <h1>Article Title</h1>
    <p>This is some content that users can easily copy...</p>
  </article>

  <script src="textcopy.min.js"></script>
  <script>
    TextCopy.init({
      excludeSelectors: ['header', 'nav', 'footer'],
      onCopy: function(data) {
        // Track copies in analytics
        gtag('event', 'copy', {
          'format': data.format,
          'length': data.length
        });
      }
    });
  </script>
</body>
</html>
```

### Example 2: Documentation Site

```html
<script src="textcopy.min.js"></script>
<script>
  TextCopy.init({
    copyFormat: 'html',        // Default to HTML for code blocks
    highlightColor: '#007bff', // Brand color
    showTooltips: true,
    excludeSelectors: [
      'nav',
      '.sidebar',
      'footer'
    ]
  });
</script>
```

### Example 3: Mobile-First Website

```html
<script src="textcopy.min.js"></script>
<script>
  TextCopy.init({
    mode: 'mobile',           // Force mobile mode always
    longPressDuration: 400,   // Shorter long-press
    showTooltips: true,
    onCopy: function(data) {
      console.log('Mobile copy:', data.format);
    }
  });
</script>
```

### Example 4: E-commerce Product Pages

```html
<script src="textcopy.min.js"></script>
<script>
  TextCopy.init({
    excludeSelectors: [
      '.price',          // Don't allow copying prices
      '.buy-button',     // Don't allow copying buttons
      '.checkout'
    ],
    highlightColor: '#ff6b6b',
    onCopy: function(data) {
      // Track what users copy (for UX research)
      analytics.track('content_copied', {
        format: data.format,
        length: data.length
      });
    }
  });
</script>
```

## 🎨 Styling & Customization

### Custom Highlight Color

```html
<script>
  TextCopy.init({
    highlightColor: '#9c27b0'  // Purple highlight
  });
</script>
```

### Custom CSS (Override Styles)

```html
<style>
  /* Override tooltip style */
  .textcopy-highlighted::after {
    background: #ff5722 !important;
    font-size: 12px !important;
  }

  /* Override menu style */
  .textcopy-menu {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
    border-radius: 20px !important;
  }

  /* Override button style */
  .textcopy-btn {
    background: rgba(255,255,255,0.2) !important;
    color: white !important;
  }
</style>
```

## 📊 Statistics & Tracking

### Enable Statistics

```html
<script>
  TextCopy.init({
    enableStats: true
  });

  // Get statistics
  setTimeout(function() {
    const stats = TextCopy.getStats();
    console.log('Total copies:', stats.totalCopies);
    console.log('Session copies:', stats.sessionCopies);
  }, 5000);
</script>
```

### Track Copies with Analytics

```html
<script>
  TextCopy.init({
    onCopy: function(data) {
      // Google Analytics 4
      gtag('event', 'copy_content', {
        'format': data.format,
        'content_length': data.length
      });

      // or Mixpanel
      mixpanel.track('Content Copied', {
        format: data.format,
        length: data.length
      });

      // or custom endpoint
      fetch('/api/track-copy', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    }
  });
</script>
```

## 🚫 Excluding Elements

### Exclude Specific Elements

```html
<script>
  TextCopy.init({
    excludeSelectors: [
      '.no-copy',          // Any element with class "no-copy"
      '#header',           // Element with ID "header"
      'nav',               // All <nav> elements
      'button',            // All buttons
      'input',             // All inputs
      '[data-no-copy]'     // Elements with data-no-copy attribute
    ]
  });
</script>
```

### Using HTML Attributes

```html
<!-- Add data-no-copy to prevent copying -->
<div data-no-copy>
  This content cannot be copied
</div>

<script>
  TextCopy.init({
    excludeSelectors: ['[data-no-copy]']
  });
</script>
```

## 🔧 API Reference

### TextCopy.init(options)

Initialize TextCopy with configuration options.

```javascript
TextCopy.init({
  mode: 'auto',              // 'auto', 'desktop', 'mobile'
  showTooltips: true,
  copyFormat: 'text',
  highlightColor: '#4CAF50',
  longPressDuration: 500,
  toastDuration: 2000,
  mobileBreakpoint: 768,
  enableStats: false,
  onCopy: null,
  excludeSelectors: []
});
```

### TextCopy.getStats()

Get copy statistics.

```javascript
const stats = TextCopy.getStats();
// Returns: { totalCopies: 10, sessionCopies: 5 }
```

### TextCopy.destroy()

Remove TextCopy from the page.

```javascript
TextCopy.destroy();
```

### TextCopy.version

Get version string.

```javascript
console.log(TextCopy.version); // "1.0.0"
```

## 📱 Mobile Support

TextCopy automatically detects mobile devices and enables touch-friendly interactions:

- **Long-press** (500ms by default) to activate copy menu
- **Floating action buttons** with large touch targets
- **Haptic feedback** on supported devices
- **Auto-dismiss** after 10 seconds
- **Responsive** design for all screen sizes

### Force Mobile Mode

```html
<script>
  TextCopy.init({
    mode: 'mobile'  // Always use mobile UI
  });
</script>
```

## 🌐 Browser Compatibility

| Browser | Desktop | Mobile | Notes |
|---------|---------|--------|-------|
| Chrome 88+ | ✅ | ✅ | Full support |
| Edge 88+ | ✅ | ✅ | Full support |
| Firefox 90+ | ✅ | ✅ | Full support |
| Safari 14+ | ✅ | ⚠️ | Context menu limited |
| Opera 74+ | ✅ | ✅ | Full support |
| Samsung Internet | ❌ | ✅ | Mobile only |

## 📦 File Sizes

| File | Size | Gzipped |
|------|------|---------|
| textcopy.js | ~25 KB | ~7 KB |
| textcopy.min.js | ~12 KB | ~4 KB |

## 🔒 Security & Privacy

- ✅ No external dependencies
- ✅ No data collection
- ✅ No tracking (unless you enable it)
- ✅ No network requests
- ✅ Works offline
- ✅ No cookies
- ✅ localStorage only for stats (optional)

## 🐛 Troubleshooting

### TextCopy not working

1. Check browser console for errors
2. Ensure script loaded: `console.log(TextCopy)`
3. Initialize manually: `TextCopy.init()`
4. Check if elements are excluded

### Copy not working

1. Check clipboard permissions
2. Try fallback: Use older browser
3. Check HTTPS: Clipboard API requires secure context

### Menu not appearing

1. Check if mobile mode is enabled correctly
2. Try longer long-press duration
3. Check excludeSelectors configuration

### Styling conflicts

1. Use `!important` to override
2. Check CSS specificity
3. Load TextCopy CSS last

## 💡 Tips & Best Practices

1. **Load at end of body** for best performance
2. **Exclude navigation** and footer elements
3. **Use onCopy callback** for analytics
4. **Test on real devices** for mobile
5. **Customize colors** to match your brand
6. **Enable stats** to track usage
7. **Don't copy sensitive data** (passwords, etc.)

## 📄 License

MIT License - Free to use in personal and commercial projects.

## 🙏 Credits

Similar to WordPress plugins:
- Copy Anything to Clipboard
- DivMagic
- Copy to Clipboard for WordPress

## 📧 Support

- 📖 [Documentation](https://github.com/your-repo/textcopy)
- 🐛 [Report Issues](https://github.com/your-repo/textcopy/issues)
- 💡 [Feature Requests](https://github.com/your-repo/textcopy/issues)

---

**Made with ❤️ for the web**
