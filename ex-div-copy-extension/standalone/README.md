# TextCopy - Automatic Copy Buttons for Any Website

**For Website Owners**: Add ONE script tag to your website
**For Visitors**: Copy buttons appear automatically - no installation needed!

Your visitors will see copy buttons appear automatically when they hover over content. It works just like a built-in website feature - seamless and intuitive.

## ⚡ Quick Start (Website Owners)

### Step 1: Add the Script

Add this to your website (before closing `</body>` tag):

```html
<!DOCTYPE html>
<html>
<head>
  <title>My Website</title>
</head>
<body>
  <h1>My Blog Post</h1>
  <p>This paragraph now has an automatic copy button!</p>

  <!-- Add TextCopy - That's it! -->
  <script src="textcopy-auto.js"></script>
  <script>
    TextCopy.init();
  </script>
</body>
</html>
```

### Step 2: Done!

That's literally it. Your visitors now see automatic copy buttons when they hover over:
- Paragraphs
- Headings
- Code blocks
- Quotes
- List items
- Any text content

**No installation for visitors. No configuration needed. It just works.**

## 👥 What Your Visitors Experience

1. **They visit your website** (normal browsing, nothing to install)
2. **They hover over content** (paragraph, code block, heading, etc.)
3. **A "Copy" button appears** automatically in the corner
4. **They click it** - content copied to clipboard!
5. **They see confirmation** "✓ Copied!" message

**Zero effort for visitors** - it feels like a built-in browser feature.

## 📱 Features

### Automatic Copy Buttons
- **Hover to Reveal**: Copy buttons appear automatically when hovering over content
- **One-Click Copy**: Visitors click the button - content copied instantly
- **Visual Feedback**: "✓ Copied!" confirmation toast
- **No Installation**: Works immediately for all visitors
- **No Configuration**: Zero setup needed for visitors

### Works on All Devices
- **Desktop**: Hover-to-reveal copy buttons
- **Mobile**: Tap-friendly buttons with large touch targets
- **Tablets**: Automatically detects and adapts
- **All Screen Sizes**: 320px to 4K+ displays

### Copy Formats
- **Plain Text** (default) - Clean text without formatting
- **HTML** (optional) - Raw HTML structure with tags

### Visitor-Friendly Design
- ✅ Zero installation required
- ✅ Works on first visit
- ✅ Touch and mouse support
- ✅ Mobile responsive (all screen sizes)
- ✅ Accessible and keyboard-friendly
- ✅ Fast and lightweight (~12KB minified)

## ⚙️ Configuration (Optional for Website Owners)

Most website owners don't need any configuration - the defaults work great! But you can customize if needed:

### Basic Configuration

```html
<script>
  TextCopy.init({
    buttonColor: '#FF5722',      // Change button color
    buttonText: 'Copy This',     // Change button text
    buttonPosition: 'top-left',  // 'top-right', 'top-left'
    showOnHover: true,           // Show button on hover (recommended)
    copyFormat: 'text',          // 'text' or 'html'
    showToast: true              // Show "Copied!" confirmation
  });
</script>
```

### Advanced Configuration

```html
<script>
  TextCopy.init({
    // What elements get copy buttons
    autoTarget: 'p, pre, code, blockquote, h1, h2, h3',

    // Button appearance
    buttonText: 'Copy',
    copiedText: '✓ Copied!',
    buttonColor: '#4CAF50',
    buttonPosition: 'top-right',  // 'top-right', 'top-left'
    showOnHover: true,            // Show only on hover (recommended)

    // Behavior
    copyFormat: 'text',           // 'text' or 'html'
    showToast: true,
    toastDuration: 2000,

    // Exclude specific elements
    excludeSelectors: [
      '.no-copy',
      'nav',
      'footer',
      'button'
    ],

    // Analytics callback
    onCopy: function(data) {
      console.log('Copied:', data.length, 'chars');
      // Track in Google Analytics, Mixpanel, etc.
    }
  });
</script>
```

## 📖 Real-World Examples

### Example 1: Blog Website

Perfect for blogs where readers want to quote or share content:

```html
<!DOCTYPE html>
<html>
<head>
  <title>My Blog</title>
</head>
<body>
  <article>
    <h1>Article Title</h1>
    <p>Your readers can now easily copy and share this content...</p>
    <blockquote>Quotes are especially easy to copy!</blockquote>
  </article>

  <!-- Add TextCopy -->
  <script src="textcopy-auto.js"></script>
  <script>
    TextCopy.init({
      excludeSelectors: ['header', 'nav', 'footer'],
      onCopy: function(data) {
        // Track what readers copy (optional)
        gtag('event', 'copy', { length: data.length });
      }
    });
  </script>
</body>
</html>
```

**Visitor Experience**: Readers hover over paragraphs/quotes, see copy button, click to copy - perfect for sharing on social media!

### Example 2: Documentation Site

Great for code tutorials where developers need to copy examples:

```html
<script src="textcopy-auto.js"></script>
<script>
  TextCopy.init({
    buttonColor: '#007bff',  // Match your brand
    excludeSelectors: ['nav', '.sidebar', 'footer']
  });
</script>
```

**Visitor Experience**: Developers hover over code blocks, click copy button - no more manual text selection!

### Example 3: Educational Website

Students can easily copy definitions, formulas, and explanations:

```html
<script src="textcopy-auto.js"></script>
<script>
  TextCopy.init({
    buttonText: 'Copy to Notes',
    buttonColor: '#9c27b0'
  });
</script>
```

**Visitor Experience**: Students hover over key concepts, click to add to their notes - makes studying easier!

### Example 4: Product Documentation

Users can copy product specs, model numbers, and instructions:

```html
<script src="textcopy-auto.js"></script>
<script>
  TextCopy.init({
    excludeSelectors: ['.price', '.buy-button'],
    onCopy: function(data) {
      // Track what users find most useful
      analytics.track('content_copied', { length: data.length });
    }
  });
</script>
```

**Visitor Experience**: Customers hover over specs, copy product details to compare or share with others.

## 🎨 Styling & Customization

### Custom Button Colors

Match your website's branding:

```html
<script>
  TextCopy.init({
    buttonColor: '#9c27b0'  // Purple buttons
  });
</script>
```

### Custom CSS (Advanced)

Override default styles with your own CSS:

```html
<style>
  /* Customize copy button appearance */
  .textcopy-btn {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
    border-radius: 20px !important;
    font-weight: bold !important;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15) !important;
  }

  /* Customize hover effect */
  .textcopy-btn:hover {
    transform: scale(1.05) !important;
  }

  /* Customize toast notification */
  .textcopy-toast {
    background: #4CAF50 !important;
    font-size: 14px !important;
  }
</style>
```

## 📊 Analytics & Tracking

### Track What Visitors Copy

Understand what content is most valuable to your visitors:

```html
<script>
  TextCopy.init({
    onCopy: function(data) {
      // Google Analytics 4
      gtag('event', 'copy_content', {
        'content_length': data.length
      });
    }
  });
</script>
```

### Advanced Analytics

```html
<script>
  TextCopy.init({
    onCopy: function(data) {
      // Track in Mixpanel
      mixpanel.track('Content Copied', {
        length: data.length,
        format: data.format
      });

      // Or send to your own API
      fetch('/api/track-copy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          length: data.length,
          timestamp: new Date().toISOString()
        })
      });
    }
  });
</script>
```

**What You Can Learn**:
- Which content is most copied (valuable content)
- When visitors copy content (engagement patterns)
- How often copy feature is used (feature adoption)

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
  // What elements get copy buttons
  autoTarget: 'p, pre, code, blockquote, h1, h2, h3, h4, h5, h6, li',

  // Button appearance
  buttonText: 'Copy',
  copiedText: '✓ Copied!',
  buttonColor: '#4CAF50',
  buttonPosition: 'top-right',  // 'top-right', 'top-left'
  showOnHover: true,            // Show button only on hover

  // Behavior
  copyFormat: 'text',           // 'text' or 'html'
  showToast: true,
  toastDuration: 2000,

  // Advanced
  excludeSelectors: [],
  onCopy: null                  // Callback function
});
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

TextCopy works perfectly on mobile devices with touch-friendly design:

- **Large Touch Targets**: Buttons are sized appropriately for fingers
- **Tap to Copy**: Visitors tap the copy button (no long-press needed)
- **Responsive Design**: Works on all screen sizes (320px to tablets)
- **Touch-Optimized**: Detects touch devices and adjusts accordingly

**For Visitors**: On mobile, copy buttons appear when you tap on content. Tap the copy button to copy instantly!

## 🌐 Browser Compatibility

Works on all modern browsers with full clipboard API support:

| Browser | Desktop | Mobile | Notes |
|---------|---------|--------|-------|
| Chrome 88+ | ✅ | ✅ | Full support |
| Edge 88+ | ✅ | ✅ | Full support |
| Firefox 90+ | ✅ | ✅ | Full support |
| Safari 14+ | ✅ | ✅ | Full support |
| Opera 74+ | ✅ | ✅ | Full support |
| Samsung Internet | ✅ | ✅ | Full support |

**HTTPS Required**: Modern browsers require HTTPS for clipboard API. Works on localhost for development.

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

### Copy buttons not appearing

1. **Check script loaded**: Open browser console and type `console.log(TextCopy)`
2. **Verify initialization**: Make sure you called `TextCopy.init()`
3. **Check excluded elements**: Verify element isn't in `excludeSelectors` list
4. **Hover over content**: Buttons appear on hover (if `showOnHover: true`)

### Copy not working

1. **HTTPS required**: Clipboard API requires HTTPS (or localhost for testing)
2. **Check browser console**: Look for permission errors
3. **Try different browser**: Test in Chrome/Edge/Firefox

### Buttons not visible on hover

1. **Check CSS conflicts**: Your CSS might be hiding the buttons
2. **Verify showOnHover setting**: Set to `true` in config
3. **Try different position**: Change `buttonPosition` to 'top-left'

### Styling conflicts

1. **Use !important**: Override TextCopy styles with `!important`
2. **Check CSS specificity**: Ensure your CSS loads after TextCopy
3. **Inspect element**: Use browser DevTools to debug styles

## 💡 Tips & Best Practices

**For Website Owners:**

1. **Load at end of body** - Better performance, buttons appear after content loads
2. **Exclude navigation** - Don't add copy buttons to nav, footer, buttons
   ```javascript
   excludeSelectors: ['nav', 'footer', 'button', '.no-copy']
   ```
3. **Match your brand** - Customize button color to match your website
   ```javascript
   buttonColor: '#your-brand-color'
   ```
4. **Track usage** - Use `onCopy` callback to understand what content is valuable
5. **Test on mobile** - Verify buttons work well on touch devices
6. **Use HTTPS** - Required for clipboard API (localhost works for development)
7. **Don't overwhelm** - Consider excluding certain elements if too many buttons appear

**For Your Visitors:**
- They'll see copy buttons appear automatically when hovering/tapping
- Zero installation needed - works immediately
- Works on all their devices (phone, tablet, desktop)

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

## 🎯 Summary

### For Website Owners:
1. Add one `<script>` tag to your website
2. Call `TextCopy.init()`
3. Done! Your visitors now have copy buttons

### For Visitors:
1. Visit website (normal browsing)
2. Hover over content (paragraphs, code, quotes, etc.)
3. Click copy button
4. Content copied! ✓

**No browser extensions needed. No installations. No configuration. It just works.**

Try the demo: Open `demo.html` in your browser to see the visitor experience!

---

**Made with ❤️ for the web**
