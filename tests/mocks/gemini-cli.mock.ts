import { EventEmitter } from 'events';
import fs from 'fs-extra';
import path from 'path';

export class GeminiCLIMock {
  static setup(): void {
    // Gemini CLI 실행을 모의
    jest.mock('child_process', () => ({
      spawn: jest.fn().mockImplementation((command, args, options) => {
        if (command === 'gemini') {
          return this.createMockProcess(args, options);
        }
        return null;
      })
    }));
  }
  
  static restore(): void {
    jest.unmock('child_process');
  }
  
  private static createMockProcess(args: string[], options: any) {
    const mockProcess = new EventEmitter() as any;
    
    mockProcess.stdout = new EventEmitter();
    mockProcess.stderr = new EventEmitter();
    mockProcess.stdin = {
      write: jest.fn(),
      end: jest.fn()
    };
    mockProcess.pid = 12345;
    
    // 작업 디렉토리 추출
    const workDir = options?.cwd || process.cwd();
    
    // 비동기로 모의 출력 생성
    setImmediate(async () => {
      try {
        // 진행 상황 출력
        mockProcess.stdout.emit('data', Buffer.from('🚀 Starting React app generation...\n'));
        mockProcess.stdout.emit('data', Buffer.from('📦 Setting up project structure...\n'));
        
        // 모의 파일 생성
        await this.generateMockFiles(workDir);
        
        mockProcess.stdout.emit('data', Buffer.from('📦 Installing dependencies...\n'));
        mockProcess.stdout.emit('data', Buffer.from('✅ React app generated successfully!\n'));
        
        // 성공적으로 종료
        mockProcess.emit('close', 0);
      } catch (error) {
        mockProcess.stderr.emit('data', Buffer.from(`Error: ${error}\n`));
        mockProcess.emit('close', 1);
      }
    });
    
    mockProcess.kill = jest.fn(() => {
      mockProcess.emit('close', 130); // SIGINT exit code
      return true;
    });
    
    return mockProcess;
  }
  
  private static async generateMockFiles(outputDir: string): Promise<void> {
    // package.json 생성
    const packageJson = {
      name: 'mock-visualization-app',
      version: '0.1.0',
      private: true,
      dependencies: {
        'react': '^18.2.0',
        'react-dom': '^18.2.0',
        'sql.js': '^1.8.0',
        'recharts': '^2.5.0',
        'tailwindcss': '^3.3.0'
      },
      scripts: {
        start: 'react-scripts start',
        build: 'react-scripts build',
        test: 'react-scripts test'
      }
    };
    
    await fs.ensureDir(outputDir);
    await fs.writeJson(path.join(outputDir, 'package.json'), packageJson, { spaces: 2 });
    
    // src 디렉토리 생성
    await fs.ensureDir(path.join(outputDir, 'src'));
    
    // App.tsx 생성
    const appTsx = `import React from 'react';
import './App.css';

function App() {
  return (
    <div className="App">
      <h1>Mock Visualization App</h1>
    </div>
  );
}

export default App;`;
    
    await fs.writeFile(path.join(outputDir, 'src/App.tsx'), appTsx);
    
    // index.tsx 생성
    const indexTsx = `import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`;
    
    await fs.writeFile(path.join(outputDir, 'src/index.tsx'), indexTsx);
    
    // public 디렉토리 생성
    await fs.ensureDir(path.join(outputDir, 'public'));
    
    // index.html 생성
    const indexHtml = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Mock Visualization App</title>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>`;
    
    await fs.writeFile(path.join(outputDir, 'public/index.html'), indexHtml);
    
    // README.md 생성
    const readme = `# Mock Visualization App

This is a mock React visualization app generated for testing purposes.`;
    
    await fs.writeFile(path.join(outputDir, 'README.md'), readme);
  }
  
  static createFailingMock(errorMessage: string): void {
    jest.mock('child_process', () => ({
      spawn: jest.fn().mockImplementation(() => {
        const mockProcess = new EventEmitter() as any;
        
        mockProcess.stdout = new EventEmitter();
        mockProcess.stderr = new EventEmitter();
        mockProcess.pid = 12346;
        
        setImmediate(() => {
          mockProcess.stderr.emit('data', Buffer.from(errorMessage));
          mockProcess.emit('close', 1);
        });
        
        mockProcess.kill = jest.fn();
        
        return mockProcess;
      })
    }));
  }
  
  static createTimeoutMock(delay: number = 5000): void {
    jest.mock('child_process', () => ({
      spawn: jest.fn().mockImplementation(() => {
        const mockProcess = new EventEmitter() as any;
        
        mockProcess.stdout = new EventEmitter();
        mockProcess.stderr = new EventEmitter();
        mockProcess.pid = 12347;
        
        // 지정된 시간 후에도 종료하지 않음
        const timeout = setTimeout(() => {
          mockProcess.stdout.emit('data', Buffer.from('Still running...\n'));
        }, delay);
        
        mockProcess.kill = jest.fn(() => {
          clearTimeout(timeout);
          mockProcess.emit('close', 130);
          return true;
        });
        
        return mockProcess;
      })
    }));
  }
}

// Mock SQLite 데이터베이스 헬퍼
export class MockSQLiteDB {
  static createMock(schema: any, data: any[]): void {
    jest.mock('sqlite3', () => ({
      Database: jest.fn().mockImplementation((path: string) => {
        return {
          serialize: jest.fn((callback) => callback()),
          run: jest.fn((sql, callback) => {
            if (callback) callback(null);
          }),
          all: jest.fn((sql, callback) => {
            // 스키마 쿼리 모의
            if (sql.includes('sqlite_master')) {
              callback(null, schema);
            } else {
              callback(null, data);
            }
          }),
          get: jest.fn((sql, callback) => {
            callback(null, data[0] || null);
          }),
          close: jest.fn((callback) => {
            if (callback) callback(null);
          }),
          prepare: jest.fn(() => ({
            run: jest.fn(),
            finalize: jest.fn()
          }))
        };
      })
    }));
  }
}