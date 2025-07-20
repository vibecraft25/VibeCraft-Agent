# 비교 분석 대시보드 템플릿

## 템플릿 설명
여러 항목, 기간, 카테고리 간의 비교 분석을 위한 대시보드

## 필수 데이터 필드
- item_name: 비교 대상 항목
- metric_value: 비교할 측정값
- category: 분류 기준
- period: 시간 기준 (선택)
- attributes: 추가 속성들

## 주요 컴포넌트
1. ComparisonSelector: 비교 대상 선택기
2. GroupedBarChart: 그룹별 막대 차트
3. RadarChart: 다차원 비교 레이더 차트
4. DifferenceTable: 차이점 표시 테이블
5. StatisticalSummary: 통계 요약

## 레이아웃 구조
```
+---------------------------+
|   Comparison Selector     |
+---------------------------+
|            |              |
|  Grouped   |   Radar      |
|  Bar Chart |   Chart      |
|            |              |
+------------+--------------+
|                           |
|    Difference Table       |
|                           |
+---------------------------+
| Statistical Summary       |
+---------------------------+
```

## SQL 쿼리 패턴
```sql
-- 항목별 비교 데이터
SELECT 
  item_name,
  category,
  metric_value,
  RANK() OVER (PARTITION BY category ORDER BY metric_value DESC) as rank
FROM data_table
WHERE item_name IN (?)
ORDER BY category, item_name;

-- 차이점 분석
SELECT 
  a.category,
  a.metric_value as item1_value,
  b.metric_value as item2_value,
  (a.metric_value - b.metric_value) as difference,
  ((a.metric_value - b.metric_value) / b.metric_value * 100) as percent_diff
FROM data_table a
JOIN data_table b ON a.category = b.category
WHERE a.item_name = ? AND b.item_name = ?;

-- 통계 요약
SELECT 
  item_name,
  AVG(metric_value) as avg_value,
  STDDEV(metric_value) as std_dev,
  MIN(metric_value) as min_value,
  MAX(metric_value) as max_value,
  COUNT(*) as data_points
FROM data_table
WHERE item_name IN (?)
GROUP BY item_name;
```

## 상호작용 기능
- 비교 항목 다중 선택
- 측정 지표 선택
- 정규화 옵션 (백분율/절대값)
- 차트 타입 전환
- 데이터 필터링

## 특화 기능
- 차이점 하이라이팅
- 통계적 유의성 검정
- 순위 변화 추적
- 벤치마크 대비 비교
- 시각적 차이 강조 (색상 코딩)