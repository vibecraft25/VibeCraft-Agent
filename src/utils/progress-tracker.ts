import ora, { Ora } from 'ora';
import chalk from 'chalk';

export interface ProgressStep {
  name: string;
  description?: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startTime: number | null;
  endTime: number | null;
  error?: string;
}

export interface ProgressSummary {
  total: number;
  completed: number;
  failed: number;
  success: boolean;
  totalDuration: number;
  steps: ProgressStep[];
}

export class ProgressTracker {
  private spinner: Ora | null = null;
  private steps: ProgressStep[] = [];
  private currentStep: number = -1;
  private startTime: number = Date.now();
  
  constructor(private silent: boolean = false) {}
  
  addStep(name: string, description?: string): void {
    this.steps.push({
      name,
      description,
      status: 'pending',
      startTime: null,
      endTime: null
    });
  }
  
  addSteps(steps: Array<{ name: string; description?: string }>): void {
    steps.forEach(step => this.addStep(step.name, step.description));
  }
  
  start(message?: string): void {
    if (this.silent) return;
    
    this.startTime = Date.now();
    this.spinner = ora({
      text: message || 'Starting...',
      spinner: 'dots'
    }).start();
  }
  
  stop(): void {
    if (this.spinner) {
      this.spinner.stop();
      this.spinner = null;
    }
  }
  
  nextStep(): void {
    // 현재 단계 완료 처리
    if (this.currentStep >= 0 && this.currentStep < this.steps.length) {
      this.completeCurrentStep();
    }
    
    // 다음 단계로 이동
    this.currentStep++;
    if (this.currentStep < this.steps.length) {
      const step = this.steps[this.currentStep];
      step.status = 'running';
      step.startTime = Date.now();
      
      if (!this.silent) {
        const progress = `[${this.currentStep + 1}/${this.steps.length}]`;
        const message = step.description 
          ? `${progress} ${step.name}: ${step.description}`
          : `${progress} ${step.name}`;
        
        if (this.spinner) {
          this.spinner.text = message;
        } else {
          this.spinner = ora({
            text: message,
            spinner: 'dots'
          }).start();
        }
      }
    }
  }
  
  private completeCurrentStep(): void {
    if (this.currentStep >= 0 && this.currentStep < this.steps.length) {
      const step = this.steps[this.currentStep];
      if (step.status === 'running') {
        step.status = 'completed';
        step.endTime = Date.now();
        
        if (!this.silent && this.spinner) {
          const duration = step.endTime - step.startTime!;
          this.spinner.succeed(`${step.name} (${this.formatDuration(duration)})`);
          this.spinner = null;
        }
      }
    }
  }
  
  succeed(message?: string): void {
    this.completeCurrentStep();
    
    if (!this.silent) {
      if (this.spinner) {
        this.spinner.succeed(message || 'Completed successfully');
        this.spinner = null;
      } else if (message) {
        console.log(chalk.green('✓'), message);
      }
    }
  }
  
  fail(error?: string | Error): void {
    if (this.currentStep >= 0 && this.currentStep < this.steps.length) {
      const step = this.steps[this.currentStep];
      step.status = 'failed';
      step.endTime = Date.now();
      step.error = error instanceof Error ? error.message : error;
    }
    
    if (!this.silent) {
      const errorMessage = error instanceof Error ? error.message : error;
      
      if (this.spinner) {
        this.spinner.fail(errorMessage || 'Failed');
        this.spinner = null;
      } else if (errorMessage) {
        console.log(chalk.red('✗'), errorMessage);
      }
    }
  }
  
  update(message: string): void {
    if (!this.silent && this.spinner) {
      this.spinner.text = message;
    }
  }
  
  info(message: string): void {
    if (!this.silent) {
      if (this.spinner) {
        this.spinner.info(message);
        this.spinner = ora().start();
      } else {
        console.log(chalk.blue('ℹ'), message);
      }
    }
  }
  
  warn(message: string): void {
    if (!this.silent) {
      if (this.spinner) {
        this.spinner.warn(message);
        this.spinner = ora().start();
      } else {
        console.log(chalk.yellow('⚠'), message);
      }
    }
  }
  
  getCurrentStep(): ProgressStep | null {
    if (this.currentStep >= 0 && this.currentStep < this.steps.length) {
      return this.steps[this.currentStep];
    }
    return null;
  }
  
  getProgress(): { current: number; total: number; percentage: number } {
    const completed = this.steps.filter(s => 
      s.status === 'completed' || s.status === 'failed'
    ).length;
    
    return {
      current: completed,
      total: this.steps.length,
      percentage: this.steps.length > 0 
        ? Math.round((completed / this.steps.length) * 100)
        : 0
    };
  }
  
  getSummary(): ProgressSummary {
    const completed = this.steps.filter(s => s.status === 'completed').length;
    const failed = this.steps.filter(s => s.status === 'failed').length;
    const totalDuration = Date.now() - this.startTime;
    
    return {
      total: this.steps.length,
      completed,
      failed,
      success: failed === 0 && completed === this.steps.length,
      totalDuration,
      steps: [...this.steps]
    };
  }
  
  printSummary(): void {
    if (this.silent) return;
    
    const summary = this.getSummary();
    
    console.log('\n' + chalk.bold('Summary:'));
    console.log(chalk.gray('─'.repeat(40)));
    
    this.steps.forEach((step, index) => {
      const icon = step.status === 'completed' ? chalk.green('✓') :
                   step.status === 'failed' ? chalk.red('✗') :
                   step.status === 'running' ? chalk.yellow('⟳') :
                   chalk.gray('○');
      
      const duration = step.startTime && step.endTime 
        ? ` (${this.formatDuration(step.endTime - step.startTime)})`
        : '';
      
      console.log(`${icon} ${step.name}${duration}`);
      
      if (step.error) {
        console.log(chalk.red(`  └─ ${step.error}`));
      }
    });
    
    console.log(chalk.gray('─'.repeat(40)));
    console.log(`Total: ${summary.completed}/${summary.total} completed`);
    console.log(`Duration: ${this.formatDuration(summary.totalDuration)}`);
    
    if (summary.success) {
      console.log(chalk.green('\n✨ All steps completed successfully!'));
    } else if (summary.failed > 0) {
      console.log(chalk.red(`\n❌ ${summary.failed} step(s) failed`));
    }
  }
  
  reset(): void {
    this.stop();
    this.steps = [];
    this.currentStep = -1;
    this.startTime = Date.now();
  }
  
  private formatDuration(ms: number): string {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  }
  
  static createSimple(message: string): Ora {
    return ora({
      text: message,
      spinner: 'dots'
    }).start();
  }
}