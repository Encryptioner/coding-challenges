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
} from '@/components/IDE';
import { useIDEStore } from '@/store/useIDEStore';
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
  const [activeBottomPanel, setActiveBottomPanel] = useState<'terminal' | 'preview'>('terminal');

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

  const bottomPanelVisible = terminalOpen || previewOpen;

  return (
    <div className="app flex flex-col h-screen bg-gray-900 text-gray-100">
      {/* Title Bar */}
      <div className="titlebar flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
        <div className="titlebar-drag flex items-center gap-4">
          <span className="title font-semibold">🚀 Browser IDE Pro v{config.APP_VERSION}</span>
          <div className="flex gap-2">
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
          </div>
        </div>
        <div className="titlebar-actions flex gap-2">
          <button
            onClick={() => setShowCloneDialog(true)}
            title="Clone Repository"
            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm font-medium"
          >
            📥 Clone
          </button>
          <button
            onClick={() => setShowAIAssistant(true)}
            title="AI Assistant"
            className="px-3 py-1 bg-purple-600 hover:bg-purple-700 rounded text-sm font-medium"
          >
            🤖 AI
          </button>
          <button
            onClick={() => setShowSettingsDialog(true)}
            title="Settings"
            className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm"
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
        <PanelGroup direction="horizontal">
          {/* Sidebar */}
          {sidebarOpen && (
            <>
              <Panel defaultSize={20} minSize={10} maxSize={40}>
                <FileExplorer />
              </Panel>
              <PanelResizeHandle className="w-1 bg-gray-700 hover:bg-blue-500 transition-colors" />
            </>
          )}

          {/* Editor + Bottom Panel */}
          <Panel>
            <PanelGroup direction="vertical">
              {/* Editor */}
              <Panel defaultSize={bottomPanelVisible ? 70 : 100} minSize={30}>
                <Editor />
              </Panel>

              {/* Bottom Panel */}
              {bottomPanelVisible && (
                <>
                  <PanelResizeHandle className="h-1 bg-gray-700 hover:bg-blue-500 transition-colors" />
                  <Panel defaultSize={30} minSize={15} maxSize={70}>
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
                            Terminal
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
                            Preview
                          </div>
                        )}
                      </div>
                      <div className="bottom-panel-content flex-1 overflow-hidden">
                        {activeBottomPanel === 'terminal' && terminalOpen && <Terminal />}
                        {activeBottomPanel === 'preview' && previewOpen && <Preview />}
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
    </div>
  );
}

export default App;
