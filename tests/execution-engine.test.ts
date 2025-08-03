// Mock modules first
jest.mock('fs-extra');
jest.mock('child_process');

const mockExecAsync = jest.fn();
jest.mock('util', () => ({
  promisify: (fn: any) => {
    if (fn.name === 'exec') {
      return mockExecAsync;
    }
    return fn;
  }
}));

import { ExecutionEngine, ExecutionConfig, ExecutionResult } from '../src/core/execution-engine';
import { EventEmitter } from 'events';
import fs from 'fs-extra';
import path from 'path';
import { spawn } from 'child_process';

describe('ExecutionEngine', () => {
  let executionEngine: ExecutionEngine;
  let mockSpawn: jest.MockedFunction<typeof spawn>;
  
  beforeEach(() => {
    executionEngine = new ExecutionEngine();
    mockSpawn = spawn as jest.MockedFunction<typeof spawn>;
    
    // Reset all mocks
    jest.clearAllMocks();
    
    // Reset mockExecAsync to default success
    mockExecAsync.mockResolvedValue({ stdout: 'gemini version 1.0.0', stderr: '' });
    
    // Setup default fs-extra mock behavior
    (fs.ensureDir as unknown as jest.Mock).mockResolvedValue(undefined);
    (fs.readdir as unknown as jest.Mock).mockResolvedValue([]);
    (fs.writeFile as unknown as jest.Mock).mockResolvedValue(undefined);
  });
  
  describe('execute', () => {
    const validConfig: ExecutionConfig = {
      workspaceDir: '/test/workspace',
      prompt: 'Create a React app',
      settingsDir: '/test/.gemini',
      model: 'gemini-2.5-pro',
      debug: false,
      autoApprove: true
    };
    
    test('should successfully execute Gemini CLI', async () => {
      // Mock successful process
      const mockProcess = new EventEmitter() as any;
      mockProcess.pid = 1234;
      mockProcess.stdin = { write: jest.fn(), end: jest.fn() };
      mockProcess.stdout = new EventEmitter();
      mockProcess.stderr = new EventEmitter();
      
      mockSpawn.mockReturnValue(mockProcess);
      
      // Mock file collection - fs.readdir with withFileTypes returns Dirent objects
      (fs.readdir as unknown as jest.Mock).mockImplementation((dir: string, options?: any) => {
        // When called with { withFileTypes: true }, return Dirent-like objects
        if (options?.withFileTypes) {
          if (dir === validConfig.workspaceDir) {
            return Promise.resolve([
              { name: 'package.json', isDirectory: () => false, isFile: () => true },
              { name: 'src', isDirectory: () => true, isFile: () => false },
              { name: '.git', isDirectory: () => true, isFile: () => false }
            ]);
          } else if (dir.includes('src')) {
            return Promise.resolve([
              { name: 'App.tsx', isDirectory: () => false, isFile: () => true }
            ]);
          }
          return Promise.resolve([]);
        }
        // When called without withFileTypes, return string array (for prepareWorkspace)
        return Promise.resolve([]);
      });
      
      // Execute in background
      const executePromise = executionEngine.execute(validConfig);
      
      // Simulate process output
      setTimeout(() => {
        mockProcess.stdout.emit('data', 'Generating code...\n');
        mockProcess.stdout.emit('data', 'Creating files...\n');
        mockProcess.emit('close', 0);
      }, 10);
      
      const result = await executePromise;
      
      // Debug log
      if (!result.success) {
        console.log('Error:', result.error);
        console.log('Logs:', result.logs);
      }
      
      expect(result.success).toBe(true);
      expect(result.outputPath).toBe(validConfig.workspaceDir);
      expect(result.generatedFiles).toContain('package.json');
      expect(result.generatedFiles).toContain(path.join('src', 'App.tsx'));
      expect(result.logs.length).toBeGreaterThan(0);
    });
    
    test('should handle Gemini CLI not found', async () => {
      // Mock exec to throw error
      mockExecAsync.mockRejectedValueOnce(new Error('Command not found'));
      
      const result = await executionEngine.execute(validConfig);
      
      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Gemini CLI not found');
    });
    
    test('should handle empty prompt', async () => {
      const invalidConfig = { ...validConfig, prompt: '' };
      
      const result = await executionEngine.execute(invalidConfig);
      
      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Prompt is empty');
    });
    
    test('should handle non-empty workspace directory', async () => {
      // Mock non-empty directory  
      (fs.readdir as unknown as jest.Mock).mockResolvedValueOnce([
        'existing-file.js'
      ]);
      
      const result = await executionEngine.execute(validConfig);
      
      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Workspace directory is not empty');
    });
    
    test('should use stdin for long prompts', async () => {
      const longPrompt = 'x'.repeat(2000); // > 1000 chars
      const configWithLongPrompt = { ...validConfig, prompt: longPrompt };
      
      const mockProcess = new EventEmitter() as any;
      mockProcess.pid = 1234;
      mockProcess.stdin = { write: jest.fn(), end: jest.fn() };
      mockProcess.stdout = new EventEmitter();
      mockProcess.stderr = new EventEmitter();
      
      mockSpawn.mockReturnValue(mockProcess);
      
      const executePromise = executionEngine.execute(configWithLongPrompt);
      
      setTimeout(() => {
        mockProcess.emit('close', 0);
      }, 10);
      
      await executePromise;
      
      // Should use stdin
      expect(mockProcess.stdin.write).toHaveBeenCalledWith(longPrompt);
      expect(mockProcess.stdin.end).toHaveBeenCalled();
      
      // Should not include -p option
      expect(mockSpawn).toHaveBeenCalledWith(
        'gemini',
        expect.not.arrayContaining(['-p']),
        expect.any(Object)
      );
    });
    
    test('should use -p option for short prompts', async () => {
      const shortPrompt = 'Create app';
      const configWithShortPrompt = { ...validConfig, prompt: shortPrompt };
      
      const mockProcess = new EventEmitter() as any;
      mockProcess.pid = 1234;
      mockProcess.stdin = { write: jest.fn(), end: jest.fn() };
      mockProcess.stdout = new EventEmitter();
      mockProcess.stderr = new EventEmitter();
      
      mockSpawn.mockReturnValue(mockProcess);
      
      const executePromise = executionEngine.execute(configWithShortPrompt);
      
      setTimeout(() => {
        mockProcess.emit('close', 0);
      }, 10);
      
      await executePromise;
      
      // Should use -p option
      expect(mockSpawn).toHaveBeenCalledWith(
        'gemini',
        expect.arrayContaining(['-p', shortPrompt]),
        expect.any(Object)
      );
      
      // Should not use stdin
      expect(mockProcess.stdin.write).not.toHaveBeenCalled();
    });
    
    test('should handle process timeout', async () => {
      const configWithTimeout = { ...validConfig, timeout: 100 }; // 100ms timeout
      
      const mockProcess = new EventEmitter() as any;
      mockProcess.pid = 1234;
      mockProcess.stdin = { write: jest.fn(), end: jest.fn() };
      mockProcess.stdout = new EventEmitter();
      mockProcess.stderr = new EventEmitter();
      mockProcess.kill = jest.fn();
      
      mockSpawn.mockReturnValue(mockProcess);
      
      const executePromise = executionEngine.execute(configWithTimeout);
      
      // Don't close the process, let it timeout
      await new Promise(resolve => setTimeout(resolve, 150));
      
      const result = await executePromise;
      
      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Execution timeout');
      expect(mockProcess.kill).toHaveBeenCalledWith('SIGTERM');
    });
  });
  
  describe('monitorExecution', () => {
    test('should return process status', async () => {
      const mockProcess = new EventEmitter() as any;
      mockProcess.pid = 1234;
      mockProcess.stdin = { write: jest.fn(), end: jest.fn() };
      mockProcess.stdout = new EventEmitter();
      mockProcess.stderr = new EventEmitter();
      
      mockSpawn.mockReturnValue(mockProcess);
      
      const config: ExecutionConfig = {
        workspaceDir: '/test',
        prompt: 'test',
        settingsDir: '/test/.gemini'
      };
      
      const executePromise = executionEngine.execute(config);
      
      // Give time for process to start
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const status = executionEngine.monitorExecution(1234);
      expect(status.status).toBe('running');
      expect(status.processId).toBe(1234);
      
      // Close process
      mockProcess.emit('close', 0);
      await executePromise;
    });
    
    test('should return failed status for unknown process', () => {
      const status = executionEngine.monitorExecution(9999);
      
      expect(status.status).toBe('failed');
      expect(status.currentOperation).toBe('Process not found');
    });
  });
  
  describe('cancelExecution', () => {
    test('should cancel running process', async () => {
      const mockProcess = new EventEmitter() as any;
      mockProcess.pid = 1234;
      mockProcess.stdin = { write: jest.fn(), end: jest.fn() };
      mockProcess.stdout = new EventEmitter();
      mockProcess.stderr = new EventEmitter();
      mockProcess.kill = jest.fn();
      
      mockSpawn.mockReturnValue(mockProcess);
      
      const config: ExecutionConfig = {
        workspaceDir: '/test',
        prompt: 'test',
        settingsDir: '/test/.gemini'
      };
      
      const executePromise = executionEngine.execute(config);
      
      // Give time for process to start
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Cancel execution
      executionEngine.cancelExecution(1234);
      
      expect(mockProcess.kill).toHaveBeenCalledWith('SIGTERM');
      
      // Simulate process close after cancel
      mockProcess.emit('close', 1);
      
      const result = await executePromise;
      expect(result.success).toBe(false);
    });
  });
  
  describe('event emission', () => {
    test('should emit progress events', async () => {
      const mockProcess = new EventEmitter() as any;
      mockProcess.pid = 1234;
      mockProcess.stdin = { write: jest.fn(), end: jest.fn() };
      mockProcess.stdout = new EventEmitter();
      mockProcess.stderr = new EventEmitter();
      
      mockSpawn.mockReturnValue(mockProcess);
      
      // Mock file collection to return empty array
      (fs.readdir as unknown as jest.Mock).mockResolvedValue([]);
      
      const progressEvents: any[] = [];
      executionEngine.on('progress', (event) => {
        progressEvents.push(event);
      });
      
      const config: ExecutionConfig = {
        workspaceDir: '/test',
        prompt: 'test',
        settingsDir: '/test/.gemini'
      };
      
      const executePromise = executionEngine.execute(config);
      
      // Give a small delay for process to start
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Emit some progress
      mockProcess.stdout.emit('data', 'Generating code...\n');
      mockProcess.stdout.emit('data', 'Creating files...\n');
      
      // Close process
      mockProcess.emit('close', 0);
      const result = await executePromise;
      
      expect(result.success).toBe(true);
      expect(progressEvents.length).toBe(2);
      expect(progressEvents[0].message).toBe('Generating code...');
      expect(progressEvents[1].message).toBe('Creating files...');
    });
  });
});

describe('ProcessManager', () => {
  const { ProcessManager } = require('../src/utils/process-manager');
  
  test('should be singleton', () => {
    const instance1 = ProcessManager.getInstance();
    const instance2 = ProcessManager.getInstance();
    
    expect(instance1).toBe(instance2);
  });
  
  test('should register and kill processes', () => {
    const manager = ProcessManager.getInstance();
    const mockProcess = { kill: jest.fn() } as any;
    
    manager.register('test-id', mockProcess);
    const killed = manager.kill('test-id');
    
    expect(killed).toBe(true);
    expect(mockProcess.kill).toHaveBeenCalledWith('SIGTERM');
  });
  
  test('should return false for unknown process', () => {
    const manager = ProcessManager.getInstance();
    const killed = manager.kill('unknown-id');
    
    expect(killed).toBe(false);
  });
});