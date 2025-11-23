#!/bin/bash

###############################################################################
# iOS Build Script
# Generates IPA file for iOS distribution
# Requires macOS with Xcode installed
###############################################################################

set -e  # Exit on error

echo "=========================================="
echo "Mobile Code IDE - iOS Build"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running on macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    echo -e "${RED}Error: iOS builds require macOS with Xcode installed.${NC}"
    exit 1
fi

# Check if Xcode is installed
if ! command -v xcodebuild &> /dev/null; then
    echo -e "${RED}Error: Xcode is not installed. Please install Xcode from the App Store.${NC}"
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}Error: package.json not found. Please run this script from the project root.${NC}"
    exit 1
fi

# Configuration
SCHEME_NAME="App"
WORKSPACE="ios/App/App.xcworkspace"
CONFIGURATION="Release"
ARCHIVE_PATH="build/MobileCodeIDE.xcarchive"
EXPORT_PATH="output/ios"
IPA_NAME="mobile-code-ide.ipa"

# Step 1: Clean previous builds
echo -e "${BLUE}[1/7] Cleaning previous builds...${NC}"
rm -rf lib
rm -rf build
rm -rf output/ios

# Step 2: Install dependencies
echo -e "${BLUE}[2/7] Installing dependencies...${NC}"
pnpm install

# Step 3: Build Theia application
echo -e "${BLUE}[3/7] Building Theia application (production mode)...${NC}"
pnpm run build:prod

echo -e "${GREEN}✓ Theia build complete${NC}"

# Step 4: Install CocoaPods dependencies
echo -e "${BLUE}[4/7] Installing CocoaPods dependencies...${NC}"
cd ios/App
pod install
cd ../..

echo -e "${GREEN}✓ CocoaPods dependencies installed${NC}"

# Step 5: Sync with Capacitor
echo -e "${BLUE}[5/7] Syncing with Capacitor...${NC}"
npx cap sync ios

echo -e "${GREEN}✓ Capacitor sync complete${NC}"

# Step 6: Archive the app
echo -e "${BLUE}[6/7] Archiving iOS app...${NC}"
xcodebuild archive \
    -workspace "$WORKSPACE" \
    -scheme "$SCHEME_NAME" \
    -configuration "$CONFIGURATION" \
    -archivePath "$ARCHIVE_PATH" \
    -destination 'generic/platform=iOS' \
    -allowProvisioningUpdates \
    CODE_SIGN_IDENTITY="" \
    CODE_SIGNING_REQUIRED=NO \
    CODE_SIGNING_ALLOWED=NO

echo -e "${GREEN}✓ Archive created${NC}"

# Step 7: Export IPA
echo -e "${BLUE}[7/7] Exporting IPA...${NC}"

# Create ExportOptions.plist for ad-hoc distribution
cat > /tmp/ExportOptions.plist << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>method</key>
    <string>ad-hoc</string>
    <key>compileBitcode</key>
    <false/>
    <key>signingStyle</key>
    <string>manual</string>
    <key>stripSwiftSymbols</key>
    <true/>
    <key>uploadSymbols</key>
    <false/>
    <key>thinning</key>
    <string>&lt;none&gt;</string>
</dict>
</plist>
EOF

mkdir -p "$EXPORT_PATH"

xcodebuild -exportArchive \
    -archivePath "$ARCHIVE_PATH" \
    -exportPath "$EXPORT_PATH" \
    -exportOptionsPlist /tmp/ExportOptions.plist \
    -allowProvisioningUpdates

# Rename IPA if needed
if [ -f "$EXPORT_PATH/App.ipa" ]; then
    mv "$EXPORT_PATH/App.ipa" "$EXPORT_PATH/$IPA_NAME"
fi

# Get IPA size
IPA_SIZE=$(du -h "$EXPORT_PATH/$IPA_NAME" | cut -f1)

echo ""
echo "=========================================="
echo -e "${GREEN}✓ iOS Build Complete!${NC}"
echo "=========================================="
echo ""
echo "IPA Location: $EXPORT_PATH/$IPA_NAME"
echo "IPA Size: $IPA_SIZE"
echo ""
echo -e "${YELLOW}Note: This IPA is unsigned and for testing only.${NC}"
echo ""
echo "To install on iOS device (requires macOS):"
echo "  1. Connect your iOS device"
echo "  2. Use Xcode: Window > Devices and Simulators"
echo "  3. Select your device and click '+' to install the IPA"
echo ""
echo "For App Store distribution:"
echo "  1. Configure signing in Xcode"
echo "  2. Use 'app-store' method in ExportOptions.plist"
echo "  3. Upload via Xcode Organizer or Transporter app"
echo ""
echo "=========================================="

# Clean up
rm /tmp/ExportOptions.plist
