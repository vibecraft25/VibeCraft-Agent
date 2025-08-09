import { useMemo } from 'react';
import { Database } from 'sql.js';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

interface RegionalSalesChartProps {
  db: Database;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#ff4d4d', '#4dff4d'];

const RegionalSalesChart = ({ db }: RegionalSalesChartProps) => {
  const data = useMemo(() => {
    try {
      const query = `
        SELECT r.region, r.total_sales
        FROM regional_stats r
        ORDER BY r.total_sales DESC;
      `;
      const results = db.exec(query);
      if (results.length === 0) return [];

      return results[0].values.map(row => ({
        name: row[0] as string,
        value: row[1] as number,
      }));
    } catch (error) {
      console.error("Error querying regional sales:", error);
      return [];
    }
  }, [db]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Regional Sales</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
              nameKey="name"
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            >
              {data.map((_entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => `${new Intl.NumberFormat('ko-KR').format(value as number)} KRW`} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default RegionalSalesChart;
