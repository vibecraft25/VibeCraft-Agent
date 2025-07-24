# Comparison Dashboard Template

## Overview
Comparison dashboards are designed to compare two or more entities, time periods, or metrics side by side. They should support flexible selection and clear visual differentiation.

## Required Components

### 1. ComparisonDashboard (Container)
Main container that manages comparison state and data flow.

State management:
- `comparisonType`: 'time' | 'entity' | 'metric'
- `selectedItems`: Array of items being compared
- `dateRange`: For time-based comparisons
- `data`: Processed comparison data
- `isLoading`: Loading state
- `error`: Error state

### 2. ComparisonSelector
Allow users to select what to compare:
- For time comparisons: Date range pickers for multiple periods
- For entity comparisons: Multi-select dropdown or checkbox list
- For metric comparisons: Metric selector with grouping options

### 3. SideBySideChart
Primary visualization showing comparisons:
```javascript
<ResponsiveContainer width="100%" height={400}>
  <BarChart data={comparisonData}>
    <CartesianGrid strokeDasharray="3 3" />
    <XAxis dataKey="category" />
    <YAxis />
    <Tooltip />
    <Legend />
    {selectedItems.map((item, index) => (
      <Bar key={item.id} dataKey={item.key} fill={colors[index]} />
    ))}
  </BarChart>
</ResponsiveContainer>
```

### 4. DifferenceChart
Shows the variance between compared items:
- Percentage differences
- Absolute differences
- Trend arrows

### 5. ComparisonTable
Detailed tabular view with:
- All metrics side by side
- Sortable columns
- Highlighting of significant differences

### 6. ComparisonSummary
Key insights displayed as cards:
- Biggest differences
- Best/worst performers
- Average variance

## SQL Queries for Comparison

### Time Period Comparison
```sql
-- Compare current vs previous period
WITH current_period AS (
  SELECT 
    DATE(date) as day,
    SUM(sales) as sales
  FROM data_table
  WHERE date >= ? AND date <= ?
  GROUP BY day
),
previous_period AS (
  SELECT 
    DATE(date) as day,
    SUM(sales) as sales
  FROM data_table
  WHERE date >= ? AND date <= ?
  GROUP BY day
)
SELECT 
  COALESCE(c.day, p.day) as day,
  c.sales as current_sales,
  p.sales as previous_sales,
  (c.sales - p.sales) as difference,
  CASE 
    WHEN p.sales > 0 THEN ((c.sales - p.sales) / p.sales * 100)
    ELSE 0
  END as percentage_change
FROM current_period c
FULL OUTER JOIN previous_period p ON c.day = p.day
ORDER BY day;
```

### Entity Comparison
```sql
-- Compare performance by region/product
SELECT 
  category,
  entity,
  SUM(sales) as total_sales,
  AVG(sales) as avg_sales,
  COUNT(*) as transaction_count
FROM data_table
WHERE entity IN (?, ?, ?)
GROUP BY category, entity
ORDER BY category, total_sales DESC;
```

### Metric Comparison
```sql
-- Compare multiple metrics
SELECT 
  date,
  SUM(sales) as total_sales,
  SUM(units) as total_units,
  AVG(sales/NULLIF(units, 0)) as avg_price_per_unit
FROM data_table
WHERE date >= ? AND date <= ?
GROUP BY date
ORDER BY date;
```

## Data Processing Utilities

### Comparison Data Formatter
```javascript
export const formatComparisonData = (data1, data2, comparisonType) => {
  // Align data points for comparison
  const aligned = alignDataPoints(data1, data2);
  
  // Calculate differences
  return aligned.map(point => ({
    ...point,
    difference: point.value2 - point.value1,
    percentageChange: ((point.value2 - point.value1) / point.value1) * 100
  }));
};
```

### Color Assignment
```javascript
export const getComparisonColors = (itemCount) => {
  const colors = [
    '#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1',
    '#d084d0', '#82d982', '#ffb347', '#ff9999', '#67b7dc'
  ];
  return colors.slice(0, itemCount);
};
```

## Layout Patterns

### Desktop Layout
```
|---------------------|---------------------|
|  Comparison Selector|   Summary Cards     |
|---------------------|---------------------|
|                                           |
|          Side by Side Chart               |
|                                           |
|---------------------|---------------------|
|   Difference Chart  |  Comparison Table   |
|---------------------|---------------------|
```

### Mobile Layout
Stack all components vertically with full width.

## Interactive Features

1. **Dynamic Selection**: Real-time updates when comparison items change
2. **Hover Effects**: Highlight corresponding data across all visualizations
3. **Drill-down**: Click to see detailed comparison for specific categories
4. **Export**: Download comparison results as CSV/PDF

## Performance Considerations

1. Limit initial comparison to 2-3 items
2. Use React.memo for chart components
3. Implement virtual scrolling for large comparison tables
4. Cache comparison calculations

## Accessibility

1. Use ARIA labels for comparison controls
2. Provide keyboard navigation for item selection
3. Ensure sufficient color contrast between compared items
4. Include data tables as alternatives to charts