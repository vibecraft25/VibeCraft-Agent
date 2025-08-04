# Task 12: 통합 테스트 및 디버깅

## 목표
전체 시스템의 통합 테스트를 구현하고 디버깅 전략을 수립합니다.

## 작업 내용

### 12.1 통합 테스트 구조
```typescript
// tests/integration/agent.integration.test.ts
import { VibeCraftAgent } from '../../src/core/agent';
import { TestHelper } from '../helpers/test-helper';
import path from 'path';
import fs from 'fs-extra';

describe('VibeCraftAgent Integration Tests', () => {
  let agent: VibeCraftAgent;
  let testDir: string;
  
  beforeAll(async () => {
    agent = new VibeCraftAgent();
    testDir = await TestHelper.createTestDirectory();
  });
  
  afterAll(async () => {
    await TestHelper.cleanupTestDirectory(testDir);
  });
  
  describe('End-to-End Workflow', () => {
    test('should generate time-series visualization successfully', async () => {
      // 테스트 SQLite 데이터베이스 생성
      const sqlitePath = await TestHelper.createTestDatabase('time-series');
      const outputDir = path.join(testDir, 'time-series-output');
      
      const args = {
        sqlitePath,
        visualizationType: 'time-series',
        userPrompt: '월별 매출 추이를 보여주는 대시보드',
        outputDir,
        debug: true
      };
      
      // 에이전트 실행
      const result = await agent.execute(args);
      
      // 결과 검증
      expect(result.success).toBe(true);
      expect(result.outputPath).toBe(outputDir);
      expect(result.generatedFiles).toContain('package.json');
      expect(result.generatedFiles).toContain('src/App.tsx');
      expect(result.generatedFiles).toContain('public/data.sqlite');
      
      // 생성된 파일 내용 검증
      const packageJson = await fs.readJson(path.join(outputDir, 'package.json'));
      expect(packageJson.dependencies).toHaveProperty('react');
      expect(packageJson.dependencies).toHaveProperty('sql.js');
      expect(packageJson.dependencies).toHaveProperty('recharts');
    }, 300000); // 5분 타임아웃
    
    test('should handle geo-spatial visualization', async () => {
      const sqlitePath = await TestHelper.createTestDatabase('geo-spatial');
      const outputDir = path.join(testDir, 'geo-spatial-output');
      
      const args = {
        sqlitePath,
        visualizationType: 'geo-spatial',
        userPrompt: '매장 위치별 매출을 지도에 표시',
        outputDir,
        debug: true
      };
      
      const result = await agent.execute(args);
      
      expect(result.success).toBe(true);
      
      // Leaflet 관련 의존성 확인
      const packageJson = await fs.readJson(path.join(outputDir, 'package.json'));
      expect(packageJson.dependencies).toHaveProperty('react-leaflet');
      expect(packageJson.dependencies).toHaveProperty('leaflet');
    }, 300000);
  });
  
  describe('Error Handling', () => {
    test('should handle invalid SQLite file', async () => {
      const args = {
        sqlitePath: '/invalid/path/to/database.sqlite',
        visualizationType: 'time-series',
        userPrompt: 'test',
        outputDir: path.join(testDir, 'error-output')
      };
      
      const result = await agent.execute(args);
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.code).toBe('FILE_NOT_FOUND');
    });
    
    test('should handle invalid visualization type', async () => {
      const sqlitePath = await TestHelper.createTestDatabase('simple');
      
      const args = {
        sqlitePath,
        visualizationType: 'invalid-type' as any,
        userPrompt: 'test',
        outputDir: path.join(testDir, 'error-output')
      };
      
      const result = await agent.execute(args);
      
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_ARGS');
    });
  });
});
```

### 12.2 테스트 헬퍼 유틸리티
```typescript
// tests/helpers/test-helper.ts
import { Database } from 'sqlite3';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';

export class TestHelper {
  private static testDatabases = new Map<string, string>();
  
  static async createTestDirectory(): Promise<string> {
    const tmpDir = path.join(os.tmpdir(), `vibecraft-test-${Date.now()}`);
    await fs.ensureDir(tmpDir);
    return tmpDir;
  }
  
  static async cleanupTestDirectory(dir: string): Promise<void> {
    await fs.remove(dir);
  }
  
  static async createTestDatabase(type: string): Promise<string> {
    // 캐시된 데이터베이스 확인
    if (this.testDatabases.has(type)) {
      return this.testDatabases.get(type)!;
    }
    
    const dbPath = path.join(os.tmpdir(), `test-${type}-${Date.now()}.sqlite`);
    const db = new Database(dbPath);
    
    return new Promise((resolve, reject) => {
      db.serialize(() => {
        switch (type) {
          case 'time-series':
            this.createTimeSeriesSchema(db);
            break;
          case 'geo-spatial':
            this.createGeoSpatialSchema(db);
            break;
          case 'simple':
            this.createSimpleSchema(db);
            break;
          default:
            this.createSimpleSchema(db);
        }
        
        db.close((err) => {
          if (err) reject(err);
          else {
            this.testDatabases.set(type, dbPath);
            resolve(dbPath);
          }
        });
      });
    });
  }
  
  private static createTimeSeriesSchema(db: Database): void {
    // 시계열 테스트 데이터
    db.run(`
      CREATE TABLE sales (
        id INTEGER PRIMARY KEY,
        date DATE NOT NULL,
        amount DECIMAL(10,2),
        product_id INTEGER,
        region VARCHAR(50)
      )
    `);
    
    // 샘플 데이터 삽입
    const stmt = db.prepare(`
      INSERT INTO sales (date, amount, product_id, region) 
      VALUES (?, ?, ?, ?)
    `);
    
    const startDate = new Date('2024-01-01');
    for (let i = 0; i < 365; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      
      stmt.run(
        date.toISOString().split('T')[0],
        Math.random() * 10000,
        Math.floor(Math.random() * 10) + 1,
        ['North', 'South', 'East', 'West'][Math.floor(Math.random() * 4)]
      );
    }
    
    stmt.finalize();
  }
  
  private static createGeoSpatialSchema(db: Database): void {
    // 지리공간 테스트 데이터
    db.run(`
      CREATE TABLE stores (
        id INTEGER PRIMARY KEY,
        name VARCHAR(100),
        latitude DECIMAL(10,8),
        longitude DECIMAL(11,8),
        revenue DECIMAL(12,2),
        city VARCHAR(50)
      )
    `);
    
    // 샘플 매장 데이터
    const stores = [
      { name: 'Store A', lat: 37.5665, lng: 126.9780, revenue: 1000000, city: 'Seoul' },
      { name: 'Store B', lat: 35.6762, lng: 139.6503, revenue: 1500000, city: 'Tokyo' },
      { name: 'Store C', lat: 40.7128, lng: -74.0060, revenue: 2000000, city: 'New York' }
    ];
    
    const stmt = db.prepare(`
      INSERT INTO stores (name, latitude, longitude, revenue, city) 
      VALUES (?, ?, ?, ?, ?)
    `);
    
    stores.forEach(store => {
      stmt.run(store.name, store.lat, store.lng, store.revenue, store.city);
    });
    
    stmt.finalize();
  }
  
  private static createSimpleSchema(db: Database): void {
    db.run(`
      CREATE TABLE users (
        id INTEGER PRIMARY KEY,
        name VARCHAR(100),
        email VARCHAR(100)
      )
    `);
  }
}
```

### 12.3 모의 객체 및 스텁
```typescript
// tests/mocks/gemini-cli.mock.ts
export class GeminiCLIMock {
  static setup(): void {
    // Gemini CLI 실행을 모의
    jest.mock('child_process', () => ({
      spawn: jest.fn().mockImplementation((command, args, options) => {
        if (command === 'gemini') {
          return this.createMockProcess();
        }
        return null;
      })
    }));
  }
  
  private static createMockProcess() {
    const EventEmitter = require('events');
    const mockProcess = new EventEmitter();
    
    mockProcess.stdout = new EventEmitter();
    mockProcess.stderr = new EventEmitter();
    mockProcess.pid = 12345;
    
    // 모의 출력 생성
    setTimeout(() => {
      mockProcess.stdout.emit('data', 'Generating React app...\n');
      mockProcess.stdout.emit('data', 'Creating components...\n');
      mockProcess.stdout.emit('data', 'Installing dependencies...\n');
      
      // 모의 파일 생성
      this.generateMockFiles();
      
      mockProcess.emit('close', 0);
    }, 100);
    
    mockProcess.kill = jest.fn();
    
    return mockProcess;
  }
  
  private static generateMockFiles(): void {
    // 테스트 환경에서 실제 파일 생성을 모의
  }
}
```

### 12.4 성능 테스트
```typescript
// tests/performance/performance.test.ts
import { PerformanceMonitor } from '../helpers/performance-monitor';

describe('Performance Tests', () => {
  let monitor: PerformanceMonitor;
  
  beforeEach(() => {
    monitor = new PerformanceMonitor();
  });
  
  test('schema extraction should complete within 1 second', async () => {
    const startTime = monitor.start('schema-extraction');
    
    // 대용량 데이터베이스로 테스트
    const largeSqlitePath = await TestHelper.createLargeDatabase(10000);
    const analyzer = new SchemaAnalyzer();
    
    await analyzer.analyze(largeSqlitePath);
    
    const duration = monitor.end('schema-extraction');
    expect(duration).toBeLessThan(1000); // 1초 이내
  });
  
  test('template rendering should be fast', async () => {
    const engine = new TemplateEngine();
    const template = engine.loadTemplate('time-series');
    
    const startTime = monitor.start('template-render');
    
    const rendered = engine.renderTemplate(template, {
      schemaInfo: TestHelper.createMockSchemaInfo(),
      userPrompt: 'test prompt',
      projectName: 'test-project'
    });
    
    const duration = monitor.end('template-render');
    expect(duration).toBeLessThan(100); // 100ms 이내
  });
  
  test('memory usage should stay within limits', async () => {
    const initialMemory = process.memoryUsage().heapUsed;
    
    // 여러 번 실행하여 메모리 누수 확인
    for (let i = 0; i < 10; i++) {
      const agent = new VibeCraftAgent();
      await agent.execute({
        sqlitePath: await TestHelper.createTestDatabase('simple'),
        visualizationType: 'time-series',
        userPrompt: `Test run ${i}`,
        outputDir: `/tmp/test-${i}`
      });
    }
    
    const finalMemory = process.memoryUsage().heapUsed;
    const memoryIncrease = finalMemory - initialMemory;
    
    // 메모리 증가가 100MB 이내
    expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024);
  });
});
```

### 12.5 디버깅 도구
```typescript
// src/debug/debugger.ts
export class VibeCraftDebugger {
  private static instance: VibeCraftDebugger;
  private breakpoints: Map<string, DebugBreakpoint>;
  private traceEnabled: boolean;
  
  private constructor() {
    this.breakpoints = new Map();
    this.traceEnabled = process.env.VIBECRAFT_TRACE === 'true';
  }
  
  static getInstance(): VibeCraftDebugger {
    if (!this.instance) {
      this.instance = new VibeCraftDebugger();
    }
    return this.instance;
  }
  
  setBreakpoint(id: string, condition?: (context: any) => boolean): void {
    this.breakpoints.set(id, {
      id,
      condition,
      hits: 0
    });
  }
  
  async checkBreakpoint(id: string, context: any): Promise<void> {
    const breakpoint = this.breakpoints.get(id);
    if (!breakpoint) return;
    
    if (!breakpoint.condition || breakpoint.condition(context)) {
      breakpoint.hits++;
      await this.pause(id, context);
    }
  }
  
  private async pause(id: string, context: any): Promise<void> {
    console.log(`\n🔴 Breakpoint hit: ${id}`);
    console.log('Context:', JSON.stringify(context, null, 2));
    
    if (process.env.VIBECRAFT_INTERACTIVE === 'true') {
      // 대화형 디버깅 모드
      const readline = require('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      await new Promise(resolve => {
        rl.question('Press Enter to continue...', () => {
          rl.close();
          resolve(null);
        });
      });
    }
  }
  
  trace(category: string, message: string, data?: any): void {
    if (!this.traceEnabled) return;
    
    const timestamp = new Date().toISOString();
    const trace = {
      timestamp,
      category,
      message,
      data,
      stack: new Error().stack
    };
    
    console.log(chalk.gray(`[TRACE] ${category}: ${message}`));
    if (data) {
      console.log(chalk.gray(JSON.stringify(data, null, 2)));
    }
    
    // 파일에도 기록
    if (process.env.VIBECRAFT_TRACE_FILE) {
      fs.appendFileSync(
        process.env.VIBECRAFT_TRACE_FILE,
        JSON.stringify(trace) + '\n'
      );
    }
  }
  
  dumpState(state: any, filename?: string): void {
    const dump = {
      timestamp: new Date().toISOString(),
      state,
      memory: process.memoryUsage(),
      uptime: process.uptime()
    };
    
    if (filename) {
      fs.writeFileSync(filename, JSON.stringify(dump, null, 2));
      console.log(`State dumped to ${filename}`);
    } else {
      console.log('State dump:', JSON.stringify(dump, null, 2));
    }
  }
}

interface DebugBreakpoint {
  id: string;
  condition?: (context: any) => boolean;
  hits: number;
}
```

### 12.6 E2E 테스트 시나리오
```typescript
// tests/e2e/scenarios.test.ts
describe('E2E Scenarios', () => {
  test('Complete workflow from CLI to running app', async () => {
    // 1. CLI 명령 실행
    const { stdout, stderr } = await execAsync(`
      node dist/cli.js \
        --sqlite-path ./test-data/sales.sqlite \
        --visualization-type time-series \
        --user-prompt "월별 매출 대시보드" \
        --output-dir ./test-output
    `);
    
    expect(stderr).toBe('');
    expect(stdout).toContain('React app generated successfully');
    
    // 2. 생성된 앱에서 npm install 실행
    await execAsync('npm install', { cwd: './test-output' });
    
    // 3. 앱 빌드 테스트
    const buildResult = await execAsync('npm run build', { 
      cwd: './test-output' 
    });
    
    expect(buildResult.stderr).toBe('');
    expect(fs.existsSync('./test-output/build')).toBe(true);
  });
});
```

## 완료 기준
- [ ] 통합 테스트 프레임워크 구성
- [ ] E2E 테스트 시나리오 작성
- [ ] 모의 객체 및 스텁 구현
- [ ] 성능 테스트 구현
- [ ] 디버깅 도구 구현
- [ ] 테스트 커버리지 80% 이상 달성