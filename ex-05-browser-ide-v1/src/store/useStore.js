import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useStore = create(
  persist(
    (set, get) => ({
      // File system state
      files: {},
      currentFile: null,
      openFiles: [],
      fileTree: [],
      
      // Git state
      currentRepo: null,
      currentBranch: 'main',
      gitStatus: [],
      commits: [],
      
      // Editor state
      editorContent: {},
      unsavedChanges: new Set(),
      
      // UI state
      sidebarOpen: true,
      terminalOpen: true,
      previewOpen: true,
      commandPaletteOpen: false,
      
      // Settings
      settings: {
        theme: 'vs-dark',
        fontSize: 14,
        tabSize: 2,
        wordWrap: 'on',
        autoSave: true,
        autoSaveDelay: 1000,
        githubToken: '',
        githubUsername: '',
        githubEmail: '',
        anthropicKey: '',
        lineNumbers: 'on',
        minimap: true,
      },
      
      // Recent projects
      recentProjects: [],
      
      // Installation state
      isInstalled: false,
      installPromptEvent: null,
      
      // Actions - File Management
      setCurrentFile: (file) => set({ currentFile: file }),
      
      addOpenFile: (file) => set((state) => {
        if (state.openFiles.includes(file)) return state;
        return { openFiles: [...state.openFiles, file] };
      }),
      
      closeFile: (file) => set((state) => {
        const newOpenFiles = state.openFiles.filter(f => f !== file);
        const newCurrentFile = state.currentFile === file 
          ? (newOpenFiles.length > 0 ? newOpenFiles[newOpenFiles.length - 1] : null)
          : state.currentFile;
        return {
          openFiles: newOpenFiles,
          currentFile: newCurrentFile
        };
      }),
      
      closeAllFiles: () => set({ openFiles: [], currentFile: null }),
      
      updateEditorContent: (file, content) => set((state) => ({
        editorContent: { ...state.editorContent, [file]: content }
      })),
      
      markFileUnsaved: (file) => set((state) => {
        const unsaved = new Set(state.unsavedChanges);
        unsaved.add(file);
        return { unsavedChanges: unsaved };
      }),
      
      markFileSaved: (file) => set((state) => {
        const unsaved = new Set(state.unsavedChanges);
        unsaved.delete(file);
        return { unsavedChanges: unsaved };
      }),
      
      setFileTree: (tree) => set({ fileTree: tree }),
      
      // Actions - Git
      setCurrentRepo: (repo) => set({ currentRepo: repo }),
      
      setCurrentBranch: (branch) => set({ currentBranch: branch }),
      
      setGitStatus: (status) => set({ gitStatus: status }),
      
      setCommits: (commits) => set({ commits: commits }),
      
      // Actions - UI
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      
      toggleTerminal: () => set((state) => ({ terminalOpen: !state.terminalOpen })),
      
      togglePreview: () => set((state) => ({ previewOpen: !state.previewOpen })),
      
      toggleCommandPalette: () => set((state) => ({ 
        commandPaletteOpen: !state.commandPaletteOpen 
      })),
      
      // Actions - Settings
      updateSettings: (newSettings) => set((state) => ({
        settings: { ...state.settings, ...newSettings }
      })),
      
      // Actions - Recent Projects
      addRecentProject: (project) => set((state) => {
        const existing = state.recentProjects.find(p => p.url === project.url);
        if (existing) {
          return {
            recentProjects: [
              { ...existing, lastOpened: Date.now() },
              ...state.recentProjects.filter(p => p.url !== project.url)
            ]
          };
        }
        return {
          recentProjects: [
            { ...project, lastOpened: Date.now() },
            ...state.recentProjects
          ].slice(0, 10)
        };
      }),
      
      removeRecentProject: (url) => set((state) => ({
        recentProjects: state.recentProjects.filter(p => p.url !== url)
      })),
      
      // Actions - PWA
      setInstalled: (installed) => set({ isInstalled: installed }),
      
      setInstallPrompt: (event) => set({ installPromptEvent: event }),
      
      // Utility actions
      reset: () => set({
        files: {},
        currentFile: null,
        openFiles: [],
        fileTree: [],
        currentRepo: null,
        currentBranch: 'main',
        editorContent: {},
        unsavedChanges: new Set(),
      }),
    }),
    {
      name: 'browser-ide-storage',
      partialize: (state) => ({
        settings: state.settings,
        recentProjects: state.recentProjects,
        sidebarOpen: state.sidebarOpen,
        terminalOpen: state.terminalOpen,
        previewOpen: state.previewOpen,
        isInstalled: state.isInstalled,
      }),
      version: 1,
    }
  )
);
