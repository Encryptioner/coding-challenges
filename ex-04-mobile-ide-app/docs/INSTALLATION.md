# Mobile Code IDE - Installation & Quick Start Guide

Complete guide to install, build, and use the Mobile Code IDE on Android and iOS.

---

## 📥 For End Users (Just Want to Use the App)

### Download Pre-built Apps

#### Android Users
1. **Download the APK**
   - Go to the [Releases](https://github.com/your-org/mobile-code-ide/releases) page
   - Download `mobile-code-ide-v1.0.0.apk` (latest version)
   - File size: ~50-80 MB

2. **Install the APK**
   ```
   Method 1: Direct Install
   - Enable "Install from Unknown Sources":
     Settings → Security → Unknown Sources (ON)
   - Open Downloads folder
   - Tap on the APK file
   - Tap "Install"
   - Wait for installation to complete
   - Open "Mobile Code IDE" from app drawer

   Method 2: ADB Install (For Developers)
   - Connect Android device via USB
   - Enable USB Debugging on device
   - Run: adb install -r mobile-code-ide.apk
   ```

3. **First Launch**
   - Grant storage permissions when prompted
   - Choose a workspace folder or create new
   - Start coding! 🎉

#### iOS Users
1. **Download the IPA**
   - Go to the [Releases](https://github.com/your-org/mobile-code-ide/releases) page
   - Download `mobile-code-ide-v1.0.0.ipa` (latest version)
   - File size: ~60-90 MB

2. **Install the IPA**
   ```
   Method 1: Xcode (macOS Required)
   - Connect iPhone/iPad to Mac via USB
   - Open Xcode
   - Go to: Window → Devices and Simulators
   - Select your device from the left sidebar
   - Click the "+" button below "Installed Apps"
   - Select the downloaded IPA file
   - Wait for installation to complete

   Method 2: TestFlight (If Available)
   - Install TestFlight from App Store
   - Open the TestFlight invitation link (sent separately)
   - Tap "Install" for Mobile Code IDE
   ```

3. **Trust the App**
   - Go to: Settings → General → Device Management / VPN & Device Management
   - Find "Mobile Code IDE" or developer name
   - Tap "Trust"
   - Confirm trust when prompted

4. **First Launch**
   - Grant file access permissions
   - Choose a workspace or clone from Git
   - Start coding! 🎉

---

## 🛠️ For Developers (Want to Build from Source)

### Prerequisites Check

Run these commands to verify you have the required tools:

```bash
# Check Node.js version (need 20+)
node --version  # Should show v20.x.x or higher

# Check pnpm (recommended) or npm
pnpm --version  # Recommended
npm --version   # Alternative

# Check Git
git --version

# For Android builds:
java --version  # Should show Java 17+
echo $ANDROID_HOME  # Should show Android SDK path

# For iOS builds (macOS only):
xcodebuild -version  # Should show Xcode 14+
pod --version  # Should show CocoaPods version
```

### Install Prerequisites

#### Install Node.js
```bash
# Using nvm (recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 20
nvm use 20

# Or download from: https://nodejs.org/
```

#### Install pnpm
```bash
npm install -g pnpm
```

#### Android Setup

**Option 1: Android Studio (Easiest)**
1. Download [Android Studio](https://developer.android.com/studio)
2. Install Android Studio
3. Open Android Studio → Settings → Appearance & Behavior → System Settings → Android SDK
4. Install:
   - Android SDK Platform 33 (Android 13)
   - Android SDK Build-Tools 33.0.0+
   - Android SDK Command-line Tools

5. Set environment variables:
```bash
# Add to ~/.bashrc or ~/.zshrc
export ANDROID_HOME=$HOME/Library/Android/sdk  # macOS
# export ANDROID_HOME=$HOME/Android/Sdk  # Linux
export PATH=$PATH:$ANDROID_HOME/tools:$ANDROID_HOME/platform-tools
```

**Option 2: Command Line Tools Only**
```bash
# macOS
brew install --cask android-sdk
brew install --cask android-platform-tools

# Linux
sudo apt-get install android-sdk
```

#### iOS Setup (macOS Only)

1. **Install Xcode**
   - Open App Store
   - Search for "Xcode"
   - Click "Get" / "Install"
   - Wait for download (12+ GB)
   - Open Xcode once to accept license

2. **Install Command Line Tools**
```bash
xcode-select --install
```

3. **Install CocoaPods**
```bash
sudo gem install cocoapods
```

4. **Configure Xcode**
   - Open Xcode → Preferences → Accounts
   - Add your Apple ID
   - For App Store distribution, join Apple Developer Program ($99/year)

---

## 🚀 Building the App

### Step 1: Clone and Setup

```bash
# Clone the repository
git clone https://github.com/your-org/mobile-code-ide.git
cd mobile-code-ide/mobile-ide-app

# Install dependencies (this may take 5-10 minutes)
pnpm install
```

### Step 2: Build for Development (Test in Browser)

```bash
# Build the Theia application
pnpm run build

# Start development server
pnpm run start

# Open in browser
# Go to: http://localhost:3000
# Or on mobile browser: http://YOUR_IP:3000
```

Test in mobile browser to verify everything works!

### Step 3A: Build Android APK

```bash
# One-command build (easiest)
./scripts/build-android.sh

# This script will:
# 1. Clean previous builds
# 2. Install dependencies
# 3. Build Theia (production mode)
# 4. Sync with Capacitor
# 5. Build release APK
# 6. Output to: output/android/mobile-code-ide.apk

# Estimated time: 5-15 minutes
# File size: ~50-80 MB
```

**Alternative: Manual Android Build**
```bash
# 1. Build Theia
pnpm run build:prod

# 2. Initialize Capacitor (first time only)
npx cap add android

# 3. Sync with Capacitor
npx cap sync android

# 4. Open in Android Studio
npx cap open android

# 5. In Android Studio:
#    - Build → Generate Signed Bundle / APK
#    - Choose "APK"
#    - Create or select a keystore
#    - Build release APK
#    - Find APK in: android/app/build/outputs/apk/release/
```

**Test Android APK**
```bash
# Install on connected device
adb install -r output/android/mobile-code-ide.apk

# Or copy APK to device and install manually
```

### Step 3B: Build iOS IPA

```bash
# One-command build (easiest) - macOS only
./scripts/build-ios.sh

# This script will:
# 1. Clean previous builds
# 2. Install dependencies
# 3. Build Theia (production mode)
# 4. Install CocoaPods
# 5. Sync with Capacitor
# 6. Archive app with Xcode
# 7. Export IPA
# 8. Output to: output/ios/mobile-code-ide.ipa

# Estimated time: 10-20 minutes
# File size: ~60-90 MB
```

**Alternative: Manual iOS Build**
```bash
# 1. Build Theia
pnpm run build:prod

# 2. Initialize Capacitor (first time only)
npx cap add ios

# 3. Install CocoaPods dependencies
cd ios/App
pod install
cd ../..

# 4. Sync with Capacitor
npx cap sync ios

# 5. Open in Xcode
npx cap open ios

# 6. In Xcode:
#    - Select "Any iOS Device" or your connected device
#    - Product → Archive
#    - When archive completes: Distribute App
#    - Choose distribution method:
#      * "Ad Hoc" for testing on specific devices
#      * "App Store" for App Store submission
#    - Follow wizard to export IPA
```

**Test iOS IPA**
```bash
# Using Xcode (device must be connected)
# Window → Devices and Simulators
# Select device → Click "+" → Select IPA
```

---

## 📦 Distribution

### Android Distribution

**Option 1: Direct Distribution (Easiest)**
1. Share the APK file directly
2. Users install via "Unknown Sources"
3. Good for: Beta testing, internal distribution

**Option 2: Google Play Store**
1. Create Google Play Developer account ($25 one-time)
2. Build AAB instead of APK:
   ```bash
   cd android
   ./gradlew bundleRelease
   # Find AAB in: app/build/outputs/bundle/release/
   ```
3. Upload to Google Play Console
4. Fill in app listing details
5. Submit for review
6. Good for: Public distribution

**Option 3: Alternative App Stores**
- Amazon Appstore
- Samsung Galaxy Store
- F-Droid (requires open source)

### iOS Distribution

**Option 1: TestFlight (Beta Testing)**
1. Archive app in Xcode
2. Upload to App Store Connect
3. Add beta testers via email
4. Testers install via TestFlight app
5. Good for: Beta testing, up to 10,000 testers

**Option 2: Apple App Store**
1. Join Apple Developer Program ($99/year)
2. Archive app with App Store distribution
3. Upload to App Store Connect
4. Complete app listing
5. Submit for review (typically 24-48 hours)
6. Good for: Public distribution

**Option 3: Enterprise Distribution**
1. Join Apple Developer Enterprise Program ($299/year)
2. Create in-house distribution certificate
3. Build with Enterprise profile
4. Distribute IPA directly
5. Good for: Internal company distribution

---

## 🔧 Troubleshooting Build Issues

### Node.js / pnpm Issues

**Problem:** `pnpm: command not found`
```bash
# Install pnpm globally
npm install -g pnpm

# Or use npm instead
# Replace 'pnpm' with 'npm' in all commands
```

**Problem:** `node version too old`
```bash
# Update Node.js
nvm install 20
nvm use 20
```

**Problem:** `EACCES: permission denied`
```bash
# Fix npm permissions
sudo chown -R $USER:$(id -gn $USER) ~/.config
sudo chown -R $USER:$(id -gn $USER) ~/.npm
```

### Android Build Issues

**Problem:** `ANDROID_HOME not set`
```bash
# Add to ~/.bashrc or ~/.zshrc
export ANDROID_HOME=$HOME/Library/Android/sdk  # macOS
export PATH=$PATH:$ANDROID_HOME/tools:$ANDROID_HOME/platform-tools

# Reload shell
source ~/.bashrc  # or source ~/.zshrc
```

**Problem:** `SDK location not found`
```bash
# Create local.properties in android/
echo "sdk.dir=$ANDROID_HOME" > android/local.properties
```

**Problem:** `Gradle build failed`
```bash
# Clean and rebuild
cd android
./gradlew clean
./gradlew assembleRelease

# If still fails, try Android Studio:
npx cap open android
# Build → Clean Project
# Build → Rebuild Project
```

**Problem:** `Java version incorrect`
```bash
# Check Java version
java --version  # Should be 17+

# Install Java 17
# macOS:
brew install openjdk@17

# Linux:
sudo apt-get install openjdk-17-jdk
```

### iOS Build Issues

**Problem:** `xcode-select: error: tool 'xcodebuild' requires Xcode`
```bash
# Install Xcode from App Store
# Or install command line tools only:
xcode-select --install
```

**Problem:** `pod: command not found`
```bash
# Install CocoaPods
sudo gem install cocoapods

# If that fails, use Homebrew:
brew install cocoapods
```

**Problem:** `CocoaPods could not find compatible versions`
```bash
# Update CocoaPods repo
pod repo update

# Clear CocoaPods cache
rm -rf ~/Library/Caches/CocoaPods
pod install --repo-update
```

**Problem:** `Signing for "App" requires a development team`
```bash
# In Xcode:
# 1. Select the "App" project
# 2. Select the "App" target
# 3. Go to "Signing & Capabilities"
# 4. Check "Automatically manage signing"
# 5. Select your team
```

**Problem:** `Archive failed with provisioning profile error`
```bash
# For testing (no App Store):
# 1. In Xcode, select target
# 2. Signing & Capabilities tab
# 3. Uncheck "Automatically manage signing"
# 4. Signing Certificate: "Sign to Run Locally"

# For App Store:
# 1. Must have Apple Developer account
# 2. Create App ID in developer portal
# 3. Create provisioning profile
# 4. Download and install in Xcode
```

### General Issues

**Problem:** Build is very slow
```bash
# Enable parallel builds
export NODE_OPTIONS="--max-old-space-size=8192"

# Use faster package manager
npm install -g pnpm  # pnpm is faster than npm

# Clear cache
pnpm store prune
rm -rf node_modules
pnpm install
```

**Problem:** Out of memory
```bash
# Increase Node.js memory
export NODE_OPTIONS="--max-old-space-size=8192"

# Or build with:
NODE_OPTIONS="--max-old-space-size=8192" pnpm run build
```

**Problem:** Port 3000 already in use
```bash
# Kill process using port 3000
# macOS/Linux:
lsof -ti:3000 | xargs kill -9

# Or use different port:
pnpm run start -- --port 3001
```

---

## 📚 Next Steps

After successful installation:

1. **Read the User Guide:** [README.md](README.md)
2. **Try the Examples:** Open sample projects in `examples/`
3. **Install Extensions:** Browse VSCode extensions
4. **Join the Community:** Discord, GitHub Discussions
5. **Report Issues:** GitHub Issues

---

## 🆘 Getting Help

**Before asking for help, please:**
1. Check this installation guide
2. Search existing [GitHub Issues](https://github.com/your-org/mobile-code-ide/issues)
3. Read the [FAQ](README.md#troubleshooting)

**Where to get help:**
- **GitHub Issues:** Bug reports and feature requests
- **GitHub Discussions:** Questions and community support
- **Discord:** Real-time chat with community
- **Stack Overflow:** Tag with `mobile-code-ide`

**When reporting issues, include:**
- Operating system (macOS, Linux, Windows)
- Node.js version (`node --version`)
- Error messages (full output)
- Steps to reproduce
- Screenshots if relevant

---

## 📝 Feedback

We'd love to hear from you!
- ⭐ Star the repo if you find it useful
- 🐛 Report bugs via GitHub Issues
- 💡 Suggest features via GitHub Discussions
- 🤝 Contribute via Pull Requests

---

Happy coding on mobile! 🚀📱
