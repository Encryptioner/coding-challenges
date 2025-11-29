import { useState, useEffect } from 'react';
import { fileSystem } from '../services/filesystem';
import { useStore } from '../store/useStore';

export function FileExplorer() {
  const [fileTree, setFileTree] = useState([]);
  const [expandedDirs, setExpandedDirs] = useState(new Set(['/repo']));
  const { currentFile, setCurrentFile, addOpenFile, setFileTree: setStoreFileTree } = useStore();
  
  useEffect(() => {
    loadFileTree();
  }, []);
  
  async function loadFileTree() {
    const tree = await fileSystem.buildFileTree('/repo', 5);
    setFileTree(tree);
    setStoreFileTree(tree);
  }
  
  function toggleDir(path) {
    setExpandedDirs(prev => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  }
  
  async function handleFileClick(file) {
    setCurrentFile(file.path);
    addOpenFile(file.path);
  }
  
  function getFileIcon(filename) {
    const ext = filename.split('.').pop()?.toLowerCase();
    const icons = {
      js: '📄', jsx: '⚛️', ts: '📘', tsx: '⚛️',
      json: '📋', md: '📝', css: '🎨', html: '🌐',
      py: '🐍', java: '☕', go: '🔷', rs: '🦀',
      vue: '💚', svelte: '🧡', php: '🐘',
      default: '📄'
    };
    return icons[ext] || icons.default;
  }
  
  function renderTree(items, level = 0) {
    return items.map(item => (
      <div key={item.path} className="tree-item" style={{ paddingLeft: `${level * 12}px` }}>
        {item.type === 'directory' ? (
          <>
            <div
              className="tree-item-row directory"
              onClick={() => toggleDir(item.path)}
            >
              <span className="icon">{expandedDirs.has(item.path) ? '📂' : '📁'}</span>
              <span className="name">{item.name}</span>
            </div>
            {expandedDirs.has(item.path) && item.children && (
              <div className="children">
                {renderTree(item.children, level + 1)}
              </div>
            )}
          </>
        ) : (
          <div
            className={`tree-item-row file ${currentFile === item.path ? 'active' : ''}`}
            onClick={() => handleFileClick(item)}
          >
            <span className="icon">{getFileIcon(item.name)}</span>
            <span className="name">{item.name}</span>
          </div>
        )}
      </div>
    ));
  }
  
  return (
    <div className="file-explorer">
      <div className="panel-header">
        <h3>EXPLORER</h3>
        <button onClick={loadFileTree} title="Refresh">↻</button>
      </div>
      <div className="tree">
        {fileTree.length > 0 ? renderTree(fileTree) : (
          <div className="empty-state">
            <p>No files yet</p>
            <p className="hint">Clone a repository to get started</p>
          </div>
        )}
      </div>
    </div>
  );
}
