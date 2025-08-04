import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
import readline from 'readline';

export class VibeCraftDebugger {
  private static instance: VibeCraftDebugger;
  private breakpoints: Map<string, DebugBreakpoint>;
  private traceEnabled: boolean;
  private watchedVariables: Map<string, any>;
  private callStack: CallStackFrame[];
  private stepMode: StepMode;
  private logFile?: string;
  
  private constructor() {
    this.breakpoints = new Map();
    this.watchedVariables = new Map();
    this.callStack = [];
    this.stepMode = StepMode.None;
    this.traceEnabled = process.env.VIBECRAFT_TRACE === 'true';
    
    if (process.env.VIBECRAFT_TRACE_FILE) {
      this.logFile = process.env.VIBECRAFT_TRACE_FILE;
      this.initializeLogFile();
    }
  }
  
  static getInstance(): VibeCraftDebugger {
    if (!this.instance) {
      this.instance = new VibeCraftDebugger();
    }
    return this.instance;
  }
  
  private initializeLogFile(): void {
    if (this.logFile) {
      const header = {
        session: new Date().toISOString(),
        pid: process.pid,
        node: process.version,
        platform: process.platform
      };
      
      fs.ensureDirSync(path.dirname(this.logFile));
      fs.writeFileSync(this.logFile, JSON.stringify(header) + '\n');
    }
  }
  
  // 브레이크포인트 설정
  setBreakpoint(id: string, condition?: (context: any) => boolean): void {
    this.breakpoints.set(id, {
      id,
      condition,
      hits: 0,
      enabled: true
    });
    
    this.log('debug', `Breakpoint set: ${id}`);
  }
  
  removeBreakpoint(id: string): void {
    this.breakpoints.delete(id);
    this.log('debug', `Breakpoint removed: ${id}`);
  }
  
  toggleBreakpoint(id: string): void {
    const bp = this.breakpoints.get(id);
    if (bp) {
      bp.enabled = !bp.enabled;
      this.log('debug', `Breakpoint ${id} ${bp.enabled ? 'enabled' : 'disabled'}`);
    }
  }
  
  // 브레이크포인트 체크
  async checkBreakpoint(id: string, context: any): Promise<void> {
    const breakpoint = this.breakpoints.get(id);
    if (!breakpoint || !breakpoint.enabled) return;
    
    if (!breakpoint.condition || breakpoint.condition(context)) {
      breakpoint.hits++;
      await this.pause(id, context);
    }
  }
  
  // 함수 진입/종료 추적
  enterFunction(name: string, args?: any): void {
    const frame: CallStackFrame = {
      name,
      args,
      enteredAt: Date.now(),
      depth: this.callStack.length
    };
    
    this.callStack.push(frame);
    
    if (this.traceEnabled) {
      this.trace('function', `Enter: ${name}`, { args, depth: frame.depth });
    }
    
    // Step Into 모드일 때 일시정지
    if (this.stepMode === StepMode.StepInto) {
      this.pauseForStep(`Entering function: ${name}`, { args });
    }
  }
  
  exitFunction(name: string, result?: any): void {
    const frame = this.callStack.pop();
    if (frame && frame.name === name) {
      const duration = Date.now() - frame.enteredAt;
      
      if (this.traceEnabled) {
        this.trace('function', `Exit: ${name}`, { 
          result, 
          duration, 
          depth: frame.depth 
        });
      }
      
      // Step Out 모드일 때 일시정지
      if (this.stepMode === StepMode.StepOut && this.callStack.length === frame.depth - 1) {
        this.pauseForStep(`Exited function: ${name}`, { result, duration });
      }
    }
  }
  
  // 변수 감시
  watchVariable(name: string, value: any): void {
    const oldValue = this.watchedVariables.get(name);
    this.watchedVariables.set(name, value);
    
    if (oldValue !== undefined && oldValue !== value) {
      this.log('watch', `Variable changed: ${name}`, {
        oldValue,
        newValue: value
      });
      
      // 변수 변경 시 브레이크포인트 체크
      const watchBreakpoint = this.breakpoints.get(`watch:${name}`);
      if (watchBreakpoint && watchBreakpoint.enabled) {
        this.pause(`watch:${name}`, { name, oldValue, newValue: value });
      }
    }
  }
  
  // 추적 로깅
  trace(category: string, message: string, data?: any): void {
    if (!this.traceEnabled) return;
    
    const timestamp = new Date().toISOString();
    const trace: TraceEntry = {
      timestamp,
      category,
      message,
      data,
      stack: this.getCallStackSummary()
    };
    
    // 콘솔 출력
    const prefix = chalk.gray(`[TRACE:${category}]`);
    console.log(`${prefix} ${message}`);
    if (data) {
      console.log(chalk.gray(this.formatData(data)));
    }
    
    // 파일 기록
    if (this.logFile) {
      fs.appendFileSync(this.logFile, JSON.stringify(trace) + '\n');
    }
  }
  
  // 로그 기록
  log(level: string, message: string, data?: any): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data
    };
    
    // 콘솔 출력
    const color = {
      error: chalk.red,
      warn: chalk.yellow,
      info: chalk.blue,
      debug: chalk.gray,
      watch: chalk.magenta
    }[level] || chalk.white;
    
    console.log(color(`[${level.toUpperCase()}] ${message}`));
    if (data) {
      console.log(this.formatData(data));
    }
    
    // 파일 기록
    if (this.logFile) {
      fs.appendFileSync(this.logFile, JSON.stringify(entry) + '\n');
    }
  }
  
  // 일시정지 및 대화형 디버깅
  private async pause(id: string, context: any): Promise<void> {
    console.log(chalk.red(`\n🔴 Breakpoint hit: ${id}`));
    console.log('Context:', this.formatData(context));
    console.log('\nCall Stack:');
    this.printCallStack();
    console.log('\nWatched Variables:');
    this.printWatchedVariables();
    
    if (process.env.VIBECRAFT_INTERACTIVE === 'true') {
      await this.interactiveDebug(context);
    }
  }
  
  private async pauseForStep(message: string, context: any): Promise<void> {
    console.log(chalk.yellow(`\n⏸ Step: ${message}`));
    console.log('Context:', this.formatData(context));
    
    if (process.env.VIBECRAFT_INTERACTIVE === 'true') {
      await this.interactiveDebug(context);
    }
  }
  
  // 대화형 디버깅 세션
  private async interactiveDebug(context: any): Promise<void> {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    console.log(chalk.green('\nDebugger Commands:'));
    console.log('  c/continue - Continue execution');
    console.log('  s/step     - Step to next line');
    console.log('  i/into     - Step into function');
    console.log('  o/out      - Step out of function');
    console.log('  v/vars     - Show variables');
    console.log('  t/stack    - Show call stack');
    console.log('  e/eval     - Evaluate expression');
    console.log('  d/dump     - Dump current state');
    console.log('  q/quit     - Quit debugger\n');
    
    const prompt = () => new Promise<string>((resolve) => {
      rl.question(chalk.cyan('debug> '), resolve);
    });
    
    let continueExecution = false;
    
    while (!continueExecution) {
      const command = await prompt();
      const [cmd, ...args] = command.split(' ');
      
      switch (cmd) {
        case 'c':
        case 'continue':
          this.stepMode = StepMode.None;
          continueExecution = true;
          break;
          
        case 's':
        case 'step':
          this.stepMode = StepMode.StepOver;
          continueExecution = true;
          break;
          
        case 'i':
        case 'into':
          this.stepMode = StepMode.StepInto;
          continueExecution = true;
          break;
          
        case 'o':
        case 'out':
          this.stepMode = StepMode.StepOut;
          continueExecution = true;
          break;
          
        case 'v':
        case 'vars':
          this.printWatchedVariables();
          break;
          
        case 't':
        case 'stack':
          this.printCallStack();
          break;
          
        case 'e':
        case 'eval':
          try {
            const expr = args.join(' ');
            const result = eval(expr);
            console.log(chalk.green('Result:'), this.formatData(result));
          } catch (error) {
            console.log(chalk.red('Error:'), error);
          }
          break;
          
        case 'd':
        case 'dump':
          this.dumpState(context);
          break;
          
        case 'q':
        case 'quit':
          process.exit(0);
          
        default:
          console.log(chalk.red('Unknown command'));
      }
    }
    
    rl.close();
  }
  
  // 상태 덤프
  dumpState(state: any, filename?: string): void {
    const dump: StateDump = {
      timestamp: new Date().toISOString(),
      state,
      callStack: this.callStack,
      watchedVariables: Object.fromEntries(this.watchedVariables),
      breakpoints: Object.fromEntries(this.breakpoints),
      memory: process.memoryUsage(),
      uptime: process.uptime()
    };
    
    if (filename) {
      fs.writeFileSync(filename, JSON.stringify(dump, null, 2));
      console.log(`State dumped to ${filename}`);
    } else {
      console.log('State dump:', this.formatData(dump));
    }
  }
  
  // 헬퍼 메서드들
  private printCallStack(): void {
    this.callStack.forEach((frame, index) => {
      const indent = '  '.repeat(frame.depth);
      console.log(`${indent}${index}: ${frame.name}`);
    });
  }
  
  private printWatchedVariables(): void {
    for (const [name, value] of this.watchedVariables) {
      console.log(`  ${name}: ${this.formatValue(value)}`);
    }
  }
  
  private getCallStackSummary(): string[] {
    return this.callStack.map(frame => frame.name);
  }
  
  private formatData(data: any): string {
    if (typeof data === 'string') return data;
    if (data instanceof Error) return data.stack || data.toString();
    
    try {
      return JSON.stringify(data, null, 2);
    } catch {
      return String(data);
    }
  }
  
  private formatValue(value: any): string {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (typeof value === 'string') return `"${value}"`;
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    if (Array.isArray(value)) return `Array(${value.length})`;
    if (typeof value === 'object') return `Object { ${Object.keys(value).join(', ')} }`;
    return String(value);
  }
  
  // 성능 프로파일링
  profileStart(label: string): void {
    performance.mark(`${label}-start`);
  }
  
  profileEnd(label: string): number {
    performance.mark(`${label}-end`);
    performance.measure(label, `${label}-start`, `${label}-end`);
    
    const measure = performance.getEntriesByName(label)[0] as any;
    const duration = measure.duration;
    
    this.trace('profile', `${label}: ${duration.toFixed(2)}ms`);
    
    performance.clearMarks(`${label}-start`);
    performance.clearMarks(`${label}-end`);
    performance.clearMeasures(label);
    
    return duration;
  }
  
  // 메모리 스냅샷
  captureMemorySnapshot(label: string): void {
    const snapshot = {
      label,
      timestamp: new Date().toISOString(),
      memory: process.memoryUsage(),
      heap: (global as any).gc ? this.getHeapSnapshot() : null
    };
    
    this.trace('memory', `Memory snapshot: ${label}`, snapshot);
  }
  
  private getHeapSnapshot(): any {
    // V8 힙 스냅샷 (실제 구현은 복잡함)
    return {
      total: process.memoryUsage().heapTotal,
      used: process.memoryUsage().heapUsed
    };
  }
}

// 타입 정의
interface DebugBreakpoint {
  id: string;
  condition?: (context: any) => boolean;
  hits: number;
  enabled: boolean;
}

interface CallStackFrame {
  name: string;
  args?: any;
  enteredAt: number;
  depth: number;
}

interface TraceEntry {
  timestamp: string;
  category: string;
  message: string;
  data?: any;
  stack: string[];
}

interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  data?: any;
}

interface StateDump {
  timestamp: string;
  state: any;
  callStack: CallStackFrame[];
  watchedVariables: Record<string, any>;
  breakpoints: Record<string, DebugBreakpoint>;
  memory: NodeJS.MemoryUsage;
  uptime: number;
}

enum StepMode {
  None,
  StepOver,
  StepInto,
  StepOut
}

// 편의 함수들
export function debug(id: string, context?: any): Promise<void> {
  return VibeCraftDebugger.getInstance().checkBreakpoint(id, context || {});
}

export function trace(category: string, message: string, data?: any): void {
  VibeCraftDebugger.getInstance().trace(category, message, data);
}

export function watch(name: string, value: any): void {
  VibeCraftDebugger.getInstance().watchVariable(name, value);
}

export function enterFunc(name: string, args?: any): void {
  VibeCraftDebugger.getInstance().enterFunction(name, args);
}

export function exitFunc(name: string, result?: any): void {
  VibeCraftDebugger.getInstance().exitFunction(name, result);
}

export function profile(label: string): { end: () => number } {
  VibeCraftDebugger.getInstance().profileStart(label);
  
  return {
    end: () => VibeCraftDebugger.getInstance().profileEnd(label)
  };
}