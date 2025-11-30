import { useState, useEffect } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import {
  FileExplorer,
  Editor,
  Terminal,
  Preview,
  StatusBar,
  CloneDialog,
  SettingsDialog,
  AIAssistant,
  ClaudeCodePanel,
  ExtensionsPanel,
  WorkspaceSwitcher,
} from '@/components/IDE';
import { SourceControlPanel } from '@/components/Git';
import { useIDEStore } from '@/store/useIDEStore';
import { gitService } from '@/services/git';
import { fileSystem } from '@/services/filesystem';
import { logger } from '@/utils/logger';
import { config } from '@/config/environment';

function App() {
  const {
    sidebarOpen,
    terminalOpen,
    previewOpen,
    isInstalled,
    installPromptEvent,
    setInstallPrompt,
    setInstalled,
    toggleSidebar,
    toggleTerminal,
    togglePreview,
  } = useIDEStore();

  const [showCloneDialog, setShowCloneDialog] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [activeBottomPanel, setActiveBottomPanel] = useState<'terminal' | 'preview' | 'claude-code' | 'extensions' | 'git'>('terminal');
  const [showClaudeCode, setShowClaudeCode] = useState(false);
  const [showExtensions, setShowExtensions] = useState(false);
  const [showGit, setShowGit] = useState(false);

  useEffect(() => {
    logger.info(`Browser IDE Pro v${config.APP_VERSION} - Starting...`);

    // Hide loading screen
    const loading = document.getElementById('loading');
    if (loading) {
      loading.classList.add('hidden');
    }

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setInstalled(true);
    }

    // Initialize git repository if it exists
    async function initGitIfExists() {
      try {
        // Check if /repo directory exists
        const fs = fileSystem.getFS();
        const stats = await fs.promises.stat('/repo').catch(() => null);

        if (stats && stats.isDirectory()) {
          console.log('📂 Found existing repository, initializing git state...');
          const result = await gitService.initializeRepository('/repo');

          if (result.success && result.data) {
            console.log(`✅ Git initialized: branch=${result.data.currentBranch}, files=${result.data.gitStatus.length}, commits=${result.data.commits.length}`);
          } else {
            console.warn('⚠️ Git initialization failed:', result.error);
          }
        } else {
          console.log('ℹ️ No repository found at /repo');
        }
      } catch (error) {
        console.error('❌ Error checking for repository:', error);
      }
    }

    initGitIfExists();

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
      if (!isInstalled) {
        setShowInstallPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Listen for app installed event
    window.addEventListener('appinstalled', () => {
      setInstalled(true);
      setShowInstallPrompt(false);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (installPromptEvent) {
      const promptEvent = installPromptEvent as any;
      promptEvent.prompt();
      const { outcome } = await promptEvent.userChoice;
      if (outcome === 'accepted') {
        setInstalled(true);
        setShowInstallPrompt(false);
      }
      setInstallPrompt(null);
    }
  };

  const bottomPanelVisible = terminalOpen || previewOpen || showClaudeCode || showExtensions || showGit;

  return (
    <div className="app flex flex-col h-screen bg-gray-900 text-gray-100 overflow-hidden">
      {/* Title Bar */}
      <div className="titlebar flex items-center justify-between px-2 sm:px-4 py-2 bg-gray-800 border-b border-gray-700 flex-shrink-0">
        <div className="titlebar-drag flex items-center gap-2 sm:gap-4 overflow-hidden">
          <span className="title font-semibold text-xs sm:text-sm truncate">🚀 Browser IDE Pro v{config.APP_VERSION}</span>
          <WorkspaceSwitcher />
          <div className="flex gap-1 sm:gap-2">
            <button
              onClick={toggleSidebar}
              className="text-xs px-2 py-1 hover:bg-gray-700 rounded"
              title="Toggle Sidebar"
            >
              📁
            </button>
            <button
              onClick={toggleTerminal}
              className="text-xs px-2 py-1 hover:bg-gray-700 rounded"
              title="Toggle Terminal"
            >
              💻
            </button>
            <button
              onClick={togglePreview}
              className="text-xs px-2 py-1 hover:bg-gray-700 rounded"
              title="Toggle Preview"
            >
              👁️
            </button>
            <button
              onClick={() => {
                setShowClaudeCode(!showClaudeCode);
                if (!showClaudeCode) setActiveBottomPanel('claude-code');
              }}
              className={`text-xs px-2 py-1 hover:bg-gray-700 rounded ${showClaudeCode ? 'bg-gray-700' : ''}`}
              title="Toggle Claude Code Agent"
            >
              🧠
            </button>
            <button
              onClick={() => {
                setShowExtensions(!showExtensions);
                if (!showExtensions) setActiveBottomPanel('extensions');
              }}
              className={`text-xs px-2 py-1 hover:bg-gray-700 rounded ${showExtensions ? 'bg-gray-700' : ''}`}
              title="Toggle Extensions"
            >
              🧩
            </button>
            <button
              onClick={() => {
                setShowGit(!showGit);
                if (!showGit) setActiveBottomPanel('git');
              }}
              className={`text-xs px-2 py-1 hover:bg-gray-700 rounded ${showGit ? 'bg-gray-700' : ''}`}
              title="Toggle Source Control"
            >
              🔀
            </button>
          </div>
        </div>
        <div className="titlebar-actions flex gap-1 sm:gap-2 flex-shrink-0">
          <button
            onClick={() => setShowCloneDialog(true)}
            title="Clone Repository"
            className="px-2 sm:px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs sm:text-sm font-medium whitespace-nowrap"
          >
            <span className="hidden sm:inline">📥 Clone</span>
            <span className="sm:hidden">📥</span>
          </button>
          <button
            onClick={() => setShowAIAssistant(true)}
            title="AI Assistant (Simple Chat)"
            className="px-2 sm:px-3 py-1 bg-purple-600 hover:bg-purple-700 rounded text-xs sm:text-sm font-medium whitespace-nowrap"
          >
            <span className="hidden sm:inline">🤖 AI</span>
            <span className="sm:hidden">🤖</span>
          </button>
          <button
            onClick={() => setShowSettingsDialog(true)}
            title="Settings"
            className="px-2 sm:px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs sm:text-sm"
          >
            ⚙️
          </button>
        </div>
      </div>

      {/* PWA Install Prompt */}
      {showInstallPrompt && !isInstalled && (
        <div className="install-prompt flex items-center justify-between px-4 py-2 bg-blue-600 text-white">
          <span className="text-sm">📱 Install Browser IDE for offline access</span>
          <div className="flex gap-2">
            <button
              onClick={handleInstallClick}
              className="px-3 py-1 bg-white text-blue-600 rounded text-sm font-medium"
            >
              Install
            </button>
            <button
              onClick={() => setShowInstallPrompt(false)}
              className="px-2 py-1 hover:bg-blue-700 rounded text-sm"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Main Layout */}
      <div className="main-content flex-1 overflow-hidden">
        <PanelGroup direction="horizontal" id="main-horizontal">
          {/* Sidebar - auto-hide on mobile */}
          {sidebarOpen && (
            <>
              <Panel
                id="sidebar"
                order={1}
                defaultSize={20}
                minSize={10}
                maxSize={40}
                className="hidden md:block"
              >
                <FileExplorer />
              </Panel>
              <PanelResizeHandle className="hidden md:block w-1 bg-gray-700 hover:bg-blue-500 transition-colors" />
            </>
          )}

          {/* Editor + Bottom Panel */}
          <Panel id="main-editor" order={2}>
            <PanelGroup direction="vertical" id="main-vertical">
              {/* Editor */}
              <Panel id="editor" order={1} defaultSize={bottomPanelVisible ? 70 : 100} minSize={30}>
                <Editor />
              </Panel>

              {/* Bottom Panel */}
              {bottomPanelVisible && (
                <>
                  <PanelResizeHandle className="h-1 bg-gray-700 hover:bg-blue-500 transition-colors" />
                  <Panel id="bottom-panel" order={2} defaultSize={30} minSize={15} maxSize={70}>
                    <div className="bottom-panel flex flex-col h-full">
                      <div className="bottom-panel-tabs flex bg-gray-800 border-b border-gray-700">
                        {terminalOpen && (
                          <div
                            className={`tab px-4 py-2 cursor-pointer text-sm ${
                              activeBottomPanel === 'terminal'
                                ? 'active bg-gray-900 text-blue-400 border-b-2 border-blue-500'
                                : 'hover:bg-gray-700 text-gray-300'
                            }`}
                            onClick={() => setActiveBottomPanel('terminal')}
                          >
                            💻 Terminal
                          </div>
                        )}
                        {previewOpen && (
                          <div
                            className={`tab px-4 py-2 cursor-pointer text-sm ${
                              activeBottomPanel === 'preview'
                                ? 'active bg-gray-900 text-blue-400 border-b-2 border-blue-500'
                                : 'hover:bg-gray-700 text-gray-300'
                            }`}
                            onClick={() => setActiveBottomPanel('preview')}
                          >
                            👁️ Preview
                          </div>
                        )}
                        {showClaudeCode && (
                          <div
                            className={`tab px-4 py-2 cursor-pointer text-sm ${
                              activeBottomPanel === 'claude-code'
                                ? 'active bg-gray-900 text-blue-400 border-b-2 border-blue-500'
                                : 'hover:bg-gray-700 text-gray-300'
                            }`}
                            onClick={() => setActiveBottomPanel('claude-code')}
                          >
                            🧠 Claude Code
                          </div>
                        )}
                        {showExtensions && (
                          <div
                            className={`tab px-4 py-2 cursor-pointer text-sm ${
                              activeBottomPanel === 'extensions'
                                ? 'active bg-gray-900 text-blue-400 border-b-2 border-blue-500'
                                : 'hover:bg-gray-700 text-gray-300'
                            }`}
                            onClick={() => setActiveBottomPanel('extensions')}
                          >
                            🧩 Extensions
                          </div>
                        )}
                        {showGit && (
                          <div
                            className={`tab px-4 py-2 cursor-pointer text-sm ${
                              activeBottomPanel === 'git'
                                ? 'active bg-gray-900 text-blue-400 border-b-2 border-blue-500'
                                : 'hover:bg-gray-700 text-gray-300'
                            }`}
                            onClick={() => setActiveBottomPanel('git')}
                          >
                            🔀 Git
                          </div>
                        )}
                      </div>
                      <div className="bottom-panel-content flex-1 overflow-hidden">
                        {activeBottomPanel === 'terminal' && terminalOpen && <Terminal />}
                        {activeBottomPanel === 'preview' && previewOpen && <Preview />}
                        {activeBottomPanel === 'claude-code' && showClaudeCode && <ClaudeCodePanel />}
                        {activeBottomPanel === 'extensions' && showExtensions && <ExtensionsPanel />}
                        {activeBottomPanel === 'git' && showGit && <SourceControlPanel />}
                      </div>
                    </div>
                  </Panel>
                </>
              )}
            </PanelGroup>
          </Panel>
        </PanelGroup>
      </div>

      {/* Status Bar */}
      <StatusBar />

      {/* Dialogs */}
      {showCloneDialog && <CloneDialog onClose={() => setShowCloneDialog(false)} />}

      {showSettingsDialog && <SettingsDialog onClose={() => setShowSettingsDialog(false)} />}

      {showAIAssistant && <AIAssistant onClose={() => setShowAIAssistant(false)} />}

      {/* Mobile File Explorer Overlay */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="absolute left-0 top-0 bottom-0 w-4/5 max-w-sm bg-gray-900 shadow-2xl">
            <div className="flex items-center justify-between px-4 py-3 bg-gray-800 border-b border-gray-700">
              <h2 className="text-sm font-semibold">Files</h2>
              <button
                onClick={toggleSidebar}
                className="px-2 py-1 hover:bg-gray-700 rounded"
              >
                ✕
              </button>
            </div>
            <div className="h-full overflow-y-auto">
              <FileExplorer />
            </div>
          </div>
          <div className="absolute right-0 top-0 bottom-0 left-4/5" onClick={toggleSidebar} />
        </div>
      )}
    </div>
  );
}

export default App;
