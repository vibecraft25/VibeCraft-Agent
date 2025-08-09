import useSQLite from '@/hooks/useSQLite';
import ProductRevenueChart from '@/components/ProductRevenueChart';
import RegionalSalesChart from '@/components/RegionalSalesChart';
import LoadingSkeleton from '@/components/LoadingSkeleton';

const Dashboard = () => {
  const { db, isLoading, error } = useSQLite();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LoadingSkeleton />
        <LoadingSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 bg-red-100 border border-red-400 rounded-lg p-4">
        Error loading database: {error.message}
      </div>
    );
  }

  if (!db) {
    return <div>Database not available.</div>;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <ProductRevenueChart db={db} />
      <RegionalSalesChart db={db} />
    </div>
  );
};

export default Dashboard;
