import { useState, useEffect } from 'react';
import { GeoSpatialMap } from '@/components/GeoSpatialMap';
import { MapSkeleton } from '@/components/MapSkeleton';
import { useDatabase } from '@/hooks/useDatabase';
import { RegionalStat } from '@/types';

function App() {
  const { db, error: dbError } = useDatabase();
  const [data, setData] = useState<RegionalStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (db) {
      try {
        const res = db.exec("SELECT region, total_sales, customer_count, avg_order_value, top_category FROM regional_stats");
        if (res.length > 0) {
          const stats: RegionalStat[] = res[0].values.map(row => ({
            region: row[0] as string,
            total_sales: row[1] as number,
            customer_count: row[2] as number,
            avg_order_value: row[3] as number,
            top_category: row[4] as string,
          }));
          setData(stats);
        }
      } catch (err) {
        console.error("Error executing query:", err);
        setError("Failed to fetch regional data.");
      } finally {
        setLoading(false);
      }
    } else if (dbError) {
      setError(dbError);
      setLoading(false);
    }
  }, [db, dbError]);

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 tracking-tight">지역별 매출 현황</h1>
          <p className="mt-2 text-lg text-gray-600">
            대한민국 지역별 매출 데이터를 시각화한 대시보드입니다.
          </p>
        </header>

        <main>
          {loading && <MapSkeleton />}
          {error && <div className="text-red-500 bg-red-100 p-4 rounded-lg">{error}</div>}
          {!loading && !error && <GeoSpatialMap data={data} />}
        </main>
      </div>
    </div>
  );
}

export default App;
