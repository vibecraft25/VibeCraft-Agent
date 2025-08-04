import fs from 'fs-extra';
import path from 'path';

// Output validator for generated React applications
export interface IOutputValidator {
  validate(outputPath: string): Promise<ValidationResult>;
  getValidationRules(): ValidationRule[];
  validateWithCustomRules(outputPath: string, rules: ValidationRule[]): Promise<ValidationResult>;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  summary: ValidationSummary;
}

export interface ValidationError {
  type: string;
  message: string;
  file?: string;
  line?: number;
  severity: 'critical' | 'error';
}

export interface ValidationWarning {
  type: string;
  message: string;
  file?: string;
  suggestion?: string;
}

export interface ValidationRule {
  name: string;
  description: string;
  type: 'file-exists' | 'file-content' | 'json-valid' | 'custom';
  target: string | string[];
  validate: (context: ValidationContext) => Promise<boolean>;
  errorMessage: string;
  critical?: boolean;
}

export interface ValidationContext {
  outputPath: string;
  files: Map<string, string>;
  packageJson?: any;
}

export interface ValidationSummary {
  totalFiles: number;
  requiredFiles: number;
  missingFiles: string[];
  validFiles: number;
  hasPackageJson: boolean;
  hasSqliteFile: boolean;
  isRunnable: boolean;
}

export class OutputValidator implements IOutputValidator {
  private defaultRules: ValidationRule[];
  
  constructor() {
    this.defaultRules = this.createDefaultRules();
  }
  
  private createDefaultRules(): ValidationRule[] {
    return [
      {
        name: 'package.json exists',
        description: 'Check if package.json exists',
        type: 'file-exists',
        target: 'package.json',
        validate: async (ctx) => await fs.pathExists(path.join(ctx.outputPath, 'package.json')),
        errorMessage: 'package.json not found',
        critical: true
      },
      {
        name: 'package.json valid',
        description: 'Validate package.json structure',
        type: 'json-valid',
        target: 'package.json',
        validate: async (ctx) => {
          try {
            const pkgPath = path.join(ctx.outputPath, 'package.json');
            const content = await fs.readJson(pkgPath);
            ctx.packageJson = content;
            
            // 필수 필드 확인
            return !!(content.name && content.version && content.dependencies);
          } catch {
            return false;
          }
        },
        errorMessage: 'package.json is invalid or missing required fields',
        critical: true
      },
      {
        name: 'React app structure',
        description: 'Check React app file structure',
        type: 'file-exists',
        target: ['src/App.tsx', 'src/App.jsx', 'src/App.js'],
        validate: async (ctx) => {
          const targets = ['src/App.tsx', 'src/App.jsx', 'src/App.js'];
          for (const target of targets) {
            if (await fs.pathExists(path.join(ctx.outputPath, target))) {
              return true;
            }
          }
          return false;
        },
        errorMessage: 'Main App component not found',
        critical: true
      },
      {
        name: 'index.html exists',
        description: 'Check if index.html exists',
        type: 'file-exists',
        target: 'index.html',
        validate: async (ctx) => {
          // Vite uses index.html in root, traditional React uses public/index.html
          const rootIndex = await fs.pathExists(path.join(ctx.outputPath, 'index.html'));
          const publicIndex = await fs.pathExists(path.join(ctx.outputPath, 'public/index.html'));
          return rootIndex || publicIndex;
        },
        errorMessage: 'index.html not found (neither in root nor in public/)',
        critical: true
      },
      {
        name: 'SQLite database',
        description: 'Check if SQLite database is copied',
        type: 'file-exists',
        target: 'public/',
        validate: async (ctx) => {
          // SQLite 파일은 이름이 다를 수 있으므로 .sqlite 확장자 확인
          const publicDir = path.join(ctx.outputPath, 'public');
          if (!await fs.pathExists(publicDir)) return false;
          
          const files = await fs.readdir(publicDir);
          return files.some(file => file.endsWith('.sqlite') || file.endsWith('.db'));
        },
        errorMessage: 'SQLite database not found in public directory',
        critical: true
      },
      {
        name: 'Required dependencies',
        description: 'Check for required npm packages',
        type: 'custom',
        target: 'package.json',
        validate: async (ctx) => {
          if (!ctx.packageJson) return false;
          
          const requiredDeps = ['react', 'react-dom', 'sql.js'];
          const deps = {
            ...ctx.packageJson.dependencies,
            ...ctx.packageJson.devDependencies
          };
          
          return requiredDeps.every(dep => dep in deps);
        },
        errorMessage: 'Missing required dependencies (react, react-dom, sql.js)',
        critical: true
      },
      {
        name: 'Visualization library',
        description: 'Check for visualization library',
        type: 'custom',
        target: 'package.json',
        validate: async (ctx) => {
          if (!ctx.packageJson) return false;
          
          const vizLibs = ['recharts', 'chart.js', 'd3', 'plotly.js', 'victory'];
          const deps = {
            ...ctx.packageJson.dependencies,
            ...ctx.packageJson.devDependencies
          };
          
          return vizLibs.some(lib => lib in deps);
        },
        errorMessage: 'No visualization library found',
        critical: false
      },
      {
        name: 'README file',
        description: 'Check if README exists',
        type: 'file-exists',
        target: ['README.md', 'readme.md', 'README.txt'],
        validate: async (ctx) => {
          const targets = ['README.md', 'readme.md', 'README.txt'];
          for (const target of targets) {
            if (await fs.pathExists(path.join(ctx.outputPath, target))) {
              return true;
            }
          }
          return false;
        },
        errorMessage: 'README file not found',
        critical: false
      }
    ];
  }
  
  async validate(outputPath: string): Promise<ValidationResult> {
    return this.validateWithCustomRules(outputPath, this.defaultRules);
  }
  
  async validateWithCustomRules(
    outputPath: string, 
    rules: ValidationRule[]
  ): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const context: ValidationContext = {
      outputPath,
      files: new Map()
    };
    
    // 파일 목록 수집
    const files = await this.collectFiles(outputPath);
    context.files = files;
    
    // 규칙 검증
    for (const rule of rules) {
      try {
        const isValid = await rule.validate(context);
        
        if (!isValid) {
          if (rule.critical) {
            errors.push({
              type: rule.name,
              message: rule.errorMessage,
              severity: 'critical'
            });
          } else {
            warnings.push({
              type: rule.name,
              message: rule.errorMessage
            });
          }
        }
      } catch (error: any) {
        errors.push({
          type: rule.name,
          message: `Validation error: ${error.message}`,
          severity: 'error'
        });
      }
    }
    
    // 추가 검증
    const additionalValidation = await this.performAdditionalValidation(outputPath, context);
    errors.push(...additionalValidation.errors);
    warnings.push(...additionalValidation.warnings);
    
    // 요약 생성
    const summary = await this.generateSummary(outputPath, context, errors);
    
    return {
      valid: errors.length === 0,
      errors,
      warnings,
      summary
    };
  }
  
  private async collectFiles(outputPath: string): Promise<Map<string, string>> {
    const files = new Map<string, string>();
    
    const walkDir = async (dir: string, prefix: string = ''): Promise<void> => {
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          const relativePath = path.join(prefix, entry.name);
          
          if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
            await walkDir(fullPath, relativePath);
          } else if (entry.isFile() && !entry.name.startsWith('.')) {
            files.set(relativePath, fullPath);
          }
        }
      } catch (error) {
        // Directory might not exist or access denied
        return;
      }
    };
    
    await walkDir(outputPath);
    return files;
  }
  
  private async performAdditionalValidation(
    outputPath: string,
    context: ValidationContext
  ): Promise<{ errors: ValidationError[], warnings: ValidationWarning[] }> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    
    // SQL.js 사용 확인
    const appFiles = Array.from(context.files.keys()).filter(f => 
      f.endsWith('.js') || f.endsWith('.jsx') || f.endsWith('.ts') || f.endsWith('.tsx')
    );
    
    let usesSqlJs = false;
    for (const file of appFiles) {
      const filePath = context.files.get(file);
      if (filePath) {
        try {
          const content = await fs.readFile(filePath, 'utf-8');
          if (content.includes('sql.js') || content.includes('initSqlJs')) {
            usesSqlJs = true;
            break;
          }
        } catch {
          // 파일 읽기 실패 시 무시
        }
      }
    }
    
    if (!usesSqlJs) {
      warnings.push({
        type: 'sql.js usage',
        message: 'No sql.js usage detected in the code',
        suggestion: 'Make sure the app is using sql.js to access the SQLite database'
      });
    }
    
    // Tailwind CSS 확인
    if (context.packageJson) {
      const hasTailwind = 'tailwindcss' in (context.packageJson.dependencies || {}) ||
                         'tailwindcss' in (context.packageJson.devDependencies || {});
      
      if (!hasTailwind) {
        warnings.push({
          type: 'Tailwind CSS',
          message: 'Tailwind CSS not found in dependencies',
          suggestion: 'Consider adding Tailwind CSS for styling'
        });
      }
    }
    
    // 빌드 스크립트 확인
    if (context.packageJson && context.packageJson.scripts) {
      const scripts = context.packageJson.scripts;
      
      // Vite uses 'dev' script, traditional React uses 'start'
      if (!scripts.start && !scripts.dev) {
        errors.push({
          type: 'npm scripts',
          message: 'No start or dev script defined in package.json',
          severity: 'error'
        });
      }
      
      if (!scripts.build) {
        warnings.push({
          type: 'npm scripts',
          message: 'No build script defined in package.json',
          suggestion: 'Add a build script for production deployment'
        });
      }
    }
    
    return { errors, warnings };
  }
  
  private async generateSummary(
    outputPath: string,
    context: ValidationContext,
    errors: ValidationError[]
  ): Promise<ValidationSummary> {
    const requiredFiles = [
      'package.json',
      'index.html', // Vite는 루트에, 기존은 public에
      'src/App' // 확장자는 다양할 수 있음
    ];
    
    const missingFiles: string[] = [];
    
    // package.json 확인
    if (!context.files.has('package.json')) {
      missingFiles.push('package.json');
    }
    
    // index.html 확인 (Vite는 루트에, 기존 React는 public에)
    const hasIndexHtml = context.files.has('index.html') || 
                        context.files.has(path.join('public', 'index.html'));
    if (!hasIndexHtml) {
      missingFiles.push('index.html');
    }
    
    // App 컴포넌트 확인
    const hasApp = ['tsx', 'jsx', 'js'].some(ext => 
      context.files.has(path.join('src', `App.${ext}`))
    );
    if (!hasApp) {
      missingFiles.push('src/App.(tsx|jsx|js)');
    }
    
    // SQLite 파일 확인
    const hasSqlite = Array.from(context.files.keys()).some(file => 
      file.startsWith('public') && (file.endsWith('.sqlite') || file.endsWith('.db'))
    );
    if (!hasSqlite) {
      missingFiles.push('public/*.sqlite');
    }
    
    const hasCriticalErrors = errors.some(e => e.severity === 'critical');
    
    return {
      totalFiles: context.files.size,
      requiredFiles: requiredFiles.length + 1, // +1 for SQLite
      missingFiles,
      validFiles: context.files.size - missingFiles.length,
      hasPackageJson: context.files.has('package.json'),
      hasSqliteFile: hasSqlite,
      isRunnable: !hasCriticalErrors && missingFiles.length === 0
    };
  }
  
  getValidationRules(): ValidationRule[] {
    return [...this.defaultRules];
  }
}