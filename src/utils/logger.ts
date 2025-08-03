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
  
  static resetInstance(): void {
    this.instance = undefined as any;
  }
  
  updateConfig(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };
    
    if (this.config.file) {
      try {
        fs.ensureDirSync(path.dirname(this.config.file));
      } catch (error) {
        // If directory creation fails, disable file logging
        console.error('Failed to create log directory:', error);
        this.config.file = undefined;
      }
    }
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
      const consoleArgs = args.length > 0 ? args : [];
      
      if (this.config.colorize) {
        console.log(this.colorize(level, formattedMessage), ...consoleArgs);
      } else {
        console.log(formattedMessage, ...consoleArgs);
      }
    }
    
    // 파일 출력
    if (this.config.file) {
      const argsStr = args.length > 0 
        ? ' ' + args.map(arg => {
            if (typeof arg === 'object') {
              try {
                return JSON.stringify(arg);
              } catch {
                return String(arg);
              }
            }
            return String(arg);
          }).join(' ')
        : '';
      
      const fileMessage = `${timestamp} [${levelName}] ${message}${argsStr}\n`;
      
      try {
        fs.appendFileSync(this.config.file, fileMessage);
      } catch (error) {
        // 파일 쓰기 실패 시 콘솔에 경고
        if (this.config.console) {
          console.error('Failed to write to log file:', error);
        }
      }
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
  
  getConfig(): LoggerConfig {
    return { ...this.config };
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

// Helper function to parse log level from string
export function parseLogLevel(level: string): LogLevel {
  const upperLevel = level.toUpperCase();
  
  switch (upperLevel) {
    case 'ERROR':
      return LogLevel.ERROR;
    case 'WARN':
    case 'WARNING':
      return LogLevel.WARN;
    case 'INFO':
      return LogLevel.INFO;
    case 'DEBUG':
      return LogLevel.DEBUG;
    case 'TRACE':
      return LogLevel.TRACE;
    default:
      return LogLevel.INFO;
  }
}