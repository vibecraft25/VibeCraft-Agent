# VibeCraft-Agent API Documentation

## 목차

1. [개요](#개요)
2. [Core Classes](#core-classes)
3. [Interfaces & Types](#interfaces--types)
4. [Error Handling](#error-handling)
5. [Utilities](#utilities)
6. [Examples](#examples)

## 개요

VibeCraft-Agent는 프로그래매틱 사용을 위한 완전한 API를 제공합니다. 이 문서는 주요 클래스, 인터페이스, 그리고 사용 방법을 설명합니다.

## Core Classes

### VibeCraftAgent

메인 에이전트 클래스로 전체 워크플로우를 관리합니다.

```typescript
import { VibeCraftAgent } from 'vibecraft-agent';
```

#### Constructor

```typescript
constructor(options?: AgentOptions)
```

**Parameters:**
- `options` (optional): 에이전트 설정 옵션
  - `logger?: Logger`: 커스텀 로거 인스턴스
  - `debug?: boolean`: 디버그 모드 활성화

#### Methods

##### execute(args: AgentCliArgs): Promise<AgentExecutionResult>

React 애플리케이션을 생성합니다.

**Parameters:**
```typescript
interface AgentCliArgs {
  sqlitePath: string;          // SQLite 데이터베이스 경로
  visualizationType: VisualizationType;  // 시각화 타입
  userPrompt: string;          // 사용자 요구사항
  outputDir: string;           // 출력 디렉토리
  projectName?: string;        // 프로젝트 이름 (선택)
  debug?: boolean;             // 디버그 모드 (선택)
}
```

**Returns:**
```typescript
interface AgentExecutionResult {
  success: boolean;            // 성공 여부
  outputPath: string;          // 생성된 앱 경로
  executionTime: number;       // 실행 시간 (ms)
  logs: LogEntry[];           // 실행 로그
  error?: ErrorInfo;          // 에러 정보 (실패 시)
  validationResult?: ValidationResult;  // 검증 결과
}
```

**Example:**
```typescript
const agent = new VibeCraftAgent({ debug: true });

try {
  const result = await agent.execute({
    sqlitePath: './data.sqlite',
    visualizationType: 'time-series',
    userPrompt: '월별 매출 대시보드',
    outputDir: './output'
  });
  
  if (result.success) {
    console.log(`앱이 생성되었습니다: ${result.outputPath}`);
  }
} catch (error) {
  console.error('실행 실패:', error);
}
```

### SchemaAnalyzer

SQLite 데이터베이스 스키마를 분석합니다.

```typescript
import { SchemaAnalyzer } from 'vibecraft-agent/schema';
```

#### Methods

##### analyze(dbPath: string): Promise<SchemaInfo>

데이터베이스 스키마를 추출하고 분석합니다.

**Parameters:**
- `dbPath`: SQLite 데이터베이스 파일 경로

**Returns:**
```typescript
interface SchemaInfo {
  tables: TableInfo[];         // 테이블 정보
  relationships: Relationship[]; // 관계 정보
  metadata: DatabaseMetadata;   // 데이터베이스 메타데이터
  statistics?: DataStatistics;  // 데이터 통계 (선택)
}
```

##### getTableInfo(dbPath: string, tableName: string): Promise<TableInfo>

특정 테이블의 상세 정보를 가져옵니다.

##### getRelationships(dbPath: string): Promise<Relationship[]>

테이블 간 관계를 분석합니다.

**Example:**
```typescript
const analyzer = new SchemaAnalyzer();
const schema = await analyzer.analyze('./database.sqlite');

console.log('테이블 수:', schema.tables.length);
schema.tables.forEach(table => {
  console.log(`${table.name}: ${table.columns.length}개 컬럼`);
});
```

### TemplateEngine

시각화 템플릿을 관리하고 렌더링합니다.

```typescript
import { TemplateEngine } from 'vibecraft-agent/templates';
```

#### Methods

##### loadTemplate(type: VisualizationType): Promise<Template>

템플릿을 로드합니다.

##### renderTemplate(template: Template, context: TemplateContext): string

템플릿을 렌더링합니다.

**Parameters:**
```typescript
interface TemplateContext {
  variables: Record<string, any>;  // 템플릿 변수
  schemaInfo?: SchemaInfo;        // 스키마 정보
  userPrompt?: string;            // 사용자 요구사항
}
```

##### validateTemplate(template: Template): ValidationResult

템플릿의 유효성을 검증합니다.

**Example:**
```typescript
const engine = new TemplateEngine();
const template = await engine.loadTemplate('time-series');
const rendered = engine.renderTemplate(template, {
  variables: {
    projectName: 'Sales Dashboard',
    primaryTable: 'monthly_sales'
  }
});
```

### PromptBuilder

프롬프트를 생성하고 최적화합니다.

```typescript
import { PromptBuilder } from 'vibecraft-agent/prompt';
```

#### Methods

##### buildPrompt(context: PromptContext): string

완전한 프롬프트를 생성합니다.

```typescript
interface PromptContext {
  visualizationType: VisualizationType;
  schemaInfo: SchemaInfo;
  templateContent: string;
  userPrompt: string;
  projectContext?: ProjectContext;
}
```

##### optimizePrompt(prompt: string, options: OptimizationOptions): string

프롬프트를 최적화합니다.

```typescript
interface OptimizationOptions {
  maxTokens?: number;           // 최대 토큰 수
  preserveSections?: string[];  // 보존할 섹션
  focusAreas?: string[];       // 집중 영역
}
```

### SettingsManager

Gemini CLI 설정을 관리합니다.

```typescript
import { SettingsManager } from 'vibecraft-agent/settings';
```

#### Methods

##### createSettings(options: SettingsOptions): Promise<string>

settings.json 파일을 생성합니다.

```typescript
interface SettingsOptions {
  workingDirectory: string;
  sqlitePath: string;
  mcpServerPath?: string;
}
```

##### updateSettings(settingsPath: string, updates: Partial<Settings>): Promise<void>

기존 설정을 업데이트합니다.

### ExecutionEngine

Gemini CLI 실행을 관리합니다.

```typescript
import { ExecutionEngine } from 'vibecraft-agent/execution';
```

#### Methods

##### execute(options: ExecutionOptions): Promise<ExecutionResult>

Gemini CLI를 실행합니다.

```typescript
interface ExecutionOptions {
  workingDirectory: string;
  settingsPath: string;
  prompt: string;
  timeout?: number;
}
```

이 메서드는 EventEmitter를 확장하여 실행 중 이벤트를 발생시킵니다:
- `start`: 실행 시작
- `log`: 로그 메시지
- `error`: 에러 발생
- `complete`: 실행 완료

**Example:**
```typescript
const engine = new ExecutionEngine();

engine.on('log', (data) => {
  console.log('Gemini:', data);
});

const result = await engine.execute({
  workingDirectory: './output',
  settingsPath: './.gemini/settings.json',
  prompt: 'Create a dashboard...'
});
```

### OutputValidator

생성된 앱의 유효성을 검증합니다.

```typescript
import { OutputValidator } from 'vibecraft-agent/validation';
```

#### Methods

##### validate(outputDir: string, options?: ValidationOptions): Promise<ValidationResult>

생성된 앱을 검증합니다.

```typescript
interface ValidationOptions {
  rules?: ValidationRule[];     // 커스텀 검증 규칙
  skipNonCritical?: boolean;   // 비필수 검증 건너뛰기
}
```

## Interfaces & Types

### VisualizationType

```typescript
type VisualizationType = 
  | 'time-series'       // 시계열 분석
  | 'geo-spatial'       // 지리공간 시각화
  | 'gantt-chart'       // 간트 차트
  | 'kpi-dashboard'     // KPI 대시보드
  | 'comparison'        // 비교 분석
  | 'funnel-analysis'   // 퍼널 분석
  | 'cohort-analysis'   // 코호트 분석
  | 'heatmap'          // 히트맵
  | 'network-graph'     // 네트워크 그래프
  | 'custom';          // 사용자 정의
```

### SchemaInfo

```typescript
interface SchemaInfo {
  tables: TableInfo[];
  relationships: Relationship[];
  metadata: DatabaseMetadata;
  statistics?: DataStatistics;
}

interface TableInfo {
  name: string;
  columns: ColumnInfo[];
  primaryKey?: string;
  foreignKeys: ForeignKey[];
  indexes: Index[];
  rowCount: number;
  sampleData?: any[];
}

interface ColumnInfo {
  name: string;
  type: string;
  nullable: boolean;
  defaultValue?: any;
  isPrimaryKey: boolean;
  isForeignKey: boolean;
  isUnique: boolean;
  dataType?: DataType;
}
```

### ValidationResult

```typescript
interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  checkedFiles: string[];
  summary: ValidationSummary;
}

interface ValidationError {
  rule: string;
  message: string;
  file?: string;
  severity: 'critical' | 'error';
}
```

### Template

```typescript
interface Template {
  type: VisualizationType;
  metadata: TemplateMetadata;
  content: string;
  variables: TemplateVariable[];
}

interface TemplateMetadata {
  name: string;
  description: string;
  author?: string;
  version: string;
  tags: string[];
  requirements: TemplateRequirements;
}
```

## Error Handling

### VibeCraftError

커스텀 에러 클래스입니다.

```typescript
import { VibeCraftError, ErrorCode } from 'vibecraft-agent/errors';
```

#### Error Codes

```typescript
enum ErrorCode {
  // CLI 에러
  INVALID_ARGS = 'INVALID_ARGS',
  MISSING_REQUIRED_ARG = 'MISSING_REQUIRED_ARG',
  
  // 파일 시스템 에러
  FILE_NOT_FOUND = 'FILE_NOT_FOUND',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  
  // SQLite 에러
  SQLITE_CONNECTION_FAILED = 'SQLITE_CONNECTION_FAILED',
  INVALID_SQLITE_FILE = 'INVALID_SQLITE_FILE',
  
  // Gemini 에러
  GEMINI_NOT_FOUND = 'GEMINI_NOT_FOUND',
  GEMINI_EXECUTION_FAILED = 'GEMINI_EXECUTION_FAILED',
  
  // 검증 에러
  VALIDATION_FAILED = 'VALIDATION_FAILED',
  MISSING_REQUIRED_FILES = 'MISSING_REQUIRED_FILES'
}
```

#### Usage

```typescript
try {
  // 작업 수행
} catch (error) {
  if (error instanceof VibeCraftError) {
    console.error(`에러 코드: ${error.code}`);
    console.error(`메시지: ${error.message}`);
    
    if (error.isRecoverable) {
      // 복구 시도
    }
  }
}
```

## Utilities

### Logger

로깅 유틸리티입니다.

```typescript
import { Logger } from 'vibecraft-agent/utils';
```

#### Usage

```typescript
const logger = Logger.getInstance();
logger.setLevel('debug');

logger.info('정보 메시지');
logger.debug('디버그 메시지');
logger.error('에러 메시지', error);
```

### FileManager

파일 작업 유틸리티입니다.

```typescript
import { FileManager } from 'vibecraft-agent/utils';
```

#### Methods

- `ensureDirectory(path: string): Promise<void>`
- `copyFile(src: string, dest: string): Promise<void>`
- `readJSON(path: string): Promise<any>`
- `writeJSON(path: string, data: any): Promise<void>`
- `getFileHash(path: string): Promise<string>`

### ProgressTracker

진행 상황 추적 유틸리티입니다.

```typescript
import { ProgressTracker } from 'vibecraft-agent/utils';
```

#### Usage

```typescript
const tracker = new ProgressTracker();

tracker.start('데이터베이스 분석 중...');
// 작업 수행
tracker.succeed('데이터베이스 분석 완료');

tracker.start('템플릿 렌더링 중...');
// 작업 수행
tracker.fail('템플릿 렌더링 실패');
```

## Examples

### 완전한 예제: 프로그래매틱 사용

```typescript
import {
  VibeCraftAgent,
  SchemaAnalyzer,
  TemplateEngine,
  Logger
} from 'vibecraft-agent';

async function createVisualization() {
  // 로거 설정
  const logger = Logger.getInstance();
  logger.setLevel('info');
  
  // 스키마 분석
  const analyzer = new SchemaAnalyzer();
  const schema = await analyzer.analyze('./sales.sqlite');
  
  logger.info(`발견된 테이블: ${schema.tables.length}개`);
  
  // 템플릿 확인
  const engine = new TemplateEngine();
  const template = await engine.loadTemplate('time-series');
  
  // 에이전트 실행
  const agent = new VibeCraftAgent({ debug: true });
  
  const result = await agent.execute({
    sqlitePath: './sales.sqlite',
    visualizationType: 'time-series',
    userPrompt: '월별 매출 트렌드 분석 대시보드',
    outputDir: './dashboard',
    projectName: 'Sales Analytics'
  });
  
  if (result.success) {
    logger.info(`✓ 앱이 성공적으로 생성되었습니다!`);
    logger.info(`  경로: ${result.outputPath}`);
    logger.info(`  실행 시간: ${result.executionTime}ms`);
  } else {
    logger.error('✗ 앱 생성 실패:', result.error);
  }
}

// 실행
createVisualization().catch(console.error);
```

### 커스텀 검증 규칙 추가

```typescript
import { OutputValidator, ValidationRule } from 'vibecraft-agent/validation';

const customRules: ValidationRule[] = [
  {
    name: 'custom-dependency-check',
    description: '커스텀 라이브러리 확인',
    severity: 'error',
    check: async (context) => {
      const pkg = await context.readJSON('package.json');
      return {
        passed: pkg.dependencies['my-custom-lib'] !== undefined,
        message: 'my-custom-lib가 필요합니다'
      };
    }
  }
];

const validator = new OutputValidator();
const result = await validator.validateWithCustomRules(
  './output',
  customRules
);
```

### 이벤트 기반 실행 모니터링

```typescript
import { ExecutionEngine } from 'vibecraft-agent/execution';

const engine = new ExecutionEngine();

// 이벤트 리스너 설정
engine.on('start', () => {
  console.log('Gemini CLI 실행 시작...');
});

engine.on('log', (data) => {
  console.log(`[Gemini] ${data}`);
});

engine.on('error', (error) => {
  console.error('에러 발생:', error);
});

engine.on('complete', (result) => {
  console.log('실행 완료:', result);
});

// 실행
await engine.execute({
  workingDirectory: './output',
  settingsPath: './.gemini/settings.json',
  prompt: 'Create a dashboard...',
  timeout: 300000
});
```

### 배치 처리

```typescript
import { VibeCraftAgent } from 'vibecraft-agent';

async function batchProcess(databases: string[]) {
  const agent = new VibeCraftAgent();
  const results = [];
  
  for (const dbPath of databases) {
    try {
      const result = await agent.execute({
        sqlitePath: dbPath,
        visualizationType: 'kpi-dashboard',
        userPrompt: 'Create KPI dashboard',
        outputDir: `./output/${path.basename(dbPath, '.sqlite')}`
      });
      
      results.push({
        database: dbPath,
        success: result.success,
        outputPath: result.outputPath
      });
    } catch (error) {
      results.push({
        database: dbPath,
        success: false,
        error: error.message
      });
    }
  }
  
  return results;
}
```

## API 레퍼런스 요약

### 주요 클래스
- `VibeCraftAgent`: 메인 에이전트
- `SchemaAnalyzer`: 스키마 분석
- `TemplateEngine`: 템플릿 관리
- `PromptBuilder`: 프롬프트 생성
- `SettingsManager`: 설정 관리
- `ExecutionEngine`: 실행 관리
- `OutputValidator`: 검증

### 주요 타입
- `VisualizationType`: 시각화 타입
- `AgentCliArgs`: CLI 인자
- `SchemaInfo`: 스키마 정보
- `ValidationResult`: 검증 결과
- `Template`: 템플릿

### 에러 처리
- `VibeCraftError`: 커스텀 에러
- `ErrorCode`: 에러 코드

### 유틸리티
- `Logger`: 로깅
- `FileManager`: 파일 작업
- `ProgressTracker`: 진행 추적