import { TemplateEngine } from '../src/core/template-engine';
import { TemplateSelector } from '../src/utils/template-selector';
import path from 'path';
import fs from 'fs-extra';
import os from 'os';

describe('TemplateEngine', () => {
  let engine: TemplateEngine;
  let testTemplatesDir: string;
  
  beforeAll(async () => {
    // 테스트용 템플릿 디렉토리 생성
    testTemplatesDir = path.join(os.tmpdir(), `template-test-${Date.now()}`);
    await fs.ensureDir(testTemplatesDir);
    
    // 테스트용 time-series 템플릿 생성
    const timeSeriesDir = path.join(testTemplatesDir, 'time-series');
    await fs.ensureDir(timeSeriesDir);
    
    // meta.json 생성
    await fs.writeJson(path.join(timeSeriesDir, 'meta.json'), {
      name: 'Time Series Visualization',
      description: 'Template for time-based data visualization',
      version: '1.0.0',
      author: 'Test Author',
      tags: ['time', 'series', 'chart'],
      requiredTables: 1,
      requiredColumns: ['date', 'numeric'],
      dependencies: ['recharts', 'date-fns'],
      variables: [
        {
          name: 'CHART_TITLE',
          type: 'string',
          required: true,
          description: 'Title for the chart',
          defaultValue: 'Time Series Chart'
        },
        {
          name: 'DATE_FORMAT',
          type: 'string',
          required: false,
          defaultValue: 'YYYY-MM-DD'
        }
      ]
    });
    
    // prompt.md 생성
    await fs.writeFile(path.join(timeSeriesDir, 'prompt.md'), `# Time Series Visualization

Project: {{PROJECT_NAME}}
User Request: {{USER_PROMPT}}
Timestamp: {{TIMESTAMP}}

## Schema Information
Tables: {{SCHEMA_TABLES}}
Total Rows: {{TOTAL_ROWS}}

## Chart Configuration
Title: {{CHART_TITLE}}
Date Format: {{DATE_FORMAT}}

## Schema Details
{{SCHEMA_DETAILS}}

## Sample Queries
{{QUERY_EXAMPLES}}
`);
    
    // 테스트용 kpi-dashboard 템플릿 생성
    const kpiDir = path.join(testTemplatesDir, 'kpi-dashboard');
    await fs.ensureDir(kpiDir);
    
    await fs.writeJson(path.join(kpiDir, 'meta.json'), {
      name: 'KPI Dashboard',
      description: 'Template for KPI metrics dashboard',
      version: '1.0.0',
      tags: ['kpi', 'metrics', 'dashboard'],
      requiredColumns: ['numeric']
    });
    
    await fs.writeFile(path.join(kpiDir, 'prompt.md'), `# KPI Dashboard
Project: {{PROJECT_NAME}}
Tables: {{TABLE_COUNT}}
`);
    
    engine = new TemplateEngine(testTemplatesDir);
  });
  
  afterAll(async () => {
    // 테스트 디렉토리 정리
    await fs.remove(testTemplatesDir);
  });
  
  describe('loadTemplate', () => {
    test('should load template successfully', async () => {
      const template = await engine.loadTemplate('time-series');
      
      expect(template.id).toBe('time-series');
      expect(template.type).toBe('time-series');
      expect(template.name).toBe('Time Series Visualization');
      expect(template.description).toBe('Template for time-based data visualization');
      expect(template.metadata.version).toBe('1.0.0');
      expect(template.metadata.tags).toContain('time');
      expect(template.content).toContain('# Time Series Visualization');
      expect(template.variables).toHaveLength(2);
    });
    
    test('should cache loaded templates', async () => {
      const template1 = await engine.loadTemplate('time-series');
      const template2 = await engine.loadTemplate('time-series');
      
      expect(template1).toBe(template2); // 같은 객체 참조
    });
    
    test('should throw error for non-existent template', async () => {
      await expect(engine.loadTemplate('non-existent' as any))
        .rejects.toThrow('Template not found');
    });
  });
  
  describe('renderTemplate', () => {
    test('should render template with all variables', async () => {
      const template = await engine.loadTemplate('time-series');
      
      const mockSchemaInfo = {
        tables: [
          {
            name: 'sales',
            columns: [
              { name: 'date', dataDistribution: { dataType: 'date' } },
              { name: 'amount', dataDistribution: { dataType: 'numeric' } }
            ],
            rowCount: 1000
          }
        ],
        metadata: {
          tableCount: 1,
          totalRowCount: 1000
        },
        relationships: []
      };
      
      const rendered = engine.renderTemplate(template, {
        schemaInfo: mockSchemaInfo as any,
        userPrompt: 'Create a sales dashboard',
        projectName: 'test-project',
        visualizationType: 'time-series',
        timestamp: new Date('2024-01-15T10:00:00Z'),
        additionalContext: {
          CUSTOM_VAR: 'custom value'
        }
      });
      
      expect(rendered).toContain('Project: test-project');
      expect(rendered).toContain('User Request: Create a sales dashboard');
      expect(rendered).toContain('Tables: sales');
      expect(rendered).toContain('Total Rows: 1000');
      expect(rendered).toContain('Title: Time Series Chart'); // 기본값
      expect(rendered).toContain('Date Format: YYYY-MM-DD'); // 기본값
    });
    
    test('should handle missing optional variables', async () => {
      const template = await engine.loadTemplate('kpi-dashboard');
      
      const mockSchemaInfo = {
        tables: [],
        metadata: {
          tableCount: 0,
          totalRowCount: 0
        },
        relationships: []
      };
      
      const rendered = engine.renderTemplate(template, {
        schemaInfo: mockSchemaInfo as any,
        userPrompt: 'Test',
        projectName: 'test',
        visualizationType: 'kpi-dashboard',
        timestamp: new Date()
      });
      
      expect(rendered).toContain('Project: test');
      expect(rendered).toContain('Tables: 0');
    });
  });
  
  describe('validateTemplate', () => {
    test('should validate template successfully', async () => {
      const template = await engine.loadTemplate('time-series');
      const result = engine.validateTemplate(template);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
    
    test('should detect undefined variables in template', async () => {
      const template = {
        id: 'test',
        type: 'custom' as any,
        name: 'Test',
        description: '',
        metadata: { version: '1.0', tags: [] } as any,
        content: 'Hello {{UNDEFINED_VAR}}',
        variables: []
      };
      
      const result = engine.validateTemplate(template);
      
      expect(result.valid).toBe(true); // 경고만 있고 에러는 없음
      expect(result.warnings).toContain('Undefined variable used in template: UNDEFINED_VAR');
    });
  });
  
  describe('getAvailableTemplates', () => {
    test('should list all available templates', async () => {
      const templates = await engine.getAvailableTemplates();
      
      expect(templates).toHaveLength(2);
      expect(templates.map(t => t.id)).toContain('time-series');
      expect(templates.map(t => t.id)).toContain('kpi-dashboard');
    });
  });
});

describe('TemplateSelector', () => {
  describe('suggestVisualizationType', () => {
    test('should suggest time-series for date and numeric data', () => {
      const schemaInfo = {
        tables: [
          {
            name: 'orders',
            columns: [
              { 
                name: 'order_date', 
                dataDistribution: { dataType: 'date' },
                isPrimaryKey: false 
              },
              { 
                name: 'total', 
                dataDistribution: { dataType: 'numeric' },
                isPrimaryKey: false 
              }
            ]
          }
        ],
        relationships: [],
        metadata: { tableCount: 1 }
      };
      
      const suggestions = TemplateSelector.suggestVisualizationType(schemaInfo as any);
      
      expect(suggestions[0]).toBe('time-series');
    });
    
    test('should suggest kpi-dashboard for multiple numeric columns', () => {
      const schemaInfo = {
        tables: [
          {
            name: 'metrics',
            columns: [
              { name: 'revenue', dataDistribution: { dataType: 'numeric' }, isPrimaryKey: false },
              { name: 'profit', dataDistribution: { dataType: 'numeric' }, isPrimaryKey: false },
              { name: 'customers', dataDistribution: { dataType: 'numeric' }, isPrimaryKey: false },
              { name: 'orders', dataDistribution: { dataType: 'numeric' }, isPrimaryKey: false }
            ]
          }
        ],
        relationships: [],
        metadata: { tableCount: 1 }
      };
      
      const suggestions = TemplateSelector.suggestVisualizationType(schemaInfo as any);
      
      expect(suggestions).toContain('kpi-dashboard');
    });
  });
  
  describe('checkTemplateCompatibility', () => {
    test('should check time-series template compatibility', () => {
      const template = {
        type: 'time-series',
        metadata: {
          requiredColumns: ['date', 'numeric']
        }
      };
      
      const schemaInfo = {
        tables: [
          {
            columns: [
              { name: 'date', dataDistribution: { dataType: 'date' } },
              { name: 'value', dataDistribution: { dataType: 'numeric' }, isPrimaryKey: false }
            ]
          }
        ],
        metadata: { tableCount: 1 }
      };
      
      const result = TemplateSelector.checkTemplateCompatibility(
        template as any, 
        schemaInfo as any
      );
      
      expect(result.compatible).toBe(true);
      expect(result.score).toBeGreaterThan(80);
    });
    
    test('should detect incompatibility for missing required columns', () => {
      const template = {
        type: 'time-series',
        metadata: {
          requiredColumns: ['date']
        }
      };
      
      const schemaInfo = {
        tables: [
          {
            columns: [
              { name: 'id', dataDistribution: { dataType: 'numeric' }, isPrimaryKey: true },
              { name: 'name', dataDistribution: { dataType: 'text' } }
            ]
          }
        ],
        metadata: { tableCount: 1 }
      };
      
      const result = TemplateSelector.checkTemplateCompatibility(
        template as any,
        schemaInfo as any
      );
      
      expect(result.compatible).toBe(false);
      expect(result.reasons).toContain('No date column found in schema');
    });
  });
});