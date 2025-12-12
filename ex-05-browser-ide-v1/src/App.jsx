import { useState, useEffect } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { FileExplorer } from './components/FileExplorer';
import { Editor } from './components/Editor';
import { Terminal } from './components/Terminal';
import { Preview } from './components/Preview';
import { StatusBar } from './components/StatusBar';
import { CloneDialog } from './components/CloneDialog';
import { SettingsDialog } from './components/SettingsDialog';
import { AIAssistant } from './components/AIAssistant';
import { useStore } from './store/useStore';
import './styles/globals.css';

function App() {
  const {
    sidebarOpen,
    terminalOpen,
    previewOpen,
    isInstalled,
    installPromptEvent,
    setInstallPrompt,
    setInstalled
  } = useStore();
  
  const [showCloneDialog, setShowCloneDialog] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  
  useEffect(() => {
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
    const handleBeforeInstallPrompt = (e) => {
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
      installPromptEvent.prompt();
      const { outcome } = await installPromptEvent.userChoice;
      if (outcome === 'accepted') {
        setInstalled(true);
        setShowInstallPrompt(false);
      }
      setInstallPrompt(null);
    }
  };
  
  return (
    <div className="app">
      {/* Title Bar */}
      <div className="titlebar">
        <div className="titlebar-drag">
          <span className="title">🚀 Browser IDE</span>
        </div>
        <div className="titlebar-actions">
          <button onClick={() => setShowCloneDialog(true)} title="Clone Repository">
            📥 Clone
          </button>
          <button onClick={() => setShowAIAssistant(true)} title="AI Assistant">
            🤖 AI
          </button>
          <button onClick={() => setShowSettingsDialog(true)} title="Settings">
            ⚙️
          </button>
        </div>
      </div>
      
      {/* PWA Install Prompt */}
      {showInstallPrompt && !isInstalled && (
        <div className="install-prompt">
          <span>📱 Install Browser IDE for offline access</span>
          <button onClick={handleInstallClick}>Install</button>
          <button onClick={() => setShowInstallPrompt(false)}>✕</button>
        </div>
      )}
      
      {/* Main Layout */}
      <div className="main-content">
        <PanelGroup direction="horizontal">
          {/* Sidebar */}
          {sidebarOpen && (
            <>
              <Panel defaultSize={20} minSize={10} maxSize={40}>
                <FileExplorer />
              </Panel>
              <PanelResizeHandle className="resize-handle-vertical" />
            </>
          )}
          
          {/* Editor + Bottom Panel */}
          <Panel>
            <PanelGroup direction="vertical">
              {/* Editor */}
              <Panel defaultSize={70} minSize={30}>
                <Editor />
              </Panel>
              
              {/* Bottom Panel */}
              {(terminalOpen || previewOpen) && (
                <>
                  <PanelResizeHandle className="resize-handle-horizontal" />
                  <Panel defaultSize={30} minSize={15} maxSize={70}>
                    <div className="bottom-panel">
                      <div className="bottom-panel-tabs">
                        {terminalOpen && <div className="tab active">Terminal</div>}
                        {previewOpen && <div className="tab">Preview</div>}
                      </div>
                      <div className="bottom-panel-content">
                        {terminalOpen && <Terminal />}
                        {previewOpen && <Preview />}
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
      {showCloneDialog && (
        <CloneDialog onClose={() => setShowCloneDialog(false)} />
      )}
      
      {showSettingsDialog && (
        <SettingsDialog onClose={() => setShowSettingsDialog(false)} />
      )}
      
      {showAIAssistant && (
        <AIAssistant onClose={() => setShowAIAssistant(false)} />
      )}
    </div>
  );
}

export default App;
