# VibeCraft-Agent 샘플 대시보드

이 폴더에는 VibeCraft-Agent로 생성된 실제 대시보드 예제들이 포함되어 있습니다.

## 📂 폴더 구조

```
samples/
├── sample-business.sqlite     # 샘플 SQLite 데이터베이스 (한국 비즈니스 데이터)
├── time-series-dashboard/      # 시계열 대시보드 예제
├── kpi-dashboard/             # KPI 메트릭 대시보드 예제
└── geo-spatial-dashboard/     # 지도 기반 시각화 예제
```

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
cd samples/kpi-dashboard
npm install
npm run dev

# 브라우저에서 http://localhost:5173 접속
```

## 💡 생성 명령어

이 대시보드들은 다음 명령어로 생성되었습니다:

```bash
# Time-Series
vibecraft-agent \
  --sqlite-path ./sample-business.sqlite \
  --visualization-type time-series \
  --user-prompt "월별 매출 추이를 라인 차트로 보여주세요"

# KPI Dashboard  
vibecraft-agent \
  --sqlite-path ./sample-business.sqlite \
  --visualization-type kpi-dashboard \
  --user-prompt "주요 비즈니스 메트릭을 카드 형태로 표시"

# Geo-Spatial
vibecraft-agent \
  --sqlite-path ./sample-business.sqlite \
  --visualization-type geo-spatial \
  --user-prompt "지역별 매출 현황을 지도에 표시"
```

## 📝 참고사항

- 모든 대시보드는 **즉시 실행 가능**한 상태입니다
- SQLite 파일은 각 앱의 `public/data.sqlite`에 복사되어 있습니다
- 브라우저에서 sql.js를 사용하여 SQLite를 직접 읽습니다
- TypeScript와 Tailwind CSS로 구현되어 있습니다