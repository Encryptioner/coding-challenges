#!/bin/bash

###############################################################################
# Android Build Script
# Generates release APK file ready for distribution
# Works on both macOS and Linux
###############################################################################

set -e  # Exit on error

echo "=========================================="
echo "Mobile Code IDE - Android Build"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}Error: package.json not found. Please run this script from the project root.${NC}"
    exit 1
fi

# Step 1: Clean previous builds
echo -e "${BLUE}[1/6] Cleaning previous builds...${NC}"
rm -rf lib
rm -rf android/app/build

# Step 2: Install dependencies
echo -e "${BLUE}[2/6] Installing dependencies...${NC}"
pnpm install

# Step 3: Build Theia application
echo -e "${BLUE}[3/6] Building Theia application (production mode)...${NC}"
pnpm run build:prod

echo -e "${GREEN}✓ Theia build complete${NC}"

# Step 4: Sync with Capacitor
echo -e "${BLUE}[4/6] Syncing with Capacitor...${NC}"
npx cap sync android

echo -e "${GREEN}✓ Capacitor sync complete${NC}"

# Step 5: Build Android APK
echo -e "${BLUE}[5/6] Building Android APK...${NC}"
cd android

# Check if gradlew exists
if [ ! -f "./gradlew" ]; then
    echo -e "${RED}Error: gradlew not found. Please ensure Android project is properly initialized.${NC}"
    exit 1
fi

# Make gradlew executable
chmod +x ./gradlew

# Build release APK
echo "Building release APK..."
./gradlew assembleRelease

cd ..

# Step 6: Copy APK to output directory
echo -e "${BLUE}[6/6] Copying APK to output directory...${NC}"
mkdir -p output/android
cp android/app/build/outputs/apk/release/app-release-unsigned.apk output/android/mobile-code-ide.apk 2>/dev/null || \
cp android/app/build/outputs/apk/release/app-release.apk output/android/mobile-code-ide.apk

# Get APK size
APK_SIZE=$(du -h output/android/mobile-code-ide.apk | cut -f1)

echo ""
echo "=========================================="
echo -e "${GREEN}✓ Android Build Complete!${NC}"
echo "=========================================="
echo ""
echo "APK Location: output/android/mobile-code-ide.apk"
echo "APK Size: $APK_SIZE"
echo ""
echo "To install on Android device:"
echo "  1. Enable 'Unknown Sources' in Android settings"
echo "  2. Transfer the APK to your device"
echo "  3. Open the APK file to install"
echo ""
echo "Or use ADB:"
echo "  adb install -r output/android/mobile-code-ide.apk"
echo ""
echo "=========================================="
