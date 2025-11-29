import LightningFS from '@isomorphic-git/lightning-fs';

class FileSystemService {
  constructor() {
    this.fs = new LightningFS('browser-ide-fs');
    this.pfs = this.fs.promises;
  }
  
  async readDir(path = '/') {
    try {
      const entries = await this.pfs.readdir(path);
      const items = await Promise.all(
        entries
          .filter(name => !name.startsWith('.')) // Hide hidden files
          .map(async (name) => {
            const fullPath = `${path}/${name}`.replace('//', '/');
            try {
              const stats = await this.pfs.stat(fullPath);
              return {
                name,
                path: fullPath,
                type: stats.isDirectory() ? 'directory' : 'file',
                size: stats.size,
                modified: stats.mtime,
              };
            } catch (err) {
              console.error(`Error stating ${fullPath}:`, err);
              return null;
            }
          })
      );
      
      return items
        .filter(Boolean)
        .sort((a, b) => {
          if (a.type === b.type) return a.name.localeCompare(b.name);
          return a.type === 'directory' ? -1 : 1;
        });
    } catch (error) {
      console.error('Error reading directory:', error);
      return [];
    }
  }
  
  async readFile(path) {
    try {
      const content = await this.pfs.readFile(path, 'utf8');
      return content;
    } catch (error) {
      console.error('Error reading file:', error);
      return '';
    }
  }
  
  async writeFile(path, content) {
    try {
      const dir = path.substring(0, path.lastIndexOf('/'));
      if (dir) {
        await this.ensureDir(dir);
      }
      await this.pfs.writeFile(path, content, 'utf8');
      return true;
    } catch (error) {
      console.error('Error writing file:', error);
      return false;
    }
  }
  
  async deleteFile(path) {
    try {
      await this.pfs.unlink(path);
      return true;
    } catch (error) {
      console.error('Error deleting file:', error);
      return false;
    }
  }
  
  async deleteDirectory(path) {
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
      return true;
    } catch (error) {
      console.error('Error deleting directory:', error);
      return false;
    }
  }
  
  async ensureDir(path) {
    const parts = path.split('/').filter(Boolean);
    let current = '';
    
    for (const part of parts) {
      current += '/' + part;
      try {
        await this.pfs.mkdir(current);
      } catch (error) {
        // Directory might already exist
      }
    }
  }
  
  async createFile(path, content = '') {
    return this.writeFile(path, content);
  }
  
  async createDirectory(path) {
    try {
      await this.pfs.mkdir(path);
      return true;
    } catch (error) {
      console.error('Error creating directory:', error);
      return false;
    }
  }
  
  async exists(path) {
    try {
      await this.pfs.stat(path);
      return true;
    } catch {
      return false;
    }
  }
  
  async rename(oldPath, newPath) {
    try {
      await this.pfs.rename(oldPath, newPath);
      return true;
    } catch (error) {
      console.error('Error renaming:', error);
      return false;
    }
  }
  
  // Recursively build file tree
  async buildFileTree(path = '/', maxDepth = 10, currentDepth = 0) {
    if (currentDepth >= maxDepth) return [];
    
    const items = await this.readDir(path);
    const tree = [];
    
    for (const item of items) {
      if (item.type === 'directory') {
        tree.push({
          ...item,
          children: await this.buildFileTree(item.path, maxDepth, currentDepth + 1)
        });
      } else {
        tree.push(item);
      }
    }
    
    return tree;
  }
  
  // Get file extension
  getExtension(filename) {
    const parts = filename.split('.');
    return parts.length > 1 ? parts[parts.length - 1] : '';
  }
  
  // Get file name without extension
  getBaseName(filename) {
    return filename.substring(0, filename.lastIndexOf('.')) || filename;
  }
  
  // Search files by name
  async searchFiles(searchTerm, rootPath = '/repo') {
    const results = [];
    
    async function search(path) {
      const items = await this.readDir(path);
      for (const item of items) {
        if (item.name.toLowerCase().includes(searchTerm.toLowerCase())) {
          results.push(item);
        }
        if (item.type === 'directory') {
          await search(item.path);
        }
      }
    }
    
    await search.call(this, rootPath);
    return results;
  }
}

export const fileSystem = new FileSystemService();
