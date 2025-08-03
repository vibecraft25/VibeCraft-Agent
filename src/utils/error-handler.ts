import { ErrorInfo } from '../types';

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
        stack: error.stack
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
        details: { path: error.path, syscall: error.syscall }
      };
    }
    
    if (error.code === 'EACCES') {
      return {
        code: ErrorCode.PERMISSION_DENIED,
        message: 'Permission denied',
        details: { path: error.path, syscall: error.syscall }
      };
    }
    
    if (error.code === 'ENOTEMPTY') {
      return {
        code: ErrorCode.DIRECTORY_NOT_EMPTY,
        message: 'Directory is not empty',
        details: { path: error.path }
      };
    }
    
    // SQLite 에러
    if (message.includes('SQLITE_CANTOPEN')) {
      return {
        code: ErrorCode.SQLITE_CONNECTION_FAILED,
        message: 'Cannot open SQLite database',
        details: { originalError: message }
      };
    }
    
    // Gemini CLI 에러
    if (message.includes('gemini: command not found') || message.includes('gemini is not recognized')) {
      return {
        code: ErrorCode.GEMINI_NOT_FOUND,
        message: 'Gemini CLI is not installed',
        details: { suggestion: 'Install Gemini CLI: npm install -g @google/gemini-cli' }
      };
    }
    
    if (message.includes('timeout')) {
      return {
        code: ErrorCode.GEMINI_TIMEOUT,
        message: 'Operation timed out',
        details: { originalError: message }
      };
    }
    
    // MCP 에러
    if (message.includes('MCP server') || message.includes('mcp-server-sqlite')) {
      return {
        code: ErrorCode.MCP_CONNECTION_FAILED,
        message: 'Failed to connect to MCP server',
        details: { originalError: message }
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
      // details가 객체인 경우 포맷팅
      if (typeof errorInfo.details === 'object' && !Array.isArray(errorInfo.details)) {
        const detailsStr = Object.entries(errorInfo.details)
          .filter(([key]) => key !== 'stack' && key !== 'originalError')
          .map(([key, value]) => `${key}: ${value}`)
          .join(', ');
        if (detailsStr) {
          message += `\n   Details: ${detailsStr}`;
        }
      } else {
        message += `\n   Details: ${errorInfo.details}`;
      }
    }
    
    // 에러 코드별 제안사항
    const suggestion = this.getSuggestion(errorInfo.code as ErrorCode);
    if (suggestion) {
      message += `\n   💡 Suggestion: ${suggestion}`;
    }
    
    return message;
  }
  
  private static getSuggestion(code: ErrorCode): string | null {
    switch (code) {
      case ErrorCode.FILE_NOT_FOUND:
        return 'Check if the file path is correct';
      case ErrorCode.PERMISSION_DENIED:
        return 'Check file permissions or run with appropriate privileges';
      case ErrorCode.DIRECTORY_NOT_EMPTY:
        return 'Use an empty directory or clear the existing one';
      case ErrorCode.SQLITE_CONNECTION_FAILED:
        return 'Verify the SQLite file exists and is accessible';
      case ErrorCode.INVALID_SQLITE_FILE:
        return 'Ensure the file is a valid SQLite database';
      case ErrorCode.GEMINI_NOT_FOUND:
        return 'Install Gemini CLI: npm install -g @google/gemini-cli';
      case ErrorCode.GEMINI_TIMEOUT:
        return 'Try increasing the timeout or simplifying the request';
      case ErrorCode.MCP_SERVER_NOT_FOUND:
        return 'Install MCP SQLite server: pip install mcp-server-sqlite';
      case ErrorCode.MCP_CONNECTION_FAILED:
        return 'Check MCP_SERVER_PATH environment variable';
      case ErrorCode.VALIDATION_FAILED:
        return 'Review the validation errors and fix the issues';
      case ErrorCode.OUTPUT_INCOMPLETE:
        return 'Try regenerating the output or check the logs';
      default:
        return null;
    }
  }
  
  static isRecoverable(code: ErrorCode): boolean {
    const recoverableCodes = [
      ErrorCode.GEMINI_TIMEOUT,
      ErrorCode.MCP_CONNECTION_FAILED,
      ErrorCode.VALIDATION_FAILED
    ];
    
    return recoverableCodes.includes(code);
  }
  
  static createFromCode(
    code: ErrorCode, 
    message?: string, 
    details?: any
  ): VibeCraftError {
    const defaultMessage = this.getDefaultMessage(code);
    return new VibeCraftError(
      code, 
      message || defaultMessage, 
      details,
      this.getSuggestion(code) || undefined
    );
  }
  
  private static getDefaultMessage(code: ErrorCode): string {
    switch (code) {
      case ErrorCode.INVALID_ARGS:
        return 'Invalid arguments provided';
      case ErrorCode.MISSING_REQUIRED_ARG:
        return 'Missing required argument';
      case ErrorCode.FILE_NOT_FOUND:
        return 'File or directory not found';
      case ErrorCode.PERMISSION_DENIED:
        return 'Permission denied';
      case ErrorCode.DIRECTORY_NOT_EMPTY:
        return 'Directory is not empty';
      case ErrorCode.SQLITE_CONNECTION_FAILED:
        return 'Failed to connect to SQLite database';
      case ErrorCode.INVALID_SQLITE_FILE:
        return 'Invalid SQLite database file';
      case ErrorCode.SCHEMA_EXTRACTION_FAILED:
        return 'Failed to extract database schema';
      case ErrorCode.GEMINI_NOT_FOUND:
        return 'Gemini CLI not found';
      case ErrorCode.GEMINI_EXECUTION_FAILED:
        return 'Gemini CLI execution failed';
      case ErrorCode.GEMINI_TIMEOUT:
        return 'Gemini CLI execution timed out';
      case ErrorCode.MCP_SERVER_NOT_FOUND:
        return 'MCP server not found';
      case ErrorCode.MCP_CONNECTION_FAILED:
        return 'Failed to connect to MCP server';
      case ErrorCode.VALIDATION_FAILED:
        return 'Validation failed';
      case ErrorCode.OUTPUT_INCOMPLETE:
        return 'Output generation incomplete';
      case ErrorCode.UNKNOWN_ERROR:
      default:
        return 'An unknown error occurred';
    }
  }
}