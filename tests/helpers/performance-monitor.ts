export class PerformanceMonitor {
  private marks: Map<string, number>;
  private measures: Map<string, number[]>;
  
  constructor() {
    this.marks = new Map();
    this.measures = new Map();
  }
  
  start(label: string): number {
    const startTime = performance.now();
    this.marks.set(label, startTime);
    return startTime;
  }
  
  end(label: string): number {
    const endTime = performance.now();
    const startTime = this.marks.get(label);
    
    if (!startTime) {
      throw new Error(`No start mark found for label: ${label}`);
    }
    
    const duration = endTime - startTime;
    
    // 측정값 저장
    if (!this.measures.has(label)) {
      this.measures.set(label, []);
    }
    this.measures.get(label)!.push(duration);
    
    this.marks.delete(label);
    return duration;
  }
  
  getStats(label: string): PerformanceStats | null {
    const measurements = this.measures.get(label);
    if (!measurements || measurements.length === 0) {
      return null;
    }
    
    const sorted = [...measurements].sort((a, b) => a - b);
    const sum = sorted.reduce((acc, val) => acc + val, 0);
    const avg = sum / sorted.length;
    const median = sorted[Math.floor(sorted.length / 2)];
    const min = sorted[0];
    const max = sorted[sorted.length - 1];
    
    // 표준편차 계산
    const variance = sorted.reduce((acc, val) => acc + Math.pow(val - avg, 2), 0) / sorted.length;
    const stdDev = Math.sqrt(variance);
    
    // 백분위수
    const p95 = sorted[Math.floor(sorted.length * 0.95)];
    const p99 = sorted[Math.floor(sorted.length * 0.99)];
    
    return {
      count: sorted.length,
      min,
      max,
      avg,
      median,
      stdDev,
      p95,
      p99
    };
  }
  
  getAllStats(): Map<string, PerformanceStats> {
    const allStats = new Map<string, PerformanceStats>();
    
    for (const [label, _] of this.measures) {
      const stats = this.getStats(label);
      if (stats) {
        allStats.set(label, stats);
      }
    }
    
    return allStats;
  }
  
  reset(): void {
    this.marks.clear();
    this.measures.clear();
  }
  
  generateReport(): string {
    const stats = this.getAllStats();
    let report = 'Performance Report\n';
    report += '==================\n\n';
    
    for (const [label, stat] of stats) {
      report += `${label}:\n`;
      report += `  Count: ${stat.count}\n`;
      report += `  Min: ${stat.min.toFixed(2)}ms\n`;
      report += `  Max: ${stat.max.toFixed(2)}ms\n`;
      report += `  Avg: ${stat.avg.toFixed(2)}ms\n`;
      report += `  Median: ${stat.median.toFixed(2)}ms\n`;
      report += `  Std Dev: ${stat.stdDev.toFixed(2)}ms\n`;
      report += `  P95: ${stat.p95.toFixed(2)}ms\n`;
      report += `  P99: ${stat.p99.toFixed(2)}ms\n\n`;
    }
    
    return report;
  }
  
  // 메모리 사용량 모니터링
  static measureMemory(): MemoryStats {
    const usage = process.memoryUsage();
    return {
      rss: usage.rss / 1024 / 1024, // MB
      heapTotal: usage.heapTotal / 1024 / 1024,
      heapUsed: usage.heapUsed / 1024 / 1024,
      external: usage.external / 1024 / 1024,
      arrayBuffers: usage.arrayBuffers / 1024 / 1024
    };
  }
  
  // CPU 사용량 모니터링
  static measureCPU(): CPUStats {
    const usage = process.cpuUsage();
    return {
      user: usage.user / 1000, // ms
      system: usage.system / 1000
    };
  }
}

export interface PerformanceStats {
  count: number;
  min: number;
  max: number;
  avg: number;
  median: number;
  stdDev: number;
  p95: number;
  p99: number;
}

export interface MemoryStats {
  rss: number;
  heapTotal: number;
  heapUsed: number;
  external: number;
  arrayBuffers: number;
}

export interface CPUStats {
  user: number;
  system: number;
}