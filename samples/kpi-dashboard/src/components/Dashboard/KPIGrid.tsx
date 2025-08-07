import { KPIMetric } from "@/types";
import { KPICard } from "./KPICard";

interface KPIGridProps {
  kpiMetrics: KPIMetric[];
}

export const KPIGrid = ({ kpiMetrics }: KPIGridProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {kpiMetrics.map((metric) => (
        <KPICard key={metric.metric_name} metric={metric} />
      ))}
    </div>
  );
};
