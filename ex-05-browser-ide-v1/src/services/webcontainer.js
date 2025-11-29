import { WebContainer } from '@webcontainer/api';

class WebContainerService {
  constructor() {
    this.instance = null;
    this.serverUrl = null;
    this.processes = new Map();
  }
  
  async boot() {
    if (!this.instance) {
      try {
        this.instance = await WebContainer.boot();
        console.log('✅ WebContainer booted successfully');
        
        // Listen for server events
        this.instance.on('server-ready', (port, url) => {
          console.log('🚀 Server ready on port', port, ':', url);
          this.serverUrl = url;
        });
        
        this.instance.on('error', (error) => {
          console.error('❌ WebContainer error:', error);
        });
        
        return { success: true, instance: this.instance };
      } catch (error) {
        console.error('❌ Failed to boot WebContainer:', error);
        return { success: false, error: error.message };
      }
    }
    return { success: true, instance: this.instance };
  }
  
  async mountFiles(fileTree) {
    if (!this.instance) {
      const result = await this.boot();
      if (!result.success) return result;
    }
    
    try {
      await this.instance.mount(fileTree);
      console.log('📁 Files mounted successfully');
      return { success: true };
    } catch (error) {
      console.error('❌ Failed to mount files:', error);
      return { success: false, error: error.message };
    }
  }
  
  async writeFile(path, content) {
    if (!this.instance) {
      const result = await this.boot();
      if (!result.success) return result;
    }
    
    try {
      await this.instance.fs.writeFile(path, content);
      return { success: true };
    } catch (error) {
      console.error('❌ Failed to write file:', error);
      return { success: false, error: error.message };
    }
  }
  
  async readFile(path) {
    if (!this.instance) {
      return { success: false, error: 'WebContainer not booted' };
    }
    
    try {
      const content = await this.instance.fs.readFile(path, 'utf-8');
      return { success: true, content };
    } catch (error) {
      console.error('❌ Failed to read file:', error);
      return { success: false, error: error.message };
    }
  }
  
  async spawn(command, args = [], options = {}) {
    if (!this.instance) {
      const result = await this.boot();
      if (!result.success) return result;
    }
    
    try {
      const process = await this.instance.spawn(command, args, options);
      
      const processId = `${command}-${Date.now()}`;
      this.processes.set(processId, process);
      
      return {
        success: true,
        process,
        processId,
        output: process.output,
        exit: process.exit
      };
    } catch (error) {
      console.error(`❌ Failed to spawn ${command}:`, error);
      return { success: false, error: error.message };
    }
  }
  
  async install() {
    console.log('📦 Installing dependencies...');
    const result = await this.spawn('pnpm', ['install']);
    
    if (result.success) {
      // Stream output to console
      result.process.output.pipeTo(new WritableStream({
        write(data) {
          console.log(data);
        }
      }));
      
      await result.process.exit;
      console.log('✅ Dependencies installed');
    }
    
    return result;
  }
  
  async run(script = 'dev') {
    console.log(`🚀 Running pnpm run ${script}...`);
    const result = await this.spawn('pnpm', ['run', script]);
    
    if (result.success) {
      // Stream output
      result.process.output.pipeTo(new WritableStream({
        write(data) {
          console.log(data);
        }
      }));
    }
    
    return result;
  }
  
  async exec(command) {
    console.log(`⚡ Executing: ${command}`);
    const parts = command.split(' ');
    const cmd = parts[0];
    const args = parts.slice(1);
    
    return this.spawn(cmd, args);
  }
  
  getServerUrl() {
    return this.serverUrl;
  }
  
  killProcess(processId) {
    const process = this.processes.get(processId);
    if (process) {
      process.kill();
      this.processes.delete(processId);
      return true;
    }
    return false;
  }
  
  killAllProcesses() {
    for (const [id, process] of this.processes.entries()) {
      process.kill();
    }
    this.processes.clear();
  }
  
  isBooted() {
    return this.instance !== null;
  }
  
  async teardown() {
    if (this.instance) {
      this.killAllProcesses();
      await this.instance.teardown();
      this.instance = null;
      this.serverUrl = null;
      console.log('🛑 WebContainer torn down');
    }
  }
}

export const webContainer = new WebContainerService();
