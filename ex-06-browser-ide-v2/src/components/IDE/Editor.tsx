import { useEffect, useState, useRef } from 'react';
import MonacoEditor from '@monaco-editor/react';
import { fileSystem } from '@/services/filesystem';
import { useIDEStore } from '@/store/useIDEStore';

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
    setCurrentFile,
  } = useIDEStore();

  const [content, setContent] = useState('');
  const [language, setLanguage] = useState('javascript');
  const editorRef = useRef<any | null>(null);

  useEffect(() => {
    if (currentFile) {
      loadFile(currentFile);
    }
  }, [currentFile]);

  async function loadFile(path: string) {
    // Check if already in memory
    if (editorContent[path] !== undefined) {
      setContent(editorContent[path]);
    } else {
      const result = await fileSystem.readFile(path);
      const fileContent = result.success ? result.data || '' : '';
      setContent(fileContent);
      updateEditorContent(path, fileContent);
    }

    // Detect language
    const lang = fileSystem.getLanguageFromPath(path);
    setLanguage(lang);
  }

  function handleChange(value: string | undefined) {
    const newValue = value || '';
    setContent(newValue);
    if (currentFile) {
      updateEditorContent(currentFile, newValue);
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

  function handleEditorDidMount(editor: any) {
    editorRef.current = editor;

    // Add save shortcut
    editor.addCommand(
      // Cmd+S or Ctrl+S
      (window.navigator.platform.match('Mac') ? 2048 : 2048) | 49, // KeyMod.CtrlCmd | KeyCode.KeyS
      () => {
        handleSave();
      }
    );
  }

  if (!currentFile) {
    return (
      <div className="editor-empty flex items-center justify-center h-full bg-gray-900 text-gray-100">
        <div className="welcome max-w-4xl text-center px-8">
          <h1 className="text-4xl font-bold mb-4">🚀 Welcome to Browser IDE</h1>
          <p className="text-xl text-gray-400 mb-8">
            A full-featured IDE that runs entirely in your browser
          </p>
          <div className="features grid grid-cols-2 gap-6 mb-8">
            <div className="feature p-6 bg-gray-800 rounded-lg">
              <span className="emoji text-4xl block mb-2">📁</span>
              <h3 className="text-lg font-semibold mb-2">File Management</h3>
              <p className="text-sm text-gray-400">
                Browse and edit files with a VS Code-like interface
              </p>
            </div>
            <div className="feature p-6 bg-gray-800 rounded-lg">
              <span className="emoji text-4xl block mb-2">🔗</span>
              <h3 className="text-lg font-semibold mb-2">Git Integration</h3>
              <p className="text-sm text-gray-400">
                Clone, commit, and push directly to GitHub
              </p>
            </div>
            <div className="feature p-6 bg-gray-800 rounded-lg">
              <span className="emoji text-4xl block mb-2">▶️</span>
              <h3 className="text-lg font-semibold mb-2">Run Code</h3>
              <p className="text-sm text-gray-400">
                Execute Node.js apps with WebContainers
              </p>
            </div>
            <div className="feature p-6 bg-gray-800 rounded-lg">
              <span className="emoji text-4xl block mb-2">🤖</span>
              <h3 className="text-lg font-semibold mb-2">AI Assistant</h3>
              <p className="text-sm text-gray-400">
                Get coding help from multiple AI providers
              </p>
            </div>
          </div>
          <div className="quick-actions flex gap-4 justify-center">
            <button className="btn-primary px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium">
              📥 Clone Repository
            </button>
            <button className="btn-secondary px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium">
              ⚙️ Open Settings
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="editor-container flex flex-col h-full bg-gray-900">
      {/* Tabs */}
      <div className="tabs flex bg-gray-800 border-b border-gray-700 overflow-x-auto">
        {openFiles.map((file) => {
          const filename = file.split('/').pop() || file;
          return (
            <div
              key={file}
              className={`tab flex items-center gap-2 px-4 py-2 border-r border-gray-700 cursor-pointer min-w-max ${
                file === currentFile
                  ? 'active bg-gray-900 text-blue-400'
                  : 'hover:bg-gray-700 text-gray-300'
              }`}
              onClick={() => setCurrentFile(file)}
            >
              <span className="tab-name text-sm">{filename}</span>
              <button
                className="tab-close hover:bg-gray-600 rounded px-1"
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
      <div className="editor-wrapper flex-1">
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
