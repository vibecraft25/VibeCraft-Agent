# Task 10: Supporting 모듈 구현

## 목표
Error Handler, Logger, File Manager 등 지원 모듈들을 구현합니다.

## 작업 내용

### 10.1 Error Handler 구현
```typescript
// src/utils/error-handler.ts
export enum ErrorCode {
  // CLI 에러
  INVALID_ARGS = 'INVALID_ARGS',
  MISSING_REQUIRED_ARG = 'MISSING_REQUIRED_ARG',
  
  // 파일 시스템 에러
  FILE_NOT_FOUND = 'FILE_NOT_FOUND',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  DIRECTORY_NOT_EMPTY = 'DIRECTORY_NOT_EMPTY',
  
  // SQLite 에러
  SQLITE_CONNECTION_FAILED = 'SQLITE_CONNECTION_FAILED',
  INVALID_SQLITE_FILE = 'INVALID_SQLITE_FILE',
  SCHEMA_EXTRACTION_FAILED = 'SCHEMA_EXTRACTION_FAILED',
  
  // Gemini CLI 에러
  GEMINI_NOT_FOUND = 'GEMINI_NOT_FOUND',
  GEMINI_EXECUTION_FAILED = 'GEMINI_EXECUTION_FAILED',
  GEMINI_TIMEOUT = 'GEMINI_TIMEOUT',
  
  // MCP 에러
  MCP_SERVER_NOT_FOUND = 'MCP_SERVER_NOT_FOUND',
  MCP_CONNECTION_FAILED = 'MCP_CONNECTION_FAILED',
  
  // 검증 에러
  VALIDATION_FAILED = 'VALIDATION_FAILED',
  OUTPUT_INCOMPLETE = 'OUTPUT_INCOMPLETE',
  
  // 기타
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

export class VibeCraftError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public details?: any,
    public suggestion?: string
  ) {
    super(message);
    this.name = 'VibeCraftError';
  }
}

export class ErrorHandler {
  static handle(error: any): ErrorInfo {
    if (error instanceof VibeCraftError) {
      return {
        code: error.code,
        message: error.message,
        details: error.details,
        suggestion: error.suggestion
      };
    }
    
    // 일반 에러 매핑
    const errorInfo = this.mapError(error);
    return errorInfo;
  }
  
  private static mapError(error: any): ErrorInfo {
    const message = error.message || 'Unknown error occurred';
    
    // Node.js 파일 시스템 에러
    if (error.code === 'ENOENT') {
      return {
        code: ErrorCode.FILE_NOT_FOUND,
        message: 'File or directory not found',
        details: error.path,
        suggestion: 'Check if the file path is correct'
      };
    }
    
    if (error.code === 'EACCES') {
      return {
        code: ErrorCode.PERMISSION_DENIED,
        message: 'Permission denied',
        details: error.path,
        suggestion: 'Check file permissions or run with appropriate privileges'
      };
    }
    
    if (error.code === 'ENOTEMPTY') {
      return {
        code: ErrorCode.DIRECTORY_NOT_EMPTY,
        message: 'Directory is not empty',
        details: error.path,
        suggestion: 'Use an empty directory or clear the existing one'
      };
    }
    
    // SQLite 에러
    if (message.includes('SQLITE_CANTOPEN')) {
      return {
        code: ErrorCode.SQLITE_CONNECTION_FAILED,
        message: 'Cannot open SQLite database',
        suggestion: 'Verify the SQLite file exists and is accessible'
      };
    }
    
    // Gemini CLI 에러
    if (message.includes('gemini: command not found')) {
      return {
        code: ErrorCode.GEMINI_NOT_FOUND,
        message: 'Gemini CLI is not installed',
        suggestion: 'Install Gemini CLI: npm install -g @google/gemini-cli'
      };
    }
    
    if (message.includes('timeout')) {
      return {
        code: ErrorCode.GEMINI_TIMEOUT,
        message: 'Operation timed out',
        suggestion: 'Try increasing the timeout or simplifying the request'
      };
    }
    
    // MCP 에러
    if (message.includes('MCP server')) {
      return {
        code: ErrorCode.MCP_CONNECTION_FAILED,
        message: 'Failed to connect to MCP server',
        suggestion: 'Check MCP_SERVER_PATH environment variable'
      };
    }
    
    // 기본 에러
    return {
      code: ErrorCode.UNKNOWN_ERROR,
      message,
      details: error.stack
    };
  }
  
  static createUserFriendlyMessage(errorInfo: ErrorInfo): string {
    let message = `❌ Error: ${errorInfo.message}`;
    
    if (errorInfo.details) {
      message += `\n   Details: ${errorInfo.details}`;
    }
    
    if (errorInfo.suggestion) {
      message += `\n   💡 Suggestion: ${errorInfo.suggestion}`;
    }
    
    return message;
  }
}

interface ErrorInfo {
  code: ErrorCode;
  message: string;
  details?: any;
  suggestion?: string;
}
```

### 10.2 Logger 구현
```typescript
// src/utils/logger.ts
import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
  TRACE = 4
}

export interface LoggerConfig {
  level: LogLevel;
  console: boolean;
  file?: string;
  timestamp: boolean;
  colorize: boolean;
}

export class Logger {
  private config: LoggerConfig;
  private static instance: Logger;
  
  private constructor(config?: Partial<LoggerConfig>) {
    this.config = {
      level: LogLevel.INFO,
      console: true,
      timestamp: true,
      colorize: true,
      ...config
    };
    
    if (this.config.file) {
      fs.ensureDirSync(path.dirname(this.config.file));
    }
  }
  
  static getInstance(config?: Partial<LoggerConfig>): Logger {
    if (!this.instance) {
      this.instance = new Logger(config);
    }
    return this.instance;
  }
  
  error(message: string, ...args: any[]): void {
    this.log(LogLevel.ERROR, message, ...args);
  }
  
  warn(message: string, ...args: any[]): void {
    this.log(LogLevel.WARN, message, ...args);
  }
  
  info(message: string, ...args: any[]): void {
    this.log(LogLevel.INFO, message, ...args);
  }
  
  debug(message: string, ...args: any[]): void {
    this.log(LogLevel.DEBUG, message, ...args);
  }
  
  trace(message: string, ...args: any[]): void {
    this.log(LogLevel.TRACE, message, ...args);
  }
  
  private log(level: LogLevel, message: string, ...args: any[]): void {
    if (level > this.config.level) return;
    
    const timestamp = this.config.timestamp 
      ? new Date().toISOString() 
      : '';
    
    const levelName = LogLevel[level];
    const formattedMessage = this.formatMessage(level, levelName, message, timestamp);
    
    // 콘솔 출력
    if (this.config.console) {
      if (this.config.colorize) {
        console.log(this.colorize(level, formattedMessage), ...args);
      } else {
        console.log(formattedMessage, ...args);
      }
    }
    
    // 파일 출력
    if (this.config.file) {
      const fileMessage = `${timestamp} [${levelName}] ${message} ${args.join(' ')}\n`;
      fs.appendFileSync(this.config.file, fileMessage);
    }
  }
  
  private formatMessage(
    level: LogLevel,
    levelName: string,
    message: string,
    timestamp: string
  ): string {
    if (this.config.timestamp) {
      return `${timestamp} [${levelName}] ${message}`;
    }
    return `[${levelName}] ${message}`;
  }
  
  private colorize(level: LogLevel, message: string): string {
    switch (level) {
      case LogLevel.ERROR:
        return chalk.red(message);
      case LogLevel.WARN:
        return chalk.yellow(message);
      case LogLevel.INFO:
        return chalk.blue(message);
      case LogLevel.DEBUG:
        return chalk.gray(message);
      case LogLevel.TRACE:
        return chalk.dim(message);
      default:
        return message;
    }
  }
  
  createChild(prefix: string): ChildLogger {
    return new ChildLogger(this, prefix);
  }
}

export class ChildLogger {
  constructor(
    private parent: Logger,
    private prefix: string
  ) {}
  
  error(message: string, ...args: any[]): void {
    this.parent.error(`[${this.prefix}] ${message}`, ...args);
  }
  
  warn(message: string, ...args: any[]): void {
    this.parent.warn(`[${this.prefix}] ${message}`, ...args);
  }
  
  info(message: string, ...args: any[]): void {
    this.parent.info(`[${this.prefix}] ${message}`, ...args);
  }
  
  debug(message: string, ...args: any[]): void {
    this.parent.debug(`[${this.prefix}] ${message}`, ...args);
  }
  
  trace(message: string, ...args: any[]): void {
    this.parent.trace(`[${this.prefix}] ${message}`, ...args);
  }
}
```

### 10.3 File Manager 구현
```typescript
// src/utils/file-manager.ts
import fs from 'fs-extra';
import path from 'path';
import crypto from 'crypto';

export class FileManager {
  static async ensureDirectory(dirPath: string): Promise<void> {
    await fs.ensureDir(dirPath);
  }
  
  static async copyFile(src: string, dest: string): Promise<void> {
    await fs.copy(src, dest);
  }
  
  static async moveFile(src: string, dest: string): Promise<void> {
    await fs.move(src, dest);
  }
  
  static async deleteFile(filePath: string): Promise<void> {
    await fs.remove(filePath);
  }
  
  static async readJson(filePath: string): Promise<any> {
    return await fs.readJson(filePath);
  }
  
  static async writeJson(filePath: string, data: any): Promise<void> {
    await fs.writeJson(filePath, data, { spaces: 2 });
  }
  
  static async readText(filePath: string): Promise<string> {
    return await fs.readFile(filePath, 'utf-8');
  }
  
  static async writeText(filePath: string, content: string): Promise<void> {
    await fs.writeFile(filePath, content, 'utf-8');
  }
  
  static async exists(filePath: string): Promise<boolean> {
    return await fs.pathExists(filePath);
  }
  
  static async isEmpty(dirPath: string): Promise<boolean> {
    const files = await fs.readdir(dirPath);
    return files.filter(f => !f.startsWith('.')).length === 0;
  }
  
  static async createTempDirectory(prefix: string = 'vibecraft'): Promise<string> {
    const tmpDir = path.join(process.env.TMPDIR || '/tmp', `${prefix}-${Date.now()}`);
    await fs.ensureDir(tmpDir);
    return tmpDir;
  }
  
  static async cleanDirectory(dirPath: string): Promise<void> {
    const files = await fs.readdir(dirPath);
    for (const file of files) {
      if (!file.startsWith('.')) {
        await fs.remove(path.join(dirPath, file));
      }
    }
  }
  
  static async calculateFileHash(filePath: string): Promise<string> {
    const content = await fs.readFile(filePath);
    return crypto.createHash('sha256').update(content).digest('hex');
  }
  
  static async getFileSize(filePath: string): Promise<number> {
    const stats = await fs.stat(filePath);
    return stats.size;
  }
  
  static async getDirectorySize(dirPath: string): Promise<number> {
    let totalSize = 0;
    
    const walkDir = async (dir: string): Promise<void> => {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory()) {
          await walkDir(fullPath);
        } else {
          const stats = await fs.stat(fullPath);
          totalSize += stats.size;
        }
      }
    };
    
    await walkDir(dirPath);
    return totalSize;
  }
  
  static formatFileSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(2)} ${units[unitIndex]}`;
  }
}
```

### 10.4 Configuration Manager 구현
```typescript
// src/utils/config-manager.ts
import fs from 'fs-extra';
import path from 'path';
import os from 'os';

export interface VibeCraftConfig {
  defaultOutputDir: string;
  defaultTimeout: number;
  mcpServerPath?: string;
  geminiPath?: string;
  logLevel: string;
  telemetry: boolean;
}

export class ConfigManager {
  private static CONFIG_FILE = '.vibecraftrc.json';
  private static GLOBAL_CONFIG_PATH = path.join(os.homedir(), this.CONFIG_FILE);
  
  static async loadConfig(): Promise<Partial<VibeCraftConfig>> {
    const configs: Partial<VibeCraftConfig>[] = [];
    
    // 1. 기본 설정
    configs.push(this.getDefaultConfig());
    
    // 2. 전역 설정
    if (await fs.pathExists(this.GLOBAL_CONFIG_PATH)) {
      const globalConfig = await fs.readJson(this.GLOBAL_CONFIG_PATH);
      configs.push(globalConfig);
    }
    
    // 3. 로컬 설정
    const localConfigPath = path.join(process.cwd(), this.CONFIG_FILE);
    if (await fs.pathExists(localConfigPath)) {
      const localConfig = await fs.readJson(localConfigPath);
      configs.push(localConfig);
    }
    
    // 4. 환경 변수
    configs.push(this.getEnvConfig());
    
    // 설정 병합 (후순위가 우선)
    return configs.reduce((merged, config) => ({ ...merged, ...config }), {});
  }
  
  static async saveConfig(config: Partial<VibeCraftConfig>, global: boolean = false): Promise<void> {
    const configPath = global ? this.GLOBAL_CONFIG_PATH : path.join(process.cwd(), this.CONFIG_FILE);
    
    // 기존 설정 읽기
    let existingConfig = {};
    if (await fs.pathExists(configPath)) {
      existingConfig = await fs.readJson(configPath);
    }
    
    // 병합 및 저장
    const updatedConfig = { ...existingConfig, ...config };
    await fs.writeJson(configPath, updatedConfig, { spaces: 2 });
  }
  
  private static getDefaultConfig(): VibeCraftConfig {
    return {
      defaultOutputDir: './output',
      defaultTimeout: 300000, // 5분
      logLevel: 'info',
      telemetry: false
    };
  }
  
  private static getEnvConfig(): Partial<VibeCraftConfig> {
    const config: Partial<VibeCraftConfig> = {};
    
    if (process.env.VIBECRAFT_OUTPUT_DIR) {
      config.defaultOutputDir = process.env.VIBECRAFT_OUTPUT_DIR;
    }
    
    if (process.env.VIBECRAFT_TIMEOUT) {
      config.defaultTimeout = parseInt(process.env.VIBECRAFT_TIMEOUT, 10);
    }
    
    if (process.env.MCP_SERVER_PATH) {
      config.mcpServerPath = process.env.MCP_SERVER_PATH;
    }
    
    if (process.env.VIBECRAFT_LOG_LEVEL) {
      config.logLevel = process.env.VIBECRAFT_LOG_LEVEL;
    }
    
    return config;
  }
}
```

### 10.5 Progress Tracker 구현
```typescript
// src/utils/progress-tracker.ts
import ora, { Ora } from 'ora';
import chalk from 'chalk';

export class ProgressTracker {
  private spinner: Ora | null = null;
  private steps: ProgressStep[] = [];
  private currentStep: number = -1;
  
  constructor(private silent: boolean = false) {}
  
  addStep(name: string, description?: string): void {
    this.steps.push({
      name,
      description,
      status: 'pending',
      startTime: null,
      endTime: null
    });
  }
  
  start(message?: string): void {
    if (this.silent) return;
    
    this.spinner = ora({
      text: message || 'Starting...',
      spinner: 'dots'
    }).start();
  }
  
  nextStep(): void {
    if (this.currentStep >= 0 && this.currentStep < this.steps.length) {
      this.completeCurrentStep();
    }
    
    this.currentStep++;
    if (this.currentStep < this.steps.length) {
      const step = this.steps[this.currentStep];
      step.status = 'running';
      step.startTime = Date.now();
      
      if (!this.silent) {
        const progress = `[${this.currentStep + 1}/${this.steps.length}]`;
        const message = `${progress} ${step.name}`;
        
        if (this.spinner) {
          this.spinner.text = message;
        } else {
          console.log(chalk.blue(message));
        }
      }
    }
  }
  
  private completeCurrentStep(): void {
    if (this.currentStep >= 0 && this.currentStep < this.steps.length) {
      const step = this.steps[this.currentStep];
      step.status = 'completed';
      step.endTime = Date.now();
      
      if (!this.silent && this.spinner) {
        const duration = step.endTime - step.startTime!;
        this.spinner.succeed(`${step.name} (${this.formatDuration(duration)})`);
        this.spinner = ora().start();
      }
    }
  }
  
  succeed(message?: string): void {
    this.completeCurrentStep();
    
    if (!this.silent && this.spinner) {
      this.spinner.succeed(message || 'Completed successfully');
      this.spinner = null;
    }
  }
  
  fail(message?: string): void {
    if (this.currentStep >= 0 && this.currentStep < this.steps.length) {
      this.steps[this.currentStep].status = 'failed';
    }
    
    if (!this.silent && this.spinner) {
      this.spinner.fail(message || 'Failed');
      this.spinner = null;
    }
  }
  
  update(message: string): void {
    if (!this.silent && this.spinner) {
      this.spinner.text = message;
    }
  }
  
  getSummary(): ProgressSummary {
    const completed = this.steps.filter(s => s.status === 'completed').length;
    const failed = this.steps.filter(s => s.status === 'failed').length;
    const totalDuration = this.steps.reduce((sum, step) => {
      if (step.startTime && step.endTime) {
        return sum + (step.endTime - step.startTime);
      }
      return sum;
    }, 0);
    
    return {
      total: this.steps.length,
      completed,
      failed,
      success: failed === 0,
      totalDuration
    };
  }
  
  private formatDuration(ms: number): string {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
  }
}

interface ProgressStep {
  name: string;
  description?: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startTime: number | null;
  endTime: number | null;
}

interface ProgressSummary {
  total: number;
  completed: number;
  failed: number;
  success: boolean;
  totalDuration: number;
}
```

## 완료 기준
- [ ] Error Handler 구현
- [ ] Logger 시스템 구현
- [ ] File Manager 유틸리티
- [ ] Configuration Manager
- [ ] Progress Tracker
- [ ] 단위 테스트 작성