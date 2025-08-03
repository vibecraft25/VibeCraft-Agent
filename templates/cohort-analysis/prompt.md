## Visualization Type: Cohort Analysis

### Overview
Create a comprehensive cohort analysis visualization to track user retention, behavior patterns, and lifecycle metrics. Enable comparison across different cohorts defined by signup date, acquisition channel, or custom attributes.

### Required Components:

1. **CohortMatrix**: Main retention matrix visualization
   - **Display Format**:
     - Heatmap with color intensity for retention rates
     - Table format with percentage values
     - Customizable color scales
   - **Features**:
     - Interactive cells with detailed data
     - Row/column highlighting
     - Tooltips with user counts
     - Export to CSV/Excel
   - **Implementation**:
     ```jsx
     <div className="cohort-matrix">
       <div className="matrix-header">
         <div className="cohort-label">Cohort</div>
         {periods.map(period => (
           <div key={period} className="period-label">
             {formatPeriod(period)}
           </div>
         ))}
       </div>
       {cohorts.map(cohort => (
         <CohortRow
           key={cohort.id}
           cohort={cohort}
           retentionData={cohort.retention}
           onCellClick={(period) => handleCellClick(cohort, period)}
         />
       ))}
     </div>
     ```

2. **RetentionCurve**: Line chart showing retention over time
   - **Features**:
     - Multiple cohort comparison
     - Benchmark lines
     - Confidence intervals
     - Trend analysis
   - **Chart Configuration**:
     ```javascript
     const chartConfig = {
       xAxis: { 
         label: 'Days Since First Use',
         type: 'number'
       },
       yAxis: {
         label: 'Retention Rate (%)',
         domain: [0, 100]
       },
       lines: cohorts.map(cohort => ({
         data: cohort.retentionCurve,
         name: cohort.name,
         color: cohort.color
       }))
     };
     ```

3. **CohortSelector**: Cohort filtering and selection
   - **Options**:
     - Date range picker for time-based cohorts
     - Attribute-based grouping
     - Custom cohort definition
     - Saved cohort sets
   - **UI Elements**:
     ```jsx
     <div className="cohort-selector">
       <Select
         multiple
         value={selectedCohorts}
         onChange={handleCohortSelection}
         options={availableCohorts}
       />
       <DateRangePicker
         value={dateRange}
         onChange={handleDateRangeChange}
       />
       <Button onClick={createCustomCohort}>
         Create Custom Cohort
       </Button>
     </div>
     ```

4. **CohortDetails**: Deep dive into specific cohort
   - **Information**:
     - User count and composition
     - Key metrics (LTV, engagement, churn)
     - Behavioral patterns
     - User segments
   - **Visualizations**:
     - Metric distribution histograms
     - Activity heatmaps
     - User journey flows

5. **MetricComparison**: Compare metrics across cohorts
   - **Comparison Types**:
     - Side-by-side bar charts
     - Trend lines over time
     - Statistical significance testing
     - Relative performance indices

### Data Processing:

```javascript
const processCohortData = (db, cohortConfig) => {
  // Define cohort grouping
  let cohortDefinition;
  switch (cohortConfig.type) {
    case 'signup_date':
      cohortDefinition = `date({{signupDateColumn}}, 'start of ${cohortConfig.period}')`;
      break;
    case 'acquisition_channel':
      cohortDefinition = `{{channelColumn}}`;
      break;
    case 'custom':
      cohortDefinition = cohortConfig.customSQL;
      break;
  }
  
  // Calculate retention for each cohort
  const retentionQuery = `
    WITH user_cohorts AS (
      SELECT 
        {{userIdColumn}} as user_id,
        ${cohortDefinition} as cohort,
        MIN({{activityDateColumn}}) as first_activity
      FROM {{tableName}}
      GROUP BY {{userIdColumn}}, cohort
    ),
    user_activity AS (
      SELECT 
        uc.user_id,
        uc.cohort,
        uc.first_activity,
        {{activityDateColumn}} as activity_date,
        CAST((julianday({{activityDateColumn}}) - julianday(uc.first_activity)) / ${cohortConfig.periodDays} AS INTEGER) as period
      FROM {{tableName}} t
      JOIN user_cohorts uc ON t.{{userIdColumn}} = uc.user_id
    )
    SELECT 
      cohort,
      period,
      COUNT(DISTINCT user_id) as active_users,
      (SELECT COUNT(DISTINCT user_id) FROM user_cohorts WHERE cohort = ua.cohort) as cohort_size
    FROM user_activity ua
    WHERE period >= 0 AND period <= ${cohortConfig.maxPeriods}
    GROUP BY cohort, period
    ORDER BY cohort, period
  `;
  
  const results = db.exec(retentionQuery);
  return buildRetentionMatrix(results[0]?.values || []);
};

// Build retention matrix from query results
const buildRetentionMatrix = (queryResults) => {
  const matrix = {};
  const cohortSizes = {};
  
  queryResults.forEach(row => {
    const [cohort, period, activeUsers, cohortSize] = row;
    
    if (!matrix[cohort]) {
      matrix[cohort] = {};
      cohortSizes[cohort] = cohortSize;
    }
    
    matrix[cohort][period] = {
      users: activeUsers,
      rate: (activeUsers / cohortSize) * 100
    };
  });
  
  // Fill in missing periods with 0
  Object.keys(matrix).forEach(cohort => {
    for (let period = 0; period <= maxPeriods; period++) {
      if (!matrix[cohort][period]) {
        matrix[cohort][period] = { users: 0, rate: 0 };
      }
    }
  });
  
  return { matrix, cohortSizes };
};

// Calculate advanced metrics
const calculateCohortMetrics = (cohortData) => {
  const metrics = {};
  
  Object.entries(cohortData.matrix).forEach(([cohort, periods]) => {
    metrics[cohort] = {
      // Day 1, 7, 30 retention
      day1Retention: periods[1]?.rate || 0,
      day7Retention: periods[7]?.rate || 0,
      day30Retention: periods[30]?.rate || 0,
      
      // Average retention over periods
      avgRetention: calculateAverage(Object.values(periods).map(p => p.rate)),
      
      // Retention curve slope (decay rate)
      decayRate: calculateDecayRate(periods),
      
      // Projected lifetime
      projectedLifetime: calculateProjectedLifetime(periods)
    };
  });
  
  return metrics;
};
```

### Retention Matrix Rendering:

```javascript
// Heatmap cell rendering
const CohortCell = ({ cohort, period, data, maxRetention }) => {
  const intensity = data.rate / maxRetention;
  const backgroundColor = interpolateColor('#ffffff', '#2ecc71', intensity);
  
  return (
    <div
      className="cohort-cell"
      style={{ backgroundColor }}
      onClick={() => handleCellClick(cohort, period)}
      title={`${data.users.toLocaleString()} users (${data.rate.toFixed(1)}%)`}
    >
      <span className="retention-rate">{data.rate.toFixed(0)}%</span>
      <span className="user-count">{formatNumber(data.users)}</span>
    </div>
  );
};

// Retention curve rendering
const renderRetentionCurves = (cohorts) => {
  return (
    <LineChart width={800} height={400} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis 
        dataKey="period" 
        label={{ value: 'Days Since First Use', position: 'insideBottom', offset: -10 }}
      />
      <YAxis 
        label={{ value: 'Retention Rate (%)', angle: -90, position: 'insideLeft' }}
        domain={[0, 100]}
      />
      <Tooltip formatter={(value) => `${value.toFixed(1)}%`} />
      <Legend />
      {cohorts.map((cohort, index) => (
        <Line
          key={cohort.id}
          type="monotone"
          dataKey={cohort.id}
          data={cohort.curve}
          stroke={colors[index % colors.length]}
          strokeWidth={2}
          dot={false}
        />
      ))}
    </LineChart>
  );
};
```

### Advanced Analytics:

```javascript
// Calculate statistical significance between cohorts
const compareCohortsStatistically = (cohortA, cohortB, period) => {
  const dataA = cohortA.matrix[period];
  const dataB = cohortB.matrix[period];
  
  // Calculate z-score for proportion difference
  const p1 = dataA.rate / 100;
  const p2 = dataB.rate / 100;
  const n1 = cohortA.size;
  const n2 = cohortB.size;
  
  const pooledP = (dataA.users + dataB.users) / (n1 + n2);
  const se = Math.sqrt(pooledP * (1 - pooledP) * (1/n1 + 1/n2));
  const z = (p1 - p2) / se;
  const pValue = 2 * (1 - normalCDF(Math.abs(z)));
  
  return {
    difference: p1 - p2,
    percentChange: ((p2 - p1) / p1) * 100,
    zScore: z,
    pValue: pValue,
    significant: pValue < 0.05
  };
};

// Predict future retention using power law
const predictRetention = (cohortData, futurePeriods) => {
  // Fit power law: retention = a * period^b
  const periods = Object.keys(cohortData).map(Number).filter(p => p > 0);
  const retentions = periods.map(p => cohortData[p].rate);
  
  // Log transform for linear regression
  const logPeriods = periods.map(Math.log);
  const logRetentions = retentions.map(r => Math.log(r / 100));
  
  const regression = linearRegression(logPeriods, logRetentions);
  const a = Math.exp(regression.intercept);
  const b = regression.slope;
  
  // Generate predictions
  const predictions = [];
  for (let period = Math.max(...periods) + 1; period <= futurePeriods; period++) {
    predictions.push({
      period,
      predicted: a * Math.pow(period, b) * 100,
      confidence: calculateConfidenceInterval(regression, Math.log(period))
    });
  }
  
  return { predictions, model: { a, b, r2: regression.r2 } };
};

// Identify behavioral patterns
const analyzeBehaviorPatterns = (db, cohort) => {
  const query = `
    SELECT 
      {{actionColumn}} as action,
      {{periodColumn}} as period,
      COUNT(*) as action_count,
      COUNT(DISTINCT {{userIdColumn}}) as unique_users
    FROM {{tableName}}
    WHERE {{cohortColumn}} = ?
    GROUP BY {{actionColumn}}, {{periodColumn}}
    ORDER BY period, action_count DESC
  `;
  
  const results = db.exec(query, [cohort]);
  
  // Analyze action patterns over time
  const patterns = identifyPatterns(results[0]?.values || []);
  
  return {
    commonPaths: patterns.commonPaths,
    criticalActions: patterns.criticalActions,
    churnIndicators: patterns.churnIndicators
  };
};
```

### Interactive Features:

```javascript
// Cohort comparison mode
const enableComparisonMode = (cohorts) => {
  setComparisonMode(true);
  setSelectedCohorts(cohorts);
  
  // Calculate relative performance
  const baseline = cohorts[0];
  const comparisons = cohorts.slice(1).map(cohort => ({
    cohort: cohort,
    relativeRetention: calculateRelativeRetention(baseline, cohort),
    significantDifferences: findSignificantDifferences(baseline, cohort)
  }));
  
  setComparisonData(comparisons);
};

// Drill-down into specific cohort-period cell
const drillDownCell = async (cohort, period) => {
  const query = `
    SELECT 
      {{userIdColumn}} as user_id,
      {{attributeColumns}},
      COUNT(*) as activity_count,
      MAX({{activityDateColumn}}) as last_activity
    FROM {{tableName}}
    WHERE {{cohortColumn}} = ?
      AND {{periodColumn}} = ?
    GROUP BY {{userIdColumn}}
    LIMIT 1000
  `;
  
  const users = await db.exec(query, [cohort, period]);
  
  showUserListModal({
    title: `${cohort} - Period ${period} Users`,
    users: users[0]?.values || [],
    actions: ['Export', 'Create Segment', 'Send Campaign']
  });
};
```

### Export and Reporting:

```javascript
// Generate cohort analysis report
const generateCohortReport = () => {
  const report = {
    summary: {
      totalCohorts: cohorts.length,
      averageDay30Retention: calculateAverage(cohorts.map(c => c.metrics.day30Retention)),
      bestPerformingCohort: findBestCohort(cohorts),
      trends: identifyTrends(cohorts)
    },
    cohortDetails: cohorts.map(cohort => ({
      name: cohort.name,
      size: cohort.size,
      metrics: cohort.metrics,
      retentionCurve: cohort.curve,
      predictions: cohort.predictions
    })),
    insights: generateCohortInsights(cohorts),
    recommendations: generateRecommendations(cohorts)
  };
  
  return report;
};

// Export retention matrix to Excel
const exportToExcel = () => {
  const workbook = XLSX.utils.book_new();
  
  // Retention matrix sheet
  const matrixData = cohorts.map(cohort => ({
    Cohort: cohort.name,
    Size: cohort.size,
    ...Object.fromEntries(
      periods.map(p => [`Day ${p}`, cohort.matrix[p]?.rate.toFixed(1) + '%'])
    )
  }));
  
  const matrixSheet = XLSX.utils.json_to_sheet(matrixData);
  XLSX.utils.book_append_sheet(workbook, matrixSheet, 'Retention Matrix');
  
  // Metrics sheet
  const metricsSheet = XLSX.utils.json_to_sheet(
    cohorts.map(c => ({ Cohort: c.name, ...c.metrics }))
  );
  XLSX.utils.book_append_sheet(workbook, metricsSheet, 'Metrics');
  
  XLSX.writeFile(workbook, 'cohort-analysis.xlsx');
};
```

### Responsive Design:

- **Mobile**: 
  - Scrollable matrix with fixed cohort column
  - Simplified view with key periods only
  - Swipe between cohorts for details
  
- **Tablet**: 
  - Condensed matrix view
  - Collapsible sections
  - Touch-optimized interactions
  
- **Desktop**: 
  - Full matrix with all periods
  - Side-by-side comparisons
  - Advanced filtering sidebar