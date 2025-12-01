import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Types
export interface EditorSettings {
  theme: string;
  fontSize: number;
  tabSize: number;
  wordWrap: 'on' | 'off';
  autoSave: boolean;
  autoSaveDelay: number;
  lineNumbers: 'on' | 'off';
  minimap: boolean;
}

export interface GitSettings {
  githubToken: string;
  githubUsername: string;
  githubEmail: string;
}

export interface AISettings {
  anthropicKey: string;
  glmKey: string;
  openaiKey: string;
  defaultProvider: 'anthropic' | 'glm' | 'openai';
}

export interface Settings extends EditorSettings, GitSettings {
  ai: AISettings;
}

export interface RecentProject {
  name: string;
  url: string;
  path: string;
  lastOpened: number;
}

export interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileNode[];
}

interface IDEState {
  // File system state
  files: Record<string, string>;
  currentFile: string | null;
  openFiles: string[];
  fileTree: FileNode[];

  // Git state
  currentRepo: string | null;
  currentBranch: string;
  gitStatus: any[];
  commits: any[];

  // Editor state
  editorContent: Record<string, string>;
  unsavedChanges: Set<string>;

  // UI state
  sidebarOpen: boolean;
  terminalOpen: boolean;
  previewOpen: boolean;
  aiOpen: boolean;
  commandPaletteOpen: boolean;

  // Settings
  settings: Settings;

  // Recent projects
  recentProjects: RecentProject[];

  // PWA
  isInstalled: boolean;
  installPromptEvent: any;

  // Actions - File Management
  setCurrentFile: (file: string | null) => void;
  addOpenFile: (file: string) => void;
  closeFile: (file: string) => void;
  closeAllFiles: () => void;
  updateEditorContent: (file: string, content: string) => void;
  markFileUnsaved: (file: string) => void;
  markFileSaved: (file: string) => void;
  setFileTree: (tree: FileNode[]) => void;

  // Actions - Directory Navigation
  changeDirectory: (path: string) => void;
  getCurrentDirectory: () => string,

  // Actions - Git
  setCurrentRepo: (repo: string | null) => void;
  setCurrentBranch: (branch: string) => void;
  setGitStatus: (status: any[]) => void;
  setCommits: (commits: any[]) => void;

  // Actions - UI
  toggleSidebar: () => void;
  toggleTerminal: () => void;
  togglePreview: () => void;
  toggleAI: () => void;
  toggleCommandPalette: () => void;
  setSidebarOpen: (open: boolean) => void;
  setTerminalOpen: (open: boolean) => void;
  setPreviewOpen: (open: boolean) => void;
  setAIOpen: (open: boolean) => void;

  // Actions - Settings
  updateSettings: (newSettings: Partial<Settings>) => void;

  // Actions - Recent Projects
  addRecentProject: (project: Omit<RecentProject, 'lastOpened'>) => void;
  removeRecentProject: (url: string) => void;

  // Actions - PWA
  setInstalled: (installed: boolean) => void;
  setInstallPrompt: (event: any) => void;

  // Utility
  reset: () => void;
}

const DEFAULT_SETTINGS: Settings = {
  theme: 'vs-dark',
  fontSize: 14,
  tabSize: 2,
  wordWrap: 'on',
  autoSave: true,
  autoSaveDelay: 1000,
  lineNumbers: 'on',
  minimap: true,
  githubToken: '',
  githubUsername: '',
  githubEmail: '',
  ai: {
    anthropicKey: '',
    glmKey: '',
    openaiKey: '',
    defaultProvider: 'glm',
  },
};

export const useIDEStore = create<IDEState>()(
  persist(
    (set) => ({
      // Initial state
      files: {},
      currentFile: null,
      openFiles: [],
      fileTree: [],

      currentRepo: null,
      currentBranch: 'main',
      gitStatus: [],
      commits: [],

      editorContent: {},
      unsavedChanges: new Set(),

      sidebarOpen: true,
      terminalOpen: true,
      previewOpen: false,
      aiOpen: false,
      commandPaletteOpen: false,

      settings: DEFAULT_SETTINGS,
      recentProjects: [],

      isInstalled: false,
      installPromptEvent: null,

      // File Management Actions
      setCurrentFile: (file) => set({ currentFile: file }),

      addOpenFile: (file) =>
        set((state) => {
          if (state.openFiles.includes(file)) return state;
          return { openFiles: [...state.openFiles, file] };
        }),

      closeFile: (file) =>
        set((state) => {
          const newOpenFiles = state.openFiles.filter((f) => f !== file);
          const newCurrentFile =
            state.currentFile === file
              ? newOpenFiles.length > 0
                ? newOpenFiles[newOpenFiles.length - 1]
                : null
              : state.currentFile;
          return {
            openFiles: newOpenFiles,
            currentFile: newCurrentFile,
          };
        }),

      closeAllFiles: () => set({ openFiles: [], currentFile: null }),

      updateEditorContent: (file, content) =>
        set((state) => ({
          editorContent: { ...state.editorContent, [file]: content },
        })),

      markFileUnsaved: (file) =>
        set((state) => {
          const unsaved = new Set(state.unsavedChanges);
          unsaved.add(file);
          return { unsavedChanges: unsaved };
        }),

      markFileSaved: (file) =>
        set((state) => {
          const unsaved = new Set(state.unsavedChanges);
          unsaved.delete(file);
          return { unsavedChanges: unsaved };
        }),

      setFileTree: (tree) => set({ fileTree: tree }),

      // Git Actions
      setCurrentRepo: (repo) => set({ currentRepo: repo }),
      setCurrentBranch: (branch) => set({ currentBranch: branch }),
      setGitStatus: (status) => set({ gitStatus: status }),
      setCommits: (commits) => set({ commits: commits }),

      // UI Actions
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      toggleTerminal: () =>
        set((state) => ({ terminalOpen: !state.terminalOpen })),
      togglePreview: () => set((state) => ({ previewOpen: !state.previewOpen })),
      toggleAI: () => set((state) => ({ aiOpen: !state.aiOpen })),
      toggleCommandPalette: () =>
        set((state) => ({
          commandPaletteOpen: !state.commandPaletteOpen,
        })),

      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      setTerminalOpen: (open) => set({ terminalOpen: open }),
      setPreviewOpen: (open) => set({ previewOpen: open }),
      setAIOpen: (open) => set({ aiOpen: open }),

      // Settings Actions
      updateSettings: (newSettings) =>
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        })),

      // Recent Projects Actions
      addRecentProject: (project) =>
        set((state) => {
          const existing = state.recentProjects.find((p) => p.url === project.url);
          if (existing) {
            return {
              recentProjects: [
                { ...existing, lastOpened: Date.now() },
                ...state.recentProjects.filter((p) => p.url !== project.url),
              ],
            };
          }
          return {
            recentProjects: [
              { ...project, lastOpened: Date.now() },
              ...state.recentProjects,
            ].slice(0, 10),
          };
        }),

      removeRecentProject: (url) =>
        set((state) => ({
          recentProjects: state.recentProjects.filter((p) => p.url !== url),
        })),

      // PWA Actions
      setInstalled: (installed) => set({ isInstalled: installed }),
      setInstallPrompt: (event) => set({ installPromptEvent: event }),

      // Reset
      reset: () =>
        set({
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
      name: 'browser-ide-storage-v2',
      partialize: (state) => ({
        settings: state.settings,
        recentProjects: state.recentProjects,
        sidebarOpen: state.sidebarOpen,
        terminalOpen: state.terminalOpen,
        previewOpen: state.previewOpen,
        aiOpen: state.aiOpen,
        isInstalled: state.isInstalled,
      }),
      version: 2,
    }
  )
);
