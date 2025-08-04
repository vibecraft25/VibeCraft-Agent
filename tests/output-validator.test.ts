import { OutputValidator, ValidationResult } from '../src/core/output-validator';
import fs from 'fs-extra';
import path from 'path';

jest.mock('fs-extra');

describe('OutputValidator', () => {
  let validator: OutputValidator;
  const mockOutputPath = '/test/output';
  
  beforeEach(() => {
    validator = new OutputValidator();
    jest.clearAllMocks();
  });
  
  describe('validate', () => {
    beforeEach(() => {
      // Setup default mock behavior
      (fs.pathExists as unknown as jest.Mock).mockResolvedValue(false);
      (fs.readdir as unknown as jest.Mock).mockImplementation((dir: string, options?: any) => {
        if (options?.withFileTypes) {
          return Promise.resolve([]);
        }
        return Promise.resolve([]);
      });
      (fs.readJson as unknown as jest.Mock).mockRejectedValue(new Error('File not found'));
      (fs.readFile as unknown as jest.Mock).mockResolvedValue('');
    });
    
    test('should fail when no files exist', async () => {
      const result = await validator.validate(mockOutputPath);
      
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(e => e.message.includes('package.json not found'))).toBe(true);
    });
    
    test('should pass with valid React app structure', async () => {
      // Mock file existence
      (fs.pathExists as unknown as jest.Mock).mockImplementation((filePath: string) => {
        const validPaths = [
          path.join(mockOutputPath, 'package.json'),
          path.join(mockOutputPath, 'src/App.tsx'),
          path.join(mockOutputPath, 'public/index.html'),
          path.join(mockOutputPath, 'public')
        ];
        return Promise.resolve(validPaths.some(p => filePath === p));
      });
      
      // Mock package.json content
      (fs.readJson as unknown as jest.Mock).mockResolvedValueOnce({
        name: 'test-app',
        version: '1.0.0',
        dependencies: {
          'react': '^18.0.0',
          'react-dom': '^18.0.0',
          'sql.js': '^1.8.0',
          'recharts': '^2.8.0',
          'tailwindcss': '^3.3.0'
        },
        scripts: {
          start: 'react-scripts start',
          build: 'react-scripts build'
        }
      });
      
      // Mock SQLite file in public directory
      (fs.readdir as unknown as jest.Mock).mockImplementation((dir: string) => {
        if (dir === path.join(mockOutputPath, 'public')) {
          return Promise.resolve(['index.html', 'data.sqlite']);
        }
        return Promise.resolve([]);
      });
      
      // Mock file collection
      (fs.readdir as unknown as jest.Mock).mockImplementation((dir: string, options?: any) => {
        if (options?.withFileTypes) {
          if (dir === mockOutputPath) {
            return Promise.resolve([
              { name: 'package.json', isDirectory: () => false, isFile: () => true },
              { name: 'src', isDirectory: () => true, isFile: () => false },
              { name: 'public', isDirectory: () => true, isFile: () => false }
            ]);
          } else if (dir.endsWith('src')) {
            return Promise.resolve([
              { name: 'App.tsx', isDirectory: () => false, isFile: () => true }
            ]);
          } else if (dir.endsWith('public')) {
            return Promise.resolve([
              { name: 'index.html', isDirectory: () => false, isFile: () => true },
              { name: 'data.sqlite', isDirectory: () => false, isFile: () => true }
            ]);
          }
        } else {
          if (dir === path.join(mockOutputPath, 'public')) {
            return Promise.resolve(['index.html', 'data.sqlite']);
          }
        }
        return Promise.resolve([]);
      });
      
      const result = await validator.validate(mockOutputPath);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.summary.isRunnable).toBe(true);
      expect(result.summary.hasPackageJson).toBe(true);
      expect(result.summary.hasSqliteFile).toBe(true);
    });
    
    test('should detect missing required dependencies', async () => {
      // Mock basic structure
      (fs.pathExists as unknown as jest.Mock).mockImplementation((filePath: string) => {
        const validPaths = [
          path.join(mockOutputPath, 'package.json'),
          path.join(mockOutputPath, 'src/App.tsx'),
          path.join(mockOutputPath, 'public/index.html'),
          path.join(mockOutputPath, 'public')
        ];
        return Promise.resolve(validPaths.some(p => filePath === p));
      });
      
      // Mock package.json without sql.js
      (fs.readJson as unknown as jest.Mock).mockResolvedValueOnce({
        name: 'test-app',
        version: '1.0.0',
        dependencies: {
          'react': '^18.0.0',
          'react-dom': '^18.0.0'
          // Missing sql.js
        }
      });
      
      // Mock SQLite file
      (fs.readdir as unknown as jest.Mock).mockImplementation((dir: string) => {
        if (dir === path.join(mockOutputPath, 'public')) {
          return Promise.resolve(['index.html', 'data.sqlite']);
        }
        return Promise.resolve([]);
      });
      
      const result = await validator.validate(mockOutputPath);
      
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.message.includes('Missing required dependencies'))).toBe(true);
    });
    
    test('should warn about missing visualization library', async () => {
      // Mock basic structure
      (fs.pathExists as unknown as jest.Mock).mockImplementation((filePath: string) => {
        const validPaths = [
          path.join(mockOutputPath, 'package.json'),
          path.join(mockOutputPath, 'src/App.tsx'),
          path.join(mockOutputPath, 'public/index.html'),
          path.join(mockOutputPath, 'public')
        ];
        return Promise.resolve(validPaths.some(p => filePath === p));
      });
      
      // Mock package.json without visualization library
      (fs.readJson as unknown as jest.Mock).mockResolvedValueOnce({
        name: 'test-app',
        version: '1.0.0',
        dependencies: {
          'react': '^18.0.0',
          'react-dom': '^18.0.0',
          'sql.js': '^1.8.0'
        },
        scripts: {
          start: 'react-scripts start'
        }
      });
      
      // Mock SQLite file
      (fs.readdir as unknown as jest.Mock).mockImplementation((dir: string) => {
        if (dir === path.join(mockOutputPath, 'public')) {
          return Promise.resolve(['index.html', 'data.sqlite']);
        }
        return Promise.resolve([]);
      });
      
      const result = await validator.validate(mockOutputPath);
      
      expect(result.valid).toBe(true); // Not critical
      expect(result.warnings.some(w => w.message.includes('No visualization library found'))).toBe(true);
    });
    
    test('should fail when SQLite database is missing', async () => {
      // Mock basic structure without SQLite
      (fs.pathExists as unknown as jest.Mock).mockImplementation((filePath: string) => {
        const validPaths = [
          path.join(mockOutputPath, 'package.json'),
          path.join(mockOutputPath, 'src/App.tsx'),
          path.join(mockOutputPath, 'public/index.html'),
          path.join(mockOutputPath, 'public')
        ];
        return Promise.resolve(validPaths.some(p => filePath === p));
      });
      
      // Mock package.json
      (fs.readJson as unknown as jest.Mock).mockResolvedValueOnce({
        name: 'test-app',
        version: '1.0.0',
        dependencies: {
          'react': '^18.0.0',
          'react-dom': '^18.0.0',
          'sql.js': '^1.8.0'
        },
        scripts: {
          start: 'react-scripts start'
        }
      });
      
      // Mock empty public directory
      (fs.readdir as unknown as jest.Mock).mockResolvedValue(['index.html']); // No SQLite file
      
      const result = await validator.validate(mockOutputPath);
      
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.message.includes('SQLite database not found'))).toBe(true);
    });
    
    test('should accept alternative App file extensions', async () => {
      // Mock with App.jsx instead of App.tsx
      (fs.pathExists as unknown as jest.Mock).mockImplementation((filePath: string) => {
        const validPaths = [
          path.join(mockOutputPath, 'package.json'),
          path.join(mockOutputPath, 'src/App.jsx'), // .jsx instead of .tsx
          path.join(mockOutputPath, 'public/index.html'),
          path.join(mockOutputPath, 'public')
        ];
        return Promise.resolve(validPaths.some(p => filePath === p));
      });
      
      // Mock package.json
      (fs.readJson as unknown as jest.Mock).mockResolvedValueOnce({
        name: 'test-app',
        version: '1.0.0',
        dependencies: {
          'react': '^18.0.0',
          'react-dom': '^18.0.0',
          'sql.js': '^1.8.0'
        },
        scripts: {
          start: 'react-scripts start'
        }
      });
      
      // Mock SQLite file
      (fs.readdir as unknown as jest.Mock).mockResolvedValue(['index.html', 'data.sqlite']);
      
      const result = await validator.validate(mockOutputPath);
      
      expect(result.valid).toBe(true);
    });
    
    test('should warn about missing npm scripts', async () => {
      // Mock basic structure
      (fs.pathExists as unknown as jest.Mock).mockImplementation((filePath: string) => {
        const validPaths = [
          path.join(mockOutputPath, 'package.json'),
          path.join(mockOutputPath, 'src/App.tsx'),
          path.join(mockOutputPath, 'public/index.html'),
          path.join(mockOutputPath, 'public')
        ];
        return Promise.resolve(validPaths.some(p => filePath === p));
      });
      
      // Mock package.json without scripts
      (fs.readJson as unknown as jest.Mock).mockResolvedValueOnce({
        name: 'test-app',
        version: '1.0.0',
        dependencies: {
          'react': '^18.0.0',
          'react-dom': '^18.0.0',
          'sql.js': '^1.8.0'
        },
        scripts: {
          // No start script
          test: 'jest'
        }
      });
      
      // Mock SQLite file
      (fs.readdir as unknown as jest.Mock).mockResolvedValue(['index.html', 'data.sqlite']);
      
      const result = await validator.validate(mockOutputPath);
      
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.message.includes('No start or dev script'))).toBe(true);
      expect(result.warnings.some(w => w.message.includes('No build script'))).toBe(true);
    });
  });
  
  describe('getValidationRules', () => {
    test('should return all default rules', () => {
      const rules = validator.getValidationRules();
      
      expect(rules.length).toBeGreaterThan(0);
      expect(rules.some(r => r.name === 'package.json exists')).toBe(true);
      expect(rules.some(r => r.name === 'React app structure')).toBe(true);
      expect(rules.some(r => r.name === 'SQLite database')).toBe(true);
    });
  });
  
  describe('validateWithCustomRules', () => {
    test('should validate with custom rules', async () => {
      const customRules = [
        {
          name: 'Custom rule',
          description: 'Test custom rule',
          type: 'custom' as const,
          target: 'test',
          validate: async () => true,
          errorMessage: 'Custom rule failed',
          critical: true
        }
      ];
      
      const result = await validator.validateWithCustomRules(mockOutputPath, customRules);
      
      expect(result.errors).toHaveLength(0);
    });
  });
});

describe('ValidationReporter', () => {
  const { ValidationReporter } = require('../src/utils/validation-reporter');
  
  beforeEach(() => {
    jest.spyOn(console, 'log').mockImplementation();
  });
  
  afterEach(() => {
    jest.restoreAllMocks();
  });
  
  test('should print validation report', () => {
    const mockResult: ValidationResult = {
      valid: true,
      errors: [],
      warnings: [
        {
          type: 'test',
          message: 'Test warning',
          suggestion: 'Fix this'
        }
      ],
      summary: {
        totalFiles: 10,
        requiredFiles: 4,
        missingFiles: [],
        validFiles: 10,
        hasPackageJson: true,
        hasSqliteFile: true,
        isRunnable: true
      }
    };
    
    ValidationReporter.printReport(mockResult);
    
    expect(console.log).toHaveBeenCalled();
  });
});