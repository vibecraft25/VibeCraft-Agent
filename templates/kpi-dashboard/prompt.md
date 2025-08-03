# KPI Dashboard Implementation Request

## Project Information
- **Project Name**: {{PROJECT_NAME}}
- **Visualization Type**: {{VISUALIZATION_TYPE}}
- **Generated At**: {{TIMESTAMP}}

## User Requirements
{{USER_PROMPT}}

## Database Schema
You have access to a SQLite database with the following structure:

{{SCHEMA_DETAILS}}

### Database Summary
- Total Tables: {{TABLE_COUNT}}
- Total Records: {{TOTAL_ROWS}}

## Implementation Requirements

### 1. Technology Stack
- **Framework**: React 18.x with TypeScript
- **Charts**: Recharts for data visualization
- **Database**: sql.js for in-browser SQLite
- **Styling**: Tailwind CSS
- **Icons**: Lucide React

### 2. Core Features to Implement

#### Dashboard Layout
1. **Header Section**
   - Dashboard title: "{{DASHBOARD_TITLE}}"
   - Last updated timestamp
   - Refresh button (if {{REFRESH_INTERVAL}} > 0)

2. **KPI Cards Grid**
   - Display primary metrics in card format
   - Show current value, change percentage, and trend
   - Use appropriate icons for each metric
   - Color coding for positive/negative changes

3. **Charts Section**
   - Bar charts for comparisons
   - Pie/Donut charts for distributions
   - Line charts for trends
   - Responsive grid layout

4. **Data Table**
   - Sortable columns
   - Search/filter functionality
   - Pagination for large datasets
   - Export to CSV option

#### Key Metrics to Calculate
Based on available numeric columns:
- Total/Sum values
- Averages
- Min/Max values
- Count of records
- Growth rates (if date columns available)
- Top N categories (if categorical data exists)

### 3. SQL Query Examples
Here are relevant queries for your data:

```sql
{{QUERY_EXAMPLES}}
```

### 4. Component Structure
```
src/
├── App.tsx                    # Main dashboard container
├── components/
│   ├── Dashboard/
│   │   ├── DashboardHeader.tsx
│   │   ├── KPICard.tsx
│   │   └── KPIGrid.tsx
│   ├── Charts/
│   │   ├── BarChart.tsx
│   │   ├── PieChart.tsx
│   │   ├── LineChart.tsx
│   │   └── ChartContainer.tsx
│   ├── DataTable/
│   │   ├── DataTable.tsx
│   │   ├── TableFilters.tsx
│   │   └── TablePagination.tsx
│   └── Common/
│       ├── LoadingSpinner.tsx
│       └── ErrorBoundary.tsx
├── hooks/
│   ├── useSQLite.ts
│   ├── useKPIData.ts
│   └── useAutoRefresh.ts
├── utils/
│   ├── calculations.ts
│   ├── formatters.ts
│   └── sqlQueries.ts
└── types/
    └── index.ts
```

### 5. KPI Card Design
Each KPI card should include:
```typescript
interface KPICard {
  title: string;
  value: number | string;
  change?: {
    value: number;
    percentage: number;
    trend: 'up' | 'down' | 'neutral';
  };
  icon: string;
  color: string;
  sparkline?: number[];
}
```

### 6. Implementation Guidelines

1. **Performance**
   - Implement React.memo for chart components
   - Use virtualization for large tables
   - Cache SQL query results
   - Debounce search inputs

2. **Interactivity**
   - Click on KPI cards to drill down
   - Hover tooltips on all charts
   - Filter data across all components
   - Cross-filtering between charts

3. **Responsive Design**
   - Mobile-first approach
   - Collapsible sidebar on small screens
   - Stacked layout for mobile
   - Touch-friendly interactions

4. **Color Scheme**
   - Primary color: {{COLOR_SCHEME}}
   - Success: green shades
   - Warning: yellow/amber
   - Error: red shades
   - Consistent color mapping

### 7. Auto-Refresh Feature
{{#if REFRESH_INTERVAL}}
- Implement auto-refresh every {{REFRESH_INTERVAL}} seconds
- Show countdown timer
- Allow manual pause/resume
- Preserve user interactions during refresh
{{else}}
- No auto-refresh required
- Implement manual refresh button
{{/if}}

### 8. Data Export Features
1. Export individual charts as PNG
2. Export data table as CSV
3. Export full dashboard as PDF
4. Copy data to clipboard

### 9. Error Handling
- Database connection errors
- Empty data scenarios
- Invalid calculations
- Network timeouts

### 10. Accessibility
- ARIA labels for all metrics
- Keyboard navigation
- Screen reader friendly
- High contrast mode support

## Final Implementation Notes
- Start with loading the SQLite database
- Calculate all KPIs on initial load
- Implement filtering that updates all components
- Ensure smooth animations and transitions
- Add loading states for all async operations
- Include a help/info modal explaining metrics

Create a professional, performant dashboard that provides immediate insights into the data with intuitive navigation and interaction patterns.