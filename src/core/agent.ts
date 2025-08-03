import { AgentCliArgs, AgentExecutionResult, LogEntry } from '../types';
import { RequestParser } from './parser';
import { RequestNormalizer } from './request-normalizer';
import { AdvancedValidator } from './parser-advanced';
import { SchemaAnalyzer } from './schema-analyzer';
import { TemplateEngine } from './template-engine';
import { SchemaSummarizer } from '../utils/schema-summarizer';
import { TemplateSelector } from '../utils/template-selector';
import chalk from 'chalk';

export class VibeCraftAgent {
  private logs: LogEntry[] = [];
  private startTime: number = 0;
  private parser: RequestParser;
  private normalizer: RequestNormalizer;
  private validator: AdvancedValidator;
  private schemaAnalyzer: SchemaAnalyzer;
  private templateEngine: TemplateEngine;

  constructor() {
    this.parser = new RequestParser();
    this.normalizer = new RequestNormalizer();
    this.validator = new AdvancedValidator();
    this.schemaAnalyzer = new SchemaAnalyzer();
    this.templateEngine = new TemplateEngine();
  }

  async execute(args: AgentCliArgs): Promise<AgentExecutionResult> {
    this.startTime = Date.now();
    this.log('info', 'Starting VibeCraft-Agent execution...');

    try {
      // 1. Parse and validate inputs
      this.log('info', 'Parsing and validating request...');
      const parsedArgs = this.parser.parse(args);
      const validation = this.parser.validate(parsedArgs);
      
      // 유효성 검사 실패 시 즉시 반환
      if (!validation.valid) {
        this.log('error', 'Validation failed', validation.errors);
        return {
          success: false,
          outputPath: '',
          executionTime: Date.now() - this.startTime,
          logs: this.logs,
          error: {
            code: 'VALIDATION_ERROR',
            message: validation.errors.join('; ')
          },
          generatedFiles: []
        };
      }
      
      // 경고 표시
      if (validation.warnings.length > 0) {
        validation.warnings.forEach(warning => {
          this.log('warn', warning);
          console.log(chalk.yellow(`⚠️  ${warning}`));
        });
      }
      
      // 2. Advanced SQLite validation
      this.log('info', 'Performing advanced SQLite schema validation...');
      const schemaValidation = await this.validator.validateSQLiteSchema(parsedArgs.sqlitePath);
      
      if (!schemaValidation.valid) {
        this.log('error', 'Schema validation failed', schemaValidation.error);
        return {
          success: false,
          outputPath: '',
          executionTime: Date.now() - this.startTime,
          logs: this.logs,
          error: {
            code: 'SCHEMA_VALIDATION_ERROR',
            message: schemaValidation.error || 'Invalid SQLite schema'
          },
          generatedFiles: []
        };
      }
      
      this.log('info', `Found ${schemaValidation.tables?.length || 0} tables with ${schemaValidation.totalRows || 0} total rows`);
      
      // 3. Normalize request
      const normalizedRequest = this.normalizer.normalizeRequest(parsedArgs);
      this.log('info', `Working directory created at: ${normalizedRequest.workingDir}`);
      
      // 4. Analyze SQLite schema
      this.log('info', 'Analyzing SQLite database schema...');
      const schemaInfo = await this.schemaAnalyzer.analyze(normalizedRequest.sqlitePath);
      this.log('info', `Schema analysis complete: ${schemaInfo.tables.length} tables found`);
      
      // 스키마 요약 생성 및 로깅 (디버그 모드에서만)
      if (normalizedRequest.debug) {
        const schemaSummary = SchemaSummarizer.generateSchemaSummary(schemaInfo);
        this.log('debug', 'Schema Summary:\n' + schemaSummary);
      }
      
      // 5. Load and render template
      this.log('info', `Loading template for visualization type: ${normalizedRequest.visualizationType}`);
      
      try {
        // 템플릿 로드
        const template = await this.templateEngine.loadTemplate(normalizedRequest.visualizationType);
        this.log('info', `Template loaded: ${template.name}`);
        
        // 템플릿 호환성 검사
        const compatibility = TemplateSelector.checkTemplateCompatibility(template, schemaInfo);
        if (!compatibility.compatible) {
          this.log('warn', 'Template compatibility issues:', compatibility.reasons);
          console.log(chalk.yellow('⚠️  Template compatibility warnings:'));
          compatibility.reasons.forEach(reason => {
            console.log(chalk.yellow(`   - ${reason}`));
          });
        }
        
        // 템플릿 렌더링
        const renderedPrompt = this.templateEngine.renderTemplate(template, {
          schemaInfo,
          userPrompt: normalizedRequest.userPrompt,
          projectName: normalizedRequest.projectName,
          visualizationType: normalizedRequest.visualizationType,
          timestamp: new Date()
        });
        
        this.log('info', 'Template rendered successfully');
        
        if (normalizedRequest.debug) {
          this.log('debug', 'Rendered prompt preview (first 500 chars):\n' + 
            renderedPrompt.substring(0, 500) + '...');
        }
        
        // TODO: Continue with remaining steps
        // 6. Create settings (Task 6)
        // 7. Build final prompt (Task 7)
        // 8. Execute Gemini CLI (Task 8)
        // 9. Validate output (Task 9)
        
        // Temporary placeholder for now
        this.log('error', 'Full implementation pending - Template Engine completed');
        
        return {
          success: false,
          outputPath: normalizedRequest.workingDir,
          executionTime: Date.now() - this.startTime,
          logs: this.logs,
          error: {
            code: 'PARTIAL_IMPLEMENTATION',
            message: 'Template Engine implemented, remaining modules pending'
          },
          generatedFiles: [],
          // 임시로 스키마 정보와 렌더링된 프롬프트 반환 (디버그용)
          debugInfo: normalizedRequest.debug ? { 
            schemaInfo, 
            renderedPrompt: renderedPrompt.substring(0, 1000) 
          } : undefined
        } as AgentExecutionResult;
        
      } catch (templateError) {
        this.log('error', `Template loading/rendering failed: ${templateError}`);
        
        // 템플릿이 없는 경우 추천 제공
        if (templateError instanceof Error && templateError.message.includes('not found')) {
          const suggestions = TemplateSelector.suggestVisualizationType(schemaInfo);
          console.log(chalk.yellow('\n💡 Based on your schema, consider these visualization types:'));
          suggestions.slice(0, 3).forEach((type, index) => {
            console.log(chalk.cyan(`   ${index + 1}. ${type}`));
          });
        }
        
        return {
          success: false,
          outputPath: normalizedRequest.workingDir,
          executionTime: Date.now() - this.startTime,
          logs: this.logs,
          error: {
            code: 'TEMPLATE_ERROR',
            message: templateError instanceof Error ? templateError.message : 'Template processing failed'
          },
          generatedFiles: []
        };
      }
    } catch (error) {
      this.log('error', `Unexpected error: ${error}`);
      
      return {
        success: false,
        outputPath: '',
        executionTime: Date.now() - this.startTime,
        logs: this.logs,
        error: {
          code: 'UNEXPECTED_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        },
        generatedFiles: []
      };
    }
  }

  private log(level: LogEntry['level'], message: string, context?: any): void {
    this.logs.push({
      timestamp: new Date(),
      level,
      message,
      context
    });

    if (level === 'debug') {
      console.debug(`[DEBUG] ${message}`, context || '');
    }
  }
}