export interface KPIMetric {
  metric_name: string;
  current_value: number;
  previous_value: number;
  target_value: number;
  unit: string;
  trend: 'up' | 'down';
  last_updated: string;
}
