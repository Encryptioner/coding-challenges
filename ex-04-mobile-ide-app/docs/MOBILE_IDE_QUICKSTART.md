# Mobile IDE Quick Start Guide
## Get Started Building the Mobile-Friendly VSCode-Compatible IDE

---

## Prerequisites

Before you begin, ensure you have:

```bash
# Required
- Node.js 20+ (LTS)
- Python 3.x (for node-gyp)
- Git
- 16GB RAM minimum
- 20GB free disk space

# Platform-specific
# macOS:
- Xcode 15+ (for iOS development)
- CocoaPods

# Windows:
- Visual Studio Build Tools
- Windows SDK

# Linux:
- build-essential
- libsecret-1-dev (for keytar)
```

---

## Step 1: Set Up Eclipse Theia Development Environment

### 1.1 Clone Theia Repository

```bash
# Create project directory
mkdir mobile-ide-project
cd mobile-ide-project

# Clone Eclipse Theia
git clone https://github.com/eclipse-theia/theia.git
cd theia

# Checkout latest stable version
git checkout v1.45.0  # Use latest stable version
```

### 1.2 Install Dependencies

```bash
# Install pnpm (recommended) or yarn
npm install -g pnpm

# Install Theia dependencies
pnpm install

# Build Theia from source
pnpm run build
```

**Expected time:** 15-30 minutes (first build)

### 1.3 Run Theia Locally

```bash
# Run the browser example
cd examples/browser
pnpm run start

# Or run the Electron example
cd examples/electron
pnpm run start
```

**Expected output:**
```
Theia app listening on http://localhost:3000
```

Open http://localhost:3000 in your browser to see Theia running.

---

## Step 2: Test on Mobile Browser

### 2.1 Enable Mobile Access

```bash
# Start Theia with host binding
cd examples/browser
pnpm run start --hostname 0.0.0.0
```

### 2.2 Access from Mobile Device

**Option A: Same WiFi Network**
```bash
# Find your local IP
# macOS/Linux:
ipconfig getifaddr en0  # or: ip addr show

# Windows:
ipconfig

# Access from mobile:
http://YOUR_IP:3000
```

**Option B: Tunneling (ngrok)**
```bash
# Install ngrok
npm install -g ngrok

# Create tunnel
ngrok http 3000

# Use the ngrok URL on your mobile device
```

### 2.3 Test Mobile Experience

Open the URL on your mobile device and note:
- ✗ UI is not mobile-optimized
- ✗ Touch targets are too small
- ✗ Layout is cramped
- ✗ Keyboard overlaps editor
- ✓ Basic functionality works
- ✓ Extensions can be loaded

**This confirms why we need a mobile UI layer!**

---

## Step 3: Create Custom Theia Application

### 3.1 Create New Project

```bash
# Go back to project root
cd ../..

# Create custom Theia app
mkdir mobile-ide
cd mobile-ide

# Initialize package.json
pnpm init
```

### 3.2 Configure package.json

```json
{
  "name": "mobile-ide",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "prepare": "pnpm run clean && pnpm run build",
    "clean": "theia clean",
    "build": "theia build --mode development",
    "start": "theia start --hostname 0.0.0.0 --port 3000",
    "watch": "theia build --watch --mode development"
  },
  "dependencies": {
    "@theia/core": "^1.45.0",
    "@theia/editor": "^1.45.0",
    "@theia/file-system": "^1.45.0",
    "@theia/filesystem": "^1.45.0",
    "@theia/markers": "^1.45.0",
    "@theia/messages": "^1.45.0",
    "@theia/monaco": "^1.45.0",
    "@theia/navigator": "^1.45.0",
    "@theia/preferences": "^1.45.0",
    "@theia/process": "^1.45.0",
    "@theia/terminal": "^1.45.0",
    "@theia/workspace": "^1.45.0",
    "@theia/plugin-ext": "^1.45.0",
    "@theia/plugin-ext-vscode": "^1.45.0"
  },
  "devDependencies": {
    "@theia/cli": "^1.45.0"
  },
  "theia": {
    "target": "browser",
    "frontend": {
      "config": {
        "applicationName": "Mobile IDE"
      }
    }
  }
}
```

### 3.3 Install and Build

```bash
# Install dependencies
pnpm install

# Build the application
pnpm run build

# Start the application
pnpm run start
```

**You now have a custom Theia application!**

---

## Step 4: Add Mobile-Optimized UI Extension

### 4.1 Create Mobile UI Extension

```bash
# Create extension directory
mkdir -p extensions/mobile-ui
cd extensions/mobile-ui

# Initialize extension
pnpm init
```

### 4.2 Extension package.json

```json
{
  "name": "mobile-ui-extension",
  "version": "0.1.0",
  "main": "lib/index.js",
  "types": "lib/index.d.ts",
  "scripts": {
    "build": "tsc",
    "watch": "tsc -w"
  },
  "dependencies": {
    "@theia/core": "^1.45.0",
    "@theia/monaco": "^1.45.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0"
  },
  "theiaExtensions": [
    {
      "frontend": "lib/browser/mobile-ui-frontend-module"
    }
  ]
}
```

### 4.3 Create TypeScript Configuration

```bash
# Create tsconfig.json
cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2017",
    "module": "commonjs",
    "moduleResolution": "node",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "strict": true,
    "esModuleInterop": true,
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "outDir": "lib",
    "rootDir": "src"
  },
  "include": [
    "src"
  ]
}
EOF
```

### 4.4 Create Mobile UI Module

```bash
# Create source directory
mkdir -p src/browser

# Create the frontend module
cat > src/browser/mobile-ui-frontend-module.ts << 'EOF'
import { ContainerModule } from '@theia/core/shared/inversify';
import { FrontendApplicationContribution } from '@theia/core/lib/browser';
import { MobileUIContribution } from './mobile-ui-contribution';

export default new ContainerModule(bind => {
    bind(MobileUIContribution).toSelf().inSingletonScope();
    bind(FrontendApplicationContribution).toService(MobileUIContribution);
});
EOF
```

### 4.5 Create Mobile UI Contribution

```bash
cat > src/browser/mobile-ui-contribution.ts << 'EOF'
import { injectable } from '@theia/core/shared/inversify';
import { FrontendApplicationContribution, FrontendApplication } from '@theia/core/lib/browser';

@injectable()
export class MobileUIContribution implements FrontendApplicationContribution {

    onStart(app: FrontendApplication): void {
        console.log('Mobile UI Extension activated!');
        this.detectMobile();
        this.applyMobileStyles();
    }

    private detectMobile(): boolean {
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        console.log('Running on mobile:', isMobile);

        if (isMobile) {
            document.body.classList.add('mobile-device');
        }

        return isMobile;
    }

    private applyMobileStyles(): void {
        const style = document.createElement('style');
        style.textContent = `
            /* Mobile-optimized styles */
            body.mobile-device {
                --theia-ui-font-size1: 16px;
            }

            body.mobile-device .theia-app-shell {
                /* Increase touch targets */
            }

            body.mobile-device .p-TabBar-tab {
                min-height: 44px;
                min-width: 44px;
            }

            body.mobile-device .theia-input {
                min-height: 44px;
                font-size: 16px;
            }

            /* Hide desktop-only elements on mobile */
            body.mobile-device .theia-editor-minimap {
                display: none;
            }
        `;
        document.head.appendChild(style);
    }
}
EOF
```

### 4.6 Build Extension

```bash
# Build the extension
pnpm run build
```

### 4.7 Link Extension to Main App

```bash
# Go back to mobile-ide root
cd ../..

# Add extension to package.json dependencies
# Edit package.json and add:
{
  "dependencies": {
    "mobile-ui-extension": "file:extensions/mobile-ui",
    // ... other dependencies
  }
}

# Install and rebuild
pnpm install
pnpm run build
pnpm run start
```

**You now have a basic mobile-aware Theia extension!**

---

## Step 5: Add Bottom Navigation (Mobile UI)

### 5.1 Create Bottom Nav Component

```bash
cd extensions/mobile-ui
mkdir -p src/browser/components
```

```typescript
// src/browser/components/bottom-navigation.tsx
import * as React from 'react';
import styled from 'styled-components';

const NavBar = styled.div`
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    height: 56px;
    background: var(--theia-toolbar-background);
    border-top: 1px solid var(--theia-border);
    display: flex;
    justify-content: space-around;
    align-items: center;
    z-index: 1000;

    @media (min-width: 768px) {
        display: none; /* Hide on desktop */
    }
`;

const NavItem = styled.button`
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: none;
    border: none;
    color: var(--theia-foreground);
    font-size: 12px;
    padding: 8px;
    cursor: pointer;
    min-width: 44px;
    min-height: 44px;

    &:active {
        background: var(--theia-toolbar-active);
    }

    &.active {
        color: var(--theia-accent-color);
    }
`;

const Icon = styled.span`
    font-size: 24px;
    margin-bottom: 4px;
`;

export interface BottomNavigationProps {
    activeItem: string;
    onNavigate: (item: string) => void;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({ activeItem, onNavigate }) => {
    const navItems = [
        { id: 'files', label: 'Files', icon: '📁' },
        { id: 'search', label: 'Search', icon: '🔍' },
        { id: 'git', label: 'Git', icon: '🌿' },
        { id: 'extensions', label: 'Extensions', icon: '🧩' },
        { id: 'settings', label: 'Settings', icon: '⚙️' },
    ];

    return (
        <NavBar>
            {navItems.map(item => (
                <NavItem
                    key={item.id}
                    className={activeItem === item.id ? 'active' : ''}
                    onClick={() => onNavigate(item.id)}
                >
                    <Icon>{item.icon}</Icon>
                    <span>{item.label}</span>
                </NavItem>
            ))}
        </NavBar>
    );
};
```

### 5.2 Integrate Bottom Nav

Update `mobile-ui-contribution.ts`:

```typescript
import * as ReactDOM from 'react-dom';
import * as React from 'react';
import { BottomNavigation } from './components/bottom-navigation';

@injectable()
export class MobileUIContribution implements FrontendApplicationContribution {

    private activeView: string = 'files';

    onStart(app: FrontendApplication): void {
        console.log('Mobile UI Extension activated!');

        if (this.detectMobile()) {
            this.renderBottomNavigation();
            this.adjustMainLayout();
        }
    }

    private renderBottomNavigation(): void {
        const container = document.createElement('div');
        container.id = 'mobile-bottom-nav';
        document.body.appendChild(container);

        ReactDOM.render(
            React.createElement(BottomNavigation, {
                activeItem: this.activeView,
                onNavigate: (item: string) => {
                    this.activeView = item;
                    this.handleNavigation(item);
                }
            }),
            container
        );
    }

    private handleNavigation(item: string): void {
        console.log('Navigate to:', item);
        // TODO: Implement navigation logic
        // - Show/hide panels
        // - Open views
        // - Execute commands
    }

    private adjustMainLayout(): void {
        const style = document.createElement('style');
        style.textContent = `
            body.mobile-device .theia-app-shell {
                padding-bottom: 56px; /* Space for bottom nav */
            }
        `;
        document.head.appendChild(style);
    }

    // ... other methods
}
```

---

## Step 6: Add Touch Gesture Support

### 6.1 Install React Use Gesture

```bash
cd extensions/mobile-ui
pnpm add @use-gesture/react
```

### 6.2 Create Gesture Handler

```typescript
// src/browser/gestures/gesture-handler.ts
import { useDrag, useGesture } from '@use-gesture/react';

export class MobileGestureHandler {

    setupEditorGestures(editorElement: HTMLElement): void {
        // Swipe left/right to switch tabs
        const bind = useGesture({
            onDrag: ({ movement: [mx, my], direction: [xDir], cancel }) => {
                if (Math.abs(mx) > 100) {
                    if (xDir > 0) {
                        this.switchToPreviousTab();
                    } else {
                        this.switchToNextTab();
                    }
                    cancel();
                }
            }
        });

        // Apply gesture handlers
        bind();
    }

    setupPanelGestures(panelElement: HTMLElement): void {
        // Swipe up to show terminal
        // Swipe down to hide
    }

    private switchToNextTab(): void {
        console.log('Switch to next tab');
        // TODO: Implement tab switching
    }

    private switchToPreviousTab(): void {
        console.log('Switch to previous tab');
        // TODO: Implement tab switching
    }
}
```

---

## Step 7: Test VSCode Extension Compatibility

### 7.1 Install a VSCode Extension

```bash
# Download a .vsix file from Open VSX Registry
# Example: Python extension
wget https://open-vsx.org/api/ms-python/python/2024.0.0/file/ms-python.python-2024.0.0.vsix

# Install via Theia CLI
theia plugin install ms-python.python-2024.0.0.vsix
```

### 7.2 Test Extension in Mobile Browser

1. Start your Theia app
2. Open on mobile device
3. Open a Python file (.py)
4. Verify:
   - Syntax highlighting works
   - IntelliSense works
   - Extension commands appear
   - Extension UI adapts (or note issues)

---

## Step 8: Create Native Mobile App Wrapper

### 8.1 Install Capacitor

```bash
# Go to mobile-ide root
cd mobile-ide

# Install Capacitor
pnpm install @capacitor/core @capacitor/cli
pnpm install @capacitor/ios @capacitor/android

# Initialize Capacitor
npx cap init "Mobile IDE" "com.yourcompany.mobileid"
```

### 8.2 Configure Capacitor

Edit `capacitor.config.ts`:

```typescript
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.yourcompany.mobileid',
  appName: 'Mobile IDE',
  webDir: 'lib',
  bundledWebRuntime: false,
  server: {
    androidScheme: 'https',
    hostname: 'localhost',
    iosScheme: 'capacitor'
  }
};

export default config;
```

### 8.3 Add iOS Platform

```bash
# Add iOS platform
npx cap add ios

# Open in Xcode
npx cap open ios
```

In Xcode:
1. Select a development team
2. Update bundle identifier
3. Run on simulator or device

### 8.4 Add Android Platform

```bash
# Add Android platform
npx cap add android

# Open in Android Studio
npx cap open android
```

In Android Studio:
1. Sync Gradle
2. Run on emulator or device

---

## Step 9: Implement File System Access

### 9.1 Install Filesystem Plugin

```bash
pnpm install @capacitor/filesystem
```

### 9.2 Create File System Service

```typescript
// extensions/mobile-ui/src/browser/services/mobile-filesystem.ts
import { Filesystem, Directory } from '@capacitor/filesystem';

export class MobileFileSystemService {

    async readFile(path: string): Promise<string> {
        try {
            const result = await Filesystem.readFile({
                path: path,
                directory: Directory.Documents
            });
            return result.data as string;
        } catch (error) {
            console.error('Error reading file:', error);
            throw error;
        }
    }

    async writeFile(path: string, data: string): Promise<void> {
        await Filesystem.writeFile({
            path: path,
            data: data,
            directory: Directory.Documents
        });
    }

    async listFiles(path: string): Promise<string[]> {
        const result = await Filesystem.readdir({
            path: path,
            directory: Directory.Documents
        });
        return result.files.map(f => f.name);
    }
}
```

---

## Step 10: Deploy and Test

### 10.1 Build for Production

```bash
# Build Theia app
pnpm run build --mode production

# Sync with Capacitor
npx cap sync
```

### 10.2 Deploy iOS

```bash
# Archive for TestFlight
# In Xcode: Product → Archive → Distribute App
```

### 10.3 Deploy Android

```bash
# Build release APK
cd android
./gradlew assembleRelease

# APK will be in: app/build/outputs/apk/release/
```

---

## Project Structure

```
mobile-ide-project/
├── mobile-ide/                 # Main Theia application
│   ├── extensions/
│   │   └── mobile-ui/         # Mobile UI extension
│   │       ├── src/
│   │       │   └── browser/
│   │       │       ├── components/
│   │       │       ├── services/
│   │       │       ├── gestures/
│   │       │       └── mobile-ui-frontend-module.ts
│   │       ├── package.json
│   │       └── tsconfig.json
│   ├── ios/                   # Capacitor iOS app
│   ├── android/               # Capacitor Android app
│   ├── package.json
│   └── capacitor.config.ts
└── theia/                     # Eclipse Theia (for reference)
```

---

## Next Steps

Now that you have the foundation:

1. **Enhance Mobile UI**
   - Add more mobile-specific components
   - Implement gesture controls
   - Create mobile-friendly dialogs

2. **Test Extensions**
   - Install top VSCode extensions
   - Document compatibility issues
   - Create adaptation layer

3. **Optimize Performance**
   - Profile on real devices
   - Implement code splitting
   - Add service worker caching

4. **Add Features**
   - Git integration UI
   - Terminal emulator
   - Settings panel

5. **Publish**
   - Submit to App Store
   - Submit to Google Play
   - Create landing page

---

## Resources

### Documentation
- Theia Docs: https://theia-ide.org/docs/
- Capacitor Docs: https://capacitorjs.com/docs
- Monaco Editor API: https://microsoft.github.io/monaco-editor/

### Community
- Theia Discussions: https://github.com/eclipse-theia/theia/discussions
- Theia Slack: https://theia-ide.org/slack

### Examples
- Theia Examples: https://github.com/eclipse-theia/theia/tree/master/examples
- VSCode Extension Samples: https://github.com/microsoft/vscode-extension-samples

---

## Troubleshooting

### Build Fails
```bash
# Clear cache and rebuild
rm -rf node_modules
rm -rf lib
pnpm install
pnpm run build
```

### Extension Not Loading
```bash
# Check extension is in package.json dependencies
# Check theiaExtensions in extension package.json
# Check console for errors
```

### Mobile Device Can't Connect
```bash
# Check firewall allows port 3000
# Use ngrok for testing
# Check devices are on same network
```

---

**Ready to start? Run:**

```bash
# Clone this plan
git clone <your-repo>
cd <your-repo>

# Follow Step 1-3 to get Theia running
# Then start building! 🚀
```

Good luck building the mobile IDE! 🎉
