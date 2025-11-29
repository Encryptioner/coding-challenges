import LightningFS from '@isomorphic-git/lightning-fs';
import type { FileNode } from '@/types';

export interface FileStats {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size: number;
  modified: number;
}

export interface FileSystemResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

class FileSystemService {
  private fs: LightningFS;
  private pfs: LightningFS['promises'];
  private initialized: boolean;
  private initPromise: Promise<void>;

  constructor() {
    this.fs = new LightningFS('browser-ide-fs-v2');
    this.pfs = this.fs.promises;
    this.initialized = false;
    this.initPromise = this.initialize();
  }

  private async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Ensure /repo directory exists
      await this.ensureDir('/repo');
      this.initialized = true;
      console.log('✅ FileSystem initialized');
    } catch (error) {
      console.error('❌ Error initializing filesystem:', error);
    }
  }

  async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.initPromise;
    }
  }

  getFS(): LightningFS {
    return this.fs;
  }

  async readDir(path = '/'): Promise<FileStats[]> {
    await this.ensureInitialized();
    try {
      const entries = await this.pfs.readdir(path);
      const items = await Promise.all(
        entries
          .filter((name) => !name.startsWith('.')) // Hide hidden files
          .map(async (name) => {
            const fullPath = `${path}/${name}`.replace('//', '/');
            try {
              const stats = await this.pfs.stat(fullPath);
              return {
                name,
                path: fullPath,
                type: stats.isDirectory() ? ('directory' as const) : ('file' as const),
                size: stats.size || 0,
                modified: stats.mtimeMs || 0,
              };
            } catch (err) {
              console.error(`Error stating ${fullPath}:`, err);
              return null;
            }
          })
      );

      return items
        .filter((item): item is FileStats => item !== null)
        .sort((a, b) => {
          if (a.type === b.type) return a.name.localeCompare(b.name);
          return a.type === 'directory' ? -1 : 1;
        });
    } catch (error) {
      console.error('Error reading directory:', error);
      return [];
    }
  }

  async readFile(path: string): Promise<FileSystemResult<string>> {
    try {
      const content = await this.pfs.readFile(path, 'utf8');
      return { success: true, data: content };
    } catch (error) {
      console.error('Error reading file:', error);
      return { success: false, error: String(error) };
    }
  }

  async writeFile(path: string, content: string): Promise<FileSystemResult<void>> {
    try {
      const dir = path.substring(0, path.lastIndexOf('/'));
      if (dir) {
        await this.ensureDir(dir);
      }
      await this.pfs.writeFile(path, content, 'utf8');
      return { success: true };
    } catch (error) {
      console.error('Error writing file:', error);
      return { success: false, error: String(error) };
    }
  }

  async deleteFile(path: string): Promise<FileSystemResult<void>> {
    try {
      await this.pfs.unlink(path);
      return { success: true };
    } catch (error) {
      console.error('Error deleting file:', error);
      return { success: false, error: String(error) };
    }
  }

  async deleteDirectory(path: string): Promise<FileSystemResult<void>> {
    try {
      // Recursively delete directory contents
      const items = await this.readDir(path);
      for (const item of items) {
        if (item.type === 'directory') {
          await this.deleteDirectory(item.path);
        } else {
          await this.deleteFile(item.path);
        }
      }
      await this.pfs.rmdir(path);
      return { success: true };
    } catch (error) {
      console.error('Error deleting directory:', error);
      return { success: false, error: String(error) };
    }
  }

  async ensureDir(path: string): Promise<void> {
    const parts = path.split('/').filter(Boolean);
    let current = '';

    for (const part of parts) {
      current += '/' + part;
      try {
        await this.pfs.mkdir(current);
      } catch (error) {
        // Directory might already exist, ignore error
      }
    }
  }

  async createFile(path: string, content = ''): Promise<FileSystemResult<void>> {
    return this.writeFile(path, content);
  }

  async createDirectory(path: string): Promise<FileSystemResult<void>> {
    try {
      await this.pfs.mkdir(path);
      return { success: true };
    } catch (error) {
      console.error('Error creating directory:', error);
      return { success: false, error: String(error) };
    }
  }

  async exists(path: string): Promise<boolean> {
    try {
      await this.pfs.stat(path);
      return true;
    } catch {
      return false;
    }
  }

  async rename(oldPath: string, newPath: string): Promise<FileSystemResult<void>> {
    try {
      await this.pfs.rename(oldPath, newPath);
      return { success: true };
    } catch (error) {
      console.error('Error renaming:', error);
      return { success: false, error: String(error) };
    }
  }

  // Recursively build file tree
  async buildFileTree(
    path = '/',
    maxDepth = 10,
    currentDepth = 0
  ): Promise<FileNode[]> {
    await this.ensureInitialized();
    if (currentDepth >= maxDepth) return [];

    const items = await this.readDir(path);
    const tree: FileNode[] = [];

    for (const item of items) {
      if (item.type === 'directory') {
        tree.push({
          name: item.name,
          path: item.path,
          type: 'directory',
          size: item.size,
          modified: item.modified,
          children: await this.buildFileTree(item.path, maxDepth, currentDepth + 1),
        });
      } else {
        tree.push({
          name: item.name,
          path: item.path,
          type: 'file',
          size: item.size,
          modified: item.modified,
        });
      }
    }

    return tree;
  }

  // Get file extension
  getExtension(filename: string): string {
    const parts = filename.split('.');
    return parts.length > 1 ? parts[parts.length - 1] : '';
  }

  // Get file name without extension
  getBaseName(filename: string): string {
    return filename.substring(0, filename.lastIndexOf('.')) || filename;
  }

  // Search files by name
  async searchFiles(searchTerm: string, rootPath = '/repo'): Promise<FileStats[]> {
    const results: FileStats[] = [];

    const search = async (path: string): Promise<void> => {
      const items = await this.readDir(path);
      for (const item of items) {
        if (item.name.toLowerCase().includes(searchTerm.toLowerCase())) {
          results.push(item);
        }
        if (item.type === 'directory') {
          await search(item.path);
        }
      }
    };

    await search(rootPath);
    return results;
  }

  // Get language from file extension
  getLanguageFromPath(path: string): string {
    const ext = this.getExtension(path).toLowerCase();
    const languageMap: Record<string, string> = {
      js: 'javascript',
      jsx: 'javascript',
      ts: 'typescript',
      tsx: 'typescript',
      py: 'python',
      java: 'java',
      c: 'c',
      cpp: 'cpp',
      cs: 'csharp',
      go: 'go',
      rs: 'rust',
      php: 'php',
      rb: 'ruby',
      swift: 'swift',
      kt: 'kotlin',
      md: 'markdown',
      json: 'json',
      yaml: 'yaml',
      yml: 'yaml',
      xml: 'xml',
      html: 'html',
      css: 'css',
      scss: 'scss',
      sass: 'sass',
      less: 'less',
      sql: 'sql',
      sh: 'shell',
      bash: 'shell',
      zsh: 'shell',
      txt: 'plaintext',
    };
    return languageMap[ext] || 'plaintext';
  }
}

export const fileSystem = new FileSystemService();
