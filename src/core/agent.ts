import { AgentCliArgs, AgentExecutionResult, LogEntry } from '../types';
import { RequestParser } from './parser';
import { RequestNormalizer } from './request-normalizer';
import { AdvancedValidator } from './sqlite-validator';
import { SchemaAnalyzer } from './schema-analyzer';
import { TemplateEngine } from './template-engine';
import { SettingsManager } from './settings-manager';
import { PromptBuilder } from './prompt-builder';
import { ExecutionEngine, ExecutionConfig } from './execution-engine';
import { OutputValidator } from './output-validator';
import { EnvironmentManager } from './environment-manager';
import { SchemaSummarizer } from '../utils/schema-summarizer';
import { TemplateSelector } from '../utils/template-selector';
import { SettingsHelper } from '../utils/settings-helper';
import { ValidationReporter } from '../utils/validation-reporter';
import chalk from 'chalk';
import path from 'path';

export class VibeCraftAgent {
  private logs: LogEntry[] = [];
  private startTime: number = 0;
  private parser: RequestParser;
  private normalizer: RequestNormalizer;
  private validator: AdvancedValidator;
  private schemaAnalyzer: SchemaAnalyzer;
  private templateEngine: TemplateEngine;
  private settingsManager: SettingsManager;
  private promptBuilder: PromptBuilder;
  private executionEngine: ExecutionEngine;
  private outputValidator: OutputValidator;

  constructor() {
    this.parser = new RequestParser();
    this.normalizer = new RequestNormalizer();
    this.validator = new AdvancedValidator();
    this.schemaAnalyzer = new SchemaAnalyzer();
    this.templateEngine = new TemplateEngine();
    this.settingsManager = new SettingsManager();
    this.promptBuilder = new PromptBuilder();
    this.executionEngine = new ExecutionEngine();
    this.outputValidator = new OutputValidator();
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
          projectName: normalizedRequest.projectName || 'vibecraft-app',
          visualizationType: normalizedRequest.visualizationType,
          timestamp: new Date()
        });
        
        this.log('info', 'Template rendered successfully');
        
        if (normalizedRequest.debug) {
          this.log('debug', 'Rendered prompt preview (first 500 chars):\n' + 
            renderedPrompt.substring(0, 500) + '...');
        }
        
        // 6. Create settings for Gemini CLI
        this.log('info', 'Creating Gemini CLI settings...');
        
        // Copy SQLite file to working directory as 'data.sqlite' for consistency
        const targetSqlitePath = path.join(normalizedRequest.workingDir, 'public', 'data.sqlite');
        await this.copyDatabaseFile(normalizedRequest.sqlitePath, targetSqlitePath);
        this.log('info', `SQLite file copied to: ${targetSqlitePath}`);
        
        // Generate settings.json
        const settingsPath = await this.settingsManager.generateSettings({
          workspaceDir: normalizedRequest.workingDir,
          sqlitePath: targetSqlitePath,
          mcpServerPath: EnvironmentManager.getMCPServerPath(),
          timeout: EnvironmentManager.getTimeout(),
          trust: true
        });
        this.log('info', `Settings file created at: ${settingsPath}`);
        
        // Validate settings
        const isValidSettings = await this.settingsManager.validateSettings(settingsPath);
        if (!isValidSettings) {
          this.log('error', 'Settings validation failed');
          return {
            success: false,
            outputPath: normalizedRequest.workingDir,
            executionTime: Date.now() - this.startTime,
            logs: this.logs,
            error: {
              code: 'SETTINGS_ERROR',
              message: 'Failed to create valid settings for Gemini CLI'
            },
            generatedFiles: []
          };
        }
        
        // 7. Build final prompt
        this.log('info', 'Building final prompt...');
        
        // Build prompt components
        const promptComponents = {
          systemPrompt: this.promptBuilder.getSystemPrompt(),
          templateContent: renderedPrompt,
          userPrompt: normalizedRequest.userPrompt,
          schemaInfo,
          projectContext: {
            projectName: normalizedRequest.projectName || 'vibecraft-app',
            outputDir: normalizedRequest.workingDir,
            visualizationType: normalizedRequest.visualizationType
          }
        };
        
        
        // Build the prompt
        const finalPrompt = this.promptBuilder.buildPrompt(promptComponents);
        this.log('info', 'Final prompt built successfully');
        
        
        // Save prompt to file for debugging
        if (normalizedRequest.debug) {
          const promptPath = path.join(normalizedRequest.workingDir, '.gemini', 'prompt.md');
          await this.savePromptToFile(finalPrompt, promptPath);
          this.log('debug', `Prompt saved to: ${promptPath}`);
        }
        
        // 8. Execute Gemini CLI
        this.log('info', 'Executing Gemini CLI...');
        
        const executionConfig: ExecutionConfig = {
          workspaceDir: normalizedRequest.workingDir,
          prompt: finalPrompt,  // 파일 경로가 아닌 프롬프트 내용
          settingsDir: path.dirname(settingsPath),
          model: 'gemini-2.5-pro',  // 또는 사용자가 지정한 모델
          timeout: 900000,  // 15분 타임아웃
          debug: normalizedRequest.debug || true,  // 디버그 모드 강제 활성화
          autoApprove: true,  // 자동화를 위해 필수
          checkpointing: false  // 필요시 활성화
        };
        
        // ExecutionEngine 이벤트 리스너 등록
        this.executionEngine.on('progress', (data) => {
          this.log('info', `[Gemini CLI] ${data.message}`);
        });
        
        this.executionEngine.on('error', (data) => {
          this.log('error', `[Gemini CLI Error] ${data.message}`);
        });
        
        const executionResult = await this.executionEngine.execute(executionConfig);
        
        if (!executionResult.success) {
          return {
            ...executionResult,
            // 이전 단계에서 생성된 파일들 포함
            generatedFiles: [settingsPath, ...executionResult.generatedFiles]
          };
        }
        
        // 9. Validate output
        this.log('info', 'Validating generated output...');
        
        const validationResult = await this.outputValidator.validate(normalizedRequest.workingDir);
        
        // 검증 보고서 출력
        if (normalizedRequest.debug || !validationResult.valid) {
          ValidationReporter.printReport(validationResult);
        }
        
        // 검증 로그 추가
        for (const error of validationResult.errors) {
          this.log('error', `Validation Error: ${error.message}`, { type: error.type });
        }
        
        for (const warning of validationResult.warnings) {
          this.log('warn', `Validation Warning: ${warning.message}`, { type: warning.type });
        }
        
        // 검증 실패 시 반환
        if (!validationResult.valid) {
          return {
            success: false,
            outputPath: normalizedRequest.workingDir,
            executionTime: Date.now() - this.startTime,
            logs: this.logs,
            error: {
              code: 'OUTPUT_VALIDATION_ERROR',
              message: 'Generated output failed validation',
              validationErrors: validationResult.errors
            },
            generatedFiles: [settingsPath, ...executionResult.generatedFiles]
          };
        }
        
        // 성공적으로 완료
        this.log('info', '✅ Output validation passed!');
        this.log('info', `Total files: ${validationResult.summary.totalFiles}`);
        
        return {
          success: true,
          outputPath: normalizedRequest.workingDir,
          executionTime: Date.now() - this.startTime,
          logs: this.logs,
          generatedFiles: [settingsPath, ...executionResult.generatedFiles],
          validationResult,
          // 디버그 정보 (필요시)
          debugInfo: normalizedRequest.debug ? { 
            schemaInfo,
            settingsPath,
            promptPath: path.join(normalizedRequest.workingDir, '.gemini', 'prompt.md'),
            executionLogs: executionResult.logs,
            validationResult
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
  
  /**
   * Copy SQLite database file to target directory
   */
  private async copyDatabaseFile(sourcePath: string, targetPath: string): Promise<void> {
    const fs = await import('fs-extra');
    
    // Ensure target directory exists
    await fs.ensureDir(path.dirname(targetPath));
    
    // Copy the file
    await fs.copy(sourcePath, targetPath);
  }
  
  /**
   * Save prompt to file for debugging
   */
  private async savePromptToFile(prompt: string, filePath: string): Promise<void> {
    const fs = await import('fs-extra');
    
    // Ensure directory exists
    await fs.ensureDir(path.dirname(filePath));
    
    // Save prompt
    await fs.writeFile(filePath, prompt, 'utf8');
  }
}