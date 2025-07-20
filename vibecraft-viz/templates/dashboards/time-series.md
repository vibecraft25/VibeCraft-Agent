# 시계열 분석 대시보드 템플릿

## 템플릿 설명
시간에 따른 데이터 변화를 분석하고 트렌드를 파악하기 위한 대시보드

## 필수 데이터 필드
- timestamp/date: 시간 정보를 담은 필드
- value: 측정값을 담은 필드
- category (선택): 데이터 분류 기준

## 주요 컴포넌트
1. DateRangePicker: 분석 기간 선택
2. LineChart/AreaChart: 시계열 데이터 시각화
3. SummaryStats: 기간별 통계 요약
4. TrendIndicator: 증감 추세 표시
5. ChartTypeSelector: 차트 타입 전환

## 레이아웃 구조
```
+---------------------------+
|    Date Range Picker      |
+---------------------------+
|                           |
|     Main Time Chart       |
|      (2 col span)         |
|                           |
+-------------+-------------+
| Summary     | Trend       |
| Statistics  | Analysis    |
+-------------+-------------+
```

## SQL 쿼리 패턴
```sql
-- 기간별 데이터 조회
SELECT 
  date_column,
  value_column,
  category_column
FROM data_table
WHERE date_column BETWEEN ? AND ?
ORDER BY date_column;

-- 일별/월별 집계
SELECT 
  DATE(date_column) as period,
  AVG(value_column) as avg_value,
  SUM(value_column) as total_value,
  COUNT(*) as count
FROM data_table
GROUP BY DATE(date_column)
ORDER BY period;

-- 트렌드 분석
SELECT 
  date_column,
  value_column,
  LAG(value_column) OVER (ORDER BY date_column) as prev_value,
  (value_column - LAG(value_column) OVER (ORDER BY date_column)) / 
   LAG(value_column) OVER (ORDER BY date_column) * 100 as change_percent
FROM data_table
ORDER BY date_column;
```

## 상호작용 기능
- 날짜 범위 선택기
- 차트 확대/축소 (zoom)
- 데이터 포인트 호버 툴팁
- 범례 클릭으로 시리즈 토글
- CSV/JSON 데이터 내보내기

## 특화 기능
- 이동 평균선 표시
- 추세선 (선형 회귀)
- 계절성 분석
- 이상치 감지 및 표시