## Visualization Type: Heatmap

### Overview
Create interactive heatmap visualizations to display patterns, correlations, and intensity distributions across two dimensions. Support various heatmap types including grid heatmaps, calendar heatmaps, and correlation matrices.

### Required Components:

1. **HeatmapGrid**: Main grid-based heatmap component
   - **Features**:
     - Customizable color scales (sequential, diverging, categorical)
     - Interactive cells with hover details
     - Zoom and pan for large datasets
     - Cell borders and spacing options
     - Value labels on cells
   - **Implementation**:
     ```jsx
     <div className="heatmap-container">
       <div className="y-axis">
         {yLabels.map(label => (
           <div key={label} className="y-label">{label}</div>
         ))}
       </div>
       <div className="heatmap-grid">
         {data.map((row, y) => (
           <div key={y} className="heatmap-row">
             {row.map((value, x) => (
               <HeatmapCell
                 key={`${x}-${y}`}
                 value={value}
                 color={colorScale(value)}
                 onClick={() => handleCellClick(x, y, value)}
                 onHover={(hovering) => handleCellHover(x, y, hovering)}
               />
             ))}
           </div>
         ))}
       </div>
       <div className="x-axis">
         {xLabels.map(label => (
           <div key={label} className="x-label">{label}</div>
         ))}
       </div>
     </div>
     ```

2. **CalendarHeatmap**: Calendar-style heatmap for temporal data
   - **Features**:
     - Year/month/week views
     - GitHub-style contribution graph
     - Day-of-week patterns
     - Seasonal trends
     - Holiday markers
   - **Layout**:
     ```jsx
     <CalendarHeatmap
       startDate={new Date('2024-01-01')}
       endDate={new Date('2024-12-31')}
       values={calendarData}
       classForValue={(value) => {
         if (!value) return 'color-empty';
         return `color-scale-${Math.min(4, Math.floor(value.count / 10))}`;
       }}
       tooltipDataAttrs={(value) => ({
         'data-tip': value ? `${value.date}: ${value.count} events` : 'No data'
       })}
       showWeekdayLabels={true}
     />
     ```

3. **CorrelationMatrix**: Specialized heatmap for correlations
   - **Features**:
     - Symmetric matrix display
     - Diagonal emphasis
     - Hierarchical clustering
     - Significance indicators
     - Variable grouping
   - **Special Handling**:
     ```javascript
     const renderCorrelationMatrix = (correlations, variables) => {
       return variables.map((varY, y) => (
         <div key={varY} className="correlation-row">
           {variables.map((varX, x) => {
             const value = correlations[y][x];
             const isSignificant = Math.abs(value) > 0.5;
             
             return (
               <div
                 key={varX}
                 className={`correlation-cell ${x === y ? 'diagonal' : ''}`}
                 style={{ backgroundColor: correlationColorScale(value) }}
               >
                 <span className={isSignificant ? 'significant' : ''}>
                   {value.toFixed(2)}
                 </span>
               </div>
             );
           })}
         </div>
       ));
     };
     ```

4. **ColorLegend**: Interactive color scale legend
   - **Types**:
     - Continuous gradient
     - Discrete steps
     - Diverging scale
   - **Features**:
     - Value range labels
     - Interactive threshold adjustment
     - Color scheme selector

5. **HeatmapControls**: Customization controls
   - **Options**:
     - Color scheme selection
     - Normalization method
     - Cell size adjustment
     - Label rotation
     - Export options

### Data Processing:

```javascript
const processHeatmapData = (db, config) => {
  let query;
  
  switch (config.type) {
    case 'grid':
      // Standard 2D aggregation
      query = `
        SELECT 
          {{xDimension}} as x,
          {{yDimension}} as y,
          ${config.aggregation}({{valueColumn}}) as value
        FROM {{tableName}}
        ${config.filter ? `WHERE ${config.filter}` : ''}
        GROUP BY x, y
        ORDER BY x, y
      `;
      break;
      
    case 'temporal':
      // Time-based heatmap (e.g., hour vs day of week)
      query = `
        SELECT 
          strftime('%w', {{dateColumn}}) as day_of_week,
          strftime('%H', {{dateColumn}}) as hour,
          COUNT(*) as value
        FROM {{tableName}}
        GROUP BY day_of_week, hour
      `;
      break;
      
    case 'calendar':
      // Calendar heatmap
      query = `
        SELECT 
          date({{dateColumn}}) as date,
          ${config.metric} as value
        FROM {{tableName}}
        WHERE {{dateColumn}} BETWEEN ? AND ?
        GROUP BY date
      `;
      break;
  }
  
  const results = db.exec(query, config.params || []);
  return transformToHeatmapFormat(results[0]?.values || [], config.type);
};

// Transform query results to matrix format
const transformToHeatmapFormat = (results, type) => {
  if (type === 'calendar') {
    return results.map(row => ({
      date: row[0],
      value: row[1]
    }));
  }
  
  // For grid heatmaps, pivot data into matrix
  const matrix = {};
  const xValues = new Set();
  const yValues = new Set();
  
  results.forEach(row => {
    const [x, y, value] = row;
    xValues.add(x);
    yValues.add(y);
    
    if (!matrix[y]) matrix[y] = {};
    matrix[y][x] = value;
  });
  
  // Convert to array format
  const xLabels = Array.from(xValues).sort();
  const yLabels = Array.from(yValues).sort();
  
  const data = yLabels.map(y => 
    xLabels.map(x => matrix[y]?.[x] || 0)
  );
  
  return { data, xLabels, yLabels };
};

// Calculate correlation matrix
const calculateCorrelationMatrix = (data, variables) => {
  const n = data.length;
  const correlations = [];
  
  variables.forEach((var1, i) => {
    correlations[i] = [];
    variables.forEach((var2, j) => {
      if (i === j) {
        correlations[i][j] = 1.0;
      } else if (j < i) {
        correlations[i][j] = correlations[j][i];
      } else {
        const values1 = data.map(row => row[var1]);
        const values2 = data.map(row => row[var2]);
        correlations[i][j] = pearsonCorrelation(values1, values2);
      }
    });
  });
  
  return correlations;
};
```

### Color Scale Management:

```javascript
// Define color scales
const colorScales = {
  sequential: {
    blue: ['#f0f9ff', '#bae6fd', '#38bdf8', '#0284c7', '#075985'],
    green: ['#f0fdf4', '#bbf7d0', '#4ade80', '#16a34a', '#14532d'],
    red: ['#fef2f2', '#fecaca', '#f87171', '#dc2626', '#7f1d1d']
  },
  diverging: {
    redBlue: ['#dc2626', '#f87171', '#ffffff', '#60a5fa', '#2563eb'],
    purpleGreen: ['#7c3aed', '#a78bfa', '#ffffff', '#86efac', '#16a34a']
  },
  correlation: {
    standard: d3.scaleDiverging()
      .domain([-1, 0, 1])
      .interpolator(d3.interpolateRdBu)
  }
};

// Dynamic color scale based on data
const createColorScale = (data, scaleType, customColors) => {
  const flatData = data.flat().filter(v => v !== null);
  const min = Math.min(...flatData);
  const max = Math.max(...flatData);
  
  switch (scaleType) {
    case 'sequential':
      return d3.scaleSequential()
        .domain([min, max])
        .interpolator(d3.interpolateBlues);
        
    case 'diverging':
      const center = (min + max) / 2;
      return d3.scaleDiverging()
        .domain([min, center, max])
        .interpolator(d3.interpolateRdBu);
        
    case 'quantize':
      return d3.scaleQuantize()
        .domain([min, max])
        .range(customColors || colorScales.sequential.blue);
        
    default:
      return d3.scaleLinear()
        .domain([min, max])
        .range(['#ffffff', '#000000']);
  }
};

// Normalize data for better visualization
const normalizeData = (data, method) => {
  switch (method) {
    case 'z-score':
      return zScoreNormalize(data);
    case 'min-max':
      return minMaxNormalize(data);
    case 'percentile':
      return percentileNormalize(data);
    default:
      return data;
  }
};
```

### Interactive Features:

```javascript
// Cell interaction handlers
const HeatmapCell = ({ x, y, value, color, onClick, onHover }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <div
      className="heatmap-cell"
      style={{ 
        backgroundColor: color,
        opacity: isHovered ? 0.8 : 1
      }}
      onClick={() => onClick(x, y, value)}
      onMouseEnter={() => {
        setIsHovered(true);
        onHover(true);
        showTooltip(x, y, value);
      }}
      onMouseLeave={() => {
        setIsHovered(false);
        onHover(false);
        hideTooltip();
      }}
    >
      {showValues && (
        <span className="cell-value">{formatValue(value)}</span>
      )}
    </div>
  );
};

// Zoom and pan functionality
const enableZoomPan = (containerRef, scale = 1) => {
  const zoom = d3.zoom()
    .scaleExtent([0.5, 4])
    .on('zoom', (event) => {
      const { transform } = event;
      containerRef.current.style.transform = 
        `translate(${transform.x}px, ${transform.y}px) scale(${transform.k})`;
    });
  
  d3.select(containerRef.current.parentElement)
    .call(zoom)
    .call(zoom.transform, d3.zoomIdentity.scale(scale));
};

// Brush selection for filtering
const enableBrushSelection = (onSelection) => {
  const brush = d3.brush()
    .extent([[0, 0], [width, height]])
    .on('end', (event) => {
      if (!event.selection) return;
      
      const [[x0, y0], [x1, y1]] = event.selection;
      const selectedCells = getCellsInSelection(x0, y0, x1, y1);
      onSelection(selectedCells);
    });
  
  svg.append('g')
    .attr('class', 'brush')
    .call(brush);
};
```

### Pattern Detection:

```javascript
// Detect patterns in heatmap data
const detectPatterns = (data, xLabels, yLabels) => {
  const patterns = {
    hotspots: [],
    coldspots: [],
    clusters: [],
    periodicPatterns: []
  };
  
  // Find hotspots and coldspots
  const threshold = calculateThreshold(data, 0.9); // 90th percentile
  data.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value > threshold.high) {
        patterns.hotspots.push({ x, y, value, label: `${xLabels[x]}, ${yLabels[y]}` });
      } else if (value < threshold.low) {
        patterns.coldspots.push({ x, y, value, label: `${xLabels[x]}, ${yLabels[y]}` });
      }
    });
  });
  
  // Detect clusters using DBSCAN or similar
  patterns.clusters = findClusters(data);
  
  // Detect periodic patterns (for temporal data)
  if (isTemporalData(xLabels) || isTemporalData(yLabels)) {
    patterns.periodicPatterns = detectPeriodicPatterns(data);
  }
  
  return patterns;
};

// Highlight patterns on the heatmap
const highlightPatterns = (patterns) => {
  // Add pattern overlays
  patterns.hotspots.forEach(spot => {
    addOverlay(spot.x, spot.y, 'hotspot-overlay');
  });
  
  patterns.clusters.forEach(cluster => {
    addClusterBoundary(cluster.cells, cluster.id);
  });
};
```

### Export Features:

```javascript
// Export heatmap as image
const exportAsImage = async (format = 'png') => {
  const canvas = await html2canvas(heatmapContainer, {
    backgroundColor: '#ffffff',
    scale: 2 // Higher resolution
  });
  
  if (format === 'png') {
    canvas.toBlob(blob => {
      saveAs(blob, 'heatmap.png');
    });
  } else if (format === 'svg') {
    const svg = convertToSVG(heatmapData);
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    saveAs(blob, 'heatmap.svg');
  }
};

// Export data as CSV
const exportAsCSV = () => {
  const csv = [
    ['', ...xLabels].join(','),
    ...yLabels.map((yLabel, y) => 
      [yLabel, ...data[y].map(v => v.toFixed(2))].join(',')
    )
  ].join('\n');
  
  const blob = new Blob([csv], { type: 'text/csv' });
  saveAs(blob, 'heatmap-data.csv');
};

// Generate insights report
const generateHeatmapInsights = (data, patterns) => {
  return {
    summary: {
      dimensions: `${xLabels.length} x ${yLabels.length}`,
      valueRange: { min: Math.min(...data.flat()), max: Math.max(...data.flat()) },
      coverage: calculateCoverage(data),
      sparsity: calculateSparsity(data)
    },
    patterns: {
      hotspots: patterns.hotspots.slice(0, 5),
      coldspots: patterns.coldspots.slice(0, 5),
      clusters: patterns.clusters.length,
      periodicPatterns: patterns.periodicPatterns
    },
    correlations: findStrongCorrelations(data),
    recommendations: generateRecommendations(patterns)
  };
};
```

### Responsive Design:

- **Mobile**: 
  - Scrollable heatmap with fixed headers
  - Tap for cell details
  - Simplified color legend
  - Pinch to zoom
  
- **Tablet**: 
  - Touch-friendly cell selection
  - Collapsible controls
  - Optimized cell sizes
  
- **Desktop**: 
  - Full interactive features
  - Keyboard navigation
  - Multi-select with brush
  - Advanced filtering options