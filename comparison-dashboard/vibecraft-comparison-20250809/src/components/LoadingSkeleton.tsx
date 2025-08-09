const LoadingSkeleton = () => {
  return (
    <div className="p-6 rounded-xl border border-gray-100 bg-white shadow-soft">
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
        <div className="h-40 bg-gray-200 rounded w-full"></div>
      </div>
    </div>
  );
};

export default LoadingSkeleton;
