import { ChildProcess, spawn, exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs-extra';
import { EventEmitter } from 'events';

const execAsync = promisify(exec);

export interface IExecutionEngine {
  execute(config: ExecutionConfig): Promise<ExecutionResult>;
  monitorExecution(processId: number): ExecutionStatus;
  cancelExecution(processId: number): void;
}

export interface ExecutionConfig {
  workspaceDir: string;
  prompt: string;           // 프롬프트 텍스트 직접 전달
  settingsDir: string;
  model?: string;           // 기본값: 'gemini-2.5-pro'
  timeout?: number;
  debug?: boolean;
  autoApprove?: boolean;    // -y 옵션 (기본값: true)
  checkpointing?: boolean;  // -c 옵션
}

export interface ExecutionResult {
  success: boolean;
  outputPath: string;
  executionTime: number;
  logs: LogEntry[];
  error?: ErrorInfo;
  generatedFiles: string[];
}

export interface ExecutionStatus {
  processId: number;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  progress?: number;
  currentOperation?: string;
}

export interface LogEntry {
  timestamp: Date;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  details?: any;
}

export interface ErrorInfo {
  code: string;
  message: string;
  stack?: string;
  details?: any;
}

export class ExecutionEngine extends EventEmitter implements IExecutionEngine {
  private activeProcesses: Map<number, ChildProcess>;
  private processStatuses: Map<number, ExecutionStatus>;
  
  constructor() {
    super();
    this.activeProcesses = new Map();
    this.processStatuses = new Map();
  }
  
  async execute(config: ExecutionConfig): Promise<ExecutionResult> {
    const startTime = Date.now();
    const logs: LogEntry[] = [];
    
    try {
      // 1. Gemini CLI 존재 확인
      await this.verifyGeminiCLI();
      logs.push(this.createLog('info', 'Gemini CLI verified'));
      
      // 2. 작업 디렉토리 준비
      await this.prepareWorkspace(config.workspaceDir);
      logs.push(this.createLog('info', 'Workspace prepared'));
      
      // 3. 프롬프트 확인
      if (!config.prompt || config.prompt.trim().length === 0) {
        throw new Error('Prompt is empty');
      }
      
      // 4. Gemini CLI 실행
      logs.push(this.createLog('info', 'Starting Gemini CLI execution'));
      const processResult = await this.runGeminiCLI(config, logs);
      
      // 5. 생성된 파일 목록 수집
      const generatedFiles = await this.collectGeneratedFiles(config.workspaceDir);
      logs.push(this.createLog('info', `Generated ${generatedFiles.length} files`));
      
      return {
        success: true,
        outputPath: config.workspaceDir,
        executionTime: Date.now() - startTime,
        logs,
        generatedFiles
      };
      
    } catch (error: any) {
      logs.push(this.createLog('error', 'Execution failed', error));
      
      return {
        success: false,
        outputPath: config.workspaceDir,
        executionTime: Date.now() - startTime,
        logs,
        error: this.createErrorInfo(error),
        generatedFiles: []
      };
    }
  }
  
  private async verifyGeminiCLI(): Promise<void> {
    try {
      const { stdout } = await execAsync('gemini --version');
      if (!stdout.includes('gemini')) {
        throw new Error('Invalid Gemini CLI installation');
      }
    } catch (error) {
      throw new Error('Gemini CLI not found. Please install it first.');
    }
  }
  
  private async prepareWorkspace(workspaceDir: string): Promise<void> {
    // 작업 디렉토리 생성
    await fs.ensureDir(workspaceDir);
    
    // 기존 파일 확인
    const existingFiles = await fs.readdir(workspaceDir);
    if (existingFiles.length > 0 && !existingFiles.every(f => f.startsWith('.'))) {
      throw new Error('Workspace directory is not empty. Please provide an empty directory.');
    }
  }
  
  private async runGeminiCLI(
    config: ExecutionConfig,
    logs: LogEntry[]
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      // 긴 프롬프트는 stdin으로, 짧은 추가 지시는 -p로
      const useStdin = config.prompt.length > 1000;
      
      const args = [];
      
      // 모델 지정
      if (config.model) {
        args.push('-m', config.model);
      }
      
      // stdin을 사용하지 않는 경우에만 -p 옵션 사용
      if (!useStdin) {
        args.push('-p', config.prompt);
      }
      
      // 자동 승인 모드 (프로덕션에서는 필수)
      if (config.autoApprove !== false) {
        args.push('-y');
      }
      
      // 디버그 모드
      if (config.debug) {
        args.push('-d');
      }
      
      // 체크포인팅
      if (config.checkpointing) {
        args.push('-c');
      }
      
      const env = {
        ...process.env,
        GEMINI_SETTINGS_DIR: config.settingsDir
      };
      
      const geminiProcess = spawn('gemini', args, {
        cwd: config.workspaceDir,
        env,
        stdio: ['pipe', 'pipe', 'pipe']
      });
      
      // 프로세스 등록
      this.activeProcesses.set(geminiProcess.pid!, geminiProcess);
      this.processStatuses.set(geminiProcess.pid!, {
        processId: geminiProcess.pid!,
        status: 'running',
        currentOperation: 'Initializing'
      });
      
      // stdin으로 프롬프트 전달
      if (useStdin) {
        geminiProcess.stdin.write(config.prompt);
        geminiProcess.stdin.end();
      }
      
      // stdout 처리
      geminiProcess.stdout.on('data', (data) => {
        const message = data.toString().trim();
        if (message) {
          logs.push(this.createLog('info', message));
          this.updateProcessStatus(geminiProcess.pid!, message);
          this.emit('progress', { processId: geminiProcess.pid!, message });
        }
      });
      
      // stderr 처리
      geminiProcess.stderr.on('data', (data) => {
        const message = data.toString().trim();
        if (message) {
          logs.push(this.createLog('warn', message));
        }
      });
      
      // 프로세스 종료 처리
      geminiProcess.on('close', (code) => {
        this.activeProcesses.delete(geminiProcess.pid!);
        
        if (code === 0) {
          this.processStatuses.set(geminiProcess.pid!, {
            processId: geminiProcess.pid!,
            status: 'completed',
            progress: 100
          });
          resolve();
        } else {
          this.processStatuses.set(geminiProcess.pid!, {
            processId: geminiProcess.pid!,
            status: 'failed'
          });
          reject(new Error(`Gemini CLI exited with code ${code}`));
        }
      });
      
      // 에러 처리
      geminiProcess.on('error', (error) => {
        this.activeProcesses.delete(geminiProcess.pid!);
        this.processStatuses.set(geminiProcess.pid!, {
          processId: geminiProcess.pid!,
          status: 'failed'
        });
        reject(error);
      });
      
      // 타임아웃 설정
      if (config.timeout) {
        setTimeout(() => {
          if (this.activeProcesses.has(geminiProcess.pid!)) {
            geminiProcess.kill('SIGTERM');
            reject(new Error('Execution timeout'));
          }
        }, config.timeout);
      }
    });
  }
  
  private updateProcessStatus(processId: number, message: string): void {
    const status = this.processStatuses.get(processId);
    if (!status) return;
    
    // 메시지에서 진행 상황 추출
    if (message.includes('Generating')) {
      status.currentOperation = 'Generating code';
      status.progress = 30;
    } else if (message.includes('Creating')) {
      status.currentOperation = 'Creating files';
      status.progress = 60;
    } else if (message.includes('Installing')) {
      status.currentOperation = 'Installing dependencies';
      status.progress = 80;
    } else if (message.includes('Complete')) {
      status.currentOperation = 'Finalizing';
      status.progress = 90;
    }
    
    this.processStatuses.set(processId, status);
  }
  
  private async collectGeneratedFiles(workspaceDir: string): Promise<string[]> {
    const files: string[] = [];
    
    const walkDir = async (dir: string, prefix: string = ''): Promise<void> => {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        const relativePath = path.join(prefix, entry.name);
        
        if (entry.isDirectory() && !entry.name.startsWith('.')) {
          await walkDir(fullPath, relativePath);
        } else if (entry.isFile() && !entry.name.startsWith('.')) {
          files.push(relativePath);
        }
      }
    };
    
    await walkDir(workspaceDir);
    return files;
  }
  
  monitorExecution(processId: number): ExecutionStatus {
    const status = this.processStatuses.get(processId);
    
    if (!status) {
      return {
        processId,
        status: 'failed',
        currentOperation: 'Process not found'
      };
    }
    
    return status;
  }
  
  cancelExecution(processId: number): void {
    const process = this.activeProcesses.get(processId);
    
    if (process) {
      process.kill('SIGTERM');
      this.activeProcesses.delete(processId);
      this.processStatuses.set(processId, {
        processId,
        status: 'cancelled'
      });
      
      this.emit('cancelled', { processId });
    }
  }
  
  private createLog(
    level: LogEntry['level'], 
    message: string, 
    details?: any
  ): LogEntry {
    return {
      timestamp: new Date(),
      level,
      message,
      details
    };
  }
  
  private createErrorInfo(error: any): ErrorInfo {
    return {
      code: error.code || 'EXECUTION_ERROR',
      message: error.message || 'Unknown error',
      stack: error.stack,
      details: error.details
    };
  }
}