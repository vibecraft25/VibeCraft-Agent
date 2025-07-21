"""
프롬프트 생성 모듈
템플릿 기반 원샷 프롬프트 생성
"""

import os
import json
from typing import Dict, Any, List
from datetime import datetime
from pathlib import Path


class PromptGenerator:
    def __init__(self, template_dir: str = None):
        if template_dir:
            self.template_dir = template_dir
        else:
            # 기본 템플릿 디렉토리 설정
            self.template_dir = os.path.join(
                os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                "templates"
            )
    
    def generate(self, user_request: str, template: str, data_info: Dict[str, Any], output_path: str = None) -> str:
        """요구사항에 따라 React 앱 생성 프롬프트 생성"""
        # 템플릿별 특화 정보 가져오기
        template_info = self._get_template_info(template)
        
        # 필요한 라이브러리 결정
        libraries = self._get_required_libraries(template)
        
        # SQL 쿼리 예시 생성
        sql_queries = self._generate_sql_queries(template, data_info)
        
        # 컴포넌트 구조 생성
        component_structure = self._generate_component_structure(template)
        
        # 프롬프트 조합
        output_dir = output_path if output_path else "output/"
        prompt = f"""다음 요구사항에 따라 완전한 React 데이터 시각화 애플리케이션을 생성해주세요:

## 사용자 요청
{user_request}

## 중요: 파일 생성 경로
모든 파일은 반드시 다음 경로에 생성하세요:
{output_dir}

## 프로젝트 구조
Create a complete React application with the following structure in {output_dir}:
- {output_dir}/package.json (with all dependencies)
- {output_dir}/src/App.js (main component)
- {output_dir}/src/components/ (visualization components)
- {output_dir}/src/utils/ (data processing utilities)
- {output_dir}/public/data.sqlite (copy from project root)

## 기술 스택
- React 18.x
- {libraries['chart_library']} for visualizations
- sql.js for SQLite in browser
- Tailwind CSS for styling
{self._format_additional_libraries(libraries['additional'])}

## 데이터 정보
- File: data.sqlite (already in project root)
- Table: {data_info['table_name']}
- Columns: {', '.join(data_info['columns'])}
- Rows: {data_info['row_count']}
{self._format_schema_info(data_info['schema'])}
{self._format_date_columns(data_info.get('date_columns', []))}

## 시각화 요구사항
- Dashboard Type: {template_info['name']}
- Goal: {user_request}
- Required Features:
{self._format_features(template_info['features'])}

## 컴포넌트 구조
{component_structure}

## SQL 쿼리 예시
{sql_queries}

## 레이아웃
{template_info['layout']}

## 상호작용 기능
{self._format_interactive_features(template_info['interactive_features'])}

## 코드 생성 규칙
1. 전체 파일 내용을 코드 블록으로 출력 (파일 경로와 함께)
2. 즉시 실행 가능해야 함 (npm install && npm start)
3. SQLite 파일은 public/data.sqlite로 참조
4. 에러 처리와 로딩 상태 구현
5. 반응형 디자인 적용
6. 주석으로 주요 로직 설명

## 파일 출력 형식
파일 작성 도구를 사용할 수 없는 경우, 각 파일의 전체 내용을 다음 형식으로 출력하세요:

**File:** `{output_dir}/filename.ext`
```언어
파일 전체 내용...
```

## 추가 요구사항
- sql.js는 CDN이 아닌 npm 패키지로 설치하여 사용
- 데이터베이스 연결 시 절대 경로가 아닌 상대 경로 사용
- 브라우저에서 SQLite 파일을 fetch로 로드하여 sql.js로 실행
- 모든 차트는 반응형으로 구현 (window resize 대응)

## 중요 참고사항
- 파일 작성 도구가 없어도 각 파일의 전체 내용을 위 형식으로 출력하세요
- 모든 파일을 순서대로 출력하세요 (package.json부터 시작)
- 각 파일은 즉시 실행 가능해야 합니다
- 다음 파일들을 반드시 포함하세요:
  1. {output_dir}/package.json
  2. {output_dir}/public/index.html
  3. {output_dir}/src/index.js
  4. {output_dir}/src/index.css
  5. {output_dir}/src/App.js
  6. {output_dir}/src/components/* (필요한 모든 컴포넌트)
  7. {output_dir}/src/utils/* (필요한 모든 유틸리티)

지금 바로 전체 React 애플리케이션 코드를 생성해주세요."""
        
        return prompt
    
    def _get_template_info(self, template: str) -> Dict[str, Any]:
        """템플릿별 정보 반환"""
        templates = {
            'time-series': {
                'name': '시계열 분석 대시보드',
                'features': [
                    'date-range-picker',
                    'zoom functionality',
                    'data export (CSV/JSON)',
                    'multiple chart types (line, bar, area)',
                    'trend analysis'
                ],
                'layout': '2x2 그리드 레이아웃 (메인 차트가 상단 전체 너비 차지)',
                'interactive_features': [
                    'Date range selection',
                    'Chart type switching',
                    'Data point hover tooltips',
                    'Legend toggle'
                ]
            },
            'kpi-dashboard': {
                'name': 'KPI 대시보드',
                'features': [
                    'metric cards with trends',
                    'gauge charts',
                    'progress bars',
                    'comparison with targets',
                    'period-over-period analysis'
                ],
                'layout': '3열 그리드 (상단에 KPI 카드, 하단에 차트)',
                'interactive_features': [
                    'Period selection',
                    'Metric drill-down',
                    'Target adjustment',
                    'Alert thresholds'
                ]
            },
            'comparison': {
                'name': '비교 분석 대시보드',
                'features': [
                    'side-by-side comparisons',
                    'grouped bar charts',
                    'radar charts',
                    'difference highlighting',
                    'statistical summaries'
                ],
                'layout': '2열 분할 뷰 (비교 대상별)',
                'interactive_features': [
                    'Comparison item selection',
                    'Metric selection',
                    'Normalization toggle',
                    'Export comparisons'
                ]
            },
            'geo-spatial': {
                'name': 'GIS 기반 지도 대시보드',
                'features': [
                    'interactive map',
                    'heatmap layer',
                    'marker clustering',
                    'region statistics',
                    'location search'
                ],
                'layout': '전체 화면 지도 + 오버레이 패널',
                'interactive_features': [
                    'Map pan and zoom',
                    'Marker clicks',
                    'Layer toggles',
                    'Region selection'
                ]
            }
        }
        
        return templates.get(template, templates['time-series'])
    
    def _get_required_libraries(self, template: str) -> Dict[str, Any]:
        """템플릿별 필요 라이브러리"""
        base_libs = {
            'chart_library': 'Recharts',
            'additional': []
        }
        
        template_specific = {
            'geo-spatial': {
                'chart_library': 'Leaflet with React-Leaflet',
                'additional': ['leaflet@^1.9.4', 'react-leaflet@^4.2.1']
            },
            'gantt-chart': {
                'chart_library': 'Frappe Gantt',
                'additional': ['frappe-gantt@^0.6.1', 'react-frappe-gantt@^2.0.0']
            },
            'network-graph': {
                'chart_library': 'vis-network',
                'additional': ['vis-network@^9.1.0', 'vis-data@^7.1.0']
            }
        }
        
        if template in template_specific:
            return template_specific[template]
        return base_libs
    
    def _generate_sql_queries(self, template: str, data_info: Dict[str, Any]) -> str:
        """템플릿별 SQL 쿼리 예시 생성"""
        table_name = data_info['table_name']
        columns = data_info['columns']
        
        # 기본 쿼리
        queries = [
            f"// 전체 데이터 조회\nSELECT * FROM {table_name} LIMIT 1000;",
            f"\n// 행 수 조회\nSELECT COUNT(*) as total_count FROM {table_name};"
        ]
        
        # 템플릿별 추가 쿼리
        if template == 'time-series' and data_info.get('date_columns'):
            date_col = data_info['date_columns'][0]
            queries.append(f"""
// 기간별 데이터 조회
SELECT * FROM {table_name} 
WHERE {date_col} >= ? AND {date_col} <= ?
ORDER BY {date_col};

// 일별 집계
SELECT 
  DATE({date_col}) as date,
  COUNT(*) as count,
  AVG(value) as avg_value
FROM {table_name}
GROUP BY DATE({date_col})
ORDER BY date;""")
        
        elif template == 'kpi-dashboard':
            queries.append(f"""
// KPI 메트릭 계산
SELECT 
  COUNT(*) as total_records,
  AVG(value) as avg_value,
  MAX(value) as max_value,
  MIN(value) as min_value
FROM {table_name};

// 카테고리별 집계
SELECT 
  category,
  COUNT(*) as count,
  SUM(value) as total_value
FROM {table_name}
GROUP BY category;""")
        
        return '\n'.join(queries)
    
    def _generate_component_structure(self, template: str) -> str:
        """템플릿별 컴포넌트 구조 생성"""
        structures = {
            'time-series': """<TimeSeriesDashboard>
  <DateRangePicker onChange={handleDateChange} />
  <ChartTypeSelector options={['line', 'bar', 'area']} />
  <MainChart data={filteredData} type={chartType} />
  <SummaryStats data={filteredData} />
  <TrendIndicator data={trendData} />
</TimeSeriesDashboard>""",
            
            'kpi-dashboard': """<KPIDashboard>
  <MetricCard title="Total Sales" value={totalSales} trend={salesTrend} />
  <MetricCard title="Avg Order Value" value={avgOrderValue} trend={aovTrend} />
  <MetricCard title="Conversion Rate" value={conversionRate} trend={convTrend} />
  <GaugeChart title="Target Achievement" value={achievement} target={100} />
  <BarChart data={categoryData} />
</KPIDashboard>""",
            
            'comparison': """<ComparisonDashboard>
  <ComparisonSelector items={items} onChange={handleSelectionChange} />
  <SideBySideChart leftData={item1Data} rightData={item2Data} />
  <DifferenceChart differences={calculateDifferences()} />
  <StatisticalSummary data={[item1Data, item2Data]} />
</ComparisonDashboard>"""
        }
        
        return structures.get(template, structures['time-series'])
    
    def _format_additional_libraries(self, libraries: List[str]) -> str:
        """추가 라이브러리 포맷팅"""
        if not libraries:
            return ""
        return "\n- " + "\n- ".join(libraries)
    
    def _format_schema_info(self, schema: Dict[str, str]) -> str:
        """스키마 정보 포맷팅"""
        if not schema:
            return ""
        
        schema_lines = []
        for col, dtype in schema.items():
            schema_lines.append(f"  - {col}: {dtype}")
        
        return "- Schema:\n" + "\n".join(schema_lines)
    
    def _format_date_columns(self, date_columns: List[str]) -> str:
        """날짜 컬럼 정보 포맷팅"""
        if not date_columns:
            return ""
        
        return f"- Date columns: {', '.join(date_columns)}"
    
    def _format_features(self, features: List[str]) -> str:
        """기능 목록 포맷팅"""
        return "\n".join(f"  - {feature}" for feature in features)
    
    def _format_interactive_features(self, features: List[str]) -> str:
        """상호작용 기능 포맷팅"""
        return "\n".join(f"- {feature}" for feature in features)