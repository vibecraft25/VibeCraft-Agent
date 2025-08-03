import path from 'path';
import fs from 'fs-extra';
import { VisualizationType } from '../types';
import { SchemaInfo } from './schema-analyzer';

export interface ITemplateEngine {
  loadTemplate(visualizationType: VisualizationType): Promise<Template>;
  renderTemplate(template: Template, context: TemplateContext): string;
  getAvailableTemplates(): Promise<TemplateInfo[]>;
  validateTemplate(template: Template): TemplateValidationResult;
}

export interface Template {
  id: string;
  type: VisualizationType;
  name: string;
  description: string;
  metadata: TemplateMetadata;
  content: string; // Markdown content
  variables: TemplateVariable[];
}

export interface TemplateMetadata {
  version: string;
  author?: string;
  tags: string[];
  requiredTables?: number; // 최소 필요 테이블 수
  requiredColumns?: string[]; // 필수 컬럼 타입 (예: 'date', 'numeric')
  dependencies?: string[]; // 필요한 라이브러리
}

export interface TemplateVariable {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  required: boolean;
  description?: string;
  defaultValue?: any;
}

export interface TemplateContext {
  schemaInfo: SchemaInfo;
  userPrompt: string;
  projectName: string;
  visualizationType: VisualizationType;
  timestamp: Date;
  additionalContext?: Record<string, any>;
}

export interface TemplateInfo {
  id: string;
  type: VisualizationType;
  name: string;
  description: string;
  path: string;
}

export interface TemplateValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export class TemplateEngine implements ITemplateEngine {
  private templatesDir: string;
  private templateCache: Map<string, Template> = new Map();
  
  constructor(templatesDir?: string) {
    // 기본 템플릿 디렉토리 설정
    this.templatesDir = templatesDir || path.join(__dirname, '../../templates');
  }
  
  async loadTemplate(visualizationType: VisualizationType): Promise<Template> {
    // 캐시 확인
    const cacheKey = visualizationType;
    if (this.templateCache.has(cacheKey)) {
      return this.templateCache.get(cacheKey)!;
    }
    
    // 템플릿 디렉토리 경로
    const templateDir = path.join(this.templatesDir, visualizationType);
    
    // 템플릿 디렉토리 존재 확인
    const exists = await fs.pathExists(templateDir);
    if (!exists) {
      throw new Error(`Template not found for visualization type: ${visualizationType}`);
    }
    
    // meta.json 읽기
    const metaPath = path.join(templateDir, 'meta.json');
    const metaExists = await fs.pathExists(metaPath);
    if (!metaExists) {
      throw new Error(`Template metadata not found: ${metaPath}`);
    }
    
    const metadata = await fs.readJson(metaPath);
    
    // prompt.md 읽기
    const promptPath = path.join(templateDir, 'prompt.md');
    const promptExists = await fs.pathExists(promptPath);
    if (!promptExists) {
      throw new Error(`Template prompt not found: ${promptPath}`);
    }
    
    const content = await fs.readFile(promptPath, 'utf8');
    
    // Template 객체 생성
    const template: Template = {
      id: visualizationType,
      type: visualizationType,
      name: metadata.name || visualizationType,
      description: metadata.description || '',
      metadata: {
        version: metadata.version || '1.0.0',
        author: metadata.author,
        tags: metadata.tags || [],
        requiredTables: metadata.requiredTables,
        requiredColumns: metadata.requiredColumns,
        dependencies: metadata.dependencies
      },
      content,
      variables: metadata.variables || []
    };
    
    // 캐시에 저장
    this.templateCache.set(cacheKey, template);
    
    return template;
  }
  
  renderTemplate(template: Template, context: TemplateContext): string {
    let rendered = template.content;
    
    // 기본 변수 준비
    const variables: Record<string, any> = {
      PROJECT_NAME: context.projectName,
      USER_PROMPT: context.userPrompt,
      VISUALIZATION_TYPE: context.visualizationType,
      TIMESTAMP: context.timestamp.toISOString(),
      ...context.additionalContext
    };
    
    // 스키마 관련 변수
    variables.SCHEMA_TABLES = context.schemaInfo.tables.map(t => t.name).join(', ');
    variables.TABLE_COUNT = context.schemaInfo.metadata.tableCount;
    variables.TOTAL_ROWS = context.schemaInfo.metadata.totalRowCount;
    
    // 스키마 정보를 구조화된 형태로 제공
    variables.SCHEMA_DETAILS = this.formatSchemaDetails(context.schemaInfo);
    
    // SQL 쿼리 예제 생성
    variables.QUERY_EXAMPLES = this.generateQueryExamples(
      context.schemaInfo, 
      context.visualizationType
    );
    
    // 템플릿 변수 치환 ({{VARIABLE_NAME}} 형식)
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
      rendered = rendered.replace(regex, String(value));
    }
    
    // 정의된 변수 검증 및 기본값 적용
    for (const variable of template.variables) {
      const regex = new RegExp(`\\{\\{\\s*${variable.name}\\s*\\}\\}`, 'g');
      
      if (variables[variable.name] === undefined) {
        if (variable.required && variable.defaultValue === undefined) {
          console.warn(`Required template variable not provided: ${variable.name}`);
        }
        const value = variable.defaultValue !== undefined ? variable.defaultValue : '';
        rendered = rendered.replace(regex, String(value));
      }
    }
    
    // 남은 변수 처리 (정의되지 않은 변수는 빈 문자열로)
    rendered = rendered.replace(/\{\{\s*\w+\s*\}\}/g, '');
    
    return rendered;
  }
  
  async getAvailableTemplates(): Promise<TemplateInfo[]> {
    const templates: TemplateInfo[] = [];
    
    // 템플릿 디렉토리 읽기
    const entries = await fs.readdir(this.templatesDir, { withFileTypes: true });
    
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const templateDir = path.join(this.templatesDir, entry.name);
        const metaPath = path.join(templateDir, 'meta.json');
        
        // meta.json이 있는 디렉토리만 템플릿으로 인식
        if (await fs.pathExists(metaPath)) {
          try {
            const metadata = await fs.readJson(metaPath);
            templates.push({
              id: entry.name,
              type: entry.name as VisualizationType,
              name: metadata.name || entry.name,
              description: metadata.description || '',
              path: templateDir
            });
          } catch (error) {
            console.warn(`Failed to read template metadata: ${metaPath}`, error);
          }
        }
      }
    }
    
    return templates;
  }
  
  validateTemplate(template: Template): TemplateValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // 필수 필드 검증
    if (!template.id) {
      errors.push('Template ID is required');
    }
    
    if (!template.type) {
      errors.push('Template type is required');
    }
    
    if (!template.content) {
      errors.push('Template content is required');
    }
    
    // 변수 검증
    const variablePattern = /\{\{\s*(\w+)\s*\}\}/g;
    const foundVariables = new Set<string>();
    let match;
    
    while ((match = variablePattern.exec(template.content)) !== null) {
      foundVariables.add(match[1]);
    }
    
    // 정의된 변수가 실제로 사용되는지 확인
    for (const variable of template.variables) {
      if (!foundVariables.has(variable.name)) {
        warnings.push(`Defined variable not used in template: ${variable.name}`);
      }
    }
    
    // 사용된 변수가 정의되어 있는지 확인
    const definedVariables = new Set(template.variables.map(v => v.name));
    const systemVariables = new Set([
      'PROJECT_NAME', 'USER_PROMPT', 'VISUALIZATION_TYPE', 'TIMESTAMP',
      'SCHEMA_TABLES', 'TABLE_COUNT', 'TOTAL_ROWS', 'SCHEMA_DETAILS', 'QUERY_EXAMPLES'
    ]);
    
    for (const varName of foundVariables) {
      if (!definedVariables.has(varName) && !systemVariables.has(varName)) {
        warnings.push(`Undefined variable used in template: ${varName}`);
      }
    }
    
    // 메타데이터 검증
    if (!template.metadata.version) {
      warnings.push('Template version is not specified');
    }
    
    if (template.metadata.tags.length === 0) {
      warnings.push('No tags specified for template');
    }
    
    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }
  
  private formatSchemaDetails(schemaInfo: SchemaInfo): string {
    let details = '';
    
    for (const table of schemaInfo.tables) {
      details += `### Table: ${table.name}\n`;
      details += `- Rows: ${table.rowCount.toLocaleString()}\n`;
      details += `- Columns:\n`;
      
      for (const col of table.columns) {
        const flags = [];
        if (col.isPrimaryKey) flags.push('PK');
        if (col.isForeignKey) flags.push('FK');
        if (col.isUnique) flags.push('UNIQUE');
        
        const flagStr = flags.length > 0 ? ` [${flags.join(', ')}]` : '';
        const nullable = col.nullable ? ' (nullable)' : '';
        
        details += `  - ${col.name}: ${col.type}${flagStr}${nullable}`;
        
        if (col.dataDistribution) {
          const dist = col.dataDistribution;
          details += ` - ${dist.dataType} type, ${dist.uniqueValues} unique values`;
        }
        
        details += '\n';
      }
      
      if (table.foreignKeys && table.foreignKeys.length > 0) {
        details += `- Foreign Keys:\n`;
        for (const fk of table.foreignKeys) {
          details += `  - ${fk.column} → ${fk.referencedTable}.${fk.referencedColumn}\n`;
        }
      }
      
      details += '\n';
    }
    
    return details;
  }
  
  private generateQueryExamples(
    schemaInfo: SchemaInfo, 
    visualizationType: VisualizationType
  ): string {
    const queries: string[] = [];
    
    // 시각화 타입별 특화 쿼리 생성
    switch (visualizationType) {
      case 'time-series':
        // 날짜 컬럼이 있는 테이블 찾기
        for (const table of schemaInfo.tables) {
          const dateColumn = table.columns.find(
            col => col.dataDistribution?.dataType === 'date'
          );
          if (dateColumn) {
            queries.push(
              `-- Time series aggregation for ${table.name}`,
              `SELECT strftime('%Y-%m', ${dateColumn.name}) as month, COUNT(*) as count`,
              `FROM ${table.name}`,
              `GROUP BY month`,
              `ORDER BY month;`
            );
            break;
          }
        }
        break;
        
      case 'kpi-dashboard':
        // 숫자형 컬럼에 대한 집계 쿼리
        for (const table of schemaInfo.tables) {
          const numericColumns = table.columns.filter(
            col => col.dataDistribution?.dataType === 'numeric' && !col.isPrimaryKey
          );
          if (numericColumns.length > 0) {
            const col = numericColumns[0];
            queries.push(
              `-- KPI metrics for ${table.name}`,
              `SELECT`,
              `  COUNT(*) as total_records,`,
              `  SUM(${col.name}) as total_${col.name},`,
              `  AVG(${col.name}) as avg_${col.name},`,
              `  MIN(${col.name}) as min_${col.name},`,
              `  MAX(${col.name}) as max_${col.name}`,
              `FROM ${table.name};`
            );
          }
        }
        break;
        
      default:
        // 기본 쿼리 예제
        if (schemaInfo.tables.length > 0) {
          const table = schemaInfo.tables[0];
          queries.push(
            `-- Sample data from ${table.name}`,
            `SELECT * FROM ${table.name} LIMIT 10;`
          );
        }
        break;
    }
    
    return queries.join('\n');
  }
}