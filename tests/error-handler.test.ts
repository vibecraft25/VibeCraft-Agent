import { ErrorHandler, VibeCraftError, ErrorCode } from '../src/utils/error-handler';

describe('ErrorHandler', () => {
  describe('VibeCraftError', () => {
    test('should create error with all properties', () => {
      const error = new VibeCraftError(
        ErrorCode.FILE_NOT_FOUND,
        'Test file not found',
        { path: '/test/path' },
        'Check the file path'
      );
      
      expect(error.code).toBe(ErrorCode.FILE_NOT_FOUND);
      expect(error.message).toBe('Test file not found');
      expect(error.details).toEqual({ path: '/test/path' });
      expect(error.suggestion).toBe('Check the file path');
      expect(error.name).toBe('VibeCraftError');
    });
  });
  
  describe('handle', () => {
    test('should handle VibeCraftError', () => {
      const error = new VibeCraftError(
        ErrorCode.SQLITE_CONNECTION_FAILED,
        'Cannot connect to database',
        { dbPath: '/test.db' }
      );
      
      const result = ErrorHandler.handle(error);
      
      expect(result.code).toBe(ErrorCode.SQLITE_CONNECTION_FAILED);
      expect(result.message).toBe('Cannot connect to database');
      expect(result.details).toEqual({ dbPath: '/test.db' });
    });
    
    test('should map ENOENT error', () => {
      const error = new Error('ENOENT: no such file or directory');
      (error as any).code = 'ENOENT';
      (error as any).path = '/missing/file';
      (error as any).syscall = 'open';
      
      const result = ErrorHandler.handle(error);
      
      expect(result.code).toBe(ErrorCode.FILE_NOT_FOUND);
      expect(result.message).toBe('File or directory not found');
      expect(result.details).toEqual({ path: '/missing/file', syscall: 'open' });
    });
    
    test('should map EACCES error', () => {
      const error = new Error('EACCES: permission denied');
      (error as any).code = 'EACCES';
      (error as any).path = '/protected/file';
      
      const result = ErrorHandler.handle(error);
      
      expect(result.code).toBe(ErrorCode.PERMISSION_DENIED);
      expect(result.message).toBe('Permission denied');
    });
    
    test('should map SQLite error', () => {
      const error = new Error('SQLITE_CANTOPEN: unable to open database file');
      
      const result = ErrorHandler.handle(error);
      
      expect(result.code).toBe(ErrorCode.SQLITE_CONNECTION_FAILED);
      expect(result.message).toBe('Cannot open SQLite database');
    });
    
    test('should map Gemini not found error', () => {
      const error = new Error('gemini: command not found');
      
      const result = ErrorHandler.handle(error);
      
      expect(result.code).toBe(ErrorCode.GEMINI_NOT_FOUND);
      expect(result.message).toBe('Gemini CLI is not installed');
    });
    
    test('should map timeout error', () => {
      const error = new Error('Operation timeout after 5000ms');
      
      const result = ErrorHandler.handle(error);
      
      expect(result.code).toBe(ErrorCode.GEMINI_TIMEOUT);
      expect(result.message).toBe('Operation timed out');
    });
    
    test('should handle unknown error', () => {
      const error = new Error('Something went wrong');
      
      const result = ErrorHandler.handle(error);
      
      expect(result.code).toBe(ErrorCode.UNKNOWN_ERROR);
      expect(result.message).toBe('Something went wrong');
    });
  });
  
  describe('createUserFriendlyMessage', () => {
    test('should create message with all details', () => {
      const errorInfo = {
        code: ErrorCode.FILE_NOT_FOUND,
        message: 'File not found',
        details: { path: '/test/file.txt', syscall: 'open' }
      };
      
      const message = ErrorHandler.createUserFriendlyMessage(errorInfo);
      
      expect(message).toContain('❌ Error: File not found');
      expect(message).toContain('Details: path: /test/file.txt, syscall: open');
      expect(message).toContain('💡 Suggestion: Check if the file path is correct');
    });
    
    test('should handle error without details', () => {
      const errorInfo = {
        code: ErrorCode.UNKNOWN_ERROR,
        message: 'Unknown error'
      };
      
      const message = ErrorHandler.createUserFriendlyMessage(errorInfo);
      
      expect(message).toBe('❌ Error: Unknown error');
    });
  });
  
  describe('isRecoverable', () => {
    test('should identify recoverable errors', () => {
      expect(ErrorHandler.isRecoverable(ErrorCode.GEMINI_TIMEOUT)).toBe(true);
      expect(ErrorHandler.isRecoverable(ErrorCode.MCP_CONNECTION_FAILED)).toBe(true);
      expect(ErrorHandler.isRecoverable(ErrorCode.VALIDATION_FAILED)).toBe(true);
    });
    
    test('should identify non-recoverable errors', () => {
      expect(ErrorHandler.isRecoverable(ErrorCode.FILE_NOT_FOUND)).toBe(false);
      expect(ErrorHandler.isRecoverable(ErrorCode.PERMISSION_DENIED)).toBe(false);
      expect(ErrorHandler.isRecoverable(ErrorCode.GEMINI_NOT_FOUND)).toBe(false);
    });
  });
  
  describe('createFromCode', () => {
    test('should create error with default message', () => {
      const error = ErrorHandler.createFromCode(ErrorCode.FILE_NOT_FOUND);
      
      expect(error.code).toBe(ErrorCode.FILE_NOT_FOUND);
      expect(error.message).toBe('File or directory not found');
      expect(error.suggestion).toBe('Check if the file path is correct');
    });
    
    test('should create error with custom message', () => {
      const error = ErrorHandler.createFromCode(
        ErrorCode.SQLITE_CONNECTION_FAILED,
        'Custom database error',
        { db: 'test.db' }
      );
      
      expect(error.code).toBe(ErrorCode.SQLITE_CONNECTION_FAILED);
      expect(error.message).toBe('Custom database error');
      expect(error.details).toEqual({ db: 'test.db' });
    });
  });
});