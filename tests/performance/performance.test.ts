import { PerformanceMonitor } from '../helpers/performance-monitor';
import { TestHelper } from '../helpers/test-helper';
import { SchemaAnalyzer } from '../../src/core/schema-analyzer';
import { TemplateEngine } from '../../src/core/template-engine';
import { PromptBuilder } from '../../src/core/prompt-builder';
import { VibeCraftAgent } from '../../src/core/agent';
import fs from 'fs-extra';
import path from 'path';

describe('Performance Tests', () => {
  let monitor: PerformanceMonitor;
  let testDir: string;
  
  beforeAll(async () => {
    testDir = await TestHelper.createTestDirectory();
  });
  
  afterAll(async () => {
    await TestHelper.cleanupTestDirectory(testDir);
  });
  
  beforeEach(() => {
    monitor = new PerformanceMonitor();
  });
  
  afterEach(() => {
    // 각 테스트 후 성능 리포트 출력
    if (process.env.SHOW_PERF_REPORT === 'true') {
      console.log(monitor.generateReport());
    }
  });
  
  describe('Schema Analysis Performance', () => {
    test('schema extraction should complete within 1 second for small DB', async () => {
      const sqlitePath = await TestHelper.createTestDatabase('time-series');
      const analyzer = new SchemaAnalyzer();
      
      monitor.start('schema-extraction-small');
      await analyzer.analyze(sqlitePath);
      const duration = monitor.end('schema-extraction-small');
      
      expect(duration).toBeLessThan(1000); // 1초 이내
    });
    
    test('schema extraction should handle large databases efficiently', async () => {
      // 대용량 데이터베이스로 테스트 (10,000 레코드)
      const largeSqlitePath = await TestHelper.createLargeDatabase(10000);
      const analyzer = new SchemaAnalyzer();
      
      monitor.start('schema-extraction-large');
      const schema = await analyzer.analyze(largeSqlitePath);
      const duration = monitor.end('schema-extraction-large');
      
      expect(duration).toBeLessThan(5000); // 5초 이내
      expect(schema.tables.length).toBeGreaterThan(0);
    });
    
    test('should analyze multiple tables efficiently', async () => {
      const sqlitePath = await TestHelper.createTestDatabase('time-series');
      const analyzer = new SchemaAnalyzer();
      
      // 여러 번 실행하여 평균 성능 측정
      for (let i = 0; i < 10; i++) {
        monitor.start('multi-analysis');
        await analyzer.analyze(sqlitePath);
        monitor.end('multi-analysis');
      }
      
      const stats = monitor.getStats('multi-analysis');
      expect(stats).not.toBeNull();
      expect(stats!.avg).toBeLessThan(500); // 평균 500ms 이내
      expect(stats!.p95).toBeLessThan(800); // 95 백분위수 800ms 이내
    });
  });
  
  describe('Template Engine Performance', () => {
    test('template loading should be fast', async () => {
      const engine = new TemplateEngine();
      
      // 모든 템플릿 로드 시간 측정
      const templates = [
        'time-series', 'geo-spatial', 'gantt-chart', 'kpi-dashboard',
        'comparison', 'funnel-analysis', 'cohort-analysis', 'heatmap',
        'network-graph', 'custom'
      ];
      
      for (const templateType of templates) {
        monitor.start(`template-load-${templateType}`);
        const template = await engine.loadTemplate(templateType as any);
        const duration = monitor.end(`template-load-${templateType}`);
        
        expect(duration).toBeLessThan(100); // 각 템플릿 100ms 이내 로드
        expect(template).toBeDefined();
      }
    });
    
    test('template rendering should be fast', async () => {
      const engine = new TemplateEngine();
      
      // 템플릿 렌더링 성능 테스트
      const context = {
        schemaInfo: TestHelper.createMockSchemaInfo(),
        userPrompt: 'Performance test prompt',
        projectName: 'perf-test-project',
        sqlitePath: '/tmp/test.sqlite'
      };
      
      for (let i = 0; i < 20; i++) {
        monitor.start('template-render');
        const rendered = await engine.renderTemplate('time-series' as any, context);
        const duration = monitor.end('template-render');
        
        expect(rendered).toBeDefined();
      }
      
      const stats = monitor.getStats('template-render');
      expect(stats!.avg).toBeLessThan(50); // 평균 50ms 이내
      expect(stats!.p99).toBeLessThan(100); // 99 백분위수 100ms 이내
    });
  });
  
  describe('Prompt Builder Performance', () => {
    test('prompt building should be efficient', async () => {
      const builder = new PromptBuilder();
      const schemaInfo = TestHelper.createMockSchemaInfo();
      
      // 큰 스키마 정보 생성
      schemaInfo.tables = Array(50).fill(null).map((_, i) => ({
        name: `table_${i}`,
        columns: Array(20).fill(null).map((_, j) => ({
          name: `column_${j}`,
          type: 'VARCHAR',
          isPrimary: j === 0,
          isNullable: j > 0,
          defaultValue: null
        })),
        rowCount: 10000
      }));
      
      monitor.start('prompt-build');
      const prompt = await builder.buildPrompt({
        systemPrompt: 'System prompt',
        templateContent: 'Template content',
        userPrompt: 'User prompt',
        schemaInfo,
        projectContext: {
          projectName: 'perf-test',
          outputDir: '/tmp/output'
        }
      });
      const duration = monitor.end('prompt-build');
      
      expect(duration).toBeLessThan(200); // 200ms 이내
      expect(prompt.length).toBeGreaterThan(0);
    });
    
    test('prompt optimization should not significantly impact performance', async () => {
      const builder = new PromptBuilder();
      const schemaInfo = TestHelper.createMockSchemaInfo();
      
      // 매우 긴 프롬프트 생성
      const longUserPrompt = 'A'.repeat(10000);
      
      monitor.start('prompt-optimize');
      const optimized = await builder.optimizePrompt({
        systemPrompt: 'System prompt',
        templateContent: 'Template content',
        userPrompt: longUserPrompt,
        schemaInfo,
        projectContext: {
          projectName: 'perf-test',
          outputDir: '/tmp/output'
        }
      });
      const duration = monitor.end('prompt-optimize');
      
      expect(duration).toBeLessThan(300); // 300ms 이내
      expect(optimized.length).toBeLessThan(longUserPrompt.length);
    });
  });
  
  describe('Memory Usage', () => {
    test('memory usage should stay within limits during repeated operations', async () => {
      const initialMemory = PerformanceMonitor.measureMemory();
      
      // 여러 번 실행하여 메모리 누수 확인
      for (let i = 0; i < 10; i++) {
        const agent = new VibeCraftAgent();
        const sqlitePath = await TestHelper.createTestDatabase('simple');
        
        await agent.execute({
          sqlitePath,
          visualizationType: 'time-series',
          userPrompt: `Test run ${i}`,
          outputDir: path.join(testDir, `test-${i}`)
        });
        
        // 가비지 컬렉션 강제 실행
        if (global.gc) {
          global.gc();
        }
      }
      
      const finalMemory = PerformanceMonitor.measureMemory();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      
      // 메모리 증가가 100MB 이내
      expect(memoryIncrease).toBeLessThan(100);
    });
    
    test('should handle large schema without excessive memory', async () => {
      const largeSqlitePath = await TestHelper.createLargeDatabase(50000);
      const analyzer = new SchemaAnalyzer();
      
      const beforeMemory = PerformanceMonitor.measureMemory();
      monitor.start('large-schema-memory');
      
      const schema = await analyzer.analyze(largeSqlitePath);
      
      const duration = monitor.end('large-schema-memory');
      const afterMemory = PerformanceMonitor.measureMemory();
      
      const memoryUsed = afterMemory.heapUsed - beforeMemory.heapUsed;
      
      expect(memoryUsed).toBeLessThan(200); // 200MB 이내
      expect(duration).toBeLessThan(10000); // 10초 이내
    });
  });
  
  describe('Concurrent Operations', () => {
    test('should handle concurrent template operations', async () => {
      const engine = new TemplateEngine();
      const templates = ['time-series', 'geo-spatial', 'gantt-chart'];
      
      monitor.start('concurrent-templates');
      
      // 동시에 여러 템플릿 로드
      const promises = templates.map(async (type) => {
        const template = await engine.loadTemplate(type as any);
        return engine.renderTemplate(type as any, {
          schemaInfo: TestHelper.createMockSchemaInfo(),
          userPrompt: 'Concurrent test',
          projectName: 'concurrent-project',
          sqlitePath: '/tmp/test.sqlite'
        });
      });
      
      const results = await Promise.all(promises);
      const duration = monitor.end('concurrent-templates');
      
      expect(results).toHaveLength(3);
      expect(duration).toBeLessThan(500); // 동시 실행이 순차 실행보다 빨라야 함
    });
    
    test('should handle concurrent schema analysis', async () => {
      const dbPaths = await Promise.all([
        TestHelper.createTestDatabase('time-series'),
        TestHelper.createTestDatabase('geo-spatial'),
        TestHelper.createTestDatabase('gantt')
      ]);
      
      monitor.start('concurrent-schema');
      
      const promises = dbPaths.map(async (path) => {
        const analyzer = new SchemaAnalyzer();
        return analyzer.analyze(path);
      });
      
      const schemas = await Promise.all(promises);
      const duration = monitor.end('concurrent-schema');
      
      expect(schemas).toHaveLength(3);
      expect(duration).toBeLessThan(2000); // 2초 이내
    });
  });
  
  describe('End-to-End Performance', () => {
    test('complete workflow should finish in reasonable time', async () => {
      const agent = new VibeCraftAgent();
      const sqlitePath = await TestHelper.createTestDatabase('time-series');
      
      monitor.start('e2e-workflow');
      
      const result = await agent.execute({
        sqlitePath,
        visualizationType: 'time-series',
        userPrompt: '월별 매출 추이 대시보드',
        outputDir: path.join(testDir, 'e2e-perf-test')
      });
      
      const duration = monitor.end('e2e-workflow');
      
      expect(result.success).toBe(true);
      expect(duration).toBeLessThan(60000); // 1분 이내
      
      // 각 단계별 시간 로깅
      if (result.metrics) {
        console.log('E2E Performance Breakdown:');
        console.log(`- Schema Analysis: ${result.metrics.schemaAnalysis}ms`);
        console.log(`- Template Loading: ${result.metrics.templateLoading}ms`);
        console.log(`- Prompt Building: ${result.metrics.promptBuilding}ms`);
        console.log(`- Execution: ${result.metrics.execution}ms`);
        console.log(`- Validation: ${result.metrics.validation}ms`);
      }
    }, 120000); // 2분 타임아웃
  });
  
  describe('Performance Regression', () => {
    test('should maintain consistent performance across runs', async () => {
      const runs = 5;
      const durations: number[] = [];
      
      for (let i = 0; i < runs; i++) {
        const agent = new VibeCraftAgent();
        const sqlitePath = await TestHelper.createTestDatabase('simple');
        
        const start = performance.now();
        await agent.execute({
          sqlitePath,
          visualizationType: 'time-series',
          userPrompt: 'Performance regression test',
          outputDir: path.join(testDir, `regression-${i}`)
        });
        const end = performance.now();
        
        durations.push(end - start);
      }
      
      // 표준편차 계산
      const avg = durations.reduce((a, b) => a + b) / runs;
      const variance = durations.reduce((acc, val) => acc + Math.pow(val - avg, 2), 0) / runs;
      const stdDev = Math.sqrt(variance);
      
      // 변동성이 평균의 20% 이내여야 함
      expect(stdDev).toBeLessThan(avg * 0.2);
    });
  });
});