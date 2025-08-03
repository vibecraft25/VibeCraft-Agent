import { RequestParser } from '../src/core/parser';
import { AgentCliArgs } from '../src/types';
import path from 'path';
import fs from 'fs-extra';
import os from 'os';

describe('RequestParser', () => {
  let parser: RequestParser;
  let testDir: string;
  let testSqliteFile: string;
  
  beforeEach(async () => {
    parser = new RequestParser();
    
    // 테스트용 임시 디렉토리 생성
    testDir = path.join(os.tmpdir(), `vibecraft-test-${Date.now()}`);
    await fs.ensureDir(testDir);
    
    // 테스트용 SQLite 파일 생성
    testSqliteFile = path.join(testDir, 'test.sqlite');
    // SQLite 파일 시그니처 작성
    const sqliteSignature = Buffer.from('SQLite format 3\0');
    await fs.writeFile(testSqliteFile, sqliteSignature);
  });
  
  afterEach(async () => {
    // 테스트 디렉토리 정리
    await fs.remove(testDir);
  });

  describe('parse', () => {
    test('should parse valid arguments correctly', () => {
      const args = {
        sqlitePath: testSqliteFile,
        visualizationType: 'time-series',
        userPrompt: '월별 매출 추이 대시보드',
        outputDir: './output',
        debug: true
      };
      
      const result = parser.parse(args);
      
      expect(result.sqlitePath).toBe(path.resolve(testSqliteFile));
      expect(result.visualizationType).toBe('time-series');
      expect(result.userPrompt).toBe('월별 매출 추이 대시보드');
      expect(result.outputDir).toBe(path.resolve('./output'));
      expect(result.debug).toBe(true);
      expect(result.projectName).toMatch(/^vibecraft-time-series-\d{8}$/);
    });
    
    test('should generate project name when not provided', () => {
      const args = {
        sqlitePath: testSqliteFile,
        visualizationType: 'kpi-dashboard',
        userPrompt: 'test',
        outputDir: './output'
      };
      
      const result = parser.parse(args);
      
      expect(result.projectName).toMatch(/^vibecraft-kpi-dashboard-\d{8}$/);
    });
    
    test('should use provided project name', () => {
      const args = {
        sqlitePath: testSqliteFile,
        visualizationType: 'time-series',
        userPrompt: 'test',
        outputDir: './output',
        projectName: 'my-custom-project'
      };
      
      const result = parser.parse(args);
      
      expect(result.projectName).toBe('my-custom-project');
    });
  });

  describe('validate', () => {
    test('should validate valid request successfully', () => {
      const outputDir = path.join(testDir, 'output');
      const request: AgentCliArgs = {
        sqlitePath: testSqliteFile,
        visualizationType: 'time-series',
        userPrompt: 'This is a valid user prompt for testing',
        outputDir: outputDir,
        projectName: 'valid-project-name',
        debug: false
      };
      
      const result = parser.validate(request);
      
      if (!result.valid) {
        console.log('Validation errors:', result.errors);
        console.log('Validation warnings:', result.warnings);
      }
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });
    
    test('should fail validation for non-existent SQLite file', () => {
      const request: AgentCliArgs = {
        sqlitePath: '/non/existent/file.sqlite',
        visualizationType: 'time-series',
        userPrompt: 'test',
        outputDir: testDir
      };
      
      const result = parser.validate(request);
      
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('SQLite validation failed');
    });
    
    test('should fail validation for invalid visualization type', () => {
      const request: AgentCliArgs = {
        sqlitePath: testSqliteFile,
        visualizationType: 'invalid-type' as any,
        userPrompt: 'test',
        outputDir: testDir
      };
      
      const result = parser.validate(request);
      
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('Visualization type validation failed'))).toBe(true);
    });
    
    test('should fail validation for empty user prompt', () => {
      const request: AgentCliArgs = {
        sqlitePath: testSqliteFile,
        visualizationType: 'time-series',
        userPrompt: '',
        outputDir: testDir
      };
      
      const result = parser.validate(request);
      
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('User prompt cannot be empty'))).toBe(true);
    });
    
    test('should warn for short user prompt', () => {
      const outputDir = path.join(testDir, 'output2');
      const request: AgentCliArgs = {
        sqlitePath: testSqliteFile,
        visualizationType: 'time-series',
        userPrompt: 'short',
        outputDir: outputDir
      };
      
      const result = parser.validate(request);
      
      if (!result.valid) {
        console.log('Validation errors:', result.errors);
      }
      console.log('Validation warnings:', result.warnings);
      
      expect(result.valid).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain('User prompt is very short');
    });
    
    test('should fail validation for invalid project name', () => {
      const request: AgentCliArgs = {
        sqlitePath: testSqliteFile,
        visualizationType: 'time-series',
        userPrompt: 'test prompt',
        outputDir: testDir,
        projectName: 'invalid project name!'
      };
      
      const result = parser.validate(request);
      
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('Project name contains invalid characters'))).toBe(true);
    });
    
    test('should fail validation for non-empty output directory', async () => {
      // 비어있지 않은 디렉토리 생성
      const nonEmptyDir = path.join(testDir, 'non-empty');
      await fs.ensureDir(nonEmptyDir);
      await fs.writeFile(path.join(nonEmptyDir, 'file.txt'), 'content');
      
      const request: AgentCliArgs = {
        sqlitePath: testSqliteFile,
        visualizationType: 'time-series',
        userPrompt: 'test',
        outputDir: nonEmptyDir
      };
      
      const result = parser.validate(request);
      
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('Output directory is not empty'))).toBe(true);
    });
  });
});