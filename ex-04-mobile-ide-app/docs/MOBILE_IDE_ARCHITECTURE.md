# Mobile IDE Architecture
## Technical Architecture for Eclipse Theia-Based Mobile IDE

---

> **Building for Mobile Requires Rethinking Everything** 🏛️
>
> You can't just take a desktop IDE and shrink it down—that's a recipe for disaster. Mobile devices have fundamentally different constraints: touch instead of mouse, limited screen real estate, variable network conditions, and battery life that actually matters.
>
> This architecture document lays out how we're building a **professional-grade mobile IDE** that doesn't feel like a compromised desktop experience. We're talking five distinct architectural layers, each solving a specific piece of the mobile puzzle:
>
> - **Native wrapper** that integrates with iOS and Android at the OS level
> - **Mobile-optimized UI** built from scratch for touch interactions
> - **Smart adaptation middleware** that makes desktop extensions work beautifully on mobile
> - **Eclipse Theia core** providing full VSCode extension API compatibility
> - **Backend services** handling file systems, Git, and language servers
>
> This isn't just another "IDE in a WebView." This is a thoughtfully architected system where every layer has a purpose, and they all work together to deliver an experience that feels *native* to mobile while maintaining the power of a desktop IDE.
>
> **Let's break down how it all fits together.**

---

## 1. System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         Mobile Devices                          │
│                     (iOS, Android, Tablets)                     │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Native App Wrapper Layer                      │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │              Capacitor / React Native                      │ │
│  │  - File System Access      - Native Gestures               │ │
│  │  - Biometric Auth          - Share Extension               │ │
│  │  - System Integration      - Background Sync               │ │
│  └────────────────────────────────────────────────────────────┘ │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Mobile-Optimized UI Layer                      │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                 Custom Mobile UI (React)                   │ │
│  │  ┌──────────────┬──────────────┬──────────────┬──────────┐ │ │
│  │  │ Touch        │ Bottom Nav   │ Gesture      │ Adaptive │ │ │
│  │  │ Interactions │ Bar          │ System       │ Layout   │ │ │
│  │  └──────────────┴──────────────┴──────────────┴──────────┘ │ │
│  │  ┌──────────────────────────────────────────────────────── │ │
│  │  │ Mobile Components Library                              │ │ │
│  │  │  - Drawer Navigation  - Bottom Sheets                 │ │ │
│  │  │  - FAB (Floating)     - Swipeable Tabs                │ │ │
│  │  │  - Touch Menus        - Mobile Dialogs                │ │ │
│  │  └──────────────────────────────────────────────────────── │ │
│  └────────────────────────────────────────────────────────────┘ │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│              Mobile Adaptation Middleware                       │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Extension UI Adapter                                      │ │
│  │  - Converts desktop extensions to mobile-friendly UI      │ │
│  │  - Touch target expansion                                 │ │
│  │  - Layout transformation                                  │ │
│  │  - Gesture mapping                                        │ │
│  └────────────────────────────────────────────────────────────┘ │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Eclipse Theia Core                            │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │           VSCode Extension API (Compatible)                │ │
│  │  ┌──────────────┬──────────────┬──────────────┬──────────┐ │ │
│  │  │ vscode.      │ vscode.      │ vscode.      │ vscode.  │ │ │
│  │  │ window       │ workspace    │ languages    │ debug    │ │ │
│  │  └──────────────┴──────────────┴──────────────┴──────────┘ │ │
│  └────────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                  Monaco Editor Core                        │ │
│  │  - Syntax Highlighting    - IntelliSense                   │ │
│  │  - Code Folding           - Multi-cursor                   │ │
│  │  - Bracket Matching       - Minimap                        │ │
│  └────────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │              Language Server Protocol (LSP)                │ │
│  │  ┌──────────┬──────────┬──────────┬──────────┬──────────┐ │ │
│  │  │ Python   │ TypeScript│ Java     │ Go       │ Rust     │ │ │
│  │  │ Server   │ Server   │ Server   │ Server   │ Server   │ │ │
│  │  └──────────┴──────────┴──────────┴──────────┴──────────┘ │ │
│  └────────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │              Debug Adapter Protocol (DAP)                  │ │
│  │  - Breakpoints    - Variable inspection                    │ │
│  │  - Step debugging - Call stack                             │ │
│  └────────────────────────────────────────────────────────────┘ │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Backend Services                           │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                   Node.js Server                           │ │
│  │  ┌──────────────┬──────────────┬──────────────┬──────────┐ │ │
│  │  │ File System  │ Git Service  │ Terminal     │ Task     │ │ │
│  │  │ Service      │              │ Service      │ Runner   │ │ │
│  │  └──────────────┴──────────────┴──────────────┴──────────┘ │ │
│  └────────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                  Cloud Services (Optional)                 │ │
│  │  - Cloud Sync         - Remote Workspaces                  │ │
│  │  - Extension Registry - Collaboration Service              │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Layer-by-Layer Breakdown

### Layer 1: Native App Wrapper

> **The Bridge Between Web and Native** 🌉
>
> Here's the reality: web technologies are incredibly powerful for building complex UIs quickly, but they can't access the file system, can't use biometric authentication, and can't integrate with the OS share sheet. That's where the native wrapper comes in.
>
> **Capacitor** (or React Native) acts as our bridge, giving our web-based IDE access to native platform APIs while keeping99% of our code cross-platform. Think of it as a universal translator between JavaScript and the native iOS/Android worlds.
>
> **What this layer unlocks:**
> - Read and write files anywhere on the device (with permission)
> - Face ID / Touch ID authentication
> - Share code snippets to/from other apps
> - Respect system dark mode and theme preferences
> - Proper keyboard handling that doesn't break on iOS 17
>
> This layer is invisible to users but absolutely critical. Without it, we'd be stuck with browser limitations. With it, we're a first-class mobile citizen.

**Technology:** Capacitor (Recommended) or React Native

**Responsibilities:**
- Bridge web app to native APIs
- File system access (iOS/Android)
- Share extensions
- Biometric authentication
- System integrations
- App lifecycle management

**APIs Exposed:**
```typescript
interface NativeWrapper {
  filesystem: {
    readFile(path: string): Promise<string>;
    writeFile(path: string, data: string): Promise<void>;
    listDirectory(path: string): Promise<FileInfo[]>;
    pickFile(): Promise<File>;
  };

  auth: {
    biometric(): Promise<boolean>;
  };

  share: {
    shareText(text: string): Promise<void>;
    shareFile(file: File): Promise<void>;
  };

  system: {
    getTheme(): 'light' | 'dark';
    onThemeChange(callback: (theme: string) => void): void;
  };
}
```

---

### Layer 2: Mobile-Optimized UI Layer

> **Touch-First, Not Desktop-Shrunk** 📱
>
> This is where we break free from desktop conventions and embrace mobile interaction paradigms. No tiny buttons. No hover states. No multi-window chaos.
>
> **Built with React + TypeScript**, this layer is our complete mobile UI reimplementation. We're talking:
> - **Bottom navigation** instead of sidebars (because thumbs are at the bottom of your phone)
> - **Gesture controls** for everything (swipe to switch files, pinch to zoom, long-press for context menus)
> - **Floating action buttons** for primary actions (always within thumb reach)
> - **Bottom sheets** instead of modal dialogs (easier to dismiss, less jarring)
> - **Touch targets** that are actually big enough (44x44px minimum, Apple's own guideline)
>
> Every component here is designed with one question: "Can someone use this comfortably with their thumb while holding a phone one-handed?" If the answer is no, we redesign it.
>
> This isn't a responsive CSS tweak. This is a **complete rethinking of IDE interaction patterns** for the mobile form factor.

**Technology:** React + TypeScript + Styled Components

**Components:**

#### Navigation System
```
Bottom Navigation Bar
├── Home (Dashboard)
├── Files (Explorer)
├── Search (Find in files)
├── Extensions (Marketplace)
└── Settings

Gesture Navigation
├── Swipe Left: Next file tab
├── Swipe Right: Previous file tab
├── Swipe Up: Show terminal
├── Swipe Down: Hide panels
├── Pinch: Zoom editor
└── Long Press: Context menu
```

#### Mobile Component Library
```typescript
// Example mobile components
interface MobileComponents {
  // Navigation
  BottomNavBar: React.FC<BottomNavBarProps>;
  DrawerMenu: React.FC<DrawerMenuProps>;

  // Interaction
  FloatingActionButton: React.FC<FABProps>;
  SwipeablePanel: React.FC<SwipeablePanelProps>;
  TouchMenu: React.FC<TouchMenuProps>;

  // Dialogs
  BottomSheet: React.FC<BottomSheetProps>;
  MobileDialog: React.FC<DialogProps>;

  // Editor
  MobileToolbar: React.FC<ToolbarProps>;
  TouchCodeEditor: React.FC<EditorProps>;
  VirtualKeyboard: React.FC<KeyboardProps>;
}
```

#### Layout Modes

**Portrait Mode:**
```
┌─────────────────────┐
│   Breadcrumb Nav    │ 40px
├─────────────────────┤
│                     │
│                     │
│   Monaco Editor     │ flex
│   (Full Width)      │
│                     │
│                     │
├─────────────────────┤
│  Bottom Tabs        │ 56px
│ [Files][Search][+]  │
└─────────────────────┘
```

**Landscape Mode (Phone):**
```
┌──────┬──────────────────┐
│ Tree │                  │ 40%/60%
│      │   Editor         │
│      │                  │
├──────┴──────────────────┤
│    Bottom Tabs          │ 56px
└─────────────────────────┘
```

**Landscape Mode (Tablet):**
```
┌────────┬────────────────┬────────┐
│  File  │                │ Outline│ 20%/60%/20%
│  Tree  │    Editor      │  Panel │
│        │                │        │
├────────┴────────────────┴────────┤
│         Bottom Tabs              │ 56px
└──────────────────────────────────┘
```

---

### Layer 3: Mobile Adaptation Middleware

> **Making Desktop Extensions Play Nice on Mobile** 🔄
>
> Here's the problem: VSCode has thousands of amazing extensions. They were all designed for desktops. We need them to work on mobile without asking every extension developer to rewrite their UI.
>
> Enter the **adaptation middleware**—a smart layer that sits between extensions and our mobile UI, automatically transforming desktop interaction patterns into mobile-friendly equivalents:
>
> - **QuickPick dropdown** → **Bottom sheet** (swipeable, easier to dismiss)
> - **Context menu** → **Long-press menu** with larger touch targets
> - **Tree view** → **Mobile tree** with swipe actions and tap-to-expand
> - **Webviews** → **Responsive webviews** with proper viewport settings
>
> **The beauty of this approach:** Extension developers don't need to do anything special. They use the standard VSCode API, and our middleware handles the mobile transformation automatically.
>
> It's not perfect for every extension, but it gets us **95%+ compatibility** without fragmenting the ecosystem or requiring mobile-specific extension versions.

**Purpose:** Automatically adapt desktop-oriented extension UIs for mobile

**Transformation Rules:**

```typescript
class ExtensionUIAdapter {
  // Transform desktop QuickPick to mobile BottomSheet
  adaptQuickPick(quickPick: vscode.QuickPick): MobileQuickPick {
    return {
      items: quickPick.items,
      display: 'bottom-sheet',  // Instead of dropdown
      touchTargetSize: 48,       // Minimum 48px
      dismissGesture: 'swipe-down',
    };
  }

  // Transform desktop TreeView to mobile-friendly tree
  adaptTreeView(treeView: vscode.TreeView): MobileTreeView {
    return {
      ...treeView,
      itemHeight: 44,            // Touch-friendly
      swipeActions: true,        // Enable swipe-to-delete, etc.
      expandOnTap: true,         // Single tap to expand
      contextMenu: 'long-press', // Long press for context menu
    };
  }

  // Transform desktop Webview to mobile-responsive
  adaptWebview(webview: vscode.Webview): MobileWebview {
    return {
      ...webview,
      viewport: {
        width: 'device-width',
        initialScale: 1,
        maximumScale: 5,
      },
      touchGestures: true,
      keyboardAdjust: 'resize',
    };
  }
}
```

---

### Layer 4: Eclipse Theia Core

> **The Engine That Makes It All Possible** ⚙️
>
> This is where the magic of **VSCode extension compatibility** lives. Eclipse Theia provides a full implementation of the VSCode Extension API—meaning any extension written for VSCode can run in our mobile IDE without modification.
>
> **What we're leveraging:**
> - **Monaco Editor** (the same code editor that powers VSCode)
> - **Language Server Protocol** clients (for IntelliSense, go-to-definition, refactoring)
> - **Debug Adapter Protocol** (for breakpoint debugging)
> - **VSCode Extension API** (window, workspace, commands, languages—the whole enchilada)
>
> **What we're replacing:**
> - The desktop UI (we built our own mobile UI in Layer 2)
> - Mouse interactions (replaced with touch gestures)
> - Desktop layout system (replaced with mobile-friendly layouts)
>
> **What stays the same:**
> - 100% of the extension API surface
> - Language servers work identically
> - Debuggers work identically
> - Extensions can't tell they're running on mobile (that's intentional)
>
> Theia did the heavy lifting of implementing the VSCode API. We're standing on the shoulders of giants here, and it's brilliant.

**What We Use:**
- VSCode Extension API implementation
- Monaco Editor
- Language Server Protocol client
- Debug Adapter Protocol client
- Plugin system
- Workspace management

**What We Replace:**
- Desktop UI → Mobile UI
- Desktop layouts → Mobile layouts
- Mouse interactions → Touch interactions

**What We Keep:**
```typescript
// All extension APIs remain unchanged
import * as vscode from 'vscode';

// Extensions work exactly as they do in VSCode
vscode.commands.registerCommand('extension.hello', () => {
  vscode.window.showInformationMessage('Hello from mobile!');
});
```

---

### Layer 5: Backend Services

> **The Workhorse Behind the Scenes** 🔧
>
> While the frontend gets all the attention with its fancy gestures and beautiful UI, the backend is where the real work happens. This layer handles everything that doesn't belong in the browser:
>
> **File System Service:**
> - Reading/writing files (with proper encoding detection)
> - Watching for changes (real-time updates when files change externally)
> - Fast file search across entire projects
> - Handling both local and cloud storage (IndexedDB for offline, S3/Drive for sync)
>
> **Git Service:**
> - Full Git operations (clone, commit, push, pull, merge)
> - Diff computation (line-by-line comparisons)
> - Conflict resolution support
> - Works with OAuth for GitHub/GitLab authentication
>
> **Terminal Service:**
> - Real terminal emulation (not just command execution)
> - Streaming output with ANSI color support
> - Background process management
> - Proper signal handling (Ctrl+C works as expected)
>
> **Language Servers:**
> - Spawn and manage language server processes
> - LSP communication over WebSockets
> - Handle multiple language servers simultaneously
>
> All of this runs in a **Node.js backend**, communicating with the frontend via WebSockets and HTTP/2. It's architected to work both locally (for the native apps) and remotely (for cloud-based workspaces).

**Architecture:**

```
┌─────────────────────────────────────┐
│         Frontend (Mobile)           │
└───────────────┬─────────────────────┘
                │ WebSocket / HTTP
                ▼
┌─────────────────────────────────────┐
│         API Gateway                 │
│  - Authentication                   │
│  - Rate limiting                    │
│  - Request routing                  │
└───────────────┬─────────────────────┘
                │
        ┌───────┴───────┐
        ▼               ▼
┌───────────────┐ ┌─────────────────┐
│ File System   │ │ Git Service     │
│ Service       │ │                 │
│ - CRUD ops    │ │ - Clone         │
│ - Watch       │ │ - Commit/Push   │
│ - Search      │ │ - Diff/Merge    │
└───────────────┘ └─────────────────┘
        │               │
        └───────┬───────┘
                ▼
┌─────────────────────────────────────┐
│      Storage Layer                  │
│  - Local (IndexedDB / File System)  │
│  - Cloud (Optional - S3, etc.)      │
└─────────────────────────────────────┘
```

**Services:**

#### File System Service
```typescript
class FileSystemService {
  async readFile(uri: string): Promise<string>;
  async writeFile(uri: string, content: string): Promise<void>;
  async deleteFile(uri: string): Promise<void>;
  async listFiles(uri: string): Promise<FileStat[]>;
  async watchFile(uri: string, callback: (event) => void): void;
  async search(query: string, options: SearchOptions): Promise<Match[]>;
}
```

#### Git Service
```typescript
class GitService {
  async clone(url: string, path: string): Promise<void>;
  async status(repo: string): Promise<GitStatus>;
  async commit(repo: string, message: string): Promise<void>;
  async push(repo: string, remote: string, branch: string): Promise<void>;
  async pull(repo: string): Promise<void>;
  async diff(repo: string, file: string): Promise<Diff>;
  async checkout(repo: string, branch: string): Promise<void>;
}
```

#### Terminal Service
```typescript
class TerminalService {
  createTerminal(options: TerminalOptions): Terminal;
  async executeCommand(command: string): Promise<CommandResult>;
  onOutput(callback: (data: string) => void): void;
  resize(cols: number, rows: number): void;
}
```

---

## 3. Data Flow

### Opening a File

```
User Action (Tap File)
    │
    ▼
┌────────────────────────┐
│ Mobile UI Layer        │
│ - Handle touch event   │
│ - Show loading state   │
└───────────┬────────────┘
            │
            ▼
┌────────────────────────┐
│ Theia Workspace        │
│ - Resolve file URI     │
│ - Check cache          │
└───────────┬────────────┘
            │
            ▼
┌────────────────────────┐
│ File System Service    │
│ - Read file content    │
│ - Detect language      │
└───────────┬────────────┘
            │
            ▼
┌────────────────────────┐
│ Language Server        │
│ - Parse syntax         │
│ - Compute highlights   │
│ - Provide IntelliSense │
└───────────┬────────────┘
            │
            ▼
┌────────────────────────┐
│ Monaco Editor          │
│ - Render content       │
│ - Apply syntax colors  │
│ - Setup completion     │
└───────────┬────────────┘
            │
            ▼
┌────────────────────────┐
│ Mobile UI              │
│ - Display editor       │
│ - Enable touch editing │
│ - Show virtual keyboard│
└────────────────────────┘
```

### Installing an Extension

```
User Action (Tap Install)
    │
    ▼
┌────────────────────────┐
│ Mobile Extension       │
│ Marketplace UI         │
│ - Show progress        │
└───────────┬────────────┘
            │
            ▼
┌────────────────────────┐
│ Extension Manager      │
│ - Download .vsix       │
│ - Verify signature     │
└───────────┬────────────┘
            │
            ▼
┌────────────────────────┐
│ Extension Loader       │
│ - Extract extension    │
│ - Load package.json    │
│ - Initialize extension │
└───────────┬────────────┘
            │
            ▼
┌────────────────────────┐
│ Mobile UI Adapter      │
│ - Adapt extension UI   │
│ - Apply mobile theme   │
└───────────┬────────────┘
            │
            ▼
┌────────────────────────┐
│ Extension Activated    │
│ - Register commands    │
│ - Start language server│
└────────────────────────┘
```

---

## 4. Performance Optimizations

### Code Splitting Strategy

```typescript
// Main bundle (loaded immediately)
import { CoreEditor } from './core-editor';
import { FileExplorer } from './file-explorer';

// Lazy loaded (on demand)
const GitPanel = lazy(() => import('./git-panel'));
const Terminal = lazy(() => import('./terminal'));
const Extensions = lazy(() => import('./extensions'));
const Settings = lazy(() => import('./settings'));

// Language servers (loaded when file opened)
const PythonLS = lazy(() => import('./language-servers/python'));
const TypeScriptLS = lazy(() => import('./language-servers/typescript'));
```

### Service Worker Caching

```typescript
// Cache strategy
const CACHE_STRATEGY = {
  // Static assets - cache first
  assets: 'cache-first',

  // Language servers - network first, fallback to cache
  languageServers: 'network-first',

  // Extensions - cache first, update in background
  extensions: 'stale-while-revalidate',

  // User files - network only (don't cache)
  userFiles: 'network-only',
};
```

### Memory Management

```typescript
class MemoryManager {
  // Close unused tabs after inactivity
  closeInactiveTabs(after: number = 5 * 60 * 1000) {
    // Close tabs not accessed in 5 minutes
  }

  // Unload extensions not in use
  unloadInactiveExtensions(after: number = 10 * 60 * 1000) {
    // Unload after 10 minutes inactive
  }

  // Limit syntax highlighting scope
  limitHighlightingScope(lines: number = 1000) {
    // Only highlight visible + 1000 lines
  }

  // Clear undo history for old documents
  clearOldUndoHistory(age: number = 30 * 60 * 1000) {
    // Clear after 30 minutes
  }
}
```

---

## 5. Security Architecture

### Authentication Flow

```
┌────────────┐
│   User     │
└─────┬──────┘
      │ 1. Open app
      ▼
┌────────────────────┐
│  Biometric Auth    │
│  (If enabled)      │
└─────┬──────────────┘
      │ 2. Success
      ▼
┌────────────────────┐
│  OAuth Provider    │
│  (GitHub, Google)  │
└─────┬──────────────┘
      │ 3. Access token
      ▼
┌────────────────────┐
│  Backend API       │
│  - Verify token    │
│  - Create session  │
└─────┬──────────────┘
      │ 4. Session token
      ▼
┌────────────────────┐
│  Secure Storage    │
│  (Encrypted)       │
└────────────────────┘
```

### Data Encryption

```typescript
interface SecurityService {
  // Encrypt sensitive data
  encrypt(data: string): string;
  decrypt(encrypted: string): string;

  // Secure file storage
  secureWrite(path: string, data: string): Promise<void>;
  secureRead(path: string): Promise<string>;

  // Token management
  storeToken(token: string): Promise<void>;
  getToken(): Promise<string | null>;
  clearToken(): Promise<void>;

  // Biometric
  enableBiometric(): Promise<void>;
  authenticateBiometric(): Promise<boolean>;
}
```

---

## 6. Offline Support

### Progressive Web App (PWA)

```typescript
// Service worker registration
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js');
}

// Offline detection
window.addEventListener('online', () => {
  // Sync changes when back online
  syncManager.syncAll();
});

window.addEventListener('offline', () => {
  // Show offline indicator
  showOfflineMode();
});
```

### Offline Capabilities

- ✅ Edit files offline
- ✅ Create new files
- ✅ Syntax highlighting
- ✅ IntelliSense (cached)
- ✅ Git commits (local)
- ⚠️ Extensions (if cached)
- ❌ Extension marketplace
- ❌ Git push/pull
- ❌ Cloud sync

---

## 7. Extension System Architecture

### Extension Loading

```
Extension Discovery
    │
    ▼
┌─────────────────────────┐
│ Extension Manifest      │
│ (package.json)          │
│ - Activations events    │
│ - Contributions         │
│ - Dependencies          │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ Dependency Resolution   │
│ - Check version compat  │
│ - Install dependencies  │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ Extension Activation    │
│ - Load extension code   │
│ - Call activate()       │
│ - Register capabilities │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ Mobile UI Adaptation    │
│ - Adapt contributed UI  │
│ - Apply mobile theme    │
└─────────────────────────┘
```

### Extension API Bridge

```typescript
// Bridge between VSCode API and mobile implementation
class ExtensionAPIBridge {
  // VSCode API
  readonly window: typeof vscode.window;
  readonly workspace: typeof vscode.workspace;
  readonly commands: typeof vscode.commands;

  // Mobile-specific enhancements
  readonly mobile: {
    // Check if running on mobile
    isMobile(): boolean;

    // Get device info
    getDeviceInfo(): DeviceInfo;

    // Mobile-specific UI
    showBottomSheet(options: BottomSheetOptions): void;
    showToast(message: string): void;

    // Gestures
    onGesture(gesture: GestureType, handler: () => void): void;
  };
}
```

---

## 8. Deployment Architecture

### Build Pipeline

```
Source Code (TypeScript/React)
    │
    ▼
ESLint + Prettier
    │
    ▼
TypeScript Compilation
    │
    ▼
Webpack Bundling
    │
    ├──► Web Bundle (PWA)
    │    │
    │    ▼
    │    Deploy to CDN
    │
    ├──► iOS Bundle (Capacitor)
    │    │
    │    ▼
    │    Xcode Build → App Store
    │
    └──► Android Bundle (Capacitor)
         │
         ▼
         Gradle Build → Google Play
```

### Hosting Options

**Option A: Static Hosting (PWA)**
- Cloudflare Pages / Vercel / Netlify
- CDN distribution
- Automatic HTTPS
- Global edge network

**Option B: Container Deployment (Backend)**
- Docker containers
- Kubernetes orchestration
- Auto-scaling
- Load balancing

**Option C: Serverless (Optional services)**
- AWS Lambda / Cloud Functions
- Extension marketplace API
- Cloud sync service
- Authentication service

---

## 9. Monitoring & Analytics

### Performance Monitoring

```typescript
interface PerformanceMetrics {
  // App performance
  timeToInteractive: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;

  // Editor performance
  editorRenderTime: number;
  syntaxHighlightTime: number;
  completionLatency: number;

  // Resource usage
  memoryUsage: number;
  cpuUsage: number;
  batteryDrain: number;

  // User interactions
  tapLatency: number;
  scrollFPS: number;
  keyboardLatency: number;
}
```

### Error Tracking

```typescript
// Sentry integration
Sentry.init({
  dsn: 'YOUR_DSN',
  environment: 'production',
  beforeSend(event) {
    // Filter sensitive data
    return sanitizeEvent(event);
  },
});

// Track errors
try {
  // Code
} catch (error) {
  Sentry.captureException(error);
}
```

---

## 10. Technology Stack Summary

```yaml
Frontend:
  Core: Eclipse Theia (forked/customized)
  UI Framework: React 18+ with TypeScript
  State Management: Redux Toolkit or Zustand
  Styling: Styled Components + TailwindCSS
  Editor: Monaco Editor
  Gestures: React Use Gesture
  Animations: Framer Motion
  PWA: Workbox

Backend:
  Runtime: Node.js 20+
  Framework: Express or Fastify
  WebSocket: Socket.io or ws
  Git: isomorphic-git
  File System: fs-extra
  Terminal: node-pty

Mobile:
  Wrapper: Capacitor 5+
  iOS: Swift + WKWebView
  Android: Kotlin + WebView

Build Tools:
  Bundler: Webpack 5 or Vite
  Compiler: TypeScript 5+
  Linter: ESLint
  Formatter: Prettier
  Package Manager: pnpm or yarn

DevOps:
  CI/CD: GitHub Actions
  Containers: Docker
  Monitoring: Sentry
  Analytics: PostHog or Mixpanel
  Testing: Jest + Playwright
```

---

**Document Version:** 1.0
**Last Updated:** 2025-11-16
