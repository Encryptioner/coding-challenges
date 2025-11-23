# Mobile Code IDE

A fully-featured mobile-friendly IDE with VSCode extension compatibility for **iOS and Android** devices.

## 🎯 Features

### 📱 Mobile-Optimized Interface
- **Touch-first design** with gesture controls
- **Responsive layouts** for phones and tablets
- **Virtual keyboard management** with smart positioning
- **Bottom navigation** instead of sidebars
- **Pinch-to-zoom**, swipe gestures, and touch-optimized controls

### 💻 Complete IDE Capabilities
- **Extensive code viewer** with syntax highlighting (100+ languages)
- **Git integration** - view code, review PRs, commit, push/pull
- **Pull Request reviews** - complete mobile-friendly PR review interface
- **Project runner** - execute code and view output in real-time
- **IntelliSense** and auto-completion
- **Integrated terminal**
- **File system access** (native iOS/Android)
- **VSCode extension support** - works with most VSCode extensions

### 🔧 Developer Features
- Search in files
- Line numbers and code folding
- Multiple language support (Node.js, Python, Java, Go, Rust, etc.)
- Quick commands for common tasks
- Command history
- Output viewing with color-coded errors
- Auto-scroll output
- Touch-friendly diff viewer

### 📦 Platform Support
- ✅ **Android** (APK file generation)
- ✅ **iOS** (IPA file generation)
- ✅ **Web** (PWA support)

---

## 📥 Download & Install

### Android

**Option 1: Download Pre-built APK** (Easiest)
1. Download `mobile-code-ide.apk` from the releases section
2. Enable "Install from Unknown Sources" in Android settings:
   - Settings → Security → Unknown Sources (enable)
3. Open the downloaded APK file
4. Tap "Install"
5. Open "Mobile Code IDE" from your app drawer

**Option 2: Install via ADB**
```bash
# Connect your Android device via USB
adb install -r output/android/mobile-code-ide.apk
```

### iOS

**Option 1: Install via Xcode** (macOS required)
1. Download `mobile-code-ide.ipa` from the releases section
2. Connect your iOS device to Mac
3. Open Xcode → Window → Devices and Simulators
4. Select your device
5. Click the "+" button and select the IPA file
6. Wait for installation to complete

**Option 2: TestFlight** (if available)
1. Install TestFlight from App Store
2. Open the TestFlight invitation link
3. Install Mobile Code IDE

**Note for iOS:** You may need to trust the app in Settings → General → Device Management

---

## 🛠️ Building from Source

### Prerequisites

**Required for both platforms:**
- Node.js 20+ (LTS)
- pnpm (or npm/yarn)
- Git

**For Android builds:**
- Java JDK 17+
- Android SDK
- Gradle (will be downloaded automatically)

**For iOS builds (macOS only):**
- macOS 12+
- Xcode 14+
- CocoaPods (`gem install cocoapods`)
- Apple Developer account (for App Store distribution)

### Quick Start

```bash
# Clone the repository
git clone <repository-url>
cd mobile-ide-app

# Install dependencies
pnpm install

# Build for development
pnpm run build

# Start development server
pnpm run start
# Access at http://localhost:3000
```

### Build Android APK

```bash
# Run the Android build script
./scripts/build-android.sh

# Output: output/android/mobile-code-ide.apk
```

**Build steps:**
1. Cleans previous builds
2. Installs dependencies
3. Builds Theia application (production mode)
4. Syncs with Capacitor
5. Builds release APK
6. Outputs APK to `output/android/`

**Estimated time:** 5-15 minutes (depending on hardware)

### Build iOS IPA

```bash
# Run the iOS build script (macOS only)
./scripts/build-ios.sh

# Output: output/ios/mobile-code-ide.ipa
```

**Build steps:**
1. Cleans previous builds
2. Installs dependencies
3. Builds Theia application (production mode)
4. Installs CocoaPods dependencies
5. Syncs with Capacitor
6. Archives iOS app
7. Exports IPA file
8. Outputs IPA to `output/ios/`

**Estimated time:** 10-20 minutes (depending on hardware)

### Manual Build Process

#### Android (Manual)
```bash
# 1. Build Theia
pnpm run build:prod

# 2. Sync Capacitor
npx cap sync android

# 3. Open in Android Studio
npx cap open android

# 4. In Android Studio:
#    Build → Generate Signed Bundle / APK → APK
#    Follow the wizard to create a signed APK
```

#### iOS (Manual)
```bash
# 1. Build Theia
pnpm run build:prod

# 2. Install pods
cd ios/App && pod install && cd ../..

# 3. Sync Capacitor
npx cap sync ios

# 4. Open in Xcode
npx cap open ios

# 5. In Xcode:
#    Product → Archive
#    Distribute App → Choose distribution method
#    Follow the wizard to export IPA
```

---

## 📖 Usage Guide

### First Launch

1. **Grant Permissions**
   - File system access (for opening/saving files)
   - Storage access (Android)
   - Photo library access (iOS, optional for file attachments)

2. **Choose Workspace**
   - Open an existing folder
   - Create a new project
   - Clone from Git

### Basic Operations

#### Opening Files
- Tap on a file in the file explorer
- Use the search button to find files
- Recent files are shown on the home screen

#### Editing Code
- Tap to edit
- Pinch to zoom in/out
- Swipe to navigate between files
- Long-press for context menu
- Double-tap toolbar to show/hide

#### Running Code
1. Open the Run panel (bottom navigation)
2. Select a quick command (e.g., "npm start")
3. Or enter a custom command
4. Tap "Run" to execute
5. View output in real-time
6. Tap "Stop" to terminate

#### Git Operations
1. Open the Git panel (bottom navigation)
2. **View changes:** See modified files
3. **Commit:** Stage files → Enter message → Commit
4. **Push/Pull:** Sync with remote
5. **View PRs:** Review pull requests
6. **Create PR:** From current branch

#### Reviewing Pull Requests
1. Navigate to Git → Pull Requests
2. Select a PR to review
3. **Tabs available:**
   - Overview: PR details and description
   - Files: View changed files with diff
   - Commits: View commit history
   - Comments: See and add comments
4. **Actions:**
   - Add comments
   - Approve PR
   - Request changes

### Keyboard Controls

#### Virtual Keyboard
- **Show/Hide:** Tap the keyboard button or double-tap code area
- **Auto-hide:** Keyboard hides when scrolling
- **Smart positioning:** Editor adjusts to keep cursor visible

#### Custom Keyboard Bar (Above Keyboard)
- **Tab** - Insert tab
- **Undo/Redo** - Code actions
- **→** / **←** - Move cursor
- **Symbols** - Quick access to  code symbols ({}[]<>/etc.)

#### External Keyboard Shortcuts
- `Cmd/Ctrl + S`: Save file
- `Cmd/Ctrl + F`: Find in file
- `Cmd/Ctrl + P`: Quick file open
- `Cmd/Ctrl + Shift + P`: Command palette
- `Tab` / `Shift + Tab`: Indent/outdent

### Gestures

#### Editor Gestures
- **Pinch:** Zoom in/out
- **Two-finger pan:** Scroll while selecting text
- **Swipe left/right:** Switch between file tabs
- **Swipe up:** Show terminal/output panel
- **Swipe down:** Hide panels
- **Long press:** Context menu
- **Double tap:** Toggle toolbar visibility

#### File Explorer Gestures
- **Swipe right:** Open file
- **Swipe left:** Show file options (rename, delete, etc.)
- **Long press:** Multi-select mode

### Settings & Options

Access settings via bottom navigation → Settings

**Available Options:**
- **Theme:** Light, Dark, or System
- **Font Size:** Adjust editor font (12-24px)
- **Tab Size:** Spaces per tab (2, 4, 8)
- **Auto-save:** Off, After Delay, On Focus Change
- **Keyboard Mode:** Native or Custom
- **Gestures:** Enable/disable specific gestures
- **Line Numbers:** Show/hide
- **Minimap:** Enable/disable (hidden by default on mobile)
- **Auto-scroll Output:** Keep terminal scrolled to bottom
- **File Extensions:** Configure language associations

---

## 🔌 Extension Support

Mobile Code IDE supports most VSCode extensions through Eclipse Theia's compatibility layer.

### Installing Extensions

**Method 1: From Marketplace**
1. Open Extensions panel (bottom navigation)
2. Search for extension
3. Tap "Install"
4. Reload if required

**Method 2: From .vsix file**
1. Download `.vsix` extension file
2. Extensions → ⋮ → Install from VSIX
3. Select the downloaded file

### Recommended Extensions

**Languages:**
- Python (ms-python.python)
- ESLint (dbaeumer.vscode-eslint)
- Prettier (esbenp.prettier-vscode)
- Go (golang.go)
- Rust Analyzer (rust-lang.rust-analyzer)

**Git:**
- GitLens (eamodio.gitlens)
- Git Graph (mhutchie.git-graph)

**Utilities:**
- Path Intellisense (christian-kohler.path-intellisense)
- Auto Rename Tag (formulahendry.auto-rename-tag)
- Bracket Pair Colorizer (coenraads.bracket-pair-colorizer-2)

### Extension Compatibility

✅ **Fully Compatible:**
- Language servers (Python, TypeScript, Go, etc.)
- Linters and formatters
- Git extensions
- Debuggers
- Syntax highlighting themes

⚠️ **Partially Compatible:**
- Extensions with complex desktop UIs (may need adaptation)
- Extensions requiring specific OS features

❌ **Not Compatible:**
- Extensions requiring native Node.js modules not supported on mobile
- Desktop-only features (window management, etc.)

---

## 🐛 Troubleshooting

### Android Issues

**App won't install:**
- Enable "Unknown Sources" in Settings
- Check that device has Android 8.0+ (API level 26+)
- Ensure sufficient storage space (200MB+ free)

**Keyboard doesn't show:**
- Check keyboard settings in app Settings
- Try switching between Native and Custom keyboard modes
- Restart the app

**Files not accessible:**
- Grant storage permission in Android Settings → Apps → Mobile Code IDE
- Try selecting a different folder

**App crashes on startup:**
- Clear app data: Settings → Apps → Mobile Code IDE → Clear Data
- Reinstall the app
- Check Android version (requires 8.0+)

### iOS Issues

**App won't install:**
- Trust the developer certificate: Settings → General → Device Management
- Check iOS version (requires 14.0+)
- Ensure device is not restricted by MDM

**Keyboard overlaps editor:**
- Adjust keyboard resize mode in Settings
- Try toggling keyboard show/hide
- Restart the app

**Can't access files:**
- Grant file access permission when prompted
- Check iCloud Drive settings
- Try selecting files from different locations

### General Issues

**Slow performance:**
- Close unused file tabs
- Disable unnecessary extensions
- Clear editor history (Settings → Clear Editor History)
- Reduce font size if using large fonts

**Git operations fail:**
- Check internet connection
- Verify Git credentials
- Try re-authenticating with GitHub/GitLab

**Extensions not working:**
- Check extension compatibility
- Reload window after installing
- Check extension logs in developer tools

**Black screen on launch:**
- Wait 10 seconds (may be loading)
- Force close and restart
- Clear app cache
- Reinstall app

---

## 🏗️ Project Structure

```
mobile-ide-app/
├── package.json              # Main project dependencies
├── capacitor.config.ts       # Capacitor configuration
├── src/                      # Source files
├── extensions/               # Theia extensions
│   ├── mobile-ide/          # Core mobile UI extension
│   │   ├── src/browser/
│   │   │   ├── components/  # React components
│   │   │   ├── keyboard/    # Keyboard management
│   │   │   ├── gestures/    # Touch gesture handlers
│   │   │   └── services/    # Core services
│   │   └── package.json
│   ├── mobile-git/          # Git & PR review extension
│   │   ├── src/browser/
│   │   │   ├── components/  # Git UI components
│   │   │   └── services/    # Git services
│   │   └── package.json
│   └── mobile-runner/       # Code execution extension
│       ├── src/browser/
│       │   ├── components/  # Runner UI
│       │   └── services/    # Execution services
│       └── package.json
├── ios/                     # iOS native project (Capacitor)
├── android/                 # Android native project (Capacitor)
├── scripts/                 # Build scripts
│   ├── build-android.sh    # Android APK builder
│   └── build-ios.sh        # iOS IPA builder
└── output/                  # Build outputs
    ├── android/
    │   └── mobile-code-ide.apk
    └── ios/
        └── mobile-code-ide.ipa
```

---

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Test on both iOS and Android if possible
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Testing

```bash
# Run tests
pnpm test

# Run linter
pnpm run lint

# Format code
pnpm run format
```

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

Built on top of:
- [Eclipse Theia](https://theia-ide.org/) - Extensible IDE framework
- [Monaco Editor](https://microsoft.github.io/monaco-editor/) - Code editor
- [Capacitor](https://capacitorjs.com/) - Cross-platform native runtime
- [React](https://react.dev/) - UI framework

---

## 📞 Support

- **Issues:** [GitHub Issues](https://github.com/your-org/mobile-code-ide/issues)
- **Discussions:** [GitHub Discussions](https://github.com/your-org/mobile-code-ide/discussions)
- **Email:** support@mobile-code-ide.com

---

## 🗺️ Roadmap

- [x] Core mobile IDE features
- [x] Git integration with PR review
- [x] Project runner
- [x] VSCode extension support
- [x] Android APK generation
- [x] iOS IPA generation
- [ ] Cloud sync across devices
- [ ] Collaborative coding
- [ ] More language servers
- [ ] Plugin marketplace
- [ ] Dark/light theme customization
- [ ] Split-screen editing (tablets)
- [ ] SSH remote development
- [ ] Docker integration

---

Made with ❤️ for mobile developers worldwide
