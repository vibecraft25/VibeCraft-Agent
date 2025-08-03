# VibeCraft-Agent 튜토리얼

이 튜토리얼에서는 VibeCraft-Agent를 사용하여 실제 데이터 시각화 애플리케이션을 만드는 과정을 단계별로 안내합니다.

## 목차

1. [시작하기](#시작하기)
2. [첫 번째 대시보드 만들기](#첫-번째-대시보드-만들기)
3. [시계열 데이터 시각화](#시계열-데이터-시각화)
4. [지리공간 데이터 시각화](#지리공간-데이터-시각화)
5. [복잡한 대시보드 구축](#복잡한-대시보드-구축)
6. [커스터마이징](#커스터마이징)
7. [배포하기](#배포하기)

## 시작하기

### 환경 준비

1. **Node.js 설치 확인**
```bash
node --version  # v18.0.0 이상
npm --version   # v8.0.0 이상
```

2. **VibeCraft-Agent 설치**
```bash
npm install -g vibecraft-agent
```

3. **Gemini CLI 설치**
```bash
npm install -g @google/gemini-cli
```

4. **설치 확인**
```bash
vibecraft-agent --version
gemini --version
```

## 첫 번째 대시보드 만들기

### Step 1: 샘플 데이터베이스 생성

`sample_data.sql` 파일 생성:

```sql
-- 판매 데이터 테이블
CREATE TABLE sales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date DATE NOT NULL,
    product_name TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    total DECIMAL(10,2) NOT NULL,
    category TEXT NOT NULL,
    region TEXT NOT NULL
);

-- 샘플 데이터 삽입
INSERT INTO sales (date, product_name, quantity, price, total, category, region) VALUES
('2024-01-01', '노트북', 5, 1200000, 6000000, '전자제품', '서울'),
('2024-01-02', '마우스', 20, 30000, 600000, '액세서리', '서울'),
('2024-01-03', '키보드', 15, 80000, 1200000, '액세서리', '부산'),
('2024-01-04', '모니터', 8, 350000, 2800000, '전자제품', '대구'),
('2024-01-05', '노트북', 3, 1200000, 3600000, '전자제품', '인천'),
('2024-02-01', '태블릿', 10, 800000, 8000000, '전자제품', '서울'),
('2024-02-02', '스피커', 25, 150000, 3750000, '액세서리', '부산'),
('2024-02-03', '웹캠', 30, 100000, 3000000, '액세서리', '대구'),
('2024-03-01', '노트북', 7, 1200000, 8400000, '전자제품', '서울'),
('2024-03-02', '프린터', 5, 500000, 2500000, '주변기기', '인천');

-- 요약 뷰 생성
CREATE VIEW monthly_summary AS
SELECT 
    strftime('%Y-%m', date) as month,
    category,
    region,
    COUNT(*) as order_count,
    SUM(quantity) as total_quantity,
    SUM(total) as total_revenue,
    AVG(total) as avg_order_value
FROM sales
GROUP BY strftime('%Y-%m', date), category, region;
```

데이터베이스 생성:
```bash
sqlite3 sales.sqlite < sample_data.sql
```

### Step 2: KPI 대시보드 생성

```bash
vibecraft-agent \
  --sqlite-path ./sales.sqlite \
  --visualization-type kpi-dashboard \
  --user-prompt "판매 데이터를 기반으로 주요 KPI를 보여주는 대시보드를 만들어주세요.
                 총 매출, 판매 수량, 평균 주문 금액, 카테고리별 매출 비중을 표시하고,
                 월별 트렌드도 함께 보여주세요." \
  --output-dir ./sales-kpi-dashboard \
  --project-name "Sales KPI Dashboard"
```

### Step 3: 생성된 앱 실행

```bash
cd ./sales-kpi-dashboard
npm install
npm start
```

브라우저에서 http://localhost:3000 접속

### 예상 결과

- 상단에 KPI 카드 (총 매출, 판매 수량, 평균 주문 금액)
- 카테고리별 매출 파이 차트
- 월별 매출 트렌드 라인 차트
- 지역별 필터링 기능

## 시계열 데이터 시각화

### 시나리오: 매출 트렌드 분석

더 복잡한 시계열 데이터를 준비해봅시다.

`timeseries_data.sql`:

```sql
-- 일별 매출 데이터 (1년치)
CREATE TABLE daily_sales (
    date DATE PRIMARY KEY,
    revenue DECIMAL(12,2),
    orders INTEGER,
    new_customers INTEGER,
    returning_customers INTEGER
);

-- 날짜 생성 및 랜덤 데이터 삽입 (SQLite 전용)
WITH RECURSIVE dates(date) AS (
    SELECT '2023-01-01'
    UNION ALL
    SELECT date(date, '+1 day')
    FROM dates
    WHERE date < '2023-12-31'
)
INSERT INTO daily_sales
SELECT 
    date,
    -- 주말/평일 패턴이 있는 매출
    CASE 
        WHEN strftime('%w', date) IN ('0', '6') 
        THEN 5000000 + ABS(RANDOM() % 2000000)
        ELSE 8000000 + ABS(RANDOM() % 3000000)
    END as revenue,
    -- 주문 수
    CASE 
        WHEN strftime('%w', date) IN ('0', '6') 
        THEN 100 + ABS(RANDOM() % 50)
        ELSE 200 + ABS(RANDOM() % 100)
    END as orders,
    -- 신규 고객
    20 + ABS(RANDOM() % 30) as new_customers,
    -- 재구매 고객
    50 + ABS(RANDOM() % 80) as returning_customers
FROM dates;

-- 주별, 월별 집계 뷰
CREATE VIEW weekly_summary AS
SELECT 
    strftime('%Y-W%W', date) as week,
    SUM(revenue) as total_revenue,
    AVG(revenue) as avg_daily_revenue,
    SUM(orders) as total_orders,
    SUM(new_customers) as new_customers,
    SUM(returning_customers) as returning_customers
FROM daily_sales
GROUP BY strftime('%Y-W%W', date);

CREATE VIEW monthly_summary AS
SELECT 
    strftime('%Y-%m', date) as month,
    SUM(revenue) as total_revenue,
    AVG(revenue) as avg_daily_revenue,
    SUM(orders) as total_orders,
    SUM(new_customers) as new_customers,
    SUM(returning_customers) as returning_customers,
    COUNT(DISTINCT date) as days
FROM daily_sales
GROUP BY strftime('%Y-%m', date);
```

### 시계열 대시보드 생성

```bash
vibecraft-agent \
  --sqlite-path ./timeseries.sqlite \
  --visualization-type time-series \
  --user-prompt "일별 매출 데이터를 시각화하는 대시보드를 만들어주세요.
                 다음 기능을 포함해주세요:
                 1. 일별/주별/월별 뷰 전환
                 2. 날짜 범위 선택기
                 3. 이동 평균선 (7일, 30일)
                 4. 전년 동기 대비 비교
                 5. 주말/평일 패턴 하이라이트
                 6. 신규 vs 재구매 고객 트렌드" \
  --output-dir ./timeseries-dashboard \
  --debug
```

### 고급 기능 활용

생성된 대시보드에 추가 기능을 요청할 수 있습니다:

```bash
vibecraft-agent \
  --sqlite-path ./timeseries.sqlite \
  --visualization-type time-series \
  --user-prompt "매출 예측 기능을 추가해주세요.
                 - 과거 데이터를 기반으로 다음 30일 예측
                 - 계절성과 트렌드를 고려
                 - 신뢰 구간 표시
                 - 이상치 탐지 및 알림" \
  --output-dir ./timeseries-forecast
```

## 지리공간 데이터 시각화

### 시나리오: 매장 위치 분석

`store_locations.sql`:

```sql
-- 매장 정보
CREATE TABLE stores (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    city TEXT NOT NULL,
    opening_date DATE,
    store_type TEXT,
    size_sqm INTEGER
);

-- 매장별 실적
CREATE TABLE store_performance (
    store_id INTEGER,
    date DATE,
    revenue DECIMAL(12,2),
    customers INTEGER,
    avg_transaction DECIMAL(10,2),
    FOREIGN KEY (store_id) REFERENCES stores(id)
);

-- 서울 지역 매장 데이터
INSERT INTO stores VALUES
(1, '강남점', '서울시 강남구 테헤란로 123', 37.5012, 127.0396, '서울', '2020-01-15', '플래그십', 500),
(2, '홍대점', '서울시 마포구 와우산로 45', 37.5563, 126.9238, '서울', '2021-03-20', '일반', 300),
(3, '명동점', '서울시 중구 명동길 78', 37.5637, 126.9869, '서울', '2019-11-10', '플래그십', 450),
(4, '강북점', '서울시 성북구 성북로 90', 37.5894, 127.0167, '서울', '2022-05-05', '소형', 200),
(5, '잠실점', '서울시 송파구 올림픽로 300', 37.5113, 127.0980, '서울', '2021-08-15', '일반', 350);

-- 실적 데이터 생성
INSERT INTO store_performance
SELECT 
    s.id,
    '2024-01-01',
    CASE s.store_type
        WHEN '플래그십' THEN 50000000 + ABS(RANDOM() % 20000000)
        WHEN '일반' THEN 30000000 + ABS(RANDOM() % 10000000)
        ELSE 20000000 + ABS(RANDOM() % 5000000)
    END,
    CASE s.store_type
        WHEN '플래그십' THEN 1000 + ABS(RANDOM() % 500)
        WHEN '일반' THEN 600 + ABS(RANDOM() % 300)
        ELSE 400 + ABS(RANDOM() % 200)
    END,
    50000 + ABS(RANDOM() % 30000)
FROM stores s;
```

### 지도 시각화 생성

```bash
vibecraft-agent \
  --sqlite-path ./store_locations.sqlite \
  --visualization-type geo-spatial \
  --user-prompt "매장 위치와 실적을 지도에 시각화해주세요.
                 다음 기능을 포함해주세요:
                 1. 매장 위치를 지도에 마커로 표시
                 2. 매출액에 따라 마커 크기 조절
                 3. 매장 타입별로 다른 색상 사용
                 4. 클릭 시 상세 정보 팝업
                 5. 히트맵 오버레이 옵션
                 6. 반경 분석 도구 (예: 5km 내 경쟁 매장)
                 7. 클러스터링 기능" \
  --output-dir ./store-map
```

## 복잡한 대시보드 구축

### 시나리오: 종합 비즈니스 인텔리전스 대시보드

여러 테이블을 조합한 복잡한 분석을 해봅시다.

`business_intelligence.sql`:

```sql
-- 고객 정보
CREATE TABLE customers (
    id INTEGER PRIMARY KEY,
    name TEXT,
    email TEXT UNIQUE,
    registration_date DATE,
    segment TEXT,
    lifetime_value DECIMAL(12,2)
);

-- 제품 정보
CREATE TABLE products (
    id INTEGER PRIMARY KEY,
    name TEXT,
    category TEXT,
    sub_category TEXT,
    price DECIMAL(10,2),
    cost DECIMAL(10,2),
    launch_date DATE
);

-- 주문 정보
CREATE TABLE orders (
    id INTEGER PRIMARY KEY,
    customer_id INTEGER,
    order_date DATETIME,
    total_amount DECIMAL(12,2),
    status TEXT,
    payment_method TEXT,
    FOREIGN KEY (customer_id) REFERENCES customers(id)
);

-- 주문 상세
CREATE TABLE order_items (
    id INTEGER PRIMARY KEY,
    order_id INTEGER,
    product_id INTEGER,
    quantity INTEGER,
    unit_price DECIMAL(10,2),
    discount DECIMAL(5,2),
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
);

-- 복잡한 분석을 위한 뷰들
CREATE VIEW customer_rfm AS
SELECT 
    customer_id,
    julianday('now') - MAX(julianday(order_date)) as recency,
    COUNT(DISTINCT id) as frequency,
    SUM(total_amount) as monetary
FROM orders
WHERE status = 'completed'
GROUP BY customer_id;

CREATE VIEW product_performance AS
SELECT 
    p.id,
    p.name,
    p.category,
    COUNT(DISTINCT oi.order_id) as order_count,
    SUM(oi.quantity) as total_sold,
    SUM(oi.quantity * oi.unit_price * (1 - oi.discount/100)) as revenue,
    SUM(oi.quantity * (oi.unit_price * (1 - oi.discount/100) - p.cost)) as profit
FROM products p
LEFT JOIN order_items oi ON p.id = oi.product_id
GROUP BY p.id;
```

### 커스텀 BI 대시보드 생성

```bash
vibecraft-agent \
  --sqlite-path ./business_intelligence.sqlite \
  --visualization-type custom \
  --user-prompt "종합 비즈니스 인텔리전스 대시보드를 만들어주세요.
                 
                 섹션 1: Executive Summary
                 - 주요 KPI 카드 (매출, 이익, 고객수, 평균 주문 가치)
                 - MoM, YoY 성장률 표시
                 - 목표 대비 달성률 게이지
                 
                 섹션 2: 고객 분석
                 - RFM 세그먼트 분포 (버블 차트)
                 - 고객 생애 가치 분포
                 - 코호트 리텐션 매트릭스
                 - 신규 vs 재구매 고객 트렌드
                 
                 섹션 3: 제품 분석
                 - 카테고리별 매출/이익 (선버스트 차트)
                 - 베스트셀러 Top 10
                 - 제품 수명 주기 분석
                 - 가격 탄력성 분석
                 
                 섹션 4: 판매 퍼널
                 - 방문 → 장바구니 → 구매 전환율
                 - 이탈 포인트 분석
                 - 결제 방법별 성공률
                 
                 기능:
                 - 날짜 범위 필터
                 - 드릴다운 기능
                 - 데이터 내보내기
                 - 대시보드 레이아웃 커스터마이징" \
  --output-dir ./bi-dashboard \
  --project-name "Business Intelligence Suite"
```

## 커스터마이징

### 생성된 코드 구조 이해

생성된 React 앱의 일반적인 구조:

```
generated-app/
├── public/
│   ├── index.html
│   └── data.sqlite      # 복사된 데이터베이스
├── src/
│   ├── App.tsx          # 메인 컴포넌트
│   ├── components/      # UI 컴포넌트
│   │   ├── Dashboard.tsx
│   │   ├── Charts/
│   │   └── Filters/
│   ├── hooks/           # 커스텀 훅
│   │   ├── useSQLite.ts
│   │   └── useData.ts
│   ├── utils/           # 유틸리티 함수
│   └── types/           # TypeScript 타입
└── package.json
```

### 커스텀 차트 추가하기

`src/components/Charts/CustomChart.tsx`:

```typescript
import React from 'react';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend
} from 'recharts';

interface CustomChartProps {
  data: any[];
  dataKey: string;
  nameKey: string;
}

export const CustomChart: React.FC<CustomChartProps> = ({
  data,
  dataKey,
  nameKey
}) => {
  return (
    <RadarChart width={400} height={400} data={data}>
      <PolarGrid />
      <PolarAngleAxis dataKey={nameKey} />
      <PolarRadiusAxis angle={90} domain={[0, 'auto']} />
      <Radar
        name="Performance"
        dataKey={dataKey}
        stroke="#8884d8"
        fill="#8884d8"
        fillOpacity={0.6}
      />
      <Legend />
    </RadarChart>
  );
};
```

### 데이터 필터링 개선

`src/hooks/useFilteredData.ts`:

```typescript
import { useMemo } from 'react';

export const useFilteredData = (
  data: any[],
  filters: Record<string, any>
) => {
  return useMemo(() => {
    return data.filter(item => {
      return Object.entries(filters).every(([key, value]) => {
        if (!value) return true;
        
        if (Array.isArray(value)) {
          return value.includes(item[key]);
        }
        
        if (typeof value === 'object' && value.min && value.max) {
          return item[key] >= value.min && item[key] <= value.max;
        }
        
        return item[key] === value;
      });
    });
  }, [data, filters]);
};
```

### 실시간 업데이트 추가

`src/hooks/useRealtimeData.ts`:

```typescript
import { useState, useEffect } from 'react';
import { useSQLite } from './useSQLite';

export const useRealtimeData = (
  query: string,
  interval: number = 5000
) => {
  const [data, setData] = useState<any[]>([]);
  const { execute } = useSQLite();
  
  useEffect(() => {
    const fetchData = async () => {
      const result = await execute(query);
      setData(result);
    };
    
    fetchData();
    const timer = setInterval(fetchData, interval);
    
    return () => clearInterval(timer);
  }, [query, interval]);
  
  return data;
};
```

## 배포하기

### 1. 프로덕션 빌드

```bash
cd ./generated-app
npm run build
```

### 2. 정적 호스팅 (Vercel)

```bash
npm install -g vercel
vercel
```

### 3. 정적 호스팅 (Netlify)

```bash
npm install -g netlify-cli
netlify deploy --prod --dir=build
```

### 4. Docker 컨테이너

`Dockerfile`:

```dockerfile
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

빌드 및 실행:
```bash
docker build -t my-dashboard .
docker run -p 8080:80 my-dashboard
```

### 5. 환경 변수 설정

`.env.production`:

```env
REACT_APP_API_URL=https://api.example.com
REACT_APP_GA_TRACKING_ID=UA-XXXXX-Y
```

## 다음 단계

1. **성능 최적화**
   - 대용량 데이터 처리
   - 가상 스크롤링
   - 메모이제이션

2. **보안 강화**
   - 데이터 암호화
   - 사용자 인증
   - 접근 권한 관리

3. **확장성 개선**
   - 서버 사이드 API 추가
   - 실시간 데이터 스트리밍
   - 다중 데이터소스 지원

4. **사용자 경험 향상**
   - 다크 모드
   - 다국어 지원
   - 모바일 최적화

## 도움이 필요하신가요?

- [GitHub Issues](https://github.com/your-org/vibecraft-agent/issues)
- [Discord 커뮤니티](https://discord.gg/vibecraft)
- [문서](https://docs.vibecraft.io)

Happy Visualizing! 🎨📊