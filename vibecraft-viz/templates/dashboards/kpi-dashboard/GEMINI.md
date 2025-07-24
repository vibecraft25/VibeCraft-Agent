# KPI Dashboard Template Guide

## Overview
This template creates a comprehensive Key Performance Indicators (KPI) dashboard with metric cards, trend analysis, gauge charts for target achievement, and real-time update capabilities.

## Required Data Structure

### Minimum Required Fields
```sql
-- Basic KPI metrics table structure
CREATE TABLE kpi_metrics (
    date DATE,
    metric_name TEXT,
    value NUMERIC,
    target NUMERIC,
    unit TEXT
);
```

### Extended Structure (Recommended)
```sql
-- Comprehensive KPI tracking
CREATE TABLE kpi_data (
    id INTEGER PRIMARY KEY,
    timestamp DATETIME,
    metric_name TEXT,
    category TEXT,
    value NUMERIC,
    target NUMERIC,
    previous_value NUMERIC,
    unit TEXT,
    department TEXT,
    region TEXT,
    metadata JSON
);

-- Historical trends
CREATE TABLE kpi_history (
    date DATE,
    metric_name TEXT,
    daily_value NUMERIC,
    weekly_avg NUMERIC,
    monthly_avg NUMERIC,
    ytd_value NUMERIC
);
```

## Core SQL Queries

### 1. Current KPI Values with Achievement Rate
```sql
-- Get current KPI values with target achievement
SELECT 
    metric_name,
    category,
    value as current_value,
    target,
    unit,
    ROUND((value / NULLIF(target, 0)) * 100, 2) as achievement_rate,
    CASE 
        WHEN value >= target THEN 'achieved'
        WHEN value >= target * 0.8 THEN 'warning'
        ELSE 'critical'
    END as status
FROM kpi_data
WHERE date = (SELECT MAX(date) FROM kpi_data)
ORDER BY category, metric_name;
```

### 2. KPI Trends Analysis
```sql
-- Calculate KPI trends (daily, weekly, monthly)
WITH trend_data AS (
    SELECT 
        metric_name,
        date,
        value,
        AVG(value) OVER (
            PARTITION BY metric_name 
            ORDER BY date 
            ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
        ) as week_avg,
        AVG(value) OVER (
            PARTITION BY metric_name 
            ORDER BY date 
            ROWS BETWEEN 29 PRECEDING AND CURRENT ROW
        ) as month_avg,
        LAG(value, 1) OVER (
            PARTITION BY metric_name 
            ORDER BY date
        ) as previous_value
    FROM kpi_data
)
SELECT 
    metric_name,
    date,
    value,
    week_avg,
    month_avg,
    ROUND(((value - previous_value) / NULLIF(previous_value, 0)) * 100, 2) as daily_change,
    ROUND(((value - week_avg) / NULLIF(week_avg, 0)) * 100, 2) as week_change,
    ROUND(((value - month_avg) / NULLIF(month_avg, 0)) * 100, 2) as month_change
FROM trend_data
WHERE date >= date('now', '-30 days')
ORDER BY metric_name, date DESC;
```

### 3. YTD Performance Summary
```sql
-- Year-to-date performance summary
SELECT 
    metric_name,
    COUNT(DISTINCT date) as days_tracked,
    MIN(value) as ytd_min,
    MAX(value) as ytd_max,
    AVG(value) as ytd_avg,
    SUM(value) as ytd_total,
    AVG(target) as avg_target,
    ROUND((SUM(value) / NULLIF(SUM(target), 0)) * 100, 2) as ytd_achievement
FROM kpi_data
WHERE date >= date('now', 'start of year')
GROUP BY metric_name
ORDER BY ytd_achievement DESC;
```

### 4. Department/Region Performance
```sql
-- KPI performance by department or region
SELECT 
    department,
    metric_name,
    AVG(value) as avg_value,
    AVG(target) as avg_target,
    ROUND((AVG(value) / NULLIF(AVG(target), 0)) * 100, 2) as achievement_rate,
    COUNT(*) as data_points
FROM kpi_data
WHERE date >= date('now', '-30 days')
GROUP BY department, metric_name
ORDER BY department, achievement_rate DESC;
```

### 5. Top/Bottom Performers
```sql
-- Identify top and bottom performing KPIs
WITH kpi_performance AS (
    SELECT 
        metric_name,
        category,
        value,
        target,
        (value / NULLIF(target, 0)) as performance_ratio,
        ROW_NUMBER() OVER (ORDER BY (value / NULLIF(target, 0)) DESC) as top_rank,
        ROW_NUMBER() OVER (ORDER BY (value / NULLIF(target, 0)) ASC) as bottom_rank
    FROM kpi_data
    WHERE date = (SELECT MAX(date) FROM kpi_data)
)
SELECT 
    metric_name,
    category,
    value,
    target,
    ROUND(performance_ratio * 100, 2) as achievement_percentage,
    CASE 
        WHEN top_rank <= 5 THEN 'Top Performer'
        WHEN bottom_rank <= 5 THEN 'Needs Attention'
        ELSE 'On Track'
    END as performance_status
FROM kpi_performance
WHERE top_rank <= 5 OR bottom_rank <= 5
ORDER BY performance_ratio DESC;
```

### 6. Real-time Update Query
```sql
-- Get latest updates for real-time monitoring
SELECT 
    metric_name,
    value,
    target,
    timestamp,
    ROUND((value - LAG(value) OVER (PARTITION BY metric_name ORDER BY timestamp)) / 
          NULLIF(LAG(value) OVER (PARTITION BY metric_name ORDER BY timestamp), 0) * 100, 2) as change_percent,
    strftime('%s', 'now') - strftime('%s', timestamp) as seconds_ago
FROM kpi_data
WHERE timestamp >= datetime('now', '-1 hour')
ORDER BY timestamp DESC
LIMIT 20;
```

## Dashboard Components

### 1. KPI Metric Cards
Display key metrics with:
- Current value
- Target value
- Achievement percentage
- Trend indicator (up/down arrow)
- Sparkline for recent trend
- Status color (green/yellow/red)

### 2. Gauge Charts
Visual representation of target achievement:
- Circular or semi-circular gauges
- Color zones (critical/warning/achieved)
- Animated needle movements
- Target line indicator

### 3. Trend Charts
Time series visualization:
- Line charts for metric trends
- Area charts for cumulative values
- Dual-axis for value vs target
- Period comparison overlays

### 4. Summary Statistics Grid
Quick overview section:
- Total KPIs tracked
- Overall achievement rate
- Number of KPIs on target
- Critical KPIs count
- Best/worst performers

### 5. Department/Category Breakdown
Comparative analysis:
- Grouped bar charts
- Heatmap for multi-dimensional view
- Radar charts for category performance
- Drill-down capabilities

## React Component Structure

```jsx
// Main dashboard layout
<KPIDashboard>
  <Header>
    <RefreshButton />
    <DateRangePicker />
    <FilterOptions />
  </Header>
  
  <SummarySection>
    <OverallStats />
    <AlertsPanel />
  </SummarySection>
  
  <MetricsGrid>
    {metrics.map(metric => (
      <KPICard 
        key={metric.id}
        metric={metric}
        showGauge={true}
        showTrend={true}
      />
    ))}
  </MetricsGrid>
  
  <ChartsSection>
    <TrendChart metrics={selectedMetrics} />
    <PerformanceHeatmap />
    <ComparativeAnalysis />
  </ChartsSection>
  
  <DetailsTable>
    <KPITable 
      data={detailedData}
      sortable={true}
      exportable={true}
    />
  </DetailsTable>
</KPIDashboard>
```

## Interactive Features

### 1. Real-time Updates
- WebSocket or polling for live data
- Smooth animations for value changes
- Toast notifications for significant changes
- Auto-refresh toggle

### 2. Drill-down Capabilities
- Click on metric card for detailed view
- Expandable sections for historical data
- Modal windows for deep analysis
- Breadcrumb navigation

### 3. Customization Options
- Drag-and-drop metric cards
- Configurable thresholds
- Custom color schemes
- Save dashboard layouts

### 4. Export and Sharing
- Export to PDF/Excel
- Share dashboard links
- Schedule email reports
- API for external integration

## Styling Guidelines

### Color Scheme
```css
/* KPI Status Colors */
--kpi-achieved: #10b981;    /* Green */
--kpi-warning: #f59e0b;     /* Amber */
--kpi-critical: #ef4444;    /* Red */
--kpi-neutral: #6b7280;     /* Gray */

/* Trend Indicators */
--trend-up: #34d399;
--trend-down: #f87171;
--trend-stable: #60a5fa;
```

### Component Styling
```css
/* KPI Card */
.kpi-card {
  @apply bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow;
  border-left: 4px solid var(--status-color);
}

/* Gauge Chart Container */
.gauge-container {
  @apply relative w-full h-48 flex items-center justify-center;
}

/* Trend Sparkline */
.sparkline {
  @apply h-12 w-full opacity-50 hover:opacity-100 transition-opacity;
}
```

## Performance Optimization

### 1. Data Aggregation
- Pre-calculate daily/weekly/monthly aggregates
- Use materialized views for complex queries
- Index on date and metric_name columns

### 2. Caching Strategy
- Cache current values for 1 minute
- Cache historical data for 1 hour
- Invalidate cache on data updates

### 3. Lazy Loading
- Load detailed data on demand
- Paginate historical records
- Virtual scrolling for large datasets

## Example Implementation

```jsx
// KPI Card Component
const KPICard = ({ metric }) => {
  const achievementRate = (metric.value / metric.target) * 100;
  const status = achievementRate >= 100 ? 'achieved' : 
                 achievementRate >= 80 ? 'warning' : 'critical';
  
  return (
    <div className={`kpi-card status-${status}`}>
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-semibold">{metric.name}</h3>
        <TrendIndicator value={metric.trendValue} />
      </div>
      
      <div className="mb-4">
        <div className="text-3xl font-bold">
          {formatValue(metric.value, metric.unit)}
        </div>
        <div className="text-sm text-gray-500">
          Target: {formatValue(metric.target, metric.unit)}
        </div>
      </div>
      
      <GaugeChart 
        value={achievementRate} 
        status={status}
        height={100}
      />
      
      <Sparkline 
        data={metric.history}
        color={status}
      />
    </div>
  );
};
```

## Best Practices

1. **Data Quality**
   - Validate metric values before display
   - Handle missing or null targets gracefully
   - Show data freshness indicators

2. **User Experience**
   - Progressive loading for better performance
   - Clear visual hierarchy
   - Consistent color coding
   - Responsive design for all devices

3. **Accessibility**
   - ARIA labels for screen readers
   - Keyboard navigation support
   - High contrast mode option
   - Text alternatives for gauges

4. **Error Handling**
   - Graceful degradation for missing data
   - Clear error messages
   - Retry mechanisms for failed updates
   - Offline mode support