#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { VibeCraftAgent } from './core/agent';
import { AgentCliArgs } from './types';
import { version } from '../package.json';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const program = new Command();

// --list-types 처리를 위한 사전 체크
if (process.argv.includes('--list-types')) {
  const types = [
    { type: 'time-series', description: '시계열 데이터 분석 및 트렌드 시각화' },
    { type: 'geo-spatial', description: '지리적 데이터 매핑 및 위치 기반 분석' },
    { type: 'kpi-dashboard', description: '핵심 성과 지표 대시보드' },
    { type: 'comparison', description: '데이터 비교 및 대조 분석' }
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
      
      // Check for API key from environment variable
      if (!process.env.GEMINI_API_KEY) {
        console.error(chalk.red('❌ Error: GEMINI_API_KEY is not set'));
        console.log(chalk.yellow('\nYou can provide the API key in two ways:'));
        console.log(chalk.gray('1. Environment variable: export GEMINI_API_KEY=YOUR_API_KEY'));
        console.log(chalk.gray('2. .env file: GEMINI_API_KEY=YOUR_API_KEY'));
        console.log(chalk.gray('\nGet your key from: https://makersuite.google.com/app/apikey'));
        process.exit(1);
      }
      
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
        process.exit(0);  // 성공 시 정상 종료
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