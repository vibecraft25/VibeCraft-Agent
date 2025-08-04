# Task 3: Request Parser 모듈 구현

## 목표
CLI 인자를 파싱하고 검증하는 Request Parser 모듈을 구현합니다.

## 작업 내용

### 3.1 Request Parser 인터페이스 정의
```typescript
// src/core/parser.ts
import { AgentCliArgs, VisualizationType } from '../types';
import { validateSqlitePath, validateVisualizationType, validateOutputDir } from '../utils/validation';
import path from 'path';
import fs from 'fs-extra';

export interface IRequestParser {
  parse(args: any): AgentCliArgs;
  validate(request: AgentCliArgs): ValidationResult;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export class RequestParser implements IRequestParser {
  parse(args: any): AgentCliArgs {
    // 경로 정규화
    const sqlitePath = path.resolve(args.sqlitePath);
    const outputDir = path.resolve(args.outputDir || './output');
    
    // 프로젝트 이름 자동 생성 (제공되지 않은 경우)
    const projectName = args.projectName || this.generateProjectName(args.visualizationType);
    
    return {
      sqlitePath,
      visualizationType: args.visualizationType,
      userPrompt: args.userPrompt,
      outputDir,
      projectName,
      debug: Boolean(args.debug)
    };
  }
  
  validate(request: AgentCliArgs): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // SQLite 파일 검증
    try {
      validateSqlitePath(request.sqlitePath);
    } catch (error: any) {
      errors.push(`SQLite validation failed: ${error.message}`);
    }
    
    // 시각화 타입 검증
    try {
      validateVisualizationType(request.visualizationType);
    } catch (error: any) {
      errors.push(`Visualization type validation failed: ${error.message}`);
    }
    
    // 출력 디렉토리 검증
    try {
      validateOutputDir(request.outputDir);
    } catch (error: any) {
      errors.push(`Output directory validation failed: ${error.message}`);
    }
    
    // 사용자 프롬프트 검증
    if (!request.userPrompt || request.userPrompt.trim().length === 0) {
      errors.push('User prompt cannot be empty');
    } else if (request.userPrompt.length < 10) {
      warnings.push('User prompt is very short. Consider providing more details for better results.');
    }
    
    // 프로젝트 이름 검증
    if (request.projectName && !this.isValidProjectName(request.projectName)) {
      errors.push('Project name contains invalid characters. Use only letters, numbers, hyphens, and underscores.');
    }
    
    // 파일 크기 확인 (경고)
    if (errors.length === 0) {
      const stats = fs.statSync(request.sqlitePath);
      const sizeMB = stats.size / (1024 * 1024);
      if (sizeMB > 100) {
        warnings.push(`SQLite file is large (${sizeMB.toFixed(2)} MB). Processing may take longer.`);
      }
    }
    
    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }
  
  private generateProjectName(visualizationType: string): string {
    const timestamp = new Date().toISOString().split('T')[0].replace(/-/g, '');
    return `vibecraft-${visualizationType}-${timestamp}`;
  }
  
  private isValidProjectName(name: string): boolean {
    return /^[a-zA-Z0-9-_]+$/.test(name);
  }
}
```

### 3.2 고급 검증 로직
```typescript
// src/core/parser-advanced.ts
import { Database } from 'sqlite3';

export class AdvancedValidator {
  async validateSQLiteSchema(sqlitePath: string): Promise<SchemaValidationResult> {
    const db = new Database(sqlitePath, { readonly: true });
    
    try {
      // 테이블 존재 여부 확인
      const tables = await this.getTables(db);
      if (tables.length === 0) {
        return {
          valid: false,
          error: 'Database contains no tables'
        };
      }
      
      // 각 테이블에 대한 기본 검증
      for (const table of tables) {
        const columns = await this.getColumns(db, table);
        if (columns.length === 0) {
          return {
            valid: false,
            error: `Table ${table} has no columns`
          };
        }
      }
      
      return {
        valid: true,
        tables,
        totalRows: await this.getTotalRows(db, tables)
      };
      
    } finally {
      db.close();
    }
  }
  
  private getTables(db: Database): Promise<string[]> {
    return new Promise((resolve, reject) => {
      db.all(
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'",
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows.map(row => row.name));
        }
      );
    });
  }
  
  private getColumns(db: Database, tableName: string): Promise<any[]> {
    return new Promise((resolve, reject) => {
      db.all(`PRAGMA table_info(${tableName})`, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }
  
  private getTotalRows(db: Database, tables: string[]): Promise<number> {
    // 총 행 수 계산 (성능 체크용)
    return Promise.resolve(0); // 간단한 구현
  }
}
```

### 3.3 요청 정규화 및 추가 검증
```typescript
// src/core/request-normalizer.ts
export class RequestNormalizer {
  normalizeRequest(request: AgentCliArgs): NormalizedRequest {
    return {
      ...request,
      sqlitePath: path.resolve(request.sqlitePath),
      outputDir: this.normalizeOutputDir(request.outputDir),
      projectName: this.normalizeProjectName(request.projectName, request.visualizationType),
      // 사용자 프롬프트는 그대로 전달 (백엔드에서 이미 처리됨)
      userPrompt: request.userPrompt.trim()
    };
  }
  
  private normalizeOutputDir(dir: string): string {
    // 출력 디렉토리 정규화 및 생성
    const normalizedPath = path.resolve(dir);
    
    // 타임스탬프 추가 옵션
    if (process.env.VIBECRAFT_ADD_TIMESTAMP === 'true') {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      return path.join(normalizedPath, timestamp);
    }
    
    return normalizedPath;
  }
  
  private normalizeProjectName(name: string | undefined, vizType: string): string {
    if (name) {
      // 특수문자 제거 및 케밥케이스 변환
      return name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    }
    
    // 기본 프로젝트 이름 생성
    const timestamp = Date.now();
    return `vibecraft-${vizType}-${timestamp}`;
  }
}

interface NormalizedRequest extends AgentCliArgs {
  // 정규화된 요청 객체
}
```

### 3.4 Parser 통합 테스트
```typescript
// tests/parser.test.ts
import { RequestParser } from '../src/core/parser';

describe('RequestParser', () => {
  let parser: RequestParser;
  
  beforeEach(() => {
    parser = new RequestParser();
  });
  
  test('should parse valid arguments correctly', () => {
    const args = {
      sqlitePath: './test.sqlite',
      visualizationType: 'time-series',
      userPrompt: '월별 매출 추이 대시보드',
      outputDir: './output',
      debug: true
    };
    
    const result = parser.parse(args);
    expect(result.sqlitePath).toContain('test.sqlite');
    expect(result.visualizationType).toBe('time-series');
    expect(result.debug).toBe(true);
  });
  
  test('should validate SQLite file existence', () => {
    const request = {
      sqlitePath: '/non/existent/file.sqlite',
      visualizationType: 'time-series',
      userPrompt: 'test',
      outputDir: './output'
    };
    
    const validation = parser.validate(request);
    expect(validation.valid).toBe(false);
    expect(validation.errors).toContain('SQLite file not found');
  });
});
```

## 완료 기준
- [ ] Request Parser 인터페이스 구현
- [ ] 기본 검증 로직 구현
- [ ] 고급 SQLite 스키마 검증
- [ ] 요청 정규화 로직 구현
- [ ] 단위 테스트 작성