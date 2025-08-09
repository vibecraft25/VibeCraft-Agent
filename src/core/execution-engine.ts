import { ChildProcess, spawn, exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs-extra';
import { EventEmitter } from 'events';
import { glob } from 'glob';

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
  private geminiPath: string = 'gemini';
  
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
      const isWindows = process.platform === 'win32';
      
      // First, try to find gemini using system command
      try {
        const findCommand = isWindows ? 'where gemini' : 'which gemini';
        const { stdout: whichPath } = await execAsync(findCommand);
        const geminiPath = whichPath.trim().split('\n')[0]; // Take first result on Windows
        if (geminiPath) {
          const { stdout: version } = await execAsync(`"${geminiPath}" --version`);
          this.geminiPath = geminiPath;
          console.log(`Found Gemini CLI at: ${geminiPath}`);
          return;
        }
      } catch {
        // If system command fails, try glob patterns
      }

      // Use glob patterns to find gemini executable
      const globPatterns: string[] = [];
      
      if (isWindows) {
        // Windows glob patterns with flexible depth
        const userProfile = process.env.USERPROFILE || process.env.HOME;
        if (userProfile) {
          globPatterns.push(
            // AppData - flexible patterns
            `${userProfile}/AppData/**/gemini.{cmd,exe,bat}`,
            `${userProfile}/AppData/**/gemini`,
            
            // User profile patterns
            `${userProfile}/**/bin/gemini.{cmd,exe,bat}`,
            `${userProfile}/.npm*/**/gemini.{cmd,exe,bat}`
          );
        }
        
        // Multiple users support
        globPatterns.push(
          'C:/Users/*/AppData/**/gemini.{cmd,exe,bat}',
          'C:/Users/*/AppData/**/gemini',
          
          // Program Files - any variant, any depth
          'C:/Program Files*/**/gemini.{cmd,exe,bat}',
          'C:/Program Files*/**/gemini',
          
          // Common Node.js paths with wildcards
          'C:/**/nodejs*/bin/gemini.{cmd,exe,bat}',
          'C:/**/npm*/bin/gemini.{cmd,exe,bat}',
          
          // Chocolatey, Scoop, other package managers
          'C:/ProgramData/chocolatey/**/gemini.{cmd,exe,bat}',
          'C:/Users/*/scoop/**/gemini.{cmd,exe,bat}'
        );
      } else {
        // Unix-like glob patterns with flexible wildcards
        const home = process.env.HOME;
        if (home) {
          globPatterns.push(
            // Home directory patterns with mixed wildcards
            `${home}/.local/**/gemini`,
            `${home}/bin/gemini`,
            `${home}/.npm*/**/gemini`,
            
            // Version managers - any version
            `${home}/.nvm/versions/node/*/bin/gemini`,
            `${home}/.nvm/**/gemini`,
            `${home}/.n/versions/node/*/bin/gemini`,
            `${home}/.volta/bin/gemini`,
            
            // Package managers
            `${home}/.yarn/*/gemini`,
            `${home}/.pnpm/*/gemini`
          );
        }
        
        globPatterns.push(
          // Standard locations
          '/usr/local/bin/gemini',
          '/usr/bin/gemini',
          
          // macOS specific
          '/opt/homebrew/*/gemini',
          '/opt/homebrew/**/bin/gemini',
          
          // Linux package managers
          '/snap/*/current/**/gemini',
          '/var/lib/flatpak/**/gemini',
          
          // Common installation paths with wildcards
          '/opt/node*/bin/gemini',
          '/usr/local/node*/bin/gemini',
          '/usr/local/lib/node_modules/*/bin/gemini'
        );
      }

      // Add npm global path pattern
      try {
        const { stdout: npmPrefix } = await execAsync('npm config get prefix');
        const prefix = npmPrefix.trim();
        if (isWindows) {
          globPatterns.unshift(`${prefix}/gemini.{cmd,exe,bat}`);
          globPatterns.unshift(`${prefix}/gemini`);
        } else {
          globPatterns.unshift(`${prefix}/bin/gemini`);
        }
      } catch {
        // Continue without npm prefix
      }
      
      // Search using glob patterns
      for (const pattern of globPatterns) {
        try {
          const matches = await glob(pattern, { 
            windowsPathsNoEscape: true,
            absolute: true 
          });
          
          for (const matchPath of matches) {
            try {
              const command = matchPath.includes(' ') ? `"${matchPath}" --version` : `${matchPath} --version`;
              const { stdout } = await execAsync(command);
              if (stdout) {
                this.geminiPath = matchPath;
                console.log(`Found Gemini CLI at: ${matchPath}`);
                return;
              }
            } catch {
              // Try next match
            }
          }
        } catch {
          // Continue with next pattern
        }
      }
      
      // Fallback to direct command
      const directCommands = ['gemini', 'gemini.cmd', 'gemini.exe'];
      for (const cmd of directCommands) {
        try {
          const { stdout } = await execAsync(`${cmd} --version`);
          if (stdout) {
            this.geminiPath = cmd;
            console.log(`Found Gemini CLI as: ${cmd}`);
            return;
          }
        } catch {
          // Try next command
        }
      }
      
      throw new Error('Gemini CLI not found. Please ensure it is installed and accessible in PATH.');
    } catch (error) {
      throw new Error(
        'Gemini CLI not found. Please install it first.\n' +
        'Installation guide: https://github.com/[gemini-cli-repo]\n' +
        'After installation, make sure "gemini" command works in your terminal.'
      );
    }
  }
  
  private async prepareWorkspace(workspaceDir: string): Promise<void> {
    // 작업 디렉토리 생성
    await fs.ensureDir(workspaceDir);
    
    // 기존 파일 확인 (VibeCraft가 생성한 .gemini와 public 폴더는 허용)
    const existingFiles = await fs.readdir(workspaceDir);
    const allowedFiles = ['.gemini', 'public'];
    const hasDisallowedFiles = existingFiles.some(file => 
      !file.startsWith('.') && !allowedFiles.includes(file)
    );
    
    if (hasDisallowedFiles) {
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
      
      const geminiProcess = spawn(this.geminiPath, args, {
        cwd: config.workspaceDir,
        env,
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: true  // Use shell to ensure PATH is properly resolved
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
      
      // stdout 처리 - 실시간 출력
      geminiProcess.stdout.on('data', (data) => {
        const message = data.toString();
        if (message.trim()) {
          logs.push(this.createLog('info', message.trim()));
          this.updateProcessStatus(geminiProcess.pid!, message.trim());
          this.emit('progress', { processId: geminiProcess.pid!, message: message.trim() });
        }
        // 실시간 출력 (줄바꿈 유지)
        if (config.debug) {
          process.stdout.write(message);
        }
      });
      
      // stderr 처리 - 실시간 출력
      geminiProcess.stderr.on('data', (data) => {
        const message = data.toString();
        if (message.trim()) {
          // MCP 서버 연결 실패는 경고가 아닌 정보로 처리 (Gemini CLI가 계속 진행함)
          const logLevel = message.includes('failed to start or connect to MCP server') ? 'info' : 'warn';
          logs.push(this.createLog(logLevel, message.trim()));
          
          if (logLevel === 'warn') {
            this.emit('error', { processId: geminiProcess.pid!, message: message.trim() });
          }
        }
        // 실시간 출력 (줄바꿈 유지)
        if (config.debug) {
          process.stderr.write(message);
        }
      });
      
      // 타임아웃 설정
      let timeoutHandle: NodeJS.Timeout | undefined;
      if (config.timeout && config.timeout > 0) {
        timeoutHandle = setTimeout(() => {
          logs.push(this.createLog('error', `Process timed out after ${config.timeout}ms`));
          geminiProcess.kill('SIGTERM');
          reject(new Error(`Gemini CLI timed out after ${config.timeout}ms`));
        }, config.timeout);
      }
      
      // 프로세스 종료 처리
      geminiProcess.on('close', (code) => {
        // 타임아웃 핸들러 정리
        if (timeoutHandle) {
          clearTimeout(timeoutHandle);
        }
        this.activeProcesses.delete(geminiProcess.pid!);
        
        // 모든 이벤트 리스너 제거
        this.removeAllListeners('progress');
        this.removeAllListeners('error');
        this.removeAllListeners('cancelled');
        
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
            logs.push(this.createLog('error', `Execution timeout after ${config.timeout}ms`));
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