import { KPIGrid } from "@/components/Dashboard/KPIGrid";
import { DashboardHeader } from "@/components/Dashboard/DashboardHeader";
import { useSQLite } from "@/hooks/useSQLite";
import { KPIMetric } from "./types";
import { LoadingSpinner } from "./components/Common/LoadingSpinner";

function App() {
  const { db, error, loading } = useSQLite('/data.sqlite');
  
  if (loading) {
    return <div className="w-screen h-screen flex items-center justify-center"><LoadingSpinner /></div>;
  }

  if (error) {
    return <div className="w-screen h-screen flex items-center justify-center">Error: {error.message}</div>;
  }

  if (!db) {
    return <div className="w-screen h-screen flex items-center justify-center">Database not loaded</div>;
  }

  const stmt = db.prepare("SELECT * FROM kpi_metrics");
  const kpiMetrics: KPIMetric[] = [];
  while (stmt.step()) {
    kpiMetrics.push(stmt.getAsObject() as unknown as KPIMetric);
  }
  stmt.free();

  const lastUpdated = kpiMetrics.length > 0 ? new Date(kpiMetrics[0].last_updated) : new Date();

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto p-4 sm:p-6 lg:p-8">
        <DashboardHeader lastUpdated={lastUpdated} />
        <KPIGrid kpiMetrics={kpiMetrics} />
      </main>
    </div>
  )
}

export default App
