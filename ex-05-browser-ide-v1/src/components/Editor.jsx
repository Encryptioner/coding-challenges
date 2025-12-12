import { useEffect, useState, useRef } from 'react';
import MonacoEditor from '@monaco-editor/react';
import { fileSystem } from '../services/filesystem';
import { useStore } from '../store/useStore';

export function Editor() {
  const {
    currentFile,
    openFiles,
    closeFile,
    editorContent,
    updateEditorContent,
    markFileUnsaved,
    markFileSaved,
    settings,
    setCurrentFile
  } = useStore();
  
  const [content, setContent] = useState('');
  const [language, setLanguage] = useState('javascript');
  const editorRef = useRef(null);
  
  useEffect(() => {
    if (currentFile) {
      loadFile(currentFile);
    }
  }, [currentFile]);
  
  async function loadFile(path) {
    // Check if already in memory
    if (editorContent[path] !== undefined) {
      setContent(editorContent[path]);
    } else {
      const fileContent = await fileSystem.readFile(path);
      setContent(fileContent);
      updateEditorContent(path, fileContent);
    }
    
    // Detect language
    const ext = path.split('.').pop()?.toLowerCase();
    setLanguage(getLanguageFromExtension(ext));
  }
  
  function handleChange(value) {
    setContent(value || '');
    if (currentFile) {
      updateEditorContent(currentFile, value || '');
      markFileUnsaved(currentFile);
    }
  }
  
  async function handleSave() {
    if (currentFile) {
      await fileSystem.writeFile(currentFile, content);
      markFileSaved(currentFile);
      console.log('✅ File saved:', currentFile);
    }
  }
  
  function handleEditorDidMount(editor) {
    editorRef.current = editor;
    
    // Add save shortcut
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      handleSave();
    });
  }
  
  if (!currentFile) {
    return (
      <div className="editor-empty">
        <div className="welcome">
          <h1>🚀 Welcome to Browser IDE</h1>
          <p>A full-featured IDE that runs entirely in your browser</p>
          <div className="features">
            <div className="feature">
              <span className="emoji">📁</span>
              <h3>File Management</h3>
              <p>Browse and edit files with a VS Code-like interface</p>
            </div>
            <div className="feature">
              <span className="emoji">🔗</span>
              <h3>Git Integration</h3>
              <p>Clone, commit, and push directly to GitHub</p>
            </div>
            <div className="feature">
              <span className="emoji">▶️</span>
              <h3>Run Code</h3>
              <p>Execute Node.js apps with WebContainers</p>
            </div>
            <div className="feature">
              <span className="emoji">🤖</span>
              <h3>AI Assistant</h3>
              <p>Get coding help from Claude AI</p>
            </div>
          </div>
          <div className="quick-actions">
            <button className="btn-primary">📥 Clone Repository</button>
            <button className="btn-secondary">⚙️ Open Settings</button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="editor-container">
      {/* Tabs */}
      <div className="tabs">
        {openFiles.map(file => {
          const filename = file.split('/').pop();
          return (
            <div
              key={file}
              className={`tab ${file === currentFile ? 'active' : ''}`}
              onClick={() => setCurrentFile(file)}
            >
              <span className="tab-name">{filename}</span>
              <button
                className="tab-close"
                onClick={(e) => {
                  e.stopPropagation();
                  closeFile(file);
                }}
              >
                ×
              </button>
            </div>
          );
        })}
      </div>
      
      {/* Monaco Editor */}
      <div className="editor-wrapper">
        <MonacoEditor
          height="100%"
          language={language}
          value={content}
          onChange={handleChange}
          onMount={handleEditorDidMount}
          theme={settings.theme}
          options={{
            fontSize: settings.fontSize,
            tabSize: settings.tabSize,
            wordWrap: settings.wordWrap,
            minimap: { enabled: settings.minimap },
            lineNumbers: settings.lineNumbers,
            automaticLayout: true,
            scrollBeyondLastLine: false,
            suggestOnTriggerCharacters: true,
            quickSuggestions: true,
          }}
        />
      </div>
    </div>
  );
}

function getLanguageFromExtension(ext) {
  const map = {
    js: 'javascript', jsx: 'javascript',
    ts: 'typescript', tsx: 'typescript',
    json: 'json', html: 'html', css: 'css',
    md: 'markdown', py: 'python', rb: 'ruby',
    go: 'go', rs: 'rust', java: 'java',
    php: 'php', vue: 'vue', svelte: 'svelte',
  };
  return map[ext] || 'plaintext';
}
