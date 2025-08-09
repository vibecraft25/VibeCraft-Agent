import { useMemo } from 'react';
import { Database } from 'sql.js';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

interface ProductRevenueChartProps {
  db: Database;
}

const ProductRevenueChart = ({ db }: ProductRevenueChartProps) => {
  const data = useMemo(() => {
    try {
      const query = `
        SELECT p.name, SUM(oi.quantity * oi.unit_price) as revenue
        FROM order_items oi
        JOIN products p ON p.id = oi.product_id
        GROUP BY p.name
        ORDER BY revenue DESC
        LIMIT 10;
      `;
      const results = db.exec(query);
      if (results.length === 0) return [];
      
      return results[0].values.map(row => ({
        name: row[0] as string,
        revenue: row[1] as number,
      }));
    } catch (error) {
      console.error("Error querying product revenue:", error);
      return [];
    }
  }, [db]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top 10 Product Revenue</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} angle={-45} textAnchor="end" height={80} />
            <YAxis tickFormatter={(value) => new Intl.NumberFormat('ko-KR').format(value as number)} />
            <Tooltip formatter={(value) => `${new Intl.NumberFormat('ko-KR').format(value as number)} KRW`} />
            <Legend />
            <Bar dataKey="revenue" fill="#3b82f6" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default ProductRevenueChart;
