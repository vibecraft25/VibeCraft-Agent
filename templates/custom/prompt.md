## Visualization Type: Custom Visualization

### Overview
Create a flexible, custom visualization that adapts to the user's specific requirements. Analyze the data structure and user needs to recommend and implement the most appropriate visualization approach.

### Required Components:

1. **CustomVisualization**: Main adaptive visualization component
   - **Approach**:
     - Analyze data structure first
     - Identify key metrics and dimensions
     - Recommend visualization types
     - Combine multiple views if needed
   - **Implementation Strategy**:
     ```jsx
     const CustomVisualization = ({ data, config }) => {
       // Analyze data to determine best visualization
       const analysis = analyzeDataStructure(data);
       const recommendations = recommendVisualizations(analysis);
       
       // Render based on data characteristics
       if (analysis.isTimeSeries) {
         return <TimeSeriesView data={data} config={config} />;
       } else if (analysis.isGeographic) {
         return <GeographicView data={data} config={config} />;
       } else if (analysis.isHierarchical) {
         return <HierarchicalView data={data} config={config} />;
       } else if (analysis.isNetwork) {
         return <NetworkView data={data} config={config} />;
       } else {
         return <GeneralDashboard data={data} config={config} />;
       }
     };
     ```

2. **DataExplorer**: Interactive data exploration
   - **Features**:
     - Schema visualization
     - Query builder interface
     - Data preview
     - Sample queries
   - **Components**:
     ```jsx
     <div className="data-explorer">
       <SchemaTree schema={schema} onSelectTable={handleTableSelect} />
       <QueryBuilder 
         tables={tables}
         onQueryChange={handleQueryChange}
       />
       <DataPreview 
         data={previewData}
         limit={100}
       />
       <SuggestedQueries 
         schema={schema}
         onSelectQuery={handleQuerySelect}
       />
     </div>
     ```

3. **VisualizationBuilder**: Visual configuration interface
   - **Features**:
     - Drag-and-drop chart builder
     - Real-time preview
     - Configuration panels
     - Save/load configurations
   - **Builder Logic**:
     ```javascript
     const buildVisualization = (dataFields, chartType) => {
       const config = {
         type: chartType,
         mappings: {},
         styling: {}
       };
       
       // Auto-map fields based on data types
       dataFields.forEach(field => {
         if (field.type === 'number') {
           if (!config.mappings.value) {
             config.mappings.value = field.name;
           } else {
             config.mappings.secondaryValue = field.name;
           }
         } else if (field.type === 'date') {
           config.mappings.x = field.name;
         } else if (field.type === 'string') {
           if (!config.mappings.category) {
             config.mappings.category = field.name;
           }
         }
       });
       
       return config;
     };
     ```

4. **ChartGallery**: Visual chart selection
   - **Organization**:
     - Group by purpose (comparison, trend, distribution, etc.)
     - Show applicable charts based on data
     - Preview with sample data
     - Compatibility indicators

5. **InsightPanel**: Automated insights
   - **Insight Types**:
     - Statistical summaries
     - Trends and patterns
     - Anomalies
     - Correlations
     - Recommendations

### Data Analysis and Processing:

```javascript
const analyzeDataStructure = (data) => {
  if (!data || data.length === 0) return null;
  
  const sample = data[0];
  const fields = Object.keys(sample);
  
  const analysis = {
    rowCount: data.length,
    fields: [],
    dataTypes: {},
    patterns: {}
  };
  
  // Analyze each field
  fields.forEach(field => {
    const values = data.map(row => row[field]);
    const fieldAnalysis = {
      name: field,
      type: inferDataType(values),
      uniqueValues: new Set(values).size,
      nullCount: values.filter(v => v == null).length,
      distribution: calculateDistribution(values)
    };
    
    analysis.fields.push(fieldAnalysis);
    analysis.dataTypes[field] = fieldAnalysis.type;
  });
  
  // Detect patterns
  analysis.isTimeSeries = detectTimeSeries(analysis.fields);
  analysis.isGeographic = detectGeographic(analysis.fields);
  analysis.isHierarchical = detectHierarchy(data, analysis.fields);
  analysis.isNetwork = detectNetwork(analysis.fields);
  analysis.hasCategories = analysis.fields.some(f => 
    f.type === 'string' && f.uniqueValues < data.length * 0.5
  );
  
  return analysis;
};

// Recommend visualizations based on data
const recommendVisualizations = (analysis) => {
  const recommendations = [];
  
  if (analysis.isTimeSeries) {
    recommendations.push({
      type: 'line',
      confidence: 0.9,
      reason: 'Time series data detected'
    });
    recommendations.push({
      type: 'area',
      confidence: 0.8,
      reason: 'Good for showing trends over time'
    });
  }
  
  if (analysis.hasCategories && analysis.fields.some(f => f.type === 'number')) {
    recommendations.push({
      type: 'bar',
      confidence: 0.85,
      reason: 'Categorical data with numeric values'
    });
    recommendations.push({
      type: 'pie',
      confidence: 0.7,
      reason: 'Good for showing proportions'
    });
  }
  
  if (analysis.fields.filter(f => f.type === 'number').length >= 2) {
    recommendations.push({
      type: 'scatter',
      confidence: 0.8,
      reason: 'Multiple numeric dimensions for correlation'
    });
  }
  
  if (analysis.isGeographic) {
    recommendations.push({
      type: 'map',
      confidence: 0.95,
      reason: 'Geographic coordinates detected'
    });
  }
  
  if (analysis.isHierarchical) {
    recommendations.push({
      type: 'treemap',
      confidence: 0.85,
      reason: 'Hierarchical structure detected'
    });
    recommendations.push({
      type: 'sunburst',
      confidence: 0.8,
      reason: 'Good for hierarchical data'
    });
  }
  
  if (analysis.isNetwork) {
    recommendations.push({
      type: 'network',
      confidence: 0.9,
      reason: 'Network/graph structure detected'
    });
  }
  
  // Sort by confidence
  return recommendations.sort((a, b) => b.confidence - a.confidence);
};
```

### Dynamic Visualization Rendering:

```javascript
// General dashboard for mixed data
const GeneralDashboard = ({ data, schema }) => {
  const analysis = analyzeDataStructure(data);
  const metrics = identifyKeyMetrics(analysis);
  const dimensions = identifyDimensions(analysis);
  
  return (
    <div className="dashboard-grid">
      {/* KPI Cards */}
      <div className="kpi-section">
        {metrics.slice(0, 4).map(metric => (
          <KPICard
            key={metric.field}
            title={metric.label}
            value={calculateMetric(data, metric)}
            trend={calculateTrend(data, metric)}
          />
        ))}
      </div>
      
      {/* Main Chart */}
      <div className="main-chart">
        <DynamicChart
          data={data}
          type={analysis.recommendedChart}
          config={generateChartConfig(analysis)}
        />
      </div>
      
      {/* Supporting Views */}
      <div className="supporting-views">
        {dimensions.map(dim => (
          <DimensionBreakdown
            key={dim.field}
            dimension={dim}
            data={groupByDimension(data, dim)}
          />
        ))}
      </div>
      
      {/* Data Table */}
      <div className="data-table">
        <InteractiveTable
          data={data}
          columns={generateTableColumns(analysis)}
        />
      </div>
    </div>
  );
};

// Dynamic chart component
const DynamicChart = ({ data, type, config }) => {
  switch (type) {
    case 'line':
      return <ResponsiveLineChart data={data} {...config} />;
    case 'bar':
      return <ResponsiveBarChart data={data} {...config} />;
    case 'scatter':
      return <ResponsiveScatterPlot data={data} {...config} />;
    case 'pie':
      return <ResponsivePieChart data={data} {...config} />;
    case 'heatmap':
      return <ResponsiveHeatmap data={data} {...config} />;
    case 'treemap':
      return <ResponsiveTreemap data={data} {...config} />;
    case 'network':
      return <ResponsiveNetwork data={data} {...config} />;
    default:
      return <CompositeChart data={data} {...config} />;
  }
};
```

### Automated Insights:

```javascript
// Generate insights from data
const generateInsights = (data, analysis) => {
  const insights = [];
  
  // Statistical insights
  analysis.fields.forEach(field => {
    if (field.type === 'number') {
      const values = data.map(row => row[field.name]);
      const stats = calculateStatistics(values);
      
      // Outliers
      const outliers = detectOutliers(values);
      if (outliers.length > 0) {
        insights.push({
          type: 'outlier',
          field: field.name,
          message: `Found ${outliers.length} outliers in ${field.name}`,
          severity: 'medium',
          details: outliers
        });
      }
      
      // Skewness
      if (Math.abs(stats.skewness) > 1) {
        insights.push({
          type: 'distribution',
          field: field.name,
          message: `${field.name} shows ${stats.skewness > 0 ? 'right' : 'left'} skew`,
          severity: 'low'
        });
      }
    }
  });
  
  // Correlation insights
  const numericFields = analysis.fields.filter(f => f.type === 'number');
  for (let i = 0; i < numericFields.length; i++) {
    for (let j = i + 1; j < numericFields.length; j++) {
      const correlation = calculateCorrelation(
        data.map(row => row[numericFields[i].name]),
        data.map(row => row[numericFields[j].name])
      );
      
      if (Math.abs(correlation) > 0.7) {
        insights.push({
          type: 'correlation',
          fields: [numericFields[i].name, numericFields[j].name],
          message: `Strong ${correlation > 0 ? 'positive' : 'negative'} correlation between ${numericFields[i].name} and ${numericFields[j].name}`,
          value: correlation,
          severity: 'high'
        });
      }
    }
  }
  
  // Trend insights for time series
  if (analysis.isTimeSeries) {
    const timeField = analysis.fields.find(f => f.type === 'date');
    numericFields.forEach(field => {
      const trend = detectTrend(data, timeField.name, field.name);
      if (trend.significant) {
        insights.push({
          type: 'trend',
          field: field.name,
          message: `${field.name} shows ${trend.direction} trend over time`,
          details: trend,
          severity: 'medium'
        });
      }
    });
  }
  
  return insights;
};

// Recommend actions based on insights
const generateRecommendations = (insights, analysis) => {
  const recommendations = [];
  
  insights.forEach(insight => {
    switch (insight.type) {
      case 'outlier':
        recommendations.push({
          action: 'investigate_outliers',
          message: `Investigate outliers in ${insight.field} - they may indicate data quality issues or interesting exceptions`,
          relatedInsight: insight
        });
        break;
        
      case 'correlation':
        recommendations.push({
          action: 'explore_relationship',
          message: `Explore the relationship between ${insight.fields[0]} and ${insight.fields[1]} with a scatter plot`,
          visualization: 'scatter',
          config: {
            x: insight.fields[0],
            y: insight.fields[1]
          }
        });
        break;
        
      case 'trend':
        recommendations.push({
          action: 'forecast',
          message: `Consider forecasting ${insight.field} based on the detected ${insight.details.direction} trend`,
          visualization: 'line',
          config: {
            showForecast: true,
            forecastPeriods: 10
          }
        });
        break;
    }
  });
  
  return recommendations;
};
```

### Interactive Features:

```javascript
// Interactive data filtering
const InteractiveFilters = ({ data, schema, onFilterChange }) => {
  const [filters, setFilters] = useState({});
  
  const applyFilter = (field, value) => {
    const newFilters = { ...filters, [field]: value };
    setFilters(newFilters);
    
    const filteredData = data.filter(row => {
      return Object.entries(newFilters).every(([field, filter]) => {
        if (!filter) return true;
        
        if (filter.type === 'range') {
          return row[field] >= filter.min && row[field] <= filter.max;
        } else if (filter.type === 'selection') {
          return filter.values.includes(row[field]);
        }
        
        return true;
      });
    });
    
    onFilterChange(filteredData);
  };
  
  return (
    <div className="filter-panel">
      {schema.fields.map(field => (
        <FilterControl
          key={field.name}
          field={field}
          data={data}
          value={filters[field.name]}
          onChange={(value) => applyFilter(field.name, value)}
        />
      ))}
    </div>
  );
};

// Cross-filtering between visualizations
const enableCrossFiltering = (charts) => {
  charts.forEach((chart, index) => {
    chart.on('select', (selection) => {
      // Update other charts based on selection
      charts.forEach((otherChart, otherIndex) => {
        if (index !== otherIndex) {
          otherChart.filter(selection);
        }
      });
    });
  });
};
```

### Export and Sharing:

```javascript
// Generate shareable dashboard configuration
const exportDashboardConfig = () => {
  const config = {
    version: '1.0',
    dataQuery: currentQuery,
    visualizations: visualizations.map(viz => ({
      type: viz.type,
      config: viz.config,
      position: viz.position,
      size: viz.size
    })),
    filters: activeFilters,
    insights: selectedInsights,
    theme: currentTheme
  };
  
  return JSON.stringify(config, null, 2);
};

// Import and apply configuration
const importDashboardConfig = (configJson) => {
  const config = JSON.parse(configJson);
  
  // Validate config version
  if (config.version !== '1.0') {
    throw new Error('Incompatible configuration version');
  }
  
  // Apply configuration
  setQuery(config.dataQuery);
  setVisualizations(config.visualizations);
  setFilters(config.filters);
  setTheme(config.theme);
  
  // Refresh data
  refreshData();
};
```

### Responsive and Adaptive Design:

- **Auto-Layout**: 
  - Detect screen size and adjust layout
  - Responsive grid system
  - Collapsible panels
  
- **Progressive Disclosure**: 
  - Show essential visualizations first
  - Load additional views on demand
  - Lazy loading for performance
  
- **Adaptive Complexity**: 
  - Simplify visualizations on mobile
  - Full features on desktop
  - Touch-optimized interactions