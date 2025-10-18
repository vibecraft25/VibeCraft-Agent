# VibeCraft-Agent 샘플 데이터 및 대시보드

이 폴더에는 VibeCraft-Agent 테스트를 위한 샘플 데이터 생성 스크립트와 생성된 대시보드 예제들이 포함되어 있습니다.

## 📂 폴더 구조

```
demo/
├── sample-business.sqlite          # 기존 샘플 DB (한국 비즈니스 데이터)
├── generate_timeseries_data.py    # Time-series 데이터 생성 스크립트
├── generate_geospatial_data.py    # Geo-spatial 데이터 생성 스크립트
├── generate_kpi_data.py            # KPI 데이터 생성 스크립트
├── csv_to_sqlite.py               # CSV → SQLite 변환 스크립트
├── DATA_INFO.md                   # 생성된 데이터 상세 정보
├── time-series-dashboard/          # 시계열 대시보드 예제
├── kpi-dashboard/                 # KPI 메트릭 대시보드 예제
└── geo-spatial-dashboard/         # 지도 기반 시각화 예제
```

## 🎲 샘플 데이터 생성

### 대용량 테스트 데이터 생성하기

Python 스크립트로 현실적인 대용량 샘플 데이터를 생성할 수 있습니다:

```bash
# 1. CSV 데이터 생성 (각각 10-17MB)
python3 generate_timeseries_data.py   # IoT 센서 데이터 (100,000 레코드)
python3 generate_geospatial_data.py   # 전국 매장 데이터 (80,000 레코드)
python3 generate_kpi_data.py          # 비즈니스 거래 (100,000 레코드)

# 2. CSV를 SQLite로 변환
python3 csv_to_sqlite.py

# 생성 결과:
# - sales.sqlite (11.18 MB)
# - stores.sqlite (12.97 MB)
# - metrics.sqlite (14.72 MB)
```

### 생성되는 데이터베이스

| 파일 | 크기 | 테이블 | 레코드 수 | 용도 |
|------|------|--------|-----------|------|
| sales.sqlite | 11.18 MB | sensor_readings | 100,000 | Time-series 시각화 |
| stores.sqlite | 176 KB | stores | 1,000 | Geo-spatial 시각화 |
| metrics.sqlite | 14.72 MB | transactions | 100,000 | KPI Dashboard |

자세한 스키마 정보는 [DATA_INFO.md](./DATA_INFO.md) 참조

## 🗄️ 샘플 데이터베이스

`sample-business.sqlite` (11.69MB)

### 테이블 구조:
- **products**: 제품 정보 (100개)
- **customers**: 고객 정보 (500명)
- **orders**: 주문 내역 (10,000건)
- **order_items**: 주문 상세 (30,000건)
- **daily_stats**: 일별 통계 (365일)
- **regional_stats**: 지역별 통계 (17개 지역)
- **kpi_metrics**: KPI 메트릭 (8개 지표)

## 🎯 대시보드 예제

### 1. Time-Series Dashboard (시계열 분석)
월별 매출 추이를 라인 차트로 시각화

```bash
cd time-series-dashboard
npm install
npm run dev
```

**특징:**
- 📈 월별 매출 트렌드
- 📊 제품별 매출 비교
- 🎨 인터랙티브 차트 (Recharts)

### 2. KPI Dashboard (핵심 지표)
주요 비즈니스 메트릭을 카드 형태로 표시

```bash
cd kpi-dashboard
npm install
npm run dev
```

**특징:**
- 💰 총 매출, 고객 수 등 8개 KPI
- 📈 전월 대비 증감률 표시
- 🎯 실시간 데이터 로딩

### 3. Geo-Spatial Dashboard (지도 시각화)
지역별 매출을 한국 지도에 표시

```bash
cd geo-spatial-dashboard
npm install
npm run dev
```

**특징:**
- 🗺️ 한국 지역 좌표 매핑
- 📍 매출 수준별 색상 마커
- 💬 클릭 시 상세 정보 팝업

## 🚀 실행 방법

각 대시보드는 독립적인 React 앱입니다:

```bash
# 예: KPI 대시보드 실행
cd demo/kpi-dashboard
npm install
npm run dev

# 브라우저에서 http://localhost:5173 접속
```

## 💡 생성 명령어 예시

### 새로운 샘플 데이터로 생성

```bash
# Time-Series (센서 데이터)
vibecraft-agent \
  --sqlite-path demo/sales.sqlite \
  --visualization-type time-series \
  --user-prompt "센서별 온도와 습도를 시계열 차트로 표시"

# Geo-Spatial (매장 위치)
vibecraft-agent \
  --sqlite-path demo/stores.sqlite \
  --visualization-type geo-spatial \
  --user-prompt "전국 매장 위치를 지도에 표시하고 매출액별로 마커 크기 조정"

# KPI Dashboard (비즈니스 메트릭)
vibecraft-agent \
  --sqlite-path demo/metrics.sqlite \
  --visualization-type kpi-dashboard \
  --user-prompt "월별 매출, 이익, 고객 만족도를 카드와 차트로 표시"

# Comparison (비교 분석)
vibecraft-agent \
  --sqlite-path demo/metrics.sqlite \
  --visualization-type comparison \
  --user-prompt "제품 카테고리별 매출을 막대 차트로, 판매 채널별 비중을 파이 차트로 나란히 표시"
```

## 📝 참고사항

- 모든 대시보드는 **즉시 실행 가능**한 상태입니다
- SQLite 파일은 각 앱의 `public/data.sqlite`에 복사되어 있습니다
- 브라우저에서 sql.js를 사용하여 SQLite를 직접 읽습니다
- TypeScript와 Tailwind CSS로 구현되어 있습니다