import { AgentCliArgs } from '../types';
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
      model: args.model,
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
      try {
        const stats = fs.statSync(request.sqlitePath);
        const sizeMB = stats.size / (1024 * 1024);
        if (sizeMB > 100) {
          warnings.push(`SQLite file is large (${sizeMB.toFixed(2)} MB). Processing may take longer.`);
        }
      } catch (error) {
        // 파일 크기 체크 실패는 무시
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