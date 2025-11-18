# DivCopy - Copy Any Element Chrome Extension

<div align="center">

![DivCopy](https://img.shields.io/badge/Chrome-Extension-green?style=for-the-badge&logo=google-chrome)
![Manifest V3](https://img.shields.io/badge/Manifest-V3-blue?style=for-the-badge)
![Desktop & Mobile](https://img.shields.io/badge/Platform-Desktop%20%26%20Mobile-orange?style=for-the-badge)

**Copy content from any div or element on any website with one click**

Similar to WordPress plugins like "Copy Anything to Clipboard" and "DivMagic"

</div>

## ✨ Features

### 🖱️ **Desktop Mode**
- ✅ Right-click context menu on any element
- ✅ Hover highlighting with visual feedback
- ✅ Multiple copy formats (Text, HTML, Styled HTML, CSS Selector)
- ✅ Keyboard-friendly interface
- ✅ Instant clipboard copy

### 📱 **Mobile Mode**
- ✅ Long-press (500ms) to activate copy menu
- ✅ Touch-friendly floating action buttons
- ✅ Haptic feedback on supported devices
- ✅ Responsive design for all screen sizes
- ✅ Auto-dismiss after 5 seconds

### 🎨 **Copy Formats**
1. **Plain Text** - Clean text without formatting
2. **HTML** - Raw HTML structure
3. **Styled HTML** - HTML with inline CSS styles
4. **CSS Selector** - Unique selector for the element

### ⚡ **Additional Features**
- Visual element highlighting
- Toast notifications
- Statistics tracking (daily & total copies)
- Dark mode support
- Accessibility features (high contrast, reduced motion)
- Zero external dependencies

## 📦 Installation

### Method 1: Install from Source (Developer Mode)

1. **Download the extension**
   ```bash
   git clone https://github.com/your-repo/coding-challenges
   cd coding-challenges/div-copy-extension
   ```

2. **Generate icons** (optional, placeholders included)
   ```bash
   # Option A: Using Python (no dependencies)
   python3 create-placeholder-icons.py

   # Option B: Using Python with Pillow (better quality)
   pip install Pillow
   python3 generate-icons.py

   # Option C: Using ImageMagick
   ./generate-icons.sh
   ```

3. **Load in Chrome**
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)
   - Click "Load unpacked"
   - Select the `div-copy-extension` folder
   - Extension icon should appear in your toolbar!

## 🚀 Usage

### Desktop Usage

#### Right-Click Context Menu
1. Navigate to any website
2. Right-click on any element you want to copy
3. Hover over "DivCopy" in the context menu
4. Select your desired format:
   - **Copy as Text** - Plain text content
   - **Copy as HTML** - HTML structure
   - **Copy with Styles** - HTML + inline CSS
   - **Copy CSS Selector** - Element selector

### Mobile Usage

#### Enabling Mobile Mode
1. Click the DivCopy extension icon
2. Toggle "Mobile Mode" to ON

#### Copying Elements
1. Long-press (hold for 500ms) on any element
2. Floating menu appears with options: 📄 Text, 🔖 HTML, 🎨 Styled, 🎯 Selector, ✖ Close
3. Tap your desired format
4. Content copied! ✓

## ⚙️ Settings

Click the DivCopy extension icon to access:
- **Mobile Mode** - Enable/disable touch-based copying
- **Auto Highlight** - Toggle element highlighting
- **Show Tooltips** - Display copy hints
- **Default Format** - Set preferred copy format
- **Statistics** - View daily and total copy counts

## 🆚 Comparison with Existing Extensions

| Feature | DivCopy | DivMagic | Copy DOM | SnipCSS |
|---------|---------|----------|----------|---------|
| **Price** | Free | Paid | Free | Free |
| **Desktop Support** | ✅ | ✅ | ✅ | ✅ |
| **Mobile Support** | ✅ | ❌ | ❌ | ❌ |
| **Copy as Text** | ✅ | ❌ | ✅ | ✅ |
| **Copy as HTML** | ✅ | ✅ | ✅ | ✅ |
| **Copy with Styles** | ✅ | ✅ | ❌ | ✅ |
| **CSS Selector** | ✅ | ❌ | ❌ | ✅ |
| **Long-Press UI** | ✅ | ❌ | ❌ | ❌ |
| **Context Menu** | ✅ | ✅ | ❌ | ❌ |
| **Open Source** | ✅ | ❌ | ✅ | ✅ |

## 🔧 Technical Details

### Browser Compatibility
- ✅ Chrome 88+ (Manifest V3)
- ✅ Edge 88+ (Chromium-based)
- ✅ Opera 74+ (Chromium-based)

### Mobile Browser Support
- ✅ Chrome for Android
- ⚠️ Safari iOS (context menus limited)

## 📝 License

Educational project - part of [CodingChallenges.fyi](https://codingchallenges.fyi)

Free to use and modify.

---

<div align="center">

**Made with ❤️ as part of coding challenges**

</div>
