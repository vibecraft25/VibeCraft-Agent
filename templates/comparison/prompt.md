## Visualization Type: Comparison Analysis

### Overview
Create a comprehensive comparison visualization that allows users to analyze differences between categories, time periods, groups, or any other dimensions. Support multiple chart types and provide insights into the differences.

### Required Components:

1. **ComparisonChart**: Main comparison visualization component
   - **Supported Chart Types**:
     - Bar chart (grouped/stacked)
     - Line chart (multiple series)
     - Radar chart
     - Scatter plot
     - Parallel coordinates
     - Heatmap
   - **Features**:
     - Dynamic chart type switching
     - Interactive legends
     - Hover tooltips with comparisons
     - Zoom and pan
     - Export functionality
   - **Implementation**:
     ```jsx
     const renderChart = () => {
       switch (chartType) {
         case 'bar':
           return <BarChart data={data} grouped={true} />;
         case 'line':
           return <LineChart data={data} multiSeries={true} />;
         case 'radar':
           return <RadarChart data={data} />;
         // ... other chart types
       }
     };
     ```

2. **ComparisonTable**: Detailed tabular view
   - **Features**:
     - Sortable columns
     - Difference columns (absolute & percentage)
     - Conditional formatting
     - Row highlighting
     - Column totals/averages
   - **Layout**:
     ```jsx
     <Table>
       <thead>
         <tr>
           <th>Category</th>
           {metrics.map(metric => (
             <>
               <th>{metric.name} (A)</th>
               <th>{metric.name} (B)</th>
               <th>Difference</th>
               <th>% Change</th>
             </>
           ))}
         </tr>
       </thead>
       <tbody>
         {renderComparisonRows()}
       </tbody>
     </Table>
     ```

3. **ChartTypeSelector**: Chart type selection with recommendations
   - **Features**:
     - Visual previews of chart types
     - Recommendations based on data
     - Disabled options for incompatible data
   - **Logic**:
     ```javascript
     const recommendChartType = (data, metrics) => {
       if (categories.length <= 5 && metrics.length <= 3) {
         return 'bar';
       } else if (hasTimeSeriesData(data)) {
         return 'line';
       } else if (metrics.length >= 3) {
         return 'radar';
       }
       return 'table';
     };
     ```

4. **DifferenceIndicator**: Visual representation of differences
   - **Features**:
     - Up/down arrows
     - Color coding (green/red)
     - Percentage or absolute values
     - Sparklines for trends
   - **Display**:
     ```jsx
     <div className={`difference ${diff > 0 ? 'positive' : 'negative'}`}>
       <Icon name={diff > 0 ? 'arrow-up' : 'arrow-down'} />
       <span>{formatDifference(diff, format)}</span>
       {showSparkline && <Sparkline data={trendData} />}
     </div>
     ```

5. **ComparisonSummary**: Key insights panel
   - **Features**:
     - Biggest differences
     - Statistical significance
     - Rankings
     - Trend analysis
   - **Content**:
     - Top performers
     - Biggest changes
     - Outliers
     - Correlations

### Data Processing:

```javascript
const processComparisonData = (db, comparisonType, options) => {
  let query;
  
  switch (comparisonType) {
    case 'categories':
      // Compare different categories
      query = `
        SELECT 
          {{categoryColumn}} as category,
          ${options.metrics.map(m => `SUM(${m}) as ${m}`).join(', ')}
        FROM {{tableName}}
        ${options.filter ? `WHERE ${options.filter}` : ''}
        GROUP BY {{categoryColumn}}
        ORDER BY {{categoryColumn}}
      `;
      break;
      
    case 'periods':
      // Compare time periods
      query = `
        SELECT 
          {{periodColumn}} as period,
          {{categoryColumn}} as category,
          ${options.metrics.map(m => `SUM(${m}) as ${m}`).join(', ')}
        FROM {{tableName}}
        WHERE {{periodColumn}} IN (${options.periods.map(() => '?').join(', ')})
        GROUP BY {{periodColumn}}, {{categoryColumn}}
      `;
      break;
      
    case 'groups':
      // Compare custom groups
      query = `
        SELECT 
          CASE 
            ${options.groups.map((g, i) => 
              `WHEN ${g.condition} THEN '${g.name}'`
            ).join(' ')}
            ELSE 'Other'
          END as group_name,
          ${options.metrics.map(m => `SUM(${m}) as ${m}`).join(', ')}
        FROM {{tableName}}
        GROUP BY group_name
      `;
      break;
  }
  
  const results = db.exec(query, options.params || []);
  return transformComparisonData(results[0]?.values || [], comparisonType);
};

// Calculate differences and percentages
const calculateDifferences = (data, baselineIndex = 0) => {
  return data.map((item, index) => {
    if (index === baselineIndex) {
      return { ...item, isBaseline: true };
    }
    
    const baseline = data[baselineIndex];
    const differences = {};
    
    Object.keys(item).forEach(key => {
      if (typeof item[key] === 'number' && baseline[key]) {
        differences[`${key}_diff`] = item[key] - baseline[key];
        differences[`${key}_pct`] = ((item[key] - baseline[key]) / baseline[key]) * 100;
      }
    });
    
    return { ...item, ...differences };
  });
};

// Rank items by metric
const rankByMetric = (data, metric) => {
  const sorted = [...data].sort((a, b) => b[metric] - a[metric]);
  return sorted.map((item, index) => ({
    ...item,
    [`${metric}_rank`]: index + 1
  }));
};
```

### Implementation Guidelines:

**CRITICAL: Import Rules**
- ALWAYS use @ alias for imports within src/ directory
- Example: `import { ComparisonChart } from '@/components/ComparisonChart'`
- NEVER use relative imports like `../components/ComparisonChart`
- If using Radix UI components, install them separately: `npm install @radix-ui/react-tabs`

### Chart Configurations:

```javascript
// Bar Chart Configuration
const barChartConfig = {
  data: comparisonData,
  keys: metrics.map(m => m.key),
  indexBy: 'category',
  margin: { top: 50, right: 130, bottom: 50, left: 60 },
  padding: 0.3,
  groupMode: 'grouped', // or 'stacked'
  colors: { scheme: 'nivo' },
  borderColor: { from: 'color', modifiers: [['darker', 1.6]] },
  axisBottom: {
    tickSize: 5,
    tickPadding: 5,
    tickRotation: -45,
    legend: 'Category',
    legendPosition: 'middle',
    legendOffset: 45
  },
  legends: [{
    dataFrom: 'keys',
    anchor: 'bottom-right',
    direction: 'column',
    translateX: 120,
    itemWidth: 100,
    itemHeight: 20
  }]
};

// Radar Chart Configuration
const radarChartConfig = {
  data: comparisonData,
  keys: items.map(i => i.name),
  indexBy: 'metric',
  maxValue: 'auto',
  margin: { top: 70, right: 80, bottom: 40, left: 80 },
  borderWidth: 2,
  gridLevels: 5,
  gridShape: 'circular',
  legends: [{
    anchor: 'top-left',
    direction: 'column',
    translateX: -50,
    translateY: -40,
    itemWidth: 80,
    itemHeight: 20
  }]
};
```

### Interactive Features:

```javascript
// Dynamic filtering
const FilterPanel = ({ data, onFilter }) => {
  const [filters, setFilters] = useState({
    minValue: null,
    maxValue: null,
    categories: [],
    showOnlyDifferences: false
  });
  
  const applyFilters = () => {
    const filtered = data.filter(item => {
      if (filters.minValue && item.value < filters.minValue) return false;
      if (filters.maxValue && item.value > filters.maxValue) return false;
      if (filters.categories.length && !filters.categories.includes(item.category)) return false;
      if (filters.showOnlyDifferences && Math.abs(item.difference) < 5) return false;
      return true;
    });
    
    onFilter(filtered);
  };
  
  return (
    <div className="filter-panel">
      {/* Filter controls */}
    </div>
  );
};

// Highlight significant differences
const highlightSignificant = (data, threshold = 0.1) => {
  return data.map(item => ({
    ...item,
    highlighted: Math.abs(item.percentChange) > threshold * 100
  }));
};
```

### Statistical Analysis:

```javascript
// Calculate statistical significance
const calculateSignificance = (groupA, groupB) => {
  // Simple t-test implementation
  const meanA = mean(groupA);
  const meanB = mean(groupB);
  const stdA = standardDeviation(groupA);
  const stdB = standardDeviation(groupB);
  const nA = groupA.length;
  const nB = groupB.length;
  
  const pooledStd = Math.sqrt(((nA - 1) * stdA * stdA + (nB - 1) * stdB * stdB) / (nA + nB - 2));
  const tStat = (meanA - meanB) / (pooledStd * Math.sqrt(1/nA + 1/nB));
  
  return {
    tStatistic: tStat,
    significant: Math.abs(tStat) > 1.96, // 95% confidence
    pValue: calculatePValue(tStat, nA + nB - 2)
  };
};

// Find correlations between metrics
const findCorrelations = (data, metrics) => {
  const correlations = [];
  
  for (let i = 0; i < metrics.length; i++) {
    for (let j = i + 1; j < metrics.length; j++) {
      const correlation = calculateCorrelation(
        data.map(d => d[metrics[i]]),
        data.map(d => d[metrics[j]])
      );
      
      if (Math.abs(correlation) > 0.7) {
        correlations.push({
          metric1: metrics[i],
          metric2: metrics[j],
          correlation: correlation
        });
      }
    }
  }
  
  return correlations;
};
```

### Export Features:

```javascript
// Export comparison report
const exportReport = (format) => {
  switch (format) {
    case 'pdf':
      generatePDFReport();
      break;
    case 'excel':
      generateExcelReport();
      break;
    case 'powerpoint':
      generatePowerPointSlides();
      break;
  }
};

// Generate insights summary
const generateInsights = (data) => {
  const insights = [];
  
  // Biggest difference
  const maxDiff = data.reduce((max, item) => 
    item.difference > max.difference ? item : max
  );
  insights.push(`Biggest increase: ${maxDiff.name} (+${maxDiff.percentChange.toFixed(1)}%)`);
  
  // Add more insights...
  
  return insights;
};
```

### Responsive Design:

- **Mobile**: 
  - Single chart view with swipe between types
  - Simplified table with horizontal scroll
  - Collapsible filters
  
- **Tablet**: 
  - Chart and summary side by side
  - Touch-friendly controls
  
- **Desktop**: 
  - Multi-panel dashboard
  - Drag-and-drop comparisons
  - Advanced filtering options