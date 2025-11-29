import git from 'isomorphic-git';
import http from 'isomorphic-git/http/web';
import { fileSystem } from './filesystem';
import type { GitStatus, GitCommit, GitBranch } from '@/types';

export interface GitResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface GitAuthor {
  name: string;
  email: string;
}

export interface GitCloneProgress {
  phase: string;
  loaded: number;
  total: number;
}

class GitService {
  private corsProxy = 'https://cors.isomorphic-git.org';

  async clone(
    url: string,
    token: string,
    onProgress?: (progress: GitCloneProgress) => void
  ): Promise<GitResult<string>> {
    const dir = '/repo';

    // Clean up existing directory
    const exists = await fileSystem.exists(dir);
    if (exists) {
      const result = await fileSystem.deleteDirectory(dir);
      if (!result.success) {
        return { success: false, error: 'Failed to clean up existing directory' };
      }
    }

    try {
      await git.clone({
        fs: fileSystem.getFS(),
        http,
        dir,
        url,
        corsProxy: this.corsProxy,
        singleBranch: false,
        depth: 1,
        onAuth: () => ({
          username: token,
          password: 'x-oauth-basic',
        }),
        onProgress: (progress) => {
          console.log('Clone progress:', progress);
          if (onProgress) onProgress(progress);
        },
      });

      return { success: true, data: dir };
    } catch (error) {
      console.error('Clone error:', error);
      return { success: false, error: String(error) };
    }
  }

  async getCurrentBranch(dir = '/repo'): Promise<string | null> {
    try {
      const branch = await git.currentBranch({
        fs: fileSystem.getFS(),
        dir,
        fullname: false,
      });
      return branch || null;
    } catch (error) {
      console.error('Get current branch error:', error);
      return null;
    }
  }

  async listBranches(dir = '/repo'): Promise<GitBranch[]> {
    try {
      const branches = await git.listBranches({
        fs: fileSystem.getFS(),
        dir,
      });
      const currentBranch = await this.getCurrentBranch(dir);

      return branches.map((name) => ({
        name,
        current: name === currentBranch,
      }));
    } catch (error) {
      console.error('List branches error:', error);
      return [];
    }
  }

  async createBranch(branchName: string, dir = '/repo'): Promise<GitResult<void>> {
    try {
      await git.branch({
        fs: fileSystem.getFS(),
        dir,
        ref: branchName,
      });
      return { success: true };
    } catch (error) {
      console.error('Create branch error:', error);
      return { success: false, error: String(error) };
    }
  }

  async checkout(branchName: string, dir = '/repo'): Promise<GitResult<void>> {
    try {
      await git.checkout({
        fs: fileSystem.getFS(),
        dir,
        ref: branchName,
      });
      return { success: true };
    } catch (error) {
      console.error('Checkout error:', error);
      return { success: false, error: String(error) };
    }
  }

  async status(filepath = '.', dir = '/repo'): Promise<string> {
    try {
      const status = await git.status({
        fs: fileSystem.getFS(),
        dir,
        filepath,
      });
      return status;
    } catch (error) {
      console.error('Status error:', error);
      return 'unmodified';
    }
  }

  async statusMatrix(dir = '/repo'): Promise<GitStatus[]> {
    try {
      const matrix = await git.statusMatrix({
        fs: fileSystem.getFS(),
        dir,
      });

      return matrix.map(([filepath, head, workdir, stage]) => ({
        path: filepath,
        status: this.getStatusFromMatrix(head, workdir, stage),
      }));
    } catch (error) {
      console.error('Status matrix error:', error);
      return [];
    }
  }

  private getStatusFromMatrix(
    head: number,
    workdir: number,
    stage: number
  ): GitStatus['status'] {
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
    if (head === 1 && workdir === 0) return 'deleted';
    return 'unmodified';
  }

  async add(filepath: string, dir = '/repo'): Promise<GitResult<void>> {
    try {
      await git.add({
        fs: fileSystem.getFS(),
        dir,
        filepath,
      });
      return { success: true };
    } catch (error) {
      console.error('Add error:', error);
      return { success: false, error: String(error) };
    }
  }

  async addAll(dir = '/repo'): Promise<GitResult<void>> {
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
      return { success: false, error: String(error) };
    }
  }

  async commit(message: string, author: GitAuthor, dir = '/repo'): Promise<GitResult<string>> {
    try {
      const sha = await git.commit({
        fs: fileSystem.getFS(),
        dir,
        message,
        author: {
          name: author.name || 'Browser IDE User',
          email: author.email || 'user@browser-ide.dev',
        },
      });
      return { success: true, data: sha };
    } catch (error) {
      console.error('Commit error:', error);
      return { success: false, error: String(error) };
    }
  }

  async push(
    token: string,
    remote = 'origin',
    remoteRef?: string,
    dir = '/repo'
  ): Promise<GitResult<void>> {
    try {
      const currentBranch = await this.getCurrentBranch(dir);

      await git.push({
        fs: fileSystem.getFS(),
        http,
        dir,
        remote,
        ref: remoteRef || currentBranch || 'main',
        corsProxy: this.corsProxy,
        onAuth: () => ({
          username: token,
          password: 'x-oauth-basic',
        }),
        onProgress: (progress) => {
          console.log('Push progress:', progress);
        },
      });
      return { success: true };
    } catch (error) {
      console.error('Push error:', error);
      return { success: false, error: String(error) };
    }
  }

  async pull(
    token: string,
    remote = 'origin',
    remoteRef?: string,
    dir = '/repo'
  ): Promise<GitResult<void>> {
    try {
      const currentBranch = await this.getCurrentBranch(dir);

      await git.pull({
        fs: fileSystem.getFS(),
        http,
        dir,
        remote,
        ref: remoteRef || currentBranch || 'main',
        corsProxy: this.corsProxy,
        onAuth: () => ({
          username: token,
          password: 'x-oauth-basic',
        }),
        author: {
          name: 'Browser IDE User',
          email: 'user@browser-ide.dev',
        },
      });
      return { success: true };
    } catch (error) {
      console.error('Pull error:', error);
      return { success: false, error: String(error) };
    }
  }

  async log(dir = '/repo', depth = 20): Promise<GitCommit[]> {
    try {
      const commits = await git.log({
        fs: fileSystem.getFS(),
        dir,
        depth,
      });

      return commits.map((commit) => ({
        oid: commit.oid,
        message: commit.commit.message,
        author: {
          name: commit.commit.author.name,
          email: commit.commit.author.email,
          timestamp: commit.commit.author.timestamp,
        },
        committer: {
          name: commit.commit.committer.name,
          email: commit.commit.committer.timestamp,
          timestamp: commit.commit.committer.timestamp,
        },
      }));
    } catch (error) {
      console.error('Log error:', error);
      return [];
    }
  }

  async getConfig(path: string, dir = '/repo'): Promise<string | undefined> {
    try {
      return await git.getConfig({
        fs: fileSystem.getFS(),
        dir,
        path,
      });
    } catch (error) {
      return undefined;
    }
  }

  async setConfig(path: string, value: string, dir = '/repo'): Promise<GitResult<void>> {
    try {
      await git.setConfig({
        fs: fileSystem.getFS(),
        dir,
        path,
        value,
      });
      return { success: true };
    } catch (error) {
      console.error('Set config error:', error);
      return { success: false, error: String(error) };
    }
  }

  async listRemotes(dir = '/repo'): Promise<Array<{ remote: string; url: string }>> {
    try {
      const remotes = await git.listRemotes({
        fs: fileSystem.getFS(),
        dir,
      });
      return remotes;
    } catch (error) {
      console.error('List remotes error:', error);
      return [];
    }
  }

  async getRemoteUrl(remote = 'origin', dir = '/repo'): Promise<string | null> {
    try {
      const remotes = await this.listRemotes(dir);
      const found = remotes.find((r) => r.remote === remote);
      return found ? found.url : null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Initialize repository state after clone
   * Loads current branch, git status, and recent commits
   * Updates IDE store with actual repository state
   */
  async initializeRepository(dir = '/repo'): Promise<GitResult<{
    currentBranch: string;
    gitStatus: GitStatus[];
    commits: GitCommit[];
  }>> {
    try {
      // Get current branch
      const branch = await this.getCurrentBranch(dir);
      if (!branch) {
        return {
          success: false,
          error: 'Could not determine current branch',
        };
      }

      // Get git status
      const allStatus = await this.statusMatrix(dir);
      const gitStatus = allStatus.filter(item => item.status !== 'unmodified');

      // Get recent commits
      const commits = await this.log(dir, 20);

      // Update IDE store
      const { useIDEStore } = await import('@/store/useIDEStore');
      const store = useIDEStore.getState();

      store.setCurrentBranch(branch);
      store.setGitStatus(gitStatus);
      store.setCommits(commits);

      console.log(`✅ Repository initialized: branch=${branch}, status=${gitStatus.length} files, commits=${commits.length}`);

      return {
        success: true,
        data: {
          currentBranch: branch,
          gitStatus,
          commits,
        },
      };
    } catch (error) {
      console.error('Initialize repository error:', error);
      return {
        success: false,
        error: String(error),
      };
    }
  }
}

export const gitService = new GitService();
