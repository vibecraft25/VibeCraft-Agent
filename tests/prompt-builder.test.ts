import { PromptBuilder, PromptComponents, ProjectContext, OptimizationContext } from '../src/core/prompt-builder';
import { PromptValidator } from '../src/utils/prompt-validator';
import { SchemaInfo, TableInfo, ColumnInfo } from '../src/core/schema-analyzer';

describe('PromptBuilder', () => {
  let promptBuilder: PromptBuilder;
  let mockSchemaInfo: SchemaInfo;
  
  beforeEach(() => {
    promptBuilder = new PromptBuilder();
    
    // Mock schema info
    mockSchemaInfo = {
      tables: [
        {
          name: 'sales',
          rowCount: 1000,
          columns: [
            {
              name: 'id',
              type: 'INTEGER',
              nullable: false,
              isPrimaryKey: true,
              isForeignKey: false,
              isUnique: true,
              dataDistribution: {
                uniqueValues: 1000,
                nullCount: 0,
                minValue: 1,
                maxValue: 1000,
                dataType: 'numeric'
              }
            },
            {
              name: 'date',
              type: 'TEXT',
              nullable: false,
              isPrimaryKey: false,
              isForeignKey: false,
              isUnique: false,
              dataDistribution: {
                uniqueValues: 365,
                nullCount: 0,
                dataType: 'text'
              }
            },
            {
              name: 'amount',
              type: 'REAL',
              nullable: false,
              isPrimaryKey: false,
              isForeignKey: false,
              isUnique: false,
              dataDistribution: {
                uniqueValues: 500,
                nullCount: 0,
                minValue: 10.50,
                maxValue: 5000.00,
                dataType: 'numeric'
              }
            }
          ],
          foreignKeys: [],
          indexes: [],
          sampleData: [
            { id: 1, date: '2024-01-01', amount: 150.50 },
            { id: 2, date: '2024-01-02', amount: 200.00 }
          ]
        }
      ],
      relationships: [],
      metadata: {
        version: '3.36.0',
        encoding: 'UTF-8',
        pageSize: 4096,
        totalSize: 1000000,
        tableCount: 1,
        totalRowCount: 1000,
        lastModified: new Date()
      }
    };
  });
  
  describe('buildPrompt', () => {
    test('should build complete prompt with all sections', () => {
      const components: PromptComponents = {
        systemPrompt: promptBuilder.getSystemPrompt(),
        templateContent: '## Time Series Visualization\nCreate line charts for temporal data.',
        userPrompt: 'Create a sales dashboard showing monthly trends',
        schemaInfo: mockSchemaInfo,
        projectContext: {
          projectName: 'Sales Dashboard',
          outputDir: '/output/sales-dashboard'
        }
      };
      
      const prompt = promptBuilder.buildPrompt(components);
      
      // Check for required sections
      expect(prompt).toContain('Core Rules');
      expect(prompt).toContain('Technical Stack');
      expect(prompt).toContain('Database Information');
      expect(prompt).toContain('User Requirements');
      expect(prompt).toContain('Implementation Instructions');
      
      // Check for specific content
      expect(prompt).toContain('sales dashboard showing monthly trends');
      expect(prompt).toContain('Table: sales');
      expect(prompt).toContain('Time Series Visualization');
      expect(prompt).toContain('Project Name: Sales Dashboard');
    });
    
    test('should include schema details correctly', () => {
      const components: PromptComponents = {
        systemPrompt: promptBuilder.getSystemPrompt(),
        templateContent: 'Template content',
        userPrompt: 'User request',
        schemaInfo: mockSchemaInfo
      };
      
      const prompt = promptBuilder.buildPrompt(components);
      
      // Check schema formatting
      expect(prompt).toContain('Row Count: 1000');
      expect(prompt).toContain('id: INTEGER [PRIMARY KEY, NOT NULL]');
      expect(prompt).toContain('date: TEXT');
      expect(prompt).toContain('amount: REAL');
      expect(prompt).toContain('Unique values: 1000');
      expect(prompt).toContain('Range: 10.5 to 5000');
    });
    
    test('should include sample data when available', () => {
      const components: PromptComponents = {
        systemPrompt: promptBuilder.getSystemPrompt(),
        templateContent: 'Template',
        userPrompt: 'Request',
        schemaInfo: mockSchemaInfo
      };
      
      const prompt = promptBuilder.buildPrompt(components);
      
      expect(prompt).toContain('Sample Data');
      expect(prompt).toContain('"id": 1');
      expect(prompt).toContain('"date": "2024-01-01"');
      expect(prompt).toContain('"amount": 150.5');
    });
    
    test('should handle project context with additional requirements', () => {
      const context: ProjectContext = {
        projectName: 'Analytics App',
        outputDir: '/output',
        additionalRequirements: [
          'Support dark mode',
          'Add export to CSV functionality'
        ],
        constraints: [
          'Must work offline',
          'Limit bundle size to 1MB'
        ]
      };
      
      const components: PromptComponents = {
        systemPrompt: promptBuilder.getSystemPrompt(),
        templateContent: 'Template',
        userPrompt: 'Build analytics',
        schemaInfo: mockSchemaInfo,
        projectContext: context
      };
      
      const prompt = promptBuilder.buildPrompt(components);
      
      expect(prompt).toContain('Additional Requirements:');
      expect(prompt).toContain('- Support dark mode');
      expect(prompt).toContain('- Add export to CSV functionality');
      expect(prompt).toContain('Constraints:');
      expect(prompt).toContain('- Must work offline');
      expect(prompt).toContain('- Limit bundle size to 1MB');
    });
  });
  
  describe('optimizePrompt', () => {
    test('should truncate prompt when exceeding token limit', () => {
      const longPrompt = 'a'.repeat(50000); // Very long prompt
      const context: OptimizationContext = {
        maxTokens: 1000
      };
      
      const optimized = promptBuilder.optimizePrompt(longPrompt, context);
      
      // Should be significantly shorter
      expect(optimized.length).toBeLessThan(5000); // ~1000 tokens * 4 chars
    });
    
    test('should emphasize focus areas', () => {
      const prompt = 'Create a dashboard with performance metrics and security features.';
      const context: OptimizationContext = {
        focusAreas: ['performance', 'security']
      };
      
      const optimized = promptBuilder.optimizePrompt(prompt, context);
      
      expect(optimized).toContain('IMPORTANT FOCUS AREAS:');
      expect(optimized).toContain('**performance**');
      expect(optimized).toContain('**security**');
    });
    
    test('should remove excluded patterns', () => {
      const prompt = 'Create app with TODO comments and FIXME notes. Add proper documentation.';
      const context: OptimizationContext = {
        excludePatterns: ['TODO', 'FIXME']
      };
      
      const optimized = promptBuilder.optimizePrompt(prompt, context);
      
      expect(optimized).not.toContain('TODO');
      expect(optimized).not.toContain('FIXME');
      expect(optimized).toContain('Add proper documentation');
    });
  });
  
  describe('getSystemPrompt', () => {
    test('should return valid system prompt', () => {
      const systemPrompt = promptBuilder.getSystemPrompt();
      
      expect(systemPrompt).toContain('VibeCraft-viz');
      expect(systemPrompt).toContain('React');
      expect(systemPrompt).toContain('sql.js');
      expect(systemPrompt).toContain('Tailwind CSS');
    });
  });
});

describe('PromptValidator', () => {
  describe('validatePrompt', () => {
    test('should validate complete prompt', () => {
      const validPrompt = `
## Core Rules:
1. Create React app

## Technical Stack:
- React 18

## Database Information:
Table: users

## User Requirements:
Build a dashboard
`;
      
      const result = PromptValidator.validatePrompt(validPrompt);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
    
    test('should detect missing sections', () => {
      const incompletePrompt = `
## Core Rules:
1. Create React app

## User Requirements:
Build a dashboard
`;
      
      const result = PromptValidator.validatePrompt(incompletePrompt);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing required section: Technical Stack');
      expect(result.errors).toContain('Missing required section: Database Information');
    });
    
    test('should warn about dangerous SQL patterns', () => {
      const dangerousPrompt = `
## Core Rules:
Rules here

## Technical Stack:
Stack here

## Database Information:
DROP TABLE users;

## User Requirements:
Requirements
`;
      
      const result = PromptValidator.validatePrompt(dangerousPrompt);
      
      expect(result.warnings).toContain('Prompt contains potentially dangerous SQL patterns');
    });
    
    test('should calculate prompt statistics', () => {
      const prompt = 'This is a test prompt with some content.';
      
      const result = PromptValidator.validatePrompt(prompt);
      
      expect(result.stats).toBeDefined();
      expect(result.stats!.characterCount).toBe(40);
      expect(result.stats!.wordCount).toBe(8);
      expect(result.stats!.estimatedTokens).toBeGreaterThan(0);
    });
  });
  
  describe('validateComponents', () => {
    test('should validate all components', () => {
      const components = {
        systemPrompt: 'System prompt',
        templateContent: 'Template content',
        userPrompt: 'User requirements for the dashboard',
        schemaInfo: {
          tables: [{ name: 'test' }]
        }
      };
      
      const result = PromptValidator.validateComponents(components);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
    
    test('should error on missing required components', () => {
      const components = {
        systemPrompt: 'System',
        templateContent: '',
        userPrompt: '',
        schemaInfo: null
      };
      
      const result = PromptValidator.validateComponents(components);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Template content is required');
      expect(result.errors).toContain('User prompt is required');
      expect(result.errors).toContain('Schema information is required');
    });
    
    test('should warn about short user prompt', () => {
      const components = {
        templateContent: 'Template',
        userPrompt: 'Dashboard',
        schemaInfo: { tables: [{ name: 'test' }] }
      };
      
      const result = PromptValidator.validateComponents(components);
      
      expect(result.warnings).toContain('User prompt is very short, consider providing more details');
    });
  });
  
  describe('isOptimized', () => {
    test('should identify optimized prompts', () => {
      const shortPrompt = 'This is a reasonably sized prompt.';
      const longPrompt = 'x'.repeat(40000);
      
      expect(PromptValidator.isOptimized(shortPrompt)).toBe(true);
      expect(PromptValidator.isOptimized(longPrompt)).toBe(false);
    });
  });
  
  describe('getOptimizationSuggestions', () => {
    test('should suggest optimizations for large prompts', () => {
      const largePrompt = 'x'.repeat(35000);
      
      const suggestions = PromptValidator.getOptimizationSuggestions(largePrompt);
      
      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions.some(s => s.includes('reducing prompt size'))).toBe(true);
    });
    
    test('should detect duplicate content', () => {
      const duplicatePrompt = Array(20).fill('This line is repeated\n').join('');
      
      const suggestions = PromptValidator.getOptimizationSuggestions(duplicatePrompt);
      
      expect(suggestions).toContain('Remove duplicate lines to reduce prompt size');
    });
  });
});