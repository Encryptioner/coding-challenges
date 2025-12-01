import { useState, useEffect } from 'react';
import { fileSystem } from '@/services/filesystem';
import { useIDEStore } from '@/store/useIDEStore';
import type { FileNode } from '@/types';

export function FileExplorer() {
  const [expandedDirs, setExpandedDirs] = useState(new Set(['/']));
  const {
    fileTree,
    currentFile,
    setCurrentFile,
    addOpenFile,
    setFileTree,
  } = useIDEStore();

  // Get current working directory
  const currentDirectory = fileSystem.getCurrentWorkingDirectory();

  useEffect(() => {
    loadFileTree();
  }, []);

  async function loadFileTree() {
    const currentDir = fileSystem.getCurrentWorkingDirectory();
    const tree = await fileSystem.buildFileTree(currentDir, 5);
    setFileTree(tree);
  }

  function toggleDir(path: string) {
    setExpandedDirs((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  }

  function handleFileClick(file: FileNode) {
    if (file.type === 'directory') {
      // Change to directory
      fileSystem.changeDirectory(file.path);
      setExpandedDirs(new Set([file.path]));
    } else {
      // Open file
      setCurrentFile(file.path);
      addOpenFile(file.path);
    }
  }

  function handleDirectoryUp() {
    const currentPath = fileSystem.getCurrentWorkingDirectory();
    if (currentPath !== '/') {
      const parentPath = currentPath.split('/').slice(0, -2).join('/') || '/';
      fileSystem.changeDirectory(parentPath);
      setExpandedDirs(new Set([parentPath]));
    }
  }

  function getFileIcon(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase();
    const icons: Record<string, string> = {
      js: '📄',
      jsx: '⚛️',
      ts: '📘',
      tsx: '⚛️',
      json: '📋',
      md: '📝',
      css: '🎨',
      html: '🌐',
      py: '🐍',
      java: '☕',
      go: '🔷',
      rs: '🦀',
      vue: '💚',
      svelte: '🧡',
      php: '🐘',
    };
    return icons[ext || ''] || '📄';
  }

  function renderTree(items: FileNode[], level = 0): React.ReactNode {
    return items.map((item) => (
      <div
        key={item.path}
        className="tree-item"
        style={{ paddingLeft: `${level * (window.innerWidth < 768 ? 16 : 12)}px` }}
      >
        {item.type === 'directory' ? (
          <>
            <div
              className={`tree-item-row directory cursor-pointer hover:bg-gray-700 touch-manipulation ${
                window.innerWidth < 768 ? 'py-3 px-2 min-h-[44px]' : 'py-2'
              }`}
              onClick={() => toggleDir(item.path)}
            >
              <span className="icon text-lg sm:text-base">
                {expandedDirs.has(item.path) ? '📂' : '📁'}
              </span>
              <span className={`name ml-2 text-sm sm:text-xs ${window.innerWidth < 768 ? 'truncate block' : ''}`}>
                {item.name}
              </span>
            </div>
            {expandedDirs.has(item.path) && item.children && (
              <div className="children">{renderTree(item.children, level + 1)}</div>
            )}
          </>
        ) : (
          <div
            className={`tree-item-row file cursor-pointer hover:bg-gray-700 touch-manipulation ${
              currentFile === item.path ? 'active bg-blue-600' : ''
            } ${window.innerWidth < 768 ? 'py-3 px-2 min-h-[44px]' : 'py-2'}`}
            onClick={() => handleFileClick(item)}
          >
            <span className="icon text-lg sm:text-base">{getFileIcon(item.name)}</span>
            <span className={`name ml-2 text-sm sm:text-xs ${window.innerWidth < 768 ? 'truncate block' : ''}`}>
              {item.name}
            </span>
          </div>
        )}
      </div>
    ));
  }

  return (
    <div className="file-explorer flex flex-col h-full bg-gray-800 text-gray-100">
      <div className="panel-header flex flex-col gap-2 px-4 py-2 bg-gray-900 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold text-gray-400 uppercase">Explorer</h3>
          <button
            onClick={loadFileTree}
            title="Refresh"
            className="text-gray-400 hover:text-gray-100 text-sm"
          >
            ↻
          </button>
        </div>
        {/* Navigation Bar */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleDirectoryUp}
            disabled={currentDirectory === '/'}
            className="px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded"
            title="Go up directory"
          >
            ↑
          </button>
          <div className="flex-1 px-2 py-1 text-xs bg-gray-700 rounded text-gray-100 font-mono">
            {currentDirectory === '/' ? '/' : currentDirectory}
          </div>
          <button
            onClick={() => fileSystem.changeDirectory('/')}
            className="px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded"
            title="Go to root"
          >
            🏠
          </button>
        </div>
      </div>
      <div className="tree flex-1 overflow-auto p-2">
        {fileTree.length > 0 ? (
          renderTree(fileTree)
        ) : (
          <div className="empty-state text-center py-8 text-gray-500">
            <p>No files yet</p>
            <p className="hint text-sm mt-2">Clone a repository to get started</p>
          </div>
        )}
      </div>
    </div>
  );
}
