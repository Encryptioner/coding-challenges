# 🚀 Browser IDE

A fully functional VS Code-like IDE that runs entirely in your browser. No backend required!

![Browser IDE](https://img.shields.io/badge/PWA-Enabled-blue)
![GitHub Pages](https://img.shields.io/badge/Deploy-GitHub%20Pages-success)

## ✨ Features

- 📁 **File Management** - Browse and edit files with a VS Code-like interface
- 🔗 **Git Integration** - Clone, commit, and push directly to GitHub
- ▶️ **Run Code** - Execute Node.js applications with WebContainers
- 🤖 **AI Assistant** - Get coding help from Claude AI
- 📱 **PWA Support** - Install and use offline
- 💾 **Local Storage** - All data stored in your browser (IndexedDB)

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- GitHub Personal Access Token (for cloning private repos)
- Anthropic API Key (for AI features)

### Installation

```bash
# Go to the project
cd ex-05-browser-ide-v1

# Install dependencies
pnpm install

# Start dev server
pnpm dev
```

Visit `http://localhost:5173`

### Build for Production

```bash
pnpm build
```

### Deploy to GitHub Pages

```bash
pnpm deploy
```

Or use the included GitHub Actions workflow for automatic deployment.

## 📖 Usage

### First Time Setup

1. Open Browser IDE
2. Click on **Settings** (⚙️) in the titlebar
3. Add your GitHub Personal Access Token
4. Add your Anthropic API Key
5. Save settings

### Clone a Repository

1. Click **Clone** button in titlebar
2. Enter repository URL (e.g., `https://github.com/user/repo`)
3. Wait for cloning to complete
4. Browse files in the file explorer

### Edit and Save Files

1. Click on any file in the explorer to open it
2. Edit in the Monaco editor
3. Press `Ctrl+S` (or `Cmd+S` on Mac) to save

### Use AI Assistant

1. Click **AI** button in titlebar
2. Ask questions about your code
3. Get explanations, fixes, and suggestions

### Commit and Push Changes

1. Make changes to files
2. Use Git commands (coming soon) or API
3. Commit with a message
4. Push to GitHub

## 🏗️ Architecture

```
Browser IDE
├── UI (React + Monaco Editor)
├── Services
│   ├── FileSystem (LightningFS)
│   ├── Git (isomorphic-git)
│   ├── WebContainer (Node.js runtime)
│   └── AI (Anthropic API)
├── State (Zustand)
└── Storage (IndexedDB)
```

## 🛠️ Tech Stack

- **React 18** - UI framework
- **Vite** - Build tool
- **Monaco Editor** - Code editor
- **WebContainers** - Run Node.js in browser
- **isomorphic-git** - Git operations
- **LightningFS** - Virtual file system
- **Zustand** - State management
- **Tailwind CSS** - Styling

## 📱 PWA Features

### Install as App

- **Desktop:** Chrome/Edge will show an install prompt
- **Mobile:** Use "Add to Home Screen"

### Offline Support

- App works offline (except AI and Git sync)
- All files stored locally in IndexedDB
- Service worker caches app assets

## ⚙️ Configuration

### User Settings

All settings are stored locally in your browser:

- GitHub Token & Username
- Anthropic API Key
- Editor preferences (theme, font size, etc.)
- Recent projects

### Keyboard Shortcuts

- `Ctrl+S` - Save file
- `Ctrl+B` - Toggle sidebar
- `Ctrl+`` - Toggle terminal

## 🔐 Security

- All API keys stored locally in browser
- Never sent to any server except their respective APIs
- You control your own keys

## 🐛 Known Limitations

- WebContainers require Chrome/Edge (no Firefox support yet)
- Some native Node modules don't work
- Large repos (>500MB) may be slow
- Safari has stricter storage limits

## 📈 Roadmap

- [ ] Advanced Git features (diff, merge, rebase)
- [ ] Multi-cursor editing
- [ ] Search across files
- [ ] Plugin system
- [ ] Collaborative editing
- [ ] Docker support

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- Monaco Editor by Microsoft
- WebContainers by StackBlitz
- isomorphic-git team
- React team

## 📞 Support

- Issues: https://github.com/yourusername/browser-ide/issues
- Discussions: https://github.com/yourusername/browser-ide/discussions

---

Made with ❤️ by the Browser IDE team
