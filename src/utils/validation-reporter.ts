import chalk from 'chalk';
import { ValidationResult, ValidationSummary } from '../core/output-validator';

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