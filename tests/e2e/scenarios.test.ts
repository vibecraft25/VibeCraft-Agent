import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs-extra';
import path from 'path';
import { TestHelper } from '../helpers/test-helper';

const execAsync = promisify(exec);

describe('E2E Scenarios', () => {
  let testDir: string;
  let cliPath: string;
  
  beforeAll(async () => {
    testDir = await TestHelper.createTestDirectory();
    
    // CLI 빌드 확인
    const distExists = await fs.pathExists('./dist/cli.js');
    if (!distExists) {
      console.log('Building CLI...');
      await execAsync('npm run build');
    }
    
    cliPath = path.resolve('./dist/cli.js');
  });
  
  afterAll(async () => {
    await TestHelper.cleanupTestDirectory(testDir);
  });
  
  describe('Complete Workflow', () => {
    test('should execute complete workflow from CLI to running app', async () => {
      // 1. 테스트 데이터베이스 생성
      const sqlitePath = await TestHelper.createTestDatabase('time-series');
      const outputDir = path.join(testDir, 'e2e-complete-workflow');
      
      // 2. CLI 명령 실행
      const command = `node ${cliPath} \
        --sqlite-path "${sqlitePath}" \
        --visualization-type time-series \
        --user-prompt "월별 매출 대시보드 with 트렌드 분석" \
        --output-dir "${outputDir}"`;
      
      console.log('Executing command:', command);
      
      const { stdout, stderr } = await execAsync(command, {
        env: { ...process.env, NODE_ENV: 'test' }
      });
      
      // 3. CLI 실행 결과 검증
      expect(stderr).toBe('');
      expect(stdout).toContain('React app generated successfully');
      
      // 4. 생성된 파일 검증
      const expectedFiles = [
        'package.json',
        'src/App.tsx',
        'src/index.tsx',
        'public/index.html',
        'public/data.sqlite',
        'README.md'
      ];
      
      for (const file of expectedFiles) {
        const exists = await fs.pathExists(path.join(outputDir, file));
        expect(exists).toBe(true);
      }
      
      // 5. package.json 검증
      const packageJson = await fs.readJson(path.join(outputDir, 'package.json'));
      expect(packageJson.dependencies).toHaveProperty('react');
      expect(packageJson.dependencies).toHaveProperty('sql.js');
      expect(packageJson.dependencies).toHaveProperty('recharts');
      
      // 6. npm install 실행
      console.log('Running npm install...');
      const { stderr: installErr } = await execAsync('npm install', { 
        cwd: outputDir,
        env: { ...process.env, CI: 'true' }
      });
      
      if (installErr && !installErr.includes('warn')) {
        throw new Error(`npm install failed: ${installErr}`);
      }
      
      // 7. 앱 빌드 테스트
      console.log('Running npm run build...');
      const { stderr: buildErr } = await execAsync('npm run build', { 
        cwd: outputDir,
        env: { ...process.env, CI: 'true' }
      });
      
      if (buildErr && !buildErr.includes('warn')) {
        throw new Error(`npm run build failed: ${buildErr}`);
      }
      
      // 8. 빌드 결과물 확인
      const buildExists = await fs.pathExists(path.join(outputDir, 'build'));
      expect(buildExists).toBe(true);
    }, 600000); // 10분 타임아웃
  });
  
  describe('Different Visualization Types', () => {
    const visualizationTypes = [
      { type: 'time-series', prompt: '시계열 매출 분석' },
      { type: 'geo-spatial', prompt: '지역별 매장 분포' },
      { type: 'gantt-chart', prompt: '프로젝트 일정 관리' },
      { type: 'kpi-dashboard', prompt: 'KPI 모니터링' },
      { type: 'comparison', prompt: '제품별 비교 분석' }
    ];
    
    visualizationTypes.forEach(({ type, prompt }) => {
      test(`should generate ${type} visualization`, async () => {
        const sqlitePath = await TestHelper.createTestDatabase(
          type === 'geo-spatial' ? 'geo-spatial' : 
          type === 'gantt-chart' ? 'gantt' : 
          'time-series'
        );
        const outputDir = path.join(testDir, `e2e-${type}`);
        
        const command = `node ${cliPath} \
          --sqlite-path "${sqlitePath}" \
          --visualization-type ${type} \
          --user-prompt "${prompt}" \
          --output-dir "${outputDir}"`;
        
        const { stdout, stderr } = await execAsync(command);
        
        expect(stderr).toBe('');
        expect(stdout).toContain('React app generated successfully');
        
        // 타입별 특수 검증
        const packageJson = await fs.readJson(path.join(outputDir, 'package.json'));
        
        switch (type) {
          case 'geo-spatial':
            expect(packageJson.dependencies).toHaveProperty('react-leaflet');
            break;
          case 'gantt-chart':
            expect(packageJson.dependencies).toHaveProperty('react-gantt-chart');
            break;
          default:
            expect(packageJson.dependencies).toHaveProperty('recharts');
        }
      }, 300000); // 5분 타임아웃
    });
  });
  
  describe('Error Scenarios', () => {
    test('should handle invalid SQLite file gracefully', async () => {
      const outputDir = path.join(testDir, 'e2e-error-invalid-sqlite');
      
      const command = `node ${cliPath} \
        --sqlite-path "/nonexistent/database.sqlite" \
        --visualization-type time-series \
        --user-prompt "test" \
        --output-dir "${outputDir}"`;
      
      try {
        await execAsync(command);
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.stderr).toContain('Error');
        expect(error.code).toBe(1);
      }
    });
    
    test('should handle invalid visualization type', async () => {
      const sqlitePath = await TestHelper.createTestDatabase('simple');
      const outputDir = path.join(testDir, 'e2e-error-invalid-type');
      
      const command = `node ${cliPath} \
        --sqlite-path "${sqlitePath}" \
        --visualization-type invalid-type \
        --user-prompt "test" \
        --output-dir "${outputDir}"`;
      
      try {
        await execAsync(command);
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.stderr).toContain('Invalid visualization type');
        expect(error.code).toBe(1);
      }
    });
  });
  
  describe('Advanced Features', () => {
    test('should support custom project name', async () => {
      const sqlitePath = await TestHelper.createTestDatabase('simple');
      const outputDir = path.join(testDir, 'e2e-custom-name');
      const projectName = 'my-awesome-viz';
      
      const command = `node ${cliPath} \
        --sqlite-path "${sqlitePath}" \
        --visualization-type time-series \
        --user-prompt "test" \
        --output-dir "${outputDir}" \
        --project-name "${projectName}"`;
      
      const { stdout } = await execAsync(command);
      
      expect(stdout).toContain('React app generated successfully');
      
      const packageJson = await fs.readJson(path.join(outputDir, 'package.json'));
      expect(packageJson.name).toBe(projectName);
    });
    
    test('should support debug mode', async () => {
      const sqlitePath = await TestHelper.createTestDatabase('simple');
      const outputDir = path.join(testDir, 'e2e-debug-mode');
      
      const command = `node ${cliPath} \
        --sqlite-path "${sqlitePath}" \
        --visualization-type time-series \
        --user-prompt "test" \
        --output-dir "${outputDir}" \
        --debug`;
      
      const { stdout } = await execAsync(command);
      
      // 디버그 모드에서는 추가 정보가 출력됨
      expect(stdout).toContain('Debug mode enabled');
      
      // 프롬프트 파일이 저장되었는지 확인
      const promptExists = await fs.pathExists(
        path.join(outputDir, '.vibecraft/prompt.md')
      );
      expect(promptExists).toBe(true);
    });
    
    test('should list available visualization types', async () => {
      const command = `node ${cliPath} --list-types`;
      
      const { stdout } = await execAsync(command);
      
      expect(stdout).toContain('time-series');
      expect(stdout).toContain('geo-spatial');
      expect(stdout).toContain('gantt-chart');
      expect(stdout).toContain('kpi-dashboard');
      expect(stdout).toContain('comparison');
      expect(stdout).toContain('funnel-analysis');
      expect(stdout).toContain('cohort-analysis');
      expect(stdout).toContain('heatmap');
      expect(stdout).toContain('network-graph');
      expect(stdout).toContain('custom');
    });
  });
  
  describe('Real-world Scenarios', () => {
    test('should handle Korean prompts correctly', async () => {
      const sqlitePath = await TestHelper.createTestDatabase('time-series');
      const outputDir = path.join(testDir, 'e2e-korean-prompt');
      
      const command = `node ${cliPath} \
        --sqlite-path "${sqlitePath}" \
        --visualization-type time-series \
        --user-prompt "월별 매출 추이를 라인 차트로 표시하고, 전년 대비 성장률을 함께 보여주세요" \
        --output-dir "${outputDir}"`;
      
      const { stdout, stderr } = await execAsync(command);
      
      expect(stderr).toBe('');
      expect(stdout).toContain('React app generated successfully');
    });
    
    test('should generate app with complex schema', async () => {
      // 복잡한 스키마를 가진 데이터베이스 생성
      const dbPath = path.join(testDir, 'complex.sqlite');
      const db = new (require('sqlite3').Database)(dbPath);
      
      await new Promise<void>((resolve, reject) => {
        db.serialize(() => {
          // 여러 테이블과 관계 생성
          db.run(`CREATE TABLE users (
            id INTEGER PRIMARY KEY,
            name VARCHAR(100),
            email VARCHAR(100),
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )`);
          
          db.run(`CREATE TABLE orders (
            id INTEGER PRIMARY KEY,
            user_id INTEGER,
            total DECIMAL(10,2),
            status VARCHAR(20),
            order_date DATE,
            FOREIGN KEY (user_id) REFERENCES users(id)
          )`);
          
          db.run(`CREATE TABLE order_items (
            id INTEGER PRIMARY KEY,
            order_id INTEGER,
            product_name VARCHAR(200),
            quantity INTEGER,
            price DECIMAL(10,2),
            FOREIGN KEY (order_id) REFERENCES orders(id)
          )`);
          
          db.close((err: any) => {
            if (err) reject(err);
            else resolve();
          });
        });
      });
      
      const outputDir = path.join(testDir, 'e2e-complex-schema');
      
      const command = `node ${cliPath} \
        --sqlite-path "${dbPath}" \
        --visualization-type custom \
        --user-prompt "주문 데이터를 분석하여 사용자별 구매 패턴과 제품별 판매 트렌드를 보여주는 대시보드" \
        --output-dir "${outputDir}"`;
      
      const { stdout } = await execAsync(command);
      
      expect(stdout).toContain('React app generated successfully');
    }, 300000);
  });
  
  describe('Performance and Scalability', () => {
    test('should handle large databases', async () => {
      // 대용량 데이터베이스 생성 (50,000 레코드)
      const largeSqlitePath = await TestHelper.createLargeDatabase(50000);
      const outputDir = path.join(testDir, 'e2e-large-db');
      
      const startTime = Date.now();
      
      const command = `node ${cliPath} \
        --sqlite-path "${largeSqlitePath}" \
        --visualization-type time-series \
        --user-prompt "대용량 데이터 시각화" \
        --output-dir "${outputDir}"`;
      
      const { stdout } = await execAsync(command);
      
      const duration = Date.now() - startTime;
      
      expect(stdout).toContain('React app generated successfully');
      expect(duration).toBeLessThan(120000); // 2분 이내
    }, 180000); // 3분 타임아웃
  });
  
  describe('Integration with External Tools', () => {
    test('should work with git repository', async () => {
      const sqlitePath = await TestHelper.createTestDatabase('simple');
      const outputDir = path.join(testDir, 'e2e-git-repo');
      
      // 출력 디렉토리에 git 저장소 초기화
      await fs.ensureDir(outputDir);
      await execAsync('git init', { cwd: outputDir });
      
      const command = `node ${cliPath} \
        --sqlite-path "${sqlitePath}" \
        --visualization-type time-series \
        --user-prompt "git 저장소 테스트" \
        --output-dir "${outputDir}"`;
      
      const { stdout } = await execAsync(command);
      
      expect(stdout).toContain('React app generated successfully');
      
      // .gitignore가 생성되었는지 확인
      const gitignoreExists = await fs.pathExists(
        path.join(outputDir, '.gitignore')
      );
      expect(gitignoreExists).toBe(true);
    });
  });
});