import { ChildProcess } from 'child_process';

export class ProcessManager {
  private static instance: ProcessManager;
  private processes: Map<string, ChildProcess>;
  
  private constructor() {
    this.processes = new Map();
    
    // 프로세스 종료 시 정리
    process.on('exit', () => this.cleanup());
    process.on('SIGINT', () => this.cleanup());
    process.on('SIGTERM', () => this.cleanup());
  }
  
  static getInstance(): ProcessManager {
    if (!this.instance) {
      this.instance = new ProcessManager();
    }
    return this.instance;
  }
  
  register(id: string, process: ChildProcess): void {
    this.processes.set(id, process);
  }
  
  unregister(id: string): void {
    this.processes.delete(id);
  }
  
  kill(id: string, signal: NodeJS.Signals = 'SIGTERM'): boolean {
    const process = this.processes.get(id);
    if (process) {
      process.kill(signal);
      this.processes.delete(id);
      return true;
    }
    return false;
  }
  
  killAll(signal: NodeJS.Signals = 'SIGTERM'): void {
    for (const [id, process] of this.processes) {
      process.kill(signal);
    }
    this.processes.clear();
  }
  
  private cleanup(): void {
    this.killAll('SIGKILL');
  }
}