export const ChartSkeleton: React.FC = () => {
  return (
    <div className="w-full h-96 bg-white rounded-xl shadow-soft p-6 border border-gray-100">
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="h-72 bg-gray-200 rounded"></div>
      </div>
    </div>
  );
};
