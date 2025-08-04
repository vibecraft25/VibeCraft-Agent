# Task 2: CLI 인터페이스 구현

## 목표
Commander.js를 사용하여 CLI 인터페이스를 구현합니다.

## 작업 내용

### 2.1 CLI 진입점 구현 (src/cli.ts)
```typescript
#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { VibeCraftAgent } from './core/agent';
import { AgentCliArgs } from './types';
import { version } from '../package.json';

const program = new Command();

program
  .name('vibecraft-agent')
  .description('Generate React data visualization apps using Gemini CLI')
  .version(version)
  .requiredOption('--sqlite-path <path>', 'Path to SQLite database file')
  .requiredOption('--visualization-type <type>', 'Type of visualization to generate')
  .requiredOption('--user-prompt <prompt>', 'User\'s visualization request')
  .option('--output-dir <dir>', 'Output directory for generated app', './output')
  .option('--project-name <name>', 'Name of the project')
  .option('--debug', 'Enable debug mode', false)
  .action(async (options) => {
    try {
      console.log(chalk.blue('🚀 VibeCraft-Agent starting...'));
      
      // CLI 인자 변환
      const args: AgentCliArgs = {
        sqlitePath: options.sqlitePath,
        visualizationType: options.visualizationType,
        userPrompt: options.userPrompt,
        outputDir: options.outputDir,
        projectName: options.projectName,
        debug: options.debug
      };
      
      // 에이전트 실행
      const agent = new VibeCraftAgent();
      const result = await agent.execute(args);
      
      if (result.success) {
        console.log(chalk.green('✅ React app generated successfully!'));
        console.log(chalk.blue(`📁 Location: ${result.outputPath}`));
        console.log(chalk.yellow('\nNext steps:'));
        console.log(chalk.yellow(`  cd ${result.outputPath}`));
        console.log(chalk.yellow('  npm install'));
        console.log(chalk.yellow('  npm start'));
      } else {
        console.error(chalk.red(`❌ Generation failed: ${result.error}`));
        if (options.debug) {
          console.log(chalk.gray('\nDebug logs:'));
          result.logs.forEach(log => console.log(chalk.gray(`  ${log}`)));
        }
        process.exit(1);
      }
    } catch (error) {
      console.error(chalk.red('❌ Unexpected error:'), error);
      process.exit(1);
    }
  });

// 시각화 타입 목록 표시 명령
program
  .command('list-types')
  .description('List available visualization types')
  .action(() => {
    const types = [
      { type: 'time-series', description: '시계열 데이터 분석 및 트렌드 시각화' },
      { type: 'geo-spatial', description: '지리적 데이터 매핑 및 위치 기반 분석' },
      { type: 'gantt-chart', description: '프로젝트 일정 및 작업 진행 상황' },
      { type: 'kpi-dashboard', description: '핵심 성과 지표 대시보드' },
      { type: 'comparison', description: '데이터 비교 및 대조 분석' },
      { type: 'funnel-analysis', description: '퍼널 분석 및 전환율 추적' },
      { type: 'cohort-analysis', description: '코호트 분석 및 사용자 행동 패턴' },
      { type: 'heatmap', description: '히트맵 및 밀도 분석' },
      { type: 'network-graph', description: '네트워크 관계 및 연결 시각화' },
      { type: 'custom', description: '사용자 정의 시각화' }
    ];
    
    console.log(chalk.blue('\nAvailable visualization types:\n'));
    types.forEach(({ type, description }) => {
      console.log(chalk.green(`  ${type.padEnd(20)}`), chalk.gray(description));
    });
  });

// 에러 처리
program.exitOverride();

try {
  program.parse();
} catch (err: any) {
  if (err.code === 'commander.missingMandatoryOptionValue') {
    console.error(chalk.red('Error: Missing required option'));
  } else if (err.code === 'commander.unknownOption') {
    console.error(chalk.red('Error: Unknown option'));
  }
  console.log(chalk.yellow('\nUse --help for usage information'));
  process.exit(1);
}
```

### 2.2 입력 검증 헬퍼 함수
```typescript
// src/utils/validation.ts
import { VisualizationType } from '../types';
import fs from 'fs-extra';
import path from 'path';

export const VALID_VISUALIZATION_TYPES: VisualizationType[] = [
  'time-series',
  'geo-spatial',
  'gantt-chart',
  'kpi-dashboard',
  'comparison',
  'funnel-analysis',
  'cohort-analysis',
  'heatmap',
  'network-graph',
  'custom'
];

export function validateSqlitePath(path: string): void {
  if (!fs.existsSync(path)) {
    throw new Error(`SQLite file not found: ${path}`);
  }
  
  const stats = fs.statSync(path);
  if (!stats.isFile()) {
    throw new Error(`Path is not a file: ${path}`);
  }
  
  // 간단한 SQLite 파일 검증 (시그니처 확인)
  const buffer = Buffer.alloc(16);
  const fd = fs.openSync(path, 'r');
  fs.readSync(fd, buffer, 0, 16, 0);
  fs.closeSync(fd);
  
  const signature = buffer.toString('utf8', 0, 15);
  if (signature !== 'SQLite format 3') {
    throw new Error('File is not a valid SQLite database');
  }
}

export function validateVisualizationType(type: string): VisualizationType {
  if (!VALID_VISUALIZATION_TYPES.includes(type as VisualizationType)) {
    throw new Error(
      `Invalid visualization type: ${type}. Valid types are: ${VALID_VISUALIZATION_TYPES.join(', ')}`
    );
  }
  return type as VisualizationType;
}

export function validateOutputDir(dir: string): void {
  const parentDir = path.dirname(dir);
  if (!fs.existsSync(parentDir)) {
    throw new Error(`Parent directory does not exist: ${parentDir}`);
  }
  
  if (fs.existsSync(dir)) {
    const stats = fs.statSync(dir);
    if (!stats.isDirectory()) {
      throw new Error(`Output path exists but is not a directory: ${dir}`);
    }
    
    // 디렉토리가 비어있지 않은지 확인
    const files = fs.readdirSync(dir);
    if (files.length > 0) {
      throw new Error(`Output directory is not empty: ${dir}`);
    }
  }
}
```

### 2.3 CLI 사용 예시 문서
```markdown
# CLI 사용 예시

## 기본 사용법
```bash
vibecraft-agent \
  --sqlite-path ./data.sqlite \
  --visualization-type time-series \
  --user-prompt "월별 매출 추이를 보여주는 대시보드"
```

## 모든 옵션 사용
```bash
vibecraft-agent \
  --sqlite-path /path/to/data.sqlite \
  --visualization-type kpi-dashboard \
  --user-prompt "주요 KPI 지표를 실시간으로 모니터링하는 대시보드" \
  --output-dir ./my-dashboard \
  --project-name "Sales KPI Dashboard" \
  --debug
```

## 시각화 타입 확인
```bash
vibecraft-agent list-types
```
```

## 완료 기준
- [ ] CLI 진입점 구현 완료
- [ ] Commander.js 설정 완료
- [ ] 입력 검증 로직 구현
- [ ] 에러 처리 구현
- [ ] 도움말 및 사용 예시 작성