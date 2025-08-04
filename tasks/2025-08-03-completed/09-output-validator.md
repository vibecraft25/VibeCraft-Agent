# Task 9: Output Validator 모듈 구현

## 목표
생성된 React 애플리케이션의 유효성을 검증하는 Output Validator 모듈을 구현합니다.

## 작업 내용

### 9.1 Output Validator 인터페이스 정의
```typescript
// src/core/output-validator.ts
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
```

### 9.2 Output Validator 구현
```typescript
// src/core/output-validator.ts (계속)
import fs from 'fs-extra';
import path from 'path';

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
          const targets = Array.isArray(this.target) ? this.target : [this.target];
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
        target: 'public/index.html',
        validate: async (ctx) => await fs.pathExists(path.join(ctx.outputPath, 'public/index.html')),
        errorMessage: 'public/index.html not found',
        critical: true
      },
      {
        name: 'SQLite database',
        description: 'Check if SQLite database is copied',
        type: 'file-exists',
        target: 'public/data.sqlite',
        validate: async (ctx) => await fs.pathExists(path.join(ctx.outputPath, 'public/data.sqlite')),
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
      const content = await fs.readFile(context.files.get(file)!, 'utf-8');
      if (content.includes('sql.js') || content.includes('initSqlJs')) {
        usesSqlJs = true;
        break;
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
      
      if (!scripts.start) {
        errors.push({
          type: 'npm scripts',
          message: 'No start script defined in package.json',
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
      'public/index.html',
      'public/data.sqlite',
      'src/App.tsx', 'src/App.jsx', 'src/App.js' // 최소 하나
    ];
    
    const missingFiles: string[] = [];
    for (const file of requiredFiles) {
      if (!context.files.has(file) && !await fs.pathExists(path.join(outputPath, file))) {
        // App 파일은 여러 확장자 가능
        if (file.startsWith('src/App.')) {
          const hasApp = ['tsx', 'jsx', 'js'].some(ext => 
            context.files.has(`src/App.${ext}`)
          );
          if (!hasApp) {
            missingFiles.push('src/App.(tsx|jsx|js)');
          }
        } else {
          missingFiles.push(file);
        }
      }
    }
    
    const hasCriticalErrors = errors.some(e => e.severity === 'critical');
    
    return {
      totalFiles: context.files.size,
      requiredFiles: requiredFiles.length,
      missingFiles,
      validFiles: context.files.size - missingFiles.length,
      hasPackageJson: context.files.has('package.json'),
      hasSqliteFile: context.files.has('public/data.sqlite'),
      isRunnable: !hasCriticalErrors && missingFiles.length === 0
    };
  }
  
  getValidationRules(): ValidationRule[] {
    return [...this.defaultRules];
  }
}
```

### 9.3 검증 리포터
```typescript
// src/utils/validation-reporter.ts
import chalk from 'chalk';
import { ValidationResult } from '../core/output-validator';

export class ValidationReporter {
  static printReport(result: ValidationResult): void {
    console.log('\n' + chalk.bold('=== Validation Report ===\n'));
    
    // 요약
    this.printSummary(result.summary);
    
    // 에러
    if (result.errors.length > 0) {
      console.log(chalk.red.bold('\n❌ Errors:'));
      for (const error of result.errors) {
        const severity = error.severity === 'critical' ? chalk.red('[CRITICAL]') : chalk.yellow('[ERROR]');
        console.log(`  ${severity} ${error.message}`);
        if (error.file) {
          console.log(chalk.gray(`     File: ${error.file}`));
        }
      }
    }
    
    // 경고
    if (result.warnings.length > 0) {
      console.log(chalk.yellow.bold('\n⚠️  Warnings:'));
      for (const warning of result.warnings) {
        console.log(`  - ${warning.message}`);
        if (warning.suggestion) {
          console.log(chalk.gray(`    💡 ${warning.suggestion}`));
        }
      }
    }
    
    // 최종 결과
    console.log('\n' + chalk.bold('Final Result:'));
    if (result.valid) {
      console.log(chalk.green('✅ Validation PASSED'));
      if (result.summary.isRunnable) {
        console.log(chalk.green('   The React app is ready to run!'));
      }
    } else {
      console.log(chalk.red('❌ Validation FAILED'));
      console.log(chalk.red(`   Found ${result.errors.length} error(s)`));
    }
  }
  
  private static printSummary(summary: ValidationSummary): void {
    console.log(chalk.bold('Summary:'));
    console.log(`  Total files: ${summary.totalFiles}`);
    console.log(`  Required files: ${summary.requiredFiles}`);
    console.log(`  Valid files: ${summary.validFiles}`);
    
    if (summary.missingFiles.length > 0) {
      console.log(chalk.red(`  Missing files: ${summary.missingFiles.join(', ')}`));
    }
    
    const status = (condition: boolean, label: string) => 
      condition ? chalk.green(`✓ ${label}`) : chalk.red(`✗ ${label}`);
    
    console.log('\n' + chalk.bold('Status:'));
    console.log(`  ${status(summary.hasPackageJson, 'package.json present')}`);
    console.log(`  ${status(summary.hasSqliteFile, 'SQLite database copied')}`);
    console.log(`  ${status(summary.isRunnable, 'App is runnable')}`);
  }
}
```

## 완료 기준
- [ ] Output Validator 인터페이스 구현
- [ ] 기본 검증 규칙 정의
- [ ] 파일 구조 검증
- [ ] package.json 검증
- [ ] SQLite 파일 존재 확인
- [ ] 검증 리포트 생성
- [ ] 단위 테스트 작성