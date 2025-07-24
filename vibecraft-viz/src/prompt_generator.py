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
        """GEMINI.md를 활용한 간결한 프롬프트 생성"""
        output_dir = output_path if output_path else "output/"
        
        # 템플릿별 GEMINI.md 경로 명시
        template_path = os.path.join(self.template_dir, "dashboards", template, "GEMINI.md")
        template_hint = ""
        if os.path.exists(template_path):
            template_hint = f"\n\nIMPORTANT: Use the {template} template guidelines from: {template_path}"
        
        # GEMINI.md가 있으므로 간결한 프롬프트만 생성
        prompt = f"""Create a {template} dashboard for the following request:

"{user_request}"

Database Information:
- Table: {data_info['table_name']}
- Columns: {', '.join(data_info['columns'])}
- Row Count: {data_info['row_count']}

Output Directory: {output_dir}{template_hint}

CRITICAL REQUIREMENTS:
1. Use the write_file tool to create all necessary files
2. FIRST query the database to find the actual date range:
   SELECT MIN(date) as min_date, MAX(date) as max_date FROM {data_info['table_name']}
3. Initialize the date picker with the ACTUAL data range, not arbitrary dates
4. Apply date filters in SQL queries when the user changes the date range
5. Handle date format conversions properly between SQL strings and JavaScript Date objects
6. Include ALL necessary dependencies in package.json (date-fns, recharts, etc.)

Generate actual files in the output directory for a complete React application."""
        
        return prompt
    
    # 아래 메서드들은 GEMINI.md를 사용하므로 더 이상 필요하지 않음
    # 하지만 호환성을 위해 유지
    def _get_template_info(self, template: str) -> Dict[str, Any]:
        """템플릿별 정보 반환 (레거시 호환성)"""
        return {'name': template, 'features': [], 'layout': '', 'interactive_features': []}
    
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
            f"-- 전체 데이터 조회\nSELECT * FROM {table_name} LIMIT 1000;",
            f"\n-- 행 수 조회\nSELECT COUNT(*) as total_count FROM {table_name};"
        ]
        
        # 템플릿별 추가 쿼리
        if template == 'time-series' and data_info.get('date_columns'):
            date_col = data_info['date_columns'][0]
            queries.append(f"""
-- 기간별 데이터 조회
SELECT * FROM {table_name} 
WHERE {date_col} >= ? AND {date_col} <= ?
ORDER BY {date_col};

-- 일별 집계
SELECT 
  DATE({date_col}) as date,
  COUNT(*) as count,
  AVG(value) as avg_value
FROM {table_name}
GROUP BY DATE({date_col})
ORDER BY date;""")
        
        elif template == 'kpi-dashboard':
            queries.append(f"""
-- KPI 메트릭 계산
SELECT 
  COUNT(*) as total_records,
  AVG(value) as avg_value,
  MAX(value) as max_value,
  MIN(value) as min_value
FROM {table_name};

-- 카테고리별 집계
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