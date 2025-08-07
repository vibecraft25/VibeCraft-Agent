import { useState, useEffect } from 'react';
import useSQLite from '@/hooks/useSQLite';
import { TimeSeriesChart } from '@/components/TimeSeriesChart';
import { ChartSkeleton } from '@/components/ChartSkeleton';
import type { DailyStat } from '@/types';

function App() {
  const { db, error: dbError, loading: dbLoading } = useSQLite();
  const [data, setData] = useState<DailyStat[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (db) {
      try {
        const query = `
          SELECT date, revenue, orders_count 
          FROM daily_stats
          ORDER BY date DESC
          LIMIT 30
        `;
        const stmt = db.prepare(query);
        const results: DailyStat[] = [];
        while (stmt.step()) {
          const row = stmt.getAsObject();
          results.push({
            date: row.date as string,
            revenue: Number(row.revenue),
            orders_count: Number(row.orders_count),
          });
        }
        // Reverse to show oldest to newest
        setData(results.reverse());
        stmt.free();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to execute query');
      } finally {
        setLoading(false);
      }
    }
  }, [db]);

  const isLoading = dbLoading || loading;
  const anyError = dbError || error;

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Time Series Dashboard</h1>
          <p className="text-gray-500 mt-1">Daily Revenue and Orders Analysis (Last 30 Days)</p>
        </header>

        <main>
          {anyError && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative" role="alert">
              <strong className="font-bold">Error:</strong>
              <span className="block sm:inline ml-2">{anyError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 gap-6">
            {isLoading ? (
              <ChartSkeleton />
            ) : (
              <TimeSeriesChart data={data} title="Revenue & Orders" />
            )}
          </div>
        </main>
        
        <footer className="text-center mt-12 text-sm text-gray-400">
          <p>VibeCraft-viz &copy; 2025</p>
        </footer>
      </div>
    </div>
  );
}

export default App;
