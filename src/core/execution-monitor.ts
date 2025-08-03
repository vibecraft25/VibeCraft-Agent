import { EventEmitter } from 'events';

export class ExecutionMonitor extends EventEmitter {
  private metrics: Map<string, ExecutionMetrics>;
  
  constructor() {
    super();
    this.metrics = new Map();
  }
  
  startMonitoring(executionId: string): void {
    this.metrics.set(executionId, {
      startTime: Date.now(),
      endTime: null,
      memoryUsage: [],
      cpuUsage: [],
      events: []
    });
    
    // 주기적 모니터링
    const interval = setInterval(() => {
      const metrics = this.metrics.get(executionId);
      if (!metrics || metrics.endTime) {
        clearInterval(interval);
        return;
      }
      
      this.collectMetrics(executionId);
    }, 1000);
  }
  
  private collectMetrics(executionId: string): void {
    const metrics = this.metrics.get(executionId);
    if (!metrics) return;
    
    const memUsage = process.memoryUsage();
    metrics.memoryUsage.push({
      timestamp: Date.now(),
      heapUsed: memUsage.heapUsed,
      heapTotal: memUsage.heapTotal,
      rss: memUsage.rss
    });
    
    // CPU 사용량은 process.cpuUsage()로 추적 가능
    
    this.emit('metrics', { executionId, metrics });
  }
  
  endMonitoring(executionId: string): ExecutionMetrics | undefined {
    const metrics = this.metrics.get(executionId);
    if (metrics) {
      metrics.endTime = Date.now();
      return metrics;
    }
    return undefined;
  }
}

interface ExecutionMetrics {
  startTime: number;
  endTime: number | null;
  memoryUsage: MemorySnapshot[];
  cpuUsage: CPUSnapshot[];
  events: ExecutionEvent[];
}

interface MemorySnapshot {
  timestamp: number;
  heapUsed: number;
  heapTotal: number;
  rss: number;
}

interface CPUSnapshot {
  timestamp: number;
  user: number;
  system: number;
}

interface ExecutionEvent {
  timestamp: number;
  type: string;
  details: any;
}