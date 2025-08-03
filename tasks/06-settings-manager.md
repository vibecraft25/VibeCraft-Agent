# Task 6: Settings Manager 모듈 구현

## 목표
Gemini CLI를 위한 settings.json 파일을 생성하고 MCP SQLite 서버 설정을 관리하는 Settings Manager 모듈을 구현합니다.

## 작업 내용

### 6.1 Settings Manager 인터페이스 정의
```typescript
// src/core/settings-manager.ts
import path from 'path';
import fs from 'fs-extra';

export interface ISettingsManager {
  generateSettings(config: SettingsConfig): Promise<string>;
  validateSettings(settingsPath: string): boolean;
  updateSettings(settingsPath: string, updates: Partial<Settings>): Promise<void>;
}

export interface SettingsConfig {
  workspaceDir: string;
  sqlitePath: string;
  mcpServerPath?: string;
  timeout?: number;
  trust?: boolean;
}

export interface Settings {
  mcpServers: {
    [key: string]: MCPServerConfig;
  };
  experimental?: {
    [key: string]: any;
  };
}

export interface MCPServerConfig {
  command: string;
  args: string[];
  timeout?: number;
  trust?: boolean;
  includeTools?: string[];
  env?: Record<string, string>;
}
```

### 6.2 Settings Manager 구현
```typescript
// src/core/settings-manager.ts (계속)
export class SettingsManager implements ISettingsManager {
  private defaultTimeout = 30000;
  private defaultMCPServerPath = process.env.MCP_SERVER_PATH || '/usr/local/lib/mcp-server-sqlite';
  
  async generateSettings(config: SettingsConfig): Promise<string> {
    // Settings 디렉토리 생성
    const settingsDir = path.join(config.workspaceDir, '.gemini');
    await fs.ensureDir(settingsDir);
    
    // Settings 객체 생성
    const settings = this.createSettings(config);
    
    // Settings 파일 경로
    const settingsPath = path.join(settingsDir, 'settings.json');
    
    // Settings 파일 저장
    await fs.writeJson(settingsPath, settings, { spaces: 2 });
    
    return settingsPath;
  }
  
  private createSettings(config: SettingsConfig): Settings {
    const absoluteSqlitePath = path.resolve(config.sqlitePath);
    const mcpServerPath = config.mcpServerPath || this.defaultMCPServerPath;
    
    // MCP 서버 실행 방식 결정 (Python 또는 UV)
    const { command, args } = this.determineMCPCommand(mcpServerPath, absoluteSqlitePath);
    
    const settings: Settings = {
      mcpServers: {
        sqlite: {
          command,
          args,
          timeout: config.timeout || this.defaultTimeout,
          trust: config.trust !== false, // 기본값 true
          includeTools: [
            'read_query',
            'write_query',
            'list_tables',
            'describe_table',
            'list_schemas',
            'describe_schema'
          ]
        }
      }
    };
    
    // 실험적 기능 설정 (필요시)
    if (process.env.GEMINI_EXPERIMENTAL_FEATURES) {
      settings.experimental = {
        asyncExecution: true,
        parallelTools: true
      };
    }
    
    return settings;
  }
  
  private determineMCPCommand(mcpServerPath: string, sqlitePath: string): {
    command: string;
    args: string[];
  } {
    // UV 기반 실행 확인
    if (fs.existsSync(path.join(mcpServerPath, 'pyproject.toml'))) {
      return {
        command: 'uv',
        args: [
          '--directory',
          mcpServerPath,
          'run',
          'mcp-server-sqlite',
          '--db-path',
          sqlitePath
        ]
      };
    }
    
    // Python 모듈 실행
    return {
      command: 'python',
      args: [
        '-m',
        'mcp_server_sqlite',
        '--db-path',
        sqlitePath
      ]
    };
  }
  
  async validateSettings(settingsPath: string): boolean {
    try {
      // 파일 존재 확인
      if (!await fs.pathExists(settingsPath)) {
        return false;
      }
      
      // JSON 파싱 가능 여부 확인
      const content = await fs.readJson(settingsPath);
      
      // 필수 필드 확인
      if (!content.mcpServers || !content.mcpServers.sqlite) {
        return false;
      }
      
      const sqliteConfig = content.mcpServers.sqlite;
      if (!sqliteConfig.command || !Array.isArray(sqliteConfig.args)) {
        return false;
      }
      
      // SQLite 파일 경로 확인
      const dbPathIndex = sqliteConfig.args.indexOf('--db-path');
      if (dbPathIndex === -1 || dbPathIndex === sqliteConfig.args.length - 1) {
        return false;
      }
      
      const dbPath = sqliteConfig.args[dbPathIndex + 1];
      if (!await fs.pathExists(dbPath)) {
        return false;
      }
      
      return true;
    } catch (error) {
      return false;
    }
  }
  
  async updateSettings(settingsPath: string, updates: Partial<Settings>): Promise<void> {
    // 기존 설정 읽기
    const currentSettings = await fs.readJson(settingsPath);
    
    // 설정 병합
    const updatedSettings = this.mergeSettings(currentSettings, updates);
    
    // 설정 저장
    await fs.writeJson(settingsPath, updatedSettings, { spaces: 2 });
  }
  
  private mergeSettings(current: Settings, updates: Partial<Settings>): Settings {
    return {
      ...current,
      ...updates,
      mcpServers: {
        ...current.mcpServers,
        ...(updates.mcpServers || {})
      },
      experimental: {
        ...(current.experimental || {}),
        ...(updates.experimental || {})
      }
    };
  }
}
```

### 6.3 Settings 헬퍼 유틸리티
```typescript
// src/utils/settings-helper.ts
export class SettingsHelper {
  static async findSettingsFile(startDir: string): Promise<string | null> {
    const possiblePaths = [
      path.join(startDir, '.gemini', 'settings.json'),
      path.join(startDir, 'settings.json'),
      path.join(process.env.HOME || '', '.gemini', 'settings.json')
    ];
    
    for (const settingsPath of possiblePaths) {
      if (await fs.pathExists(settingsPath)) {
        return settingsPath;
      }
    }
    
    return null;
  }
  
  static async backupSettings(settingsPath: string): Promise<string> {
    const backupPath = `${settingsPath}.backup.${Date.now()}`;
    await fs.copy(settingsPath, backupPath);
    return backupPath;
  }
  
  static validateMCPServerPath(serverPath: string): boolean {
    // Python 패키지 확인
    const pythonPackage = path.join(serverPath, 'mcp_server_sqlite', '__init__.py');
    if (fs.existsSync(pythonPackage)) {
      return true;
    }
    
    // UV 프로젝트 확인
    const uvProject = path.join(serverPath, 'pyproject.toml');
    if (fs.existsSync(uvProject)) {
      return true;
    }
    
    return false;
  }
}
```

### 6.4 환경 변수 관리
```typescript
// src/core/environment-manager.ts
export class EnvironmentManager {
  private static readonly ENV_VARS = {
    GEMINI_SETTINGS_DIR: 'GEMINI_SETTINGS_DIR',
    MCP_SERVER_PATH: 'MCP_SERVER_PATH',
    VIBECRAFT_DEBUG: 'VIBECRAFT_DEBUG',
    VIBECRAFT_TIMEOUT: 'VIBECRAFT_TIMEOUT'
  };
  
  static getSettingsDir(workspaceDir: string): string {
    return process.env[this.ENV_VARS.GEMINI_SETTINGS_DIR] || 
           path.join(workspaceDir, '.gemini');
  }
  
  static getMCPServerPath(): string | undefined {
    return process.env[this.ENV_VARS.MCP_SERVER_PATH];
  }
  
  static isDebugMode(): boolean {
    return process.env[this.ENV_VARS.VIBECRAFT_DEBUG] === 'true';
  }
  
  static getTimeout(): number {
    const timeout = process.env[this.ENV_VARS.VIBECRAFT_TIMEOUT];
    return timeout ? parseInt(timeout, 10) : 30000;
  }
  
  static createEnvironment(workspaceDir: string): NodeJS.ProcessEnv {
    return {
      ...process.env,
      [this.ENV_VARS.GEMINI_SETTINGS_DIR]: path.join(workspaceDir, '.gemini')
    };
  }
}
```

### 6.5 Settings Manager 테스트
```typescript
// tests/settings-manager.test.ts
import { SettingsManager } from '../src/core/settings-manager';
import fs from 'fs-extra';
import path from 'path';

describe('SettingsManager', () => {
  let manager: SettingsManager;
  let tempDir: string;
  
  beforeEach(async () => {
    manager = new SettingsManager();
    tempDir = path.join(__dirname, 'temp', Date.now().toString());
    await fs.ensureDir(tempDir);
  });
  
  afterEach(async () => {
    await fs.remove(tempDir);
  });
  
  test('should generate valid settings.json', async () => {
    const config = {
      workspaceDir: tempDir,
      sqlitePath: '/path/to/data.sqlite',
      timeout: 60000
    };
    
    const settingsPath = await manager.generateSettings(config);
    
    expect(await fs.pathExists(settingsPath)).toBe(true);
    
    const settings = await fs.readJson(settingsPath);
    expect(settings.mcpServers.sqlite).toBeDefined();
    expect(settings.mcpServers.sqlite.timeout).toBe(60000);
  });
  
  test('should validate settings correctly', async () => {
    const validSettings = {
      mcpServers: {
        sqlite: {
          command: 'python',
          args: ['-m', 'mcp_server_sqlite', '--db-path', __filename] // 임시로 실제 파일 사용
        }
      }
    };
    
    const settingsPath = path.join(tempDir, 'settings.json');
    await fs.writeJson(settingsPath, validSettings);
    
    const isValid = await manager.validateSettings(settingsPath);
    expect(isValid).toBe(true);
  });
});
```

## 완료 기준
- [ ] Settings Manager 인터페이스 구현
- [ ] MCP 서버 설정 생성 로직
- [ ] Settings 파일 검증
- [ ] 환경 변수 관리
- [ ] MCP 서버 경로 자동 탐지
- [ ] 단위 테스트 작성