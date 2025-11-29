// Core Type Definitions for Browser IDE

// ============= AI Provider Types =============
export type AIProvider = 'anthropic' | 'glm' | 'openai' | 'custom';

export interface AIProviderConfig {
  id: string;
  name: string;
  provider: AIProvider;
  apiKey: string;
  baseUrl?: string;
  model: string;
  maxTokens?: number;
  temperature?: number;
  enabled: boolean;
}

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  tokens?: number;
  model?: string;
  parentId?: string | null; // For message branching
  children?: string[]; // Child message IDs
}

export interface AISession {
  id: string;
  title: string;
  projectId: string;
  providerId: string;
  model: string;
  messages: AIMessage[];
  createdAt: number;
  updatedAt: number;
  pinned: boolean;
  systemPrompt?: string;
}

// ============= Project Types =============
export interface Project {
  id: string;
  name: string;
  description?: string;
  repoUrl?: string;
  localPath: string;
  gitBranch: string;
  lastOpened: number;
  createdAt: number;
  starred: boolean;
  color?: string;
  tags?: string[];
}

export interface ProjectSettings {
  projectId: string;
  defaultAIProvider?: string;
  defaultModel?: string;
  systemPrompt?: string;
  autoSave: boolean;
  formatOnSave: boolean;
  gitAutoFetch: boolean;
}

// ============= File System Types =============
export interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
  modified?: number;
  children?: FileNode[];
}

export interface OpenFile {
  path: string;
  content: string;
  modified: boolean;
  language: string;
  cursorPosition?: {
    line: number;
    column: number;
  };
}

// ============= Git Types =============
export interface GitStatus {
  path: string;
  status: 'modified' | 'added' | 'deleted' | 'untracked' | 'staged' | 'unmodified';
}

export interface GitCommit {
  oid: string;
  message: string;
  author: {
    name: string;
    email: string;
    timestamp: number;
  };
  committer: {
    name: string;
    email: number;
    timestamp: number;
  };
}

export interface GitBranch {
  name: string;
  current: boolean;
  remote?: string;
}

// ============= Settings Types =============
export interface EditorSettings {
  theme: 'vs-dark' | 'vs-light' | 'hc-black';
  fontSize: number;
  fontFamily: string;
  tabSize: number;
  wordWrap: 'on' | 'off' | 'wordWrapColumn' | 'bounded';
  lineNumbers: 'on' | 'off' | 'relative' | 'interval';
  minimap: boolean;
  autoSave: boolean;
  autoSaveDelay: number;
  formatOnSave: boolean;
  bracketPairColorization: boolean;
}

export interface GitSettings {
  username: string;
  email: string;
  githubToken: string;
  defaultBranch: string;
  autoFetch: boolean;
  autoFetchInterval: number;
}

export interface AppSettings {
  editor: EditorSettings;
  git: GitSettings;
  ai: {
    providers: AIProviderConfig[];
    defaultProvider: string;
    defaultModel: string;
    streamResponses: boolean;
  };
  appearance: {
    sidebarPosition: 'left' | 'right';
    panelPosition: 'bottom' | 'right';
    activityBarVisible: boolean;
    statusBarVisible: boolean;
    zoomLevel: number;
  };
  terminal: {
    fontFamily: string;
    fontSize: number;
    cursorStyle: 'block' | 'underline' | 'bar';
  };
}

export interface UserProfile {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
  settings: AppSettings;
  createdAt: number;
  updatedAt: number;
}

// ============= UI State Types =============
export interface EditorTab {
  id: string;
  path: string;
  title: string;
  modified: boolean;
  pinned: boolean;
  preview: boolean;
}

export interface PanelState {
  terminal: boolean;
  output: boolean;
  preview: boolean;
  aiChat: boolean;
}

export interface SidebarState {
  explorer: boolean;
  search: boolean;
  git: boolean;
  extensions: boolean;
}

export interface UIState {
  sidebarOpen: boolean;
  sidebarView: 'explorer' | 'search' | 'git' | 'aiChat' | 'settings';
  panelOpen: boolean;
  panelView: 'terminal' | 'output' | 'preview' | 'problems';
  panelHeight: number;
  sidebarWidth: number;
  editorTabs: EditorTab[];
  activeTabId: string | null;
  commandPaletteOpen: boolean;
  modalOpen: string | null;
}

// ============= Store Types =============
export interface RootStore {
  // Projects
  projects: Project[];
  activeProjectId: string | null;
  projectSettings: Record<string, ProjectSettings>;
  
  // Files
  fileTree: FileNode[];
  openFiles: Record<string, OpenFile>;
  
  // Git
  gitStatus: GitStatus[];
  gitBranches: GitBranch[];
  gitCommits: GitCommit[];
  
  // AI
  aiSessions: Record<string, AISession[]>; // Keyed by projectId
  activeSessions: Record<string, string>; // projectId -> sessionId
  
  // Settings
  settings: AppSettings;
  profile: UserProfile | null;
  
  // UI
  ui: UIState;
}

// ============= API Response Types =============
export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface StreamChunk {
  type: 'content' | 'done' | 'error';
  content?: string;
  error?: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
}

// ============= WebContainer Types =============
export interface WebContainerProcess {
  id: string;
  command: string;
  args: string[];
  running: boolean;
  exitCode?: number;
  output: string[];
}

export interface WebContainerServer {
  port: number;
  url: string;
  ready: boolean;
}

// ============= Database Types (IndexedDB) =============
export interface DBProject extends Project {
  // Additional DB fields if needed
}

export interface DBSession extends AISession {
  // Additional DB fields if needed
}

export interface DBMessage extends AIMessage {
  sessionId: string;
}

export interface DBSettings {
  id: 'app-settings';
  settings: AppSettings;
  updatedAt: number;
}

// ============= Utility Types =============
export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type AsyncResult<T> = Promise<APIResponse<T>>;
export type VoidAsync = Promise<void>;

// ============= Component Props Types =============
export interface BaseComponentProps {
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

export interface ModalProps extends BaseComponentProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
}

export interface ButtonProps extends BaseComponentProps {
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

// ============= Event Types =============
export interface FileChangeEvent {
  path: string;
  content: string;
  modified: boolean;
}

export interface GitChangeEvent {
  type: 'commit' | 'branch' | 'status';
  data: unknown;
}

export interface AIMessageEvent {
  sessionId: string;
  message: AIMessage;
}

// ============= Constants =============
export const AI_PROVIDERS = {
  anthropic: {
    name: 'Anthropic Claude',
    baseUrl: 'https://api.anthropic.com',
    models: ['claude-sonnet-4-20250514', 'claude-opus-4-20250514', 'claude-haiku-4-20250514'],
  },
  glm: {
    name: 'Z.ai GLM',
    baseUrl: 'https://api.z.ai/api/paas/v4',
    models: ['glm-4.6', 'glm-4-plus', 'glm-4-air'],
  },
  openai: {
    name: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    models: ['gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo'],
  },
} as const;

export const DEFAULT_EDITOR_SETTINGS: EditorSettings = {
  theme: 'vs-dark',
  fontSize: 14,
  fontFamily: 'Consolas, Monaco, monospace',
  tabSize: 2,
  wordWrap: 'on',
  lineNumbers: 'on',
  minimap: true,
  autoSave: true,
  autoSaveDelay: 1000,
  formatOnSave: false,
  bracketPairColorization: true,
};

export const DEFAULT_GIT_SETTINGS: GitSettings = {
  username: '',
  email: '',
  githubToken: '',
  defaultBranch: 'main',
  autoFetch: false,
  autoFetchInterval: 300000, // 5 minutes
};
