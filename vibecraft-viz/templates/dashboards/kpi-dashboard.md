# KPI 대시보드 템플릿

## 템플릿 설명
핵심 성과 지표(KPI)를 한눈에 모니터링하고 목표 대비 달성률을 추적하는 대시보드

## 필수 데이터 필드
- metric_name: KPI 지표명
- metric_value: 실제 값
- target_value: 목표 값
- period: 측정 기간
- category: 지표 카테고리

## 주요 컴포넌트
1. MetricCard: KPI 카드 (현재값, 변화율, 트렌드)
2. GaugeChart: 목표 달성률 게이지
3. ProgressBar: 진행률 표시
4. ComparisonChart: 실제 vs 목표 비교
5. PeriodSelector: 기간 선택기

## 레이아웃 구조
```
+----------+----------+----------+
| Metric   | Metric   | Metric   |
| Card 1   | Card 2   | Card 3   |
+----------+----------+----------+
| Metric   | Metric   | Metric   |
| Card 4   | Card 5   | Card 6   |
+----------+----------+----------+
|          |                    |
| Gauge    |   Comparison       |
| Charts   |   Chart            |
|          |                    |
+----------+--------------------+
```

## SQL 쿼리 패턴
```sql
-- 현재 KPI 값 조회
SELECT 
  metric_name,
  metric_value,
  target_value,
  (metric_value / target_value * 100) as achievement_rate
FROM data_table
WHERE period = ?
ORDER BY metric_name;

-- 기간별 KPI 추이
SELECT 
  period,
  metric_name,
  metric_value,
  target_value,
  LAG(metric_value) OVER (PARTITION BY metric_name ORDER BY period) as prev_value
FROM data_table
WHERE metric_name IN (?)
ORDER BY period, metric_name;

-- 카테고리별 집계
SELECT 
  category,
  COUNT(*) as metric_count,
  AVG(metric_value / target_value * 100) as avg_achievement,
  SUM(CASE WHEN metric_value >= target_value THEN 1 ELSE 0 END) as achieved_count
FROM data_table
GROUP BY category;
```

## 상호작용 기능
- 기간 선택 (일/주/월/분기/년)
- KPI 카드 클릭으로 상세 보기
- 목표값 동적 조정
- 알림 임계값 설정
- 대시보드 레이아웃 커스터마이징

## 특화 기능
- 목표 달성 알림
- 전기 대비 성장률 표시
- 예측 값 표시 (선택적)
- RAG (Red-Amber-Green) 상태 표시
- 드릴다운 분석