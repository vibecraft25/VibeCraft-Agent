import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format, parseISO } from 'date-fns';
import type { DailyStat } from '@/types';

interface ChartProps {
  data: DailyStat[];
  title: string;
}

export const TimeSeriesChart: React.FC<ChartProps> = ({ data, title }) => {
  const formatXAxis = (tickItem: string) => {
    return format(parseISO(tickItem), 'MMM dd');
  };

  const formatYAxis = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(0)}K`;
    }
    return value.toString();
  }

  return (
    <div className="w-full h-96 bg-white rounded-xl shadow-soft p-6 hover:shadow-lg transition-all duration-300 border border-gray-100">
      <h2 className="text-xl font-semibold mb-4 text-gray-700">{title}</h2>
      <ResponsiveContainer width="100%" height="85%">
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
          <XAxis 
            dataKey="date" 
            tickFormatter={formatXAxis}
            className="text-sm text-gray-500"
            axisLine={{ stroke: '#e0e0e0' }}
            tickLine={{ stroke: '#e0e0e0' }}
          />
          <YAxis 
            yAxisId="left"
            tickFormatter={formatYAxis}
            className="text-sm text-gray-500"
            axisLine={{ stroke: '#e0e0e0' }}
            tickLine={{ stroke: '#e0e0e0' }}
          />
          <YAxis 
            yAxisId="right"
            orientation="right"
            className="text-sm text-gray-500"
            axisLine={{ stroke: '#e0e0e0' }}
            tickLine={{ stroke: '#e0e0e0' }}
          />
          <Tooltip 
            labelFormatter={(value) => format(parseISO(value as string), 'PPP')}
            formatter={(value: number, name: string) => {
              if (name === 'Revenue') {
                return [`₩${value.toLocaleString()}`, name];
              }
              return [value, name];
            }}
            contentStyle={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.95)', 
              border: '1px solid #e5e7eb',
              borderRadius: '0.75rem',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
            }}
            cursor={{ fill: 'rgba(239, 246, 255, 0.5)' }}
          />
          <Legend wrapperStyle={{ paddingTop: '20px' }} />
          <Line 
            yAxisId="left"
            type="monotone" 
            dataKey="revenue"
            name="Revenue"
            stroke="#3b82f6" 
            strokeWidth={2}
            dot={{ fill: '#3b82f6', r: 3 }}
            activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }}
          />
          <Line 
            yAxisId="right"
            type="monotone" 
            dataKey="orders_count"
            name="Orders"
            stroke="#10b981" 
            strokeWidth={2}
            dot={{ fill: '#10b981', r: 3 }}
            activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
