#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { VibeCraftAgent } from './core/agent';
import { AgentCliArgs } from './types';
import { version } from '../package.json';

const program = new Command();

// --list-types 처리를 위한 사전 체크
if (process.argv.includes('--list-types')) {
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
  process.exit(0);
}

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
        console.log(chalk.gray(`⏱️  Execution time: ${(result.executionTime / 1000).toFixed(2)}s`));
        console.log(chalk.yellow('\nNext steps:'));
        console.log(chalk.yellow(`  cd ${result.outputPath}`));
        console.log(chalk.yellow('  npm install'));
        console.log(chalk.yellow('  npm start'));
      } else {
        console.error(chalk.red(`❌ Generation failed: ${result.error?.message || 'Unknown error'}`));
        if (options.debug && result.logs.length > 0) {
          console.log(chalk.gray('\nDebug logs:'));
          result.logs.forEach(log => {
            const color = log.level === 'error' ? chalk.red : 
                         log.level === 'warn' ? chalk.yellow : 
                         chalk.gray;
            console.log(color(`  [${log.timestamp.toISOString()}] ${log.message}`));
          });
        }
        process.exit(1);
      }
    } catch (error) {
      console.error(chalk.red('❌ Unexpected error:'), error);
      process.exit(1);
    }
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