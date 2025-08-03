# Time Series Data Visualization Request

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
- **Charts**: Recharts for time series visualization
- **Database**: sql.js for in-browser SQLite
- **Styling**: Tailwind CSS
- **Date Handling**: date-fns

### 2. Core Features to Implement

#### Data Loading and Processing
1. Load SQLite database from `/data.sqlite` using sql.js
2. Execute SQL queries to fetch time-series data
3. Process and transform data for visualization
4. Handle date parsing and formatting

#### Visualization Components
1. **Main Time Series Chart**
   - Line chart with proper time scale on X-axis
   - Interactive tooltips showing values
   - Responsive design that adapts to screen size
   - Zoom and pan capabilities if data is extensive

2. **Data Controls**
   - Date range selector (start and end date)
   - Aggregation period selector (daily, weekly, monthly, yearly)
   - Metric selector if multiple numeric columns exist
   - Export functionality (CSV/PNG)

3. **Summary Statistics**
   - Display key metrics (total, average, min, max)
   - Show trend indicators (growth rate, direction)
   - Period-over-period comparison

#### User Interface
1. Clean, modern dashboard layout
2. Dark mode support
3. Loading states and error handling
4. Mobile-responsive design

### 3. SQL Query Examples
Here are some example queries you can use as a starting point:

```sql
{{QUERY_EXAMPLES}}
```

### 4. Component Structure
```
src/
├── App.tsx                 # Main app component
├── components/
│   ├── TimeSeriesChart.tsx # Main chart component
│   ├── DateRangePicker.tsx # Date selection
│   ├── MetricSelector.tsx  # Metric dropdown
│   ├── SummaryStats.tsx    # Statistics display
│   └── DataExporter.tsx    # Export functionality
├── hooks/
│   ├── useSQLite.ts        # SQLite database hook
│   └── useTimeSeriesData.ts # Data fetching/processing
├── utils/
│   ├── dateHelpers.ts      # Date formatting utilities
│   ├── sqlQueries.ts       # SQL query builders
│   └── dataTransform.ts    # Data transformation
└── types/
    └── index.ts            # TypeScript interfaces

```

### 5. Implementation Guidelines

1. **Performance Optimization**
   - Implement data virtualization for large datasets
   - Use memoization for expensive computations
   - Lazy load components when appropriate

2. **Error Handling**
   - Gracefully handle database connection errors
   - Validate date ranges and user inputs
   - Show meaningful error messages

3. **Accessibility**
   - Proper ARIA labels for interactive elements
   - Keyboard navigation support
   - Color contrast compliance

4. **Chart Configuration**
   - Title: "{{CHART_TITLE}}"
   - Date Format: "{{DATE_FORMAT}}"
   - Aggregation: {{AGGREGATION_TYPE}}

### 6. Sample Data Structure
The chart should expect data in this format:
```typescript
interface TimeSeriesDataPoint {
  date: Date;
  value: number;
  label?: string;
}
```

### 7. Additional Features (if applicable)
- Multiple series comparison
- Annotations for significant events
- Forecast/trend line options
- Data smoothing options

## Final Notes
- Ensure the SQLite file is copied to the public directory
- Include proper loading states while data is being fetched
- Make the interface intuitive and self-explanatory
- Add helpful tooltips and documentation where needed

Remember to create a production-ready application with proper error handling, performance optimization, and a polished user interface.