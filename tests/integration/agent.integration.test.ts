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
        visualizationType: 'time-series' as const,
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
      
      // App.tsx 파일 검증
      const appContent = await fs.readFile(path.join(outputDir, 'src/App.tsx'), 'utf-8');
      expect(appContent).toContain('import');
      expect(appContent).toContain('React');
      
      // SQLite 파일이 복사되었는지 확인
      const sqliteExists = await fs.pathExists(path.join(outputDir, 'public/data.sqlite'));
      expect(sqliteExists).toBe(true);
    }, 300000); // 5분 타임아웃
    
    test('should handle geo-spatial visualization', async () => {
      const sqlitePath = await TestHelper.createTestDatabase('geo-spatial');
      const outputDir = path.join(testDir, 'geo-spatial-output');
      
      const args = {
        sqlitePath,
        visualizationType: 'geo-spatial' as const,
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
    
    test('should handle gantt-chart visualization', async () => {
      const sqlitePath = await TestHelper.createTestDatabase('gantt');
      const outputDir = path.join(testDir, 'gantt-output');
      
      const args = {
        sqlitePath,
        visualizationType: 'gantt-chart' as const,
        userPrompt: '프로젝트 일정을 간트차트로 표시',
        outputDir,
        debug: false
      };
      
      const result = await agent.execute(args);
      
      expect(result.success).toBe(true);
      expect(result.validationResult?.passed).toBe(true);
    }, 300000);
    
    test('should handle kpi-dashboard visualization', async () => {
      const sqlitePath = await TestHelper.createTestDatabase('kpi');
      const outputDir = path.join(testDir, 'kpi-output');
      
      const args = {
        sqlitePath,
        visualizationType: 'kpi-dashboard' as const,
        userPrompt: '주요 지표를 실시간으로 보여주는 대시보드',
        outputDir,
        projectName: 'kpi-monitor'
      };
      
      const result = await agent.execute(args);
      
      expect(result.success).toBe(true);
      
      // KPI 대시보드 특화 검증
      const packageJson = await fs.readJson(path.join(outputDir, 'package.json'));
      expect(packageJson.name).toBe('kpi-monitor');
    }, 300000);
  });
  
  describe('Error Handling', () => {
    test('should handle invalid SQLite file', async () => {
      const args = {
        sqlitePath: '/invalid/path/to/database.sqlite',
        visualizationType: 'time-series' as const,
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
    
    test('should handle corrupted database', async () => {
      // 손상된 파일 생성
      const corruptPath = path.join(testDir, 'corrupt.sqlite');
      await fs.writeFile(corruptPath, 'This is not a valid SQLite file');
      
      const args = {
        sqlitePath: corruptPath,
        visualizationType: 'time-series' as const,
        userPrompt: 'test',
        outputDir: path.join(testDir, 'corrupt-output')
      };
      
      const result = await agent.execute(args);
      
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('SQLITE_ERROR');
    });
    
    test('should handle output directory permission issues', async () => {
      const sqlitePath = await TestHelper.createTestDatabase('simple');
      const readOnlyDir = '/root/readonly'; // 권한이 없는 디렉토리
      
      const args = {
        sqlitePath,
        visualizationType: 'time-series' as const,
        userPrompt: 'test',
        outputDir: readOnlyDir
      };
      
      const result = await agent.execute(args);
      
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('PERMISSION_DENIED');
    });
  });
  
  describe('Edge Cases', () => {
    test('should handle empty database', async () => {
      const emptyDbPath = path.join(testDir, 'empty.sqlite');
      const db = new (require('sqlite3').Database)(emptyDbPath);
      
      await new Promise<void>((resolve, reject) => {
        db.close((err: any) => {
          if (err) reject(err);
          else resolve();
        });
      });
      
      const args = {
        sqlitePath: emptyDbPath,
        visualizationType: 'time-series' as const,
        userPrompt: 'Show empty data',
        outputDir: path.join(testDir, 'empty-output')
      };
      
      const result = await agent.execute(args);
      
      // 빈 데이터베이스도 처리할 수 있어야 함
      expect(result.success).toBe(true);
    });
    
    test('should handle very long user prompts', async () => {
      const sqlitePath = await TestHelper.createTestDatabase('simple');
      const longPrompt = 'A'.repeat(10000); // 10,000자 프롬프트
      
      const args = {
        sqlitePath,
        visualizationType: 'custom' as const,
        userPrompt: longPrompt,
        outputDir: path.join(testDir, 'long-prompt-output')
      };
      
      const result = await agent.execute(args);
      
      // 긴 프롬프트도 처리되어야 함
      expect(result.success).toBe(true);
    });
    
    test('should handle special characters in project name', async () => {
      const sqlitePath = await TestHelper.createTestDatabase('simple');
      
      const args = {
        sqlitePath,
        visualizationType: 'time-series' as const,
        userPrompt: 'test',
        outputDir: path.join(testDir, 'special-chars-output'),
        projectName: 'test@#$%^&*()'
      };
      
      const result = await agent.execute(args);
      
      expect(result.success).toBe(true);
      
      // 프로젝트 이름이 정규화되었는지 확인
      const packageJson = await fs.readJson(
        path.join(result.outputPath!, 'package.json')
      );
      expect(packageJson.name).toMatch(/^[a-z0-9-]+$/);
    });
  });
  
  describe('Template Integration', () => {
    const templates: Array<{ type: string; dbType: string }> = [
      { type: 'time-series', dbType: 'time-series' },
      { type: 'geo-spatial', dbType: 'geo-spatial' },
      { type: 'gantt-chart', dbType: 'gantt' },
      { type: 'kpi-dashboard', dbType: 'kpi' },
      { type: 'comparison', dbType: 'time-series' },
      { type: 'funnel-analysis', dbType: 'simple' },
      { type: 'cohort-analysis', dbType: 'time-series' },
      { type: 'heatmap', dbType: 'time-series' },
      { type: 'network-graph', dbType: 'simple' },
      { type: 'custom', dbType: 'simple' }
    ];
    
    templates.forEach(({ type, dbType }) => {
      test(`should generate ${type} visualization`, async () => {
        const sqlitePath = await TestHelper.createTestDatabase(dbType);
        const outputDir = path.join(testDir, `${type}-template-output`);
        
        const args = {
          sqlitePath,
          visualizationType: type as any,
          userPrompt: `Test ${type} visualization`,
          outputDir
        };
        
        const result = await agent.execute(args);
        
        expect(result.success).toBe(true);
        expect(result.templateUsed).toBe(type);
        
        // 템플릿 특화 검증
        const hasRequiredFiles = await fs.pathExists(
          path.join(outputDir, 'package.json')
        );
        expect(hasRequiredFiles).toBe(true);
      }, 300000);
    });
  });
});