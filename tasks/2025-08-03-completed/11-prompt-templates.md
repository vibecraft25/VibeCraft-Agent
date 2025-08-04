# Task 11: 프롬프트 템플릿 작성

## 목표
각 시각화 타입별 프롬프트 템플릿을 Markdown 형식으로 작성합니다.

## 작업 내용

### 11.1 템플릿 디렉토리 구조
```
templates/
├── time-series/
│   ├── prompt.md         # 시계열 분석 프롬프트
│   └── meta.json        # 메타데이터
├── geo-spatial/
│   ├── prompt.md         # 지리공간 시각화 프롬프트
│   └── meta.json        # 메타데이터
├── gantt-chart/
│   ├── prompt.md         # 간트차트 프롬프트
│   └── meta.json        # 메타데이터
├── kpi-dashboard/
│   ├── prompt.md         # KPI 대시보드 프롬프트
│   └── meta.json        # 메타데이터
├── comparison/
│   ├── prompt.md         # 비교 분석 프롬프트
│   └── meta.json        # 메타데이터
├── funnel-analysis/
│   ├── prompt.md         # 퍼널 분석 프롬프트
│   └── meta.json        # 메타데이터
├── cohort-analysis/
│   ├── prompt.md         # 코호트 분석 프롬프트
│   └── meta.json        # 메타데이터
├── heatmap/
│   ├── prompt.md         # 히트맵 프롬프트
│   └── meta.json        # 메타데이터
├── network-graph/
│   ├── prompt.md         # 네트워크 그래프 프롬프트
│   └── meta.json        # 메타데이터
└── custom/
    ├── prompt.md         # 커스텀 시각화 프롬프트
    └── meta.json        # 메타데이터
```

### 11.2 시계열 분석 템플릿

#### templates/time-series/meta.json
```json
{
  "type": "time-series",
  "name": "Time Series Analysis",
  "description": "시계열 데이터 분석 및 트렌드 시각화",
  "requiredLibraries": ["recharts", "date-fns"],
  "systemPrompt": "Create a time series visualization dashboard with date range selection, multiple metrics, and trend analysis capabilities.",
  "componentStructure": {
    "mainComponents": [
      {
        "name": "TimeSeriesChart",
        "description": "Interactive time series line/area chart",
        "props": [
          { "name": "data", "type": "TimeSeriesData[]" },
          { "name": "dateRange", "type": "DateRange" },
          { "name": "metrics", "type": "string[]" },
          { "name": "onRangeChange", "type": "(range: DateRange) => void" }
        ],
        "features": ["zoom", "pan", "export", "annotations"]
      },
      {
        "name": "DateRangePicker",
        "description": "Date range selection component",
        "props": [
          { "name": "value", "type": "DateRange" },
          { "name": "onChange", "type": "(range: DateRange) => void" },
          { "name": "presets", "type": "PresetRange[]" }
        ],
        "features": ["presets", "calendar", "validation"]
      }
    ],
    "supportingComponents": [
      {
        "name": "MetricSelector",
        "description": "Multi-select for metrics",
        "props": [],
        "features": []
      },
      {
        "name": "TrendIndicator",
        "description": "Trend visualization",
        "props": [],
        "features": []
      }
    ],
    "hooks": [
      {
        "name": "useTimeSeriesData",
        "description": "Hook for fetching and processing time series data"
      }
    ],
    "utils": [
      {
        "name": "dateUtils",
        "description": "Date formatting and manipulation utilities"
      }
    ]
  },
  "dataProcessingPatterns": [
    {
      "name": "Basic Time Series Query",
      "sqlTemplate": "SELECT date({{timeColumn}}) as date, {{metrics}} FROM {{table}} WHERE date({{timeColumn}}) BETWEEN ? AND ?",
      "dataTransformation": "results.map(row => ({ date: new Date(row.date), ...row }))"
    },
    {
      "name": "Aggregated Time Series",
      "sqlTemplate": "SELECT strftime('%Y-%m', {{timeColumn}}) as month, SUM({{metric}}) as total FROM {{table}} GROUP BY month",
      "dataTransformation": "results.map(row => ({ month: row.month, total: row.total }))"
    }
  ]
}
```

#### templates/time-series/prompt.md
```markdown
## Visualization Type: Time Series Analysis

### Required Components:

1. **TimeSeriesChart**: Main line/area chart component
   - Props: data, dateRange, metrics, onRangeChange
   - Features: Zoom, pan, tooltip, export
   - Support multiple Y-axes for different scales
   - Include moving average lines

2. **DateRangePicker**: Time period selector
   - Presets: Last 7 days, 30 days, 90 days, 1 year, custom
   - Props: value, onChange, presets
   - Calendar interface for custom selection

3. **MetricSelector**: Choose which metrics to display
   - Multi-select capability
   - Props: available, selected, onChange
   - Group metrics by category if applicable

4. **TrendIndicator**: Show trend direction and percentage
   - Props: current, previous, format
   - Color coding: green for up, red for down

5. **DataTable**: Tabular view of time series data
   - Sortable columns
   - Export to CSV functionality

### Data Processing:
```javascript
const processTimeSeriesData = (db, dateRange, metrics) => {
  const query = `
    SELECT 
      date({{timeColumn}}) as date,
      {{metricColumns}}
    FROM {{tableName}}
    WHERE date({{timeColumn}}) BETWEEN ? AND ?
    GROUP BY date({{timeColumn}})
    ORDER BY date({{timeColumn}})
  `;
  
  const stmt = db.prepare(query);
  stmt.bind([dateRange.start, dateRange.end]);
  
  const results = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  
  return results;
};
```

### Chart Configuration:
- Use Recharts LineChart for time series
- Enable area fill for better visualization
- Add reference lines for averages
- Implement brush for zoom functionality
- Support for annotations on specific dates

### Responsive Design:
- Mobile: Stack components vertically
- Tablet: 2-column layout
- Desktop: Full dashboard layout

### Performance Considerations:
- Implement data aggregation for large datasets
- Use React.memo for chart components
- Virtualize data table for many rows
```

### 11.3 지리공간 시각화 템플릿

#### templates/geo-spatial/meta.json
```json
{
  "type": "geo-spatial",
  "name": "Geo-Spatial Visualization",
  "description": "지리적 데이터 매핑 및 위치 기반 분석",
  "requiredLibraries": ["react-leaflet", "leaflet", "d3-geo"],
  "systemPrompt": "Create a geo-spatial visualization with interactive maps, heatmaps, and location-based analytics.",
  "componentStructure": {
    "mainComponents": [
      {
        "name": "InteractiveMap",
        "description": "React Leaflet based map component",
        "props": [
          { "name": "center", "type": "[number, number]" },
          { "name": "zoom", "type": "number" },
          { "name": "markers", "type": "MapMarker[]" },
          { "name": "onMarkerClick", "type": "(marker: MapMarker) => void" }
        ],
        "features": ["clustering", "heatmap", "layers", "export"]
      }
    ],
    "supportingComponents": [],
    "hooks": [],
    "utils": []
  },
  "dataProcessingPatterns": [
    {
      "name": "Location Query",
      "sqlTemplate": "SELECT {{lat}}, {{lng}}, {{name}}, {{metrics}} FROM {{table}} WHERE {{lat}} IS NOT NULL",
      "dataTransformation": "results.map(row => ({ position: [row.lat, row.lng], ...row }))"
    }
  ]
}
```

#### templates/geo-spatial/prompt.md
```markdown
## Visualization Type: Geo-Spatial Analysis

### Required Components:

1. **InteractiveMap**: Main map component using React Leaflet
   - Props: center, zoom, markers, onMarkerClick
   - Features: Clustering, heatmap overlay, custom markers
   - Support multiple base layers (street, satellite, terrain)

2. **LocationSearch**: Search and filter locations
   - Autocomplete functionality
   - Geographic bounds filtering
   - Category-based filtering

3. **MapControls**: Map interaction controls
   - Zoom controls
   - Layer selection
   - Fullscreen toggle
   - Export map as image

4. **LocationDetails**: Popup/sidebar for location information
   - Display detailed metrics
   - Charts for location-specific data
   - Comparison with nearby locations

5. **HeatmapLayer**: Density visualization
   - Configurable radius and intensity
   - Color gradient customization

### Data Processing:
```javascript
const processGeoData = (db) => {
  const query = `
    SELECT 
      {{latColumn}} as lat,
      {{lngColumn}} as lng,
      {{nameColumn}} as name,
      {{metricColumns}}
    FROM {{tableName}}
    WHERE {{latColumn}} IS NOT NULL 
      AND {{lngColumn}} IS NOT NULL
  `;
  
  const results = db.exec(query);
  return results[0].values.map(row => ({
    position: [row[0], row[1]],
    name: row[2],
    metrics: { /* mapped metrics */ }
  }));
};
```

### Map Configuration:
- Default center based on data bounds
- Appropriate zoom level for data density
- Custom marker icons based on data attributes
- Popup templates with data visualization

### Performance Optimization:
- Marker clustering for large datasets
- Lazy loading of detailed data
- Viewport-based data filtering
- Canvas rendering for many points
```

### 11.4 간트차트 템플릿

#### templates/gantt-chart/meta.json
```json
{
  "type": "gantt-chart",
  "name": "Gantt Chart",
  "description": "프로젝트 일정 및 작업 진행 상황 시각화",
  "requiredLibraries": ["@nivo/calendar", "date-fns"],
  "systemPrompt": "Create a Gantt chart for project management with task dependencies, resource allocation, and progress tracking.",
  "componentStructure": {
    "mainComponents": [
      {
        "name": "GanttChart",
        "description": "Interactive Gantt chart with task bars",
        "props": [
          { "name": "tasks", "type": "Task[]" },
          { "name": "startDate", "type": "Date" },
          { "name": "endDate", "type": "Date" },
          { "name": "onTaskClick", "type": "(task: Task) => void" }
        ],
        "features": ["drag-drop", "dependencies", "zoom", "export"]
      }
    ],
    "supportingComponents": [],
    "hooks": [],
    "utils": []
  },
  "dataProcessingPatterns": [
    {
      "name": "Task Hierarchy Query",
      "sqlTemplate": "SELECT * FROM {{table}} ORDER BY {{parentId}}, {{startDate}}",
      "dataTransformation": "buildTaskTree(results)"
    }
  ]
}
```

#### templates/gantt-chart/prompt.md
```markdown
## Visualization Type: Gantt Chart

### Required Components:

1. **GanttChart**: Main Gantt chart component
   - Props: tasks, startDate, endDate, onTaskClick
   - Features: Drag-and-drop, dependencies, milestones
   - Support for task grouping and hierarchy

2. **TaskList**: Hierarchical task list
   - Expandable/collapsible groups
   - Inline editing capabilities
   - Progress indicators

3. **ResourceView**: Resource allocation view
   - Resource utilization charts
   - Conflict detection
   - Load balancing suggestions

4. **Timeline**: Time scale component
   - Multiple zoom levels (days, weeks, months)
   - Today marker
   - Weekend/holiday highlighting

5. **TaskDetails**: Task information panel
   - Edit task properties
   - Dependency management
   - Progress updates

### Data Processing:
```javascript
const processGanttData = (db) => {
  const query = `
    SELECT 
      {{idColumn}} as id,
      {{nameColumn}} as name,
      {{startDateColumn}} as startDate,
      {{endDateColumn}} as endDate,
      {{progressColumn}} as progress,
      {{parentIdColumn}} as parentId,
      {{assigneeColumn}} as assignee
    FROM {{tableName}}
    ORDER BY {{startDateColumn}}
  `;
  
  const results = db.exec(query);
  return buildTaskHierarchy(results[0].values);
};
```

### Gantt Features:
- Task dependencies with different types (FS, FF, SF, SS)
- Critical path highlighting
- Resource allocation visualization
- Progress tracking with actual vs planned
- Milestone markers
- Export to PDF/PNG
```

### 11.5 KPI 대시보드 템플릿

#### templates/kpi-dashboard/meta.json
```json
{
  "type": "kpi-dashboard",
  "name": "KPI Dashboard",
  "description": "핵심 성과 지표 대시보드",
  "requiredLibraries": ["recharts", "@nivo/core"],
  "systemPrompt": "Create a KPI dashboard with metric cards, gauges, and comparative visualizations for business metrics.",
  "componentStructure": {
    "mainComponents": [
      {
        "name": "KPICard",
        "description": "Individual KPI metric card",
        "props": [
          { "name": "title", "type": "string" },
          { "name": "value", "type": "number" },
          { "name": "target", "type": "number" },
          { "name": "trend", "type": "TrendData" }
        ],
        "features": ["animation", "sparkline", "alerts"]
      }
    ],
    "supportingComponents": [],
    "hooks": [],
    "utils": []
  },
  "dataProcessingPatterns": [
    {
      "name": "KPI Calculation",
      "sqlTemplate": "SELECT SUM({{metric}}) as value, COUNT(*) as count FROM {{table}} WHERE {{conditions}}",
      "dataTransformation": "({ value: result.value, count: result.count, trend: calculateTrend() })"
    }
  ]
}
```

#### templates/kpi-dashboard/prompt.md
```markdown
## Visualization Type: KPI Dashboard

### Required Components:

1. **KPICard**: Individual KPI display card
   - Props: title, value, target, trend, sparkline
   - Features: Animated counters, trend arrows, mini charts
   - Color coding based on performance

2. **GaugeChart**: Circular gauge for percentage metrics
   - Props: value, min, max, thresholds
   - Features: Animated transitions, color zones

3. **ComparisonChart**: Compare actual vs target
   - Bar charts with target lines
   - Variance highlighting
   - Period-over-period comparison

4. **MetricGrid**: Responsive grid layout for KPIs
   - Auto-layout based on screen size
   - Drag-and-drop rearrangement
   - Customizable card sizes

5. **PeriodSelector**: Time period selection
   - Predefined periods
   - Custom date ranges
   - Comparison period selection

### Data Processing:
```javascript
const calculateKPIs = (db, period) => {
  const kpis = {};
  
  // Revenue KPI
  const revenueQuery = `
    SELECT 
      SUM({{amountColumn}}) as current,
      (SELECT SUM({{amountColumn}}) FROM {{table}} 
       WHERE date({{dateColumn}}) BETWEEN ? AND ?) as previous
    FROM {{table}}
    WHERE date({{dateColumn}}) BETWEEN ? AND ?
  `;
  
  const result = db.exec(revenueQuery, [...period.previous, ...period.current]);
  kpis.revenue = processKPIResult(result);
  
  return kpis;
};
```

### KPI Features:
- Real-time updates with animations
- Drill-down capabilities
- Alert thresholds
- Export reports
- Mobile-responsive cards
```

### 11.6 템플릿 구조 인터페이스
```typescript
// templates/template-structure.ts
export interface VisualizationTemplate {
  // 메타데이터 (meta.json)
  type: VisualizationType;
  name: string;
  description: string;
  requiredLibraries: string[];
  systemPrompt?: string;
  componentStructure: {
    mainComponents: ComponentSpec[];
    supportingComponents: ComponentSpec[];
    hooks: HookSpec[];
    utils: UtilSpec[];
  };
  dataProcessingPatterns: DataPattern[];
  
  // 프롬프트 내용 (prompt.md에서 로드)
  typeSpecificPrompt: string;
}
```

### 11.7 나머지 시각화 타입 템플릿 구조

각 시각화 타입은 동일한 구조를 따릅니다:
- `{type}/meta.json`: 메타데이터 및 구조 정보
- `{type}/prompt.md`: 실제 프롬프트 내용

**구현해야 할 나머지 타입들:**
- comparison: 데이터 비교 분석
- funnel-analysis: 퍼널 분석
- cohort-analysis: 코호트 분석
- heatmap: 히트맵 시각화
- network-graph: 네트워크 그래프
- custom: 사용자 정의 시각화

## 완료 기준
- [ ] 시계열 분석 템플릿 작성 (meta.json + prompt.md)
- [ ] 지리공간 시각화 템플릿 작성
- [ ] 간트차트 템플릿 작성
- [ ] KPI 대시보드 템플릿 작성
- [ ] 기타 시각화 타입 템플릿 작성
- [ ] 템플릿 검증 로직 구현