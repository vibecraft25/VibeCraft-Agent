# Time Series Dashboard Template

## Overview
Time series dashboards are used to visualize data trends over time. They should support various time granularities and comparison periods.

## Required Components

### 1. TimeSeriesDashboard (Container)
Main container that orchestrates all child components.

State management:
- `dateRange`: Start and end dates (MUST be initialized based on actual data range)
- `chartType`: 'line' | 'bar' | 'area'
- `data`: Processed time series data
- `isLoading`: Loading state
- `error`: Error state

CRITICAL: Always load the data range first:
```javascript
// First, get the actual date range
const dateRangeQuery = "SELECT MIN(date) as min_date, MAX(date) as max_date FROM data_table";
const { data: dateRangeData } = useSqlQuery(dateRangeQuery);

// Then set initial state based on actual data
const [dateRange, setDateRange] = useState(() => {
  if (dateRangeData && dateRangeData.length > 0) {
    return {
      start: new Date(dateRangeData[0].min_date),
      end: new Date(dateRangeData[0].max_date)
    };
  }
  // Fallback only
  return {
    start: new Date(new Date().setMonth(new Date().getMonth() - 1)),
    end: new Date()
  };
});
```

### 2. DateRangePicker
Allow users to select date ranges with presets:
- Last 7 days
- Last 30 days
- Last 3 months
- Last year
- Custom range

### 3. ChartTypeSelector
Toggle between visualization types:
- Line chart (default for trends)
- Bar chart (good for comparisons)
- Area chart (shows volume)

### 4. MainChart
The primary visualization using Recharts:
```javascript
<ResponsiveContainer width="100%" height={400}>
  <LineChart data={data}>
    <CartesianGrid strokeDasharray="3 3" />
    <XAxis dataKey="date" />
    <YAxis />
    <Tooltip />
    <Legend />
    <Line type="monotone" dataKey="value" stroke="#8884d8" />
  </LineChart>
</ResponsiveContainer>
```

### 5. SummaryStats
Key metrics displayed as cards:
- Total for period
- Average value
- Min/Max values
- Trend direction

### 6. TrendIndicator
Visual indicator showing:
- Percentage change
- Direction (up/down arrow)
- Comparison to previous period

## SQL Queries for Time Series

### IMPORTANT: Initial Data Check
```sql
-- Always run this first to understand the data
SELECT 
  MIN(date) as earliest_date,
  MAX(date) as latest_date,
  COUNT(*) as total_records
FROM data_table;
```

### Daily Aggregation
```sql
-- Daily sales totals
SELECT 
  DATE(date) as day,
  SUM(sales) as total_sales,
  COUNT(*) as transaction_count
FROM data_table
WHERE date >= ? AND date <= ?
GROUP BY day
ORDER BY day;
```

### Monthly Aggregation
```sql
-- Monthly summary with year-over-year comparison
SELECT 
  strftime('%Y-%m', date) as month,
  SUM(sales) as total_sales,
  AVG(sales) as avg_sales
FROM data_table
GROUP BY month
ORDER BY month;
```

### Moving Averages
```sql
-- 7-day moving average
SELECT 
  date,
  sales,
  AVG(sales) OVER (
    ORDER BY date 
    ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
  ) as moving_avg_7d
FROM data_table
ORDER BY date;
```

## Data Processing Utilities

### Date Formatting
```javascript
export const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: 'numeric'
  });
};
```

### Trend Calculation
```javascript
export const calculateTrend = (currentPeriod, previousPeriod) => {
  const current = sumValues(currentPeriod);
  const previous = sumValues(previousPeriod);
  const change = ((current - previous) / previous) * 100;
  return {
    value: change.toFixed(1),
    direction: change > 0 ? 'up' : 'down'
  };
};
```

## Responsive Design

- Mobile: Stack components vertically
- Tablet: 2-column layout for stats
- Desktop: Full dashboard with sidebar controls

## Performance Considerations

1. Limit initial data load to recent period
2. Implement data pagination for large datasets
3. Use React.memo for chart components
4. Debounce date range changes