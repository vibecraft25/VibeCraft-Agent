# Time Series Data Visualization Request

## Project Information
- **Project Name**: {{PROJECT_NAME}}
- **Visualization Type**: {{VISUALIZATION_TYPE}}
- **Generated At**: {{TIMESTAMP}}

## User Requirements
{{USER_PROMPT}}

## Implementation Requirements

### 1. Technology Stack (USE EXACT VERSIONS)
- **Framework**: React 18.3.1 with TypeScript 5.6.2
- **Build Tool**: Vite 5.4.10
- **Charts**: Recharts 2.12.7 for time series visualization
- **Database**: sql.js 1.12.0 for in-browser SQLite
- **Styling**: Tailwind CSS 3.4.15
- **Date Handling**: date-fns 3.6.0

### 2. Core Features to Implement

#### Data Loading and Processing
1. Load SQLite database from `/data.sqlite` using sql.js
2. Execute SQL queries to fetch time-series data
3. Process and transform data for visualization
4. Handle date parsing and formatting

**Example Implementation:**
```typescript
import { useState, useEffect } from 'react';
import initSqlJs from 'sql.js';
import { format, parseISO } from 'date-fns';
import type { Database } from 'sql.js';

interface TimeSeriesData {
  date: string;
  value: number;
  label?: string;
}

const useTimeSeriesData = (query: string) => {
  const [data, setData] = useState<TimeSeriesData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const sqlPromise = initSqlJs({
          locateFile: file => `https://sql.js.org/dist/${file}`
        });
        const dataPromise = fetch('/data.sqlite').then(res => res.arrayBuffer());
        const [SQL, buf] = await Promise.all([sqlPromise, dataPromise]);
        const db = new SQL.Database(new Uint8Array(buf));
        
        const stmt = db.prepare(query);
        const results: TimeSeriesData[] = [];
        while (stmt.step()) {
          const row = stmt.getAsObject();
          results.push({
            date: row.date as string,
            value: Number(row.value),
            label: row.label as string
          });
        }
        stmt.free();
        db.close();
        
        setData(results);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [query]);

  return { data, loading, error };
};
```

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

**Example Chart Component:**
```typescript
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format, parseISO } from 'date-fns';
import type { TimeSeriesData } from '@/types';

interface ChartProps {
  data: TimeSeriesData[];
  title: string;
}

export const TimeSeriesChart: React.FC<ChartProps> = ({ data, title }) => {
  const formatXAxis = (tickItem: string) => {
    return format(parseISO(tickItem), 'MMM dd');
  };

  return (
    <div className="w-full h-96 bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4">{title}</h2>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
          <XAxis 
            dataKey="date" 
            tickFormatter={formatXAxis}
            className="text-sm"
          />
          <YAxis className="text-sm" />
          <Tooltip 
            labelFormatter={(value) => format(parseISO(value as string), 'PPP')}
            contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', border: '1px solid #e5e7eb' }}
          />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="value" 
            stroke="#3b82f6" 
            strokeWidth={2}
            dot={{ fill: '#3b82f6', r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
```

3. **Summary Statistics**
   - Display key metrics (total, average, min, max)
   - Show trend indicators (growth rate, direction)
   - Period-over-period comparison

#### User Interface
1. **Modern Dashboard Layout**
   - Use grid layout with gap-6 spacing
   - Cards with rounded-xl corners and shadow-soft effect
   - Consistent padding (p-6) inside cards
   - Hover effects on interactive elements

2. **Beautiful Chart Design**
   - Use gradient fills for area charts
   - Smooth animation transitions (1000ms duration)
   - Custom tooltip with rounded corners and shadow
   - Color palette: primary (#3b82f6), secondary (#10b981)

3. **Loading States**
   - Skeleton loaders with animate-pulse
   - Consistent height matching final content
   - Smooth fade-in when data loads

4. **Responsive Design**
   - Mobile-first approach
   - Stack cards vertically on small screens
   - Adjust chart heights for different viewports

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

**CRITICAL: Import Rules**
- ALWAYS use @ alias for imports within src/ directory
- Example: `import { TimeSeriesChart } from '@/components/TimeSeriesChart'`
- NEVER use relative imports like `../components/TimeSeriesChart`

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

### 6. Package.json Dependencies
Ensure your package.json includes these exact versions:
```json
{
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "sql.js": "^1.12.0",
    "recharts": "^2.12.7",
    "date-fns": "^3.6.0"
  },
  "devDependencies": {
    "@types/react": "^18.3.12",
    "@types/react-dom": "^18.3.1",
    "@vitejs/plugin-react": "^4.3.3",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.4.49",
    "tailwindcss": "^3.4.15",
    "typescript": "^5.6.2",
    "vite": "^5.4.10"
  }
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