import { formatDate } from "@/utils/formatters";

interface DashboardHeaderProps {
  lastUpdated: Date;
}

export const DashboardHeader = ({ lastUpdated }: DashboardHeaderProps) => {
  return (
    <div className="mb-6">
      <h1 className="text-3xl font-bold text-gray-800">KPI Dashboard</h1>
      <p className="text-sm text-gray-500">Last updated: {formatDate(lastUpdated)}</p>
    </div>
  );
};
