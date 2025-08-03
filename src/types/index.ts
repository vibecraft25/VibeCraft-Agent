export type VisualizationType = 
  | 'time-series'
  | 'geo-spatial'
  | 'gantt-chart'
  | 'kpi-dashboard'
  | 'comparison'
  | 'funnel-analysis'
  | 'cohort-analysis'
  | 'heatmap'
  | 'network-graph'
  | 'custom';

export interface AgentCliArgs {
  sqlitePath: string;
  visualizationType: VisualizationType;
  userPrompt: string;
  outputDir: string;
  projectName?: string;
  debug?: boolean;
}

export interface AgentExecutionResult {
  success: boolean;
  outputPath: string;
  executionTime: number;
  logs: LogEntry[];
  error?: ErrorInfo;
  generatedFiles: string[];
  validationResult?: any;
  debugInfo?: any;
}

export interface LogEntry {
  timestamp: Date;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  context?: any;
}

export interface ErrorInfo {
  code: string;
  message: string;
  stack?: string;
  details?: any;
  validationErrors?: any[];
}