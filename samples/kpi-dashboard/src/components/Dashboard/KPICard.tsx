import { KPIMetric } from "@/types";
import { formatNumber, formatPercentage } from "@/utils/formatters";
import { ArrowUp, ArrowDown, Minus } from "lucide-react";

interface KPICardProps {
  metric: KPIMetric;
}

const TrendIcon = ({ trend }: { trend: 'up' | 'down' | 'neutral' }) => {
  if (trend === 'up') {
    return <ArrowUp className="w-5 h-5 text-green-500" />;
  }
  if (trend === 'down') {
    return <ArrowDown className="w-5 h-5 text-red-500" />;
  }
  return <Minus className="w-5 h-5 text-gray-500" />;
};

export const KPICard = ({ metric }: KPICardProps) => {
  const { percentage, trend } = formatPercentage(metric.current_value, metric.previous_value);

  const trendColor = trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-600';

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-soft hover:shadow-soft-lg transition-all duration-300">
      <h3 className="text-lg font-semibold text-gray-600 capitalize">{metric.metric_name.replace(/_/g, ' ')}</h3>
      <p className="text-3xl font-bold text-gray-900 my-2">{formatNumber(metric.current_value, metric.unit)}</p>
      <div className="flex items-center text-sm">
        <TrendIcon trend={trend} />
        <span className={`ml-1 font-semibold ${trendColor}`}>
          {percentage}%
        </span>
        <span className="ml-2 text-gray-500">vs previous</span>
      </div>
    </div>
  );
};
