# Task 6: Settings Manager 모듈 구현

## 개요
Gemini CLI를 위한 settings.json 파일을 생성하고 MCP SQLite 서버 설정을 관리하는 Settings Manager 모듈을 구현합니다.

## 목표
- Gemini CLI settings.json 파일 생성
- MCP SQLite 서버 설정 관리
- 환경 변수 관리 및 검증
- 설정 파일 검증 및 업데이트

## 구현 내용

### 1. 핵심 인터페이스 정의

```typescript
export interface ISettingsManager {
  generateSettings(config: SettingsConfig): Promise<string>;
  validateSettings(settingsPath: string): Promise<boolean>;
  updateSettings(settingsPath: string, updates: Partial<Settings>): Promise<void>;
  getDefaultSettings(): Settings;
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
```

### 2. SettingsManager 구현

#### 2.1 Settings 생성
- `.gemini` 디렉토리에 settings.json 생성
- SQLite 파일 경로를 절대 경로로 변환
- MCP 서버 실행 방식 자동 결정 (Python 모듈 또는 UV)

```typescript
async generateSettings(config: SettingsConfig): Promise<string> {
  const settingsDir = path.join(config.workspaceDir, '.gemini');
  await fs.ensureDir(settingsDir);
  
  const settings = this.createSettings(config);
  const settingsPath = path.join(settingsDir, 'settings.json');
  
  await fs.writeJson(settingsPath, settings, { spaces: 2 });
  return settingsPath;
}
```

#### 2.2 MCP 서버 명령 결정
```typescript
private determineMCPCommand(mcpServerPath: string, sqlitePath: string) {
  // UV 프로젝트 확인
  if (fs.existsSync(path.join(mcpServerPath, 'pyproject.toml'))) {
    return {
      command: 'uv',
      args: ['--directory', mcpServerPath, 'run', 'mcp-server-sqlite', '--db-path', sqlitePath]
    };
  }
  
  // Python 모듈 실행
  return {
    command: 'python',
    args: ['-m', 'mcp_server_sqlite', '--db-path', sqlitePath]
  };
}
```

### 3. SettingsHelper 유틸리티

#### 3.1 Settings 파일 탐색
```typescript
static async findSettingsFile(startDir: string): Promise<string | null> {
  const possiblePaths = [
    path.join(startDir, '.gemini', 'settings.json'),
    path.join(startDir, 'settings.json')
  ];
  // 홈 디렉토리 확인
}
```

#### 3.2 MCP 서버 경로 검증
```typescript
static validateMCPServerPath(serverPath: string): boolean {
  // Python 패키지 구조 확인
  // UV 프로젝트 구조 확인
}
```

### 4. EnvironmentManager 구현

#### 4.1 환경 변수 관리
- `GEMINI_SETTINGS_DIR`: Settings 디렉토리 위치
- `MCP_SERVER_PATH`: MCP 서버 설치 경로
- `VIBECRAFT_DEBUG`: 디버그 모드
- `VIBECRAFT_TIMEOUT`: 타임아웃 설정

#### 4.2 환경 검증
```typescript
static validateEnvironment(): { valid: boolean; errors: string[] } {
  // Python 설치 확인
  // Node.js 버전 확인 (16+)
}
```

### 5. Agent 통합

```typescript
// Settings 생성
const settingsPath = await this.settingsManager.generateSettings({
  workspaceDir: normalizedRequest.workingDir,
  sqlitePath: targetSqlitePath,
  mcpServerPath: EnvironmentManager.getMCPServerPath(),
  timeout: EnvironmentManager.getTimeout(),
  trust: true
});

// Settings 검증
const isValidSettings = await this.settingsManager.validateSettings(settingsPath);
```

### 6. 생성되는 settings.json 예시

```json
{
  "mcpServers": {
    "sqlite": {
      "command": "python",
      "args": ["-m", "mcp_server_sqlite", "--db-path", "/absolute/path/to/data.sqlite"],
      "timeout": 30000,
      "trust": true,
      "includeTools": [
        "read_query",
        "write_query",
        "list_tables",
        "describe_table",
        "list_schemas",
        "describe_schema"
      ]
    }
  }
}
```

## 테스트

### 단위 테스트
- Settings 생성 및 검증
- 경로 변환 (상대 → 절대)
- MCP 도구 포함 확인
- 환경 변수 처리
- Settings 업데이트 및 병합

### 통합 테스트
- Agent와의 통합
- 실제 파일 시스템 작업
- 다양한 MCP 서버 설치 형태 지원

## 구현 결과
- ✅ SettingsManager 클래스 구현 완료
- ✅ SettingsHelper 유틸리티 구현 완료
- ✅ EnvironmentManager 구현 완료
- ✅ 단위 테스트 작성 (24개 테스트 통과)
- ✅ Agent 클래스와 통합 완료

## 다음 단계
- Task 7: Prompt Builder 구현 (프롬프트 조합)
- Settings과 렌더링된 템플릿을 결합하여 최종 프롬프트 생성