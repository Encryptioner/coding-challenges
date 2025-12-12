import git from 'isomorphic-git';
import http from 'isomorphic-git/http/web';
import { fileSystem } from './filesystem';

class GitService {
  constructor() {
    this.corsProxy = 'https://cors.isomorphic-git.org';
  }
  
  async clone(url, token, onProgress = null) {
    const dir = '/repo';
    
    // Clean up existing directory
    const exists = await fileSystem.exists(dir);
    if (exists) {
      await fileSystem.deleteDirectory(dir);
    }
    
    try {
      await git.clone({
        fs: fileSystem.fs,
        http,
        dir,
        url,
        corsProxy: this.corsProxy,
        singleBranch: false,
        depth: 1,
        onAuth: () => ({
          username: token,
          password: 'x-oauth-basic'
        }),
        onProgress: (progress) => {
          console.log('Clone progress:', progress);
          if (onProgress) onProgress(progress);
        }
      });
      
      return { success: true, dir };
    } catch (error) {
      console.error('Clone error:', error);
      return { success: false, error: error.message };
    }
  }
  
  async getCurrentBranch(dir = '/repo') {
    try {
      return await git.currentBranch({ 
        fs: fileSystem.fs, 
        dir,
        fullname: false 
      });
    } catch (error) {
      console.error('Get current branch error:', error);
      return null;
    }
  }
  
  async listBranches(dir = '/repo') {
    try {
      const branches = await git.listBranches({ 
        fs: fileSystem.fs, 
        dir 
      });
      return branches;
    } catch (error) {
      console.error('List branches error:', error);
      return [];
    }
  }
  
  async createBranch(branchName, dir = '/repo') {
    try {
      await git.branch({
        fs: fileSystem.fs,
        dir,
        ref: branchName
      });
      return { success: true };
    } catch (error) {
      console.error('Create branch error:', error);
      return { success: false, error: error.message };
    }
  }
  
  async checkout(branchName, dir = '/repo') {
    try {
      await git.checkout({
        fs: fileSystem.fs,
        dir,
        ref: branchName
      });
      return { success: true };
    } catch (error) {
      console.error('Checkout error:', error);
      return { success: false, error: error.message };
    }
  }
  
  async status(filepath = '.', dir = '/repo') {
    try {
      const status = await git.status({
        fs: fileSystem.fs,
        dir,
        filepath
      });
      return status;
    } catch (error) {
      console.error('Status error:', error);
      return 'unmodified';
    }
  }
  
  async statusMatrix(dir = '/repo') {
    try {
      const matrix = await git.statusMatrix({ 
        fs: fileSystem.fs, 
        dir 
      });
      
      return matrix.map(([filepath, head, workdir, stage]) => ({
        path: filepath,
        status: this.getStatusFromMatrix(head, workdir, stage),
        head,
        workdir,
        stage
      }));
    } catch (error) {
      console.error('Status matrix error:', error);
      return [];
    }
  }
  
  getStatusFromMatrix(head, workdir, stage) {
    // [head, workdir, stage]
    // [0, 2, 0] = new, untracked
    // [0, 2, 2] = new, staged
    // [1, 2, 1] = modified, unstaged
    // [1, 2, 2] = modified, staged
    // [1, 0, 1] = deleted, unstaged
    // [1, 0, 0] = deleted, staged
    // [1, 1, 1] = unmodified
    
    if (head === 0 && workdir === 2 && stage === 0) return 'untracked';
    if (head === 0 && workdir === 2 && stage === 2) return 'added';
    if (head === 1 && workdir === 2 && stage === 1) return 'modified';
    if (head === 1 && workdir === 2 && stage === 2) return 'staged';
    if (head === 1 && workdir === 0 && stage === 1) return 'deleted';
    if (head === 1 && workdir === 0 && stage === 0) return 'removed';
    return 'unmodified';
  }
  
  async add(filepath, dir = '/repo') {
    try {
      await git.add({ 
        fs: fileSystem.fs, 
        dir, 
        filepath 
      });
      return { success: true };
    } catch (error) {
      console.error('Add error:', error);
      return { success: false, error: error.message };
    }
  }
  
  async addAll(dir = '/repo') {
    try {
      const status = await this.statusMatrix(dir);
      for (const file of status) {
        if (file.status !== 'unmodified') {
          await this.add(file.path, dir);
        }
      }
      return { success: true };
    } catch (error) {
      console.error('Add all error:', error);
      return { success: false, error: error.message };
    }
  }
  
  async commit(message, author, dir = '/repo') {
    try {
      const sha = await git.commit({
        fs: fileSystem.fs,
        dir,
        message,
        author: {
          name: author.name || 'Browser IDE User',
          email: author.email || 'user@browser-ide.dev'
        }
      });
      return { success: true, sha };
    } catch (error) {
      console.error('Commit error:', error);
      return { success: false, error: error.message };
    }
  }
  
  async push(token, remote = 'origin', remoteRef = undefined, dir = '/repo') {
    try {
      const currentBranch = await this.getCurrentBranch(dir);
      
      await git.push({
        fs: fileSystem.fs,
        http,
        dir,
        remote,
        ref: remoteRef || currentBranch,
        corsProxy: this.corsProxy,
        onAuth: () => ({
          username: token,
          password: 'x-oauth-basic'
        }),
        onProgress: (progress) => {
          console.log('Push progress:', progress);
        }
      });
      return { success: true };
    } catch (error) {
      console.error('Push error:', error);
      return { success: false, error: error.message };
    }
  }
  
  async pull(token, remote = 'origin', remoteRef = undefined, dir = '/repo') {
    try {
      const currentBranch = await this.getCurrentBranch(dir);
      
      await git.pull({
        fs: fileSystem.fs,
        http,
        dir,
        remote,
        ref: remoteRef || currentBranch,
        corsProxy: this.corsProxy,
        onAuth: () => ({
          username: token,
          password: 'x-oauth-basic'
        }),
        author: {
          name: 'Browser IDE User',
          email: 'user@browser-ide.dev'
        }
      });
      return { success: true };
    } catch (error) {
      console.error('Pull error:', error);
      return { success: false, error: error.message };
    }
  }
  
  async log(dir = '/repo', depth = 20) {
    try {
      const commits = await git.log({
        fs: fileSystem.fs,
        dir,
        depth
      });
      return commits;
    } catch (error) {
      console.error('Log error:', error);
      return [];
    }
  }
  
  async getConfig(path, dir = '/repo') {
    try {
      return await git.getConfig({
        fs: fileSystem.fs,
        dir,
        path
      });
    } catch (error) {
      return undefined;
    }
  }
  
  async setConfig(path, value, dir = '/repo') {
    try {
      await git.setConfig({
        fs: fileSystem.fs,
        dir,
        path,
        value
      });
      return { success: true };
    } catch (error) {
      console.error('Set config error:', error);
      return { success: false, error: error.message };
    }
  }
  
  async listRemotes(dir = '/repo') {
    try {
      const remotes = await git.listRemotes({
        fs: fileSystem.fs,
        dir
      });
      return remotes;
    } catch (error) {
      console.error('List remotes error:', error);
      return [];
    }
  }
  
  async getRemoteUrl(remote = 'origin', dir = '/repo') {
    try {
      const remotes = await this.listRemotes(dir);
      const found = remotes.find(r => r.remote === remote);
      return found ? found.url : null;
    } catch (error) {
      return null;
    }
  }
}

export const gitService = new GitService();
