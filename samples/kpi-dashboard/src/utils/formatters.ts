import { format } from 'date-fns';

export const formatNumber = (value: number, unit: string) => {
  if (unit === 'KRW') {
    return new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(value);
  }
  return new Intl.NumberFormat('en-US').format(value);
};

export const formatPercentage = (current: number, previous: number) => {
  if (previous === 0) return { percentage: 0, trend: 'neutral' as const };
  const percentage = ((current - previous) / previous) * 100;
  const trend = percentage >= 0 ? 'up' as const : 'down' as const;
  return { percentage: parseFloat(percentage.toFixed(1)), trend };
};

export const formatDate = (date: Date) => {
  return format(date, "yyyy-MM-dd HH:mm:ss");
};
