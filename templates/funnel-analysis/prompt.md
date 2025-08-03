## Visualization Type: Funnel Analysis

### Overview
Create a comprehensive funnel analysis visualization to track user progression through stages, identify drop-off points, and analyze conversion rates. Support segmentation, time-based analysis, and actionable insights.

### Required Components:

1. **FunnelChart**: Main funnel visualization
   - **Visual Styles**:
     - Traditional funnel shape
     - Bar chart style
     - Sankey diagram
     - Step chart
   - **Features**:
     - Interactive stages with click/hover
     - Animated transitions
     - Conversion percentages
     - Drop-off indicators
     - Stage labels and counts
   - **Implementation**:
     ```jsx
     <div className="funnel-container">
       {stages.map((stage, index) => (
         <FunnelStage
           key={stage.id}
           stage={stage}
           previousStage={stages[index - 1]}
           width={calculateWidth(stage, stages[0])}
           onClick={() => handleStageClick(stage)}
         />
       ))}
     </div>
     ```

2. **ConversionMetrics**: Key metrics dashboard
   - **Metrics**:
     - Overall conversion rate
     - Stage-to-stage conversion
     - Average time between stages
     - Conversion velocity
     - Trend indicators
   - **Display**:
     ```jsx
     <div className="metrics-grid">
       <MetricCard
         title="Overall Conversion"
         value={`${overallConversion}%`}
         trend={conversionTrend}
         sparkline={conversionHistory}
       />
       <MetricCard
         title="Biggest Drop-off"
         value={biggestDropoff.stage}
         subtitle={`${biggestDropoff.rate}% lost`}
       />
     </div>
     ```

3. **DropoffAnalysis**: Detailed drop-off analysis
   - **Features**:
     - Drop-off reasons (if available)
     - Segmented drop-off analysis
     - Time-based patterns
     - Recommendations
   - **Visualizations**:
     - Waterfall chart
     - Heat map by segment
     - Time series of drop-offs

4. **StageDetails**: Deep dive into specific stages
   - **Information**:
     - User count and percentage
     - Time spent in stage
     - Entry/exit points
     - User segments breakdown
     - Common paths
   - **Charts**:
     - Distribution histograms
     - Segment pie charts
     - Time analysis

5. **FunnelComparison**: Compare multiple funnels
   - **Comparison Types**:
     - Time periods (MoM, YoY)
     - User segments
     - A/B test variants
     - Different funnels
   - **Visualizations**:
     - Side-by-side funnels
     - Overlay comparison
     - Difference highlighting

### Data Processing:

```javascript
const processFunnelData = (db, funnelConfig) => {
  // Get users at each stage
  const stageQuery = `
    SELECT 
      {{stageColumn}} as stage,
      COUNT(DISTINCT {{userIdColumn}}) as users,
      AVG({{timeInStageColumn}}) as avg_time
    FROM {{tableName}}
    WHERE {{stageColumn}} IN (${funnelConfig.stages.map(() => '?').join(', ')})
    GROUP BY {{stageColumn}}
  `;
  
  const stageResults = db.exec(stageQuery, funnelConfig.stages);
  
  // Calculate conversion metrics
  const stages = buildFunnelStages(stageResults[0]?.values || []);
  const metrics = calculateConversionMetrics(stages);
  
  // Get drop-off details
  const dropoffQuery = `
    SELECT 
      {{fromStageColumn}} as from_stage,
      {{toStageColumn}} as to_stage,
      COUNT(DISTINCT {{userIdColumn}}) as users
    FROM {{transitionTable}}
    GROUP BY {{fromStageColumn}}, {{toStageColumn}}
  `;
  
  const dropoffResults = db.exec(dropoffQuery);
  const dropoffs = analyzeDropoffs(dropoffResults[0]?.values || []);
  
  return { stages, metrics, dropoffs };
};

// Calculate conversion metrics
const calculateConversionMetrics = (stages) => {
  const metrics = {
    stages: [],
    overall: 0,
    biggestDropoff: null
  };
  
  let maxDropoff = 0;
  
  stages.forEach((stage, index) => {
    const stageMetric = {
      name: stage.name,
      users: stage.users,
      percentage: (stage.users / stages[0].users) * 100
    };
    
    if (index > 0) {
      const prevStage = stages[index - 1];
      stageMetric.conversionRate = (stage.users / prevStage.users) * 100;
      stageMetric.dropoffRate = 100 - stageMetric.conversionRate;
      
      if (stageMetric.dropoffRate > maxDropoff) {
        maxDropoff = stageMetric.dropoffRate;
        metrics.biggestDropoff = {
          from: prevStage.name,
          to: stage.name,
          rate: stageMetric.dropoffRate
        };
      }
    }
    
    metrics.stages.push(stageMetric);
  });
  
  metrics.overall = (stages[stages.length - 1].users / stages[0].users) * 100;
  
  return metrics;
};

// Segment analysis
const analyzeBySegment = (db, funnelConfig, segmentColumn) => {
  const query = `
    SELECT 
      {{segmentColumn}} as segment,
      {{stageColumn}} as stage,
      COUNT(DISTINCT {{userIdColumn}}) as users
    FROM {{tableName}}
    WHERE {{stageColumn}} IN (${funnelConfig.stages.map(() => '?').join(', ')})
    GROUP BY {{segmentColumn}}, {{stageColumn}}
  `;
  
  const results = db.exec(query, funnelConfig.stages);
  
  // Build funnel for each segment
  const segmentFunnels = {};
  results[0]?.values.forEach(row => {
    const [segment, stage, users] = row;
    if (!segmentFunnels[segment]) {
      segmentFunnels[segment] = {};
    }
    segmentFunnels[segment][stage] = users;
  });
  
  return segmentFunnels;
};
```

### Funnel Visualization Rendering:

```javascript
// Traditional funnel shape
const renderFunnelShape = (stages) => {
  const maxWidth = 400;
  const height = 80;
  const spacing = 10;
  
  return (
    <svg className="funnel-svg" width={maxWidth} height={stages.length * (height + spacing)}>
      {stages.map((stage, index) => {
        const width = (stage.users / stages[0].users) * maxWidth;
        const x = (maxWidth - width) / 2;
        const y = index * (height + spacing);
        
        return (
          <g key={stage.id}>
            {/* Funnel segment */}
            <rect
              x={x}
              y={y}
              width={width}
              height={height}
              fill={getStageColor(index)}
              className="funnel-segment"
              onClick={() => handleStageClick(stage)}
            />
            
            {/* Stage label */}
            <text
              x={maxWidth / 2}
              y={y + height / 2}
              textAnchor="middle"
              className="stage-label"
            >
              {stage.name}: {stage.users.toLocaleString()} ({stage.percentage.toFixed(1)}%)
            </text>
            
            {/* Drop-off indicator */}
            {index > 0 && (
              <text
                x={maxWidth + 20}
                y={y - spacing / 2}
                className="dropoff-label"
              >
                ↓ {stage.dropoffRate.toFixed(1)}% drop
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
};

// Sankey diagram style
const renderSankeyFunnel = (stages, transitions) => {
  const sankeyData = {
    nodes: stages.map(s => ({ id: s.id, name: s.name })),
    links: transitions.map(t => ({
      source: t.from,
      target: t.to,
      value: t.users
    }))
  };
  
  return <SankeyDiagram data={sankeyData} />;
};
```

### Interactive Features:

```javascript
// Stage click handler with drill-down
const handleStageClick = (stage) => {
  setSelectedStage(stage);
  
  // Fetch detailed data for the stage
  const detailQuery = `
    SELECT 
      {{userIdColumn}} as user_id,
      {{timeColumn}} as timestamp,
      {{attributeColumns}}
    FROM {{tableName}}
    WHERE {{stageColumn}} = ?
    ORDER BY {{timeColumn}} DESC
    LIMIT 1000
  `;
  
  const details = db.exec(detailQuery, [stage.name]);
  setStageDetails(processStageDetails(details[0]?.values || []));
};

// Time-based filtering
const filterByTimeRange = (startDate, endDate) => {
  const filteredQuery = `
    SELECT 
      {{stageColumn}} as stage,
      COUNT(DISTINCT {{userIdColumn}}) as users
    FROM {{tableName}}
    WHERE {{timeColumn}} BETWEEN ? AND ?
      AND {{stageColumn}} IN (${stages.map(() => '?').join(', ')})
    GROUP BY {{stageColumn}}
  `;
  
  const params = [startDate, endDate, ...stages];
  const results = db.exec(filteredQuery, params);
  
  updateFunnelData(results[0]?.values || []);
};

// Cohort analysis
const analyzeByCohort = (cohortType) => {
  let cohortColumn;
  
  switch (cohortType) {
    case 'signup_date':
      cohortColumn = "date({{signupColumn}})";
      break;
    case 'channel':
      cohortColumn = "{{acquisitionChannelColumn}}";
      break;
    case 'user_type':
      cohortColumn = "{{userTypeColumn}}";
      break;
  }
  
  const cohortQuery = `
    SELECT 
      ${cohortColumn} as cohort,
      {{stageColumn}} as stage,
      COUNT(DISTINCT {{userIdColumn}}) as users
    FROM {{tableName}}
    GROUP BY cohort, {{stageColumn}}
  `;
  
  const results = db.exec(cohortQuery);
  return buildCohortFunnels(results[0]?.values || []);
};
```

### Advanced Analytics:

```javascript
// Calculate statistical significance of changes
const calculateSignificance = (funnelA, funnelB) => {
  const significance = {};
  
  funnelA.stages.forEach((stageA, index) => {
    const stageB = funnelB.stages[index];
    
    // Calculate z-score for conversion rate difference
    const convA = stageA.users / funnelA.stages[0].users;
    const convB = stageB.users / funnelB.stages[0].users;
    const pooledConv = (stageA.users + stageB.users) / 
                      (funnelA.stages[0].users + funnelB.stages[0].users);
    
    const se = Math.sqrt(pooledConv * (1 - pooledConv) * 
               (1/funnelA.stages[0].users + 1/funnelB.stages[0].users));
    
    const zScore = (convA - convB) / se;
    const pValue = 2 * (1 - normalCDF(Math.abs(zScore)));
    
    significance[stageA.name] = {
      zScore,
      pValue,
      significant: pValue < 0.05,
      improvement: ((convB - convA) / convA) * 100
    };
  });
  
  return significance;
};

// Predict future conversions
const predictConversions = (historicalData, futureSteps = 7) => {
  // Simple linear regression for each stage
  const predictions = {};
  
  Object.keys(historicalData).forEach(stage => {
    const data = historicalData[stage];
    const regression = linearRegression(data);
    
    predictions[stage] = [];
    for (let i = 1; i <= futureSteps; i++) {
      predictions[stage].push({
        date: addDays(new Date(), i),
        predicted: regression.predict(data.length + i),
        confidence: regression.r2
      });
    }
  });
  
  return predictions;
};
```

### Export and Reporting:

```javascript
// Generate funnel report
const generateFunnelReport = () => {
  const report = {
    summary: {
      overallConversion: metrics.overall,
      totalUsers: stages[0].users,
      completedUsers: stages[stages.length - 1].users,
      biggestDropoff: metrics.biggestDropoff
    },
    stages: stages.map(stage => ({
      name: stage.name,
      users: stage.users,
      conversionRate: stage.conversionRate,
      averageTime: stage.avgTime,
      segments: stage.segments
    })),
    insights: generateInsights(),
    recommendations: generateRecommendations()
  };
  
  return report;
};

// Generate actionable insights
const generateInsights = () => {
  const insights = [];
  
  // Identify problem areas
  metrics.stages.forEach((stage, index) => {
    if (stage.dropoffRate > 30) {
      insights.push({
        type: 'high_dropoff',
        stage: stage.name,
        message: `High drop-off rate of ${stage.dropoffRate.toFixed(1)}% at ${stage.name}`,
        severity: 'high'
      });
    }
  });
  
  // Compare with benchmarks
  if (metrics.overall < benchmarks.industry) {
    insights.push({
      type: 'below_benchmark',
      message: `Overall conversion ${metrics.overall.toFixed(1)}% is below industry average of ${benchmarks.industry}%`,
      severity: 'medium'
    });
  }
  
  return insights;
};
```

### Responsive Design:

- **Mobile**: 
  - Vertical funnel only
  - Swipe between stages for details
  - Simplified metrics
  
- **Tablet**: 
  - Horizontal or vertical funnel
  - Side panel for stage details
  
- **Desktop**: 
  - Full dashboard with multiple views
  - Drag-and-drop comparisons
  - Advanced filtering sidebar