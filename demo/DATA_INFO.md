# VibeCraft-Agent 샘플 데이터베이스

VibeCraft-Agent의 다양한 시각화 타입을 테스트하기 위한 샘플 SQLite 데이터베이스입니다.

## 생성된 데이터베이스

### 1. sales.sqlite (11.18 MB)
**테이블:** `sensor_readings`
**레코드 수:** 100,000개
**기간:** 2024-10-18 ~ 2025-09-30 (약 1년)
**용도:** Time-series 시각화 테스트

**스키마:**
- `timestamp` (TEXT): 측정 시간
- `sensor_id` (TEXT): 센서 ID (50개 센서)
- `location` (TEXT): 측정 위치 (17개 지역)
- `device_type` (TEXT): 장치 유형
- `temperature` (REAL): 온도 (°C)
- `humidity` (REAL): 습도 (%)
- `pressure` (REAL): 기압 (hPa)
- `co2_level` (REAL): CO2 농도 (ppm)
- `light_level` (REAL): 조도 (lux)
- `motion_detected` (INTEGER): 움직임 감지 (0/1)
- `battery_level` (REAL): 배터리 잔량 (%)
- `status` (TEXT): 센서 상태

**시각화 예시:**
```bash
vibecraft-agent \
  --sqlite-path demo/sales.sqlite \
  --visualization-type time-series \
  --user-prompt "센서별 온도 및 습도 변화 추이를 시계열로 표시"
```

---

### 2. stores.sqlite (12.97 MB)
**테이블:** `stores`
**레코드 수:** 80,000개
**도시:** 18개 주요 도시
**용도:** Geo-spatial 시각화 테스트

**스키마:**
- `store_id` (TEXT): 매장 ID
- `store_name` (TEXT): 매장명
- `business_type` (TEXT): 업종 (15개 카테고리)
- `brand` (TEXT): 브랜드명
- `city` (TEXT): 도시
- `district` (TEXT): 구/동
- `address` (TEXT): 주소
- `latitude` (REAL): 위도
- `longitude` (REAL): 경도
- `opening_date` (TEXT): 개업일
- `square_meters` (REAL): 면적 (m²)
- `employees` (INTEGER): 직원 수
- `monthly_revenue` (REAL): 월 매출 (원)
- `customer_rating` (REAL): 고객 평점 (1-5)
- `delivery_available` (INTEGER): 배달 가능 여부 (0/1)
- `parking_available` (INTEGER): 주차 가능 여부 (0/1)
- `status` (TEXT): 영업 상태

**시각화 예시:**
```bash
vibecraft-agent \
  --sqlite-path demo/stores.sqlite \
  --visualization-type geo-spatial \
  --user-prompt "전국 매장 위치를 지도에 표시하고 매출액별로 색상 구분"
```

---

### 3. metrics.sqlite (14.72 MB)
**테이블:** `transactions`
**레코드 수:** 100,000개
**기간:** 2020-10-19 ~ 2032-04-13 (약 5년)
**총 매출:** 약 1,106억원
**용도:** KPI Dashboard 시각화 테스트

**스키마:**
- `transaction_id` (TEXT): 거래 ID
- `date` (TEXT): 거래 날짜
- `year` (INTEGER): 연도
- `quarter` (TEXT): 분기 (Q1-Q4)
- `month` (INTEGER): 월
- `weekday` (INTEGER): 요일 (0=월요일, 6=일요일)
- `category` (TEXT): 제품 카테고리 (10개)
- `product_name` (TEXT): 제품명
- `channel` (TEXT): 판매 채널 (온라인, 오프라인, 모바일앱 등)
- `region` (TEXT): 지역 (16개 지역)
- `customer_segment` (TEXT): 고객 세그먼트 (VIP, 일반, 신규 등)
- `customer_id` (TEXT): 고객 ID
- `quantity_sold` (INTEGER): 판매 수량
- `unit_price` (REAL): 단가 (원)
- `total_revenue` (REAL): 총 매출 (원)
- `cost` (REAL): 비용 (원)
- `profit` (REAL): 이익 (원)
- `discount_rate` (REAL): 할인율 (%)
- `customer_satisfaction` (REAL): 고객 만족도 (1-5)
- `return_flag` (INTEGER): 반품 여부 (0/1)
- `marketing_cost` (REAL): 마케팅 비용 (원)
- `acquisition_cost` (REAL): 고객 획득 비용 (원)
- `lifetime_value` (REAL): 고객 생애 가치 (원)
- `churn_risk` (REAL): 이탈 위험도 (0-1)

**시각화 예시:**
```bash
vibecraft-agent \
  --sqlite-path demo/metrics.sqlite \
  --visualization-type kpi-dashboard \
  --user-prompt "월별 매출, 이익, 고객 만족도 등 핵심 지표를 대시보드로 표시"
```

---

### 4. metrics.sqlite - Comparison (비교 분석)

**동일한 데이터베이스를 Comparison 시각화에도 활용**

metrics.sqlite의 transactions 테이블은 다양한 카테고리를 포함하고 있어 비교 분석에 최적화되어 있습니다:

**비교 가능한 차원:**
- `category` (TEXT): 10개 제품 카테고리 (완구, 스포츠용품, 전자제품, 화장품, 의류 등)
- `channel` (TEXT): 5개 판매 채널 (온라인, 오프라인, 모바일앱, 전화주문, 도매)
- `region` (TEXT): 16개 지역 (서울, 부산, 대구 등)
- `customer_segment` (TEXT): 5개 고객 세그먼트 (VIP, 일반, 신규, 휴면복귀, 단골)

**비교 가능한 지표:**
- `total_revenue` (REAL): 총 매출
- `profit` (REAL): 이익
- `quantity_sold` (INTEGER): 판매 수량
- `customer_satisfaction` (REAL): 고객 만족도

**시각화 예시:**
```bash
vibecraft-agent \
  --sqlite-path demo/metrics.sqlite \
  --visualization-type comparison \
  --user-prompt "제품 카테고리별 매출을 막대 차트로, 판매 채널별 비중을 파이 차트로 나란히 표시"
```

---

## 데이터 생성 방법

### CSV 데이터 생성
```bash
# Time-series 데이터
python3 demo/generate_timeseries_data.py

# Geo-spatial 데이터
python3 demo/generate_geospatial_data.py

# KPI 데이터
python3 demo/generate_kpi_data.py
```

### SQLite 변환
```bash
python3 demo/csv_to_sqlite.py
```

---

## 데이터 특징

### Time-series 데이터
- 5분 간격의 센서 측정값
- 50개 센서의 1년치 데이터
- 시간대별 패턴 (낮/밤 차이)
- 계절별 패턴 (여름/겨울 차이)
- 자연스러운 센서 노이즈

### Geo-spatial 데이터
- 실제 대한민국 주요 도시 좌표
- 정규분포를 사용한 도심 집중 패턴
- 15개 업종, 다양한 브랜드
- 개업 기간에 따른 매출 변화
- 현실적인 고객 평점 분포

### KPI 데이터
- 5년치 거래 데이터
- 10개 제품 카테고리
- 5개 판매 채널
- 고객 세그먼트별 차별화된 할인율
- 고객별 LTV 누적 추적
- 연말/명절 등 계절 효과 반영

---

## 파일 크기 요약

| 파일명 | 타입 | 크기 | 레코드 수 |
|--------|------|------|-----------|
| sales.sqlite | SQLite | 11.18 MB | 100,000 |
| stores.sqlite | SQLite | 12.97 MB | 80,000 |
| metrics.sqlite | SQLite | 14.72 MB | 100,000 |
| timeseries_data.csv | CSV | 10 MB | 100,000 |
| geospatial_data.csv | CSV | 12 MB | 80,000 |
| kpi_data.csv | CSV | 17 MB | 100,000 |

---

## 라이선스

이 샘플 데이터는 Apache License 2.0 하에 배포됩니다.
