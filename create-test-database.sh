#!/bin/bash

# 테스트용 데이터베이스 생성 스크립트

sqlite3 test-data.sqlite << 'EOF'
-- 판매 데이터 테이블
CREATE TABLE sales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    amount REAL NOT NULL,
    quantity INTEGER NOT NULL,
    product TEXT NOT NULL,
    category TEXT NOT NULL,
    region TEXT NOT NULL,
    city TEXT NOT NULL,
    customer_id INTEGER NOT NULL,
    payment_method TEXT
);

-- 제품 테이블
CREATE TABLE products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    price REAL NOT NULL,
    cost REAL NOT NULL,
    stock INTEGER DEFAULT 0
);

-- 고객 테이블
CREATE TABLE customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT,
    region TEXT NOT NULL,
    city TEXT NOT NULL,
    registration_date TEXT NOT NULL,
    tier TEXT DEFAULT 'Bronze'
);

-- 지역 데이터 (geo-spatial 테스트용)
CREATE TABLE locations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    city TEXT NOT NULL,
    region TEXT NOT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    population INTEGER
);

-- 제품 데이터 삽입
INSERT INTO products (name, category, price, cost, stock) VALUES
('노트북 A', '전자제품', 1200000, 900000, 50),
('노트북 B', '전자제품', 1500000, 1100000, 30),
('마우스', '액세서리', 50000, 30000, 200),
('키보드', '액세서리', 80000, 50000, 150),
('모니터', '전자제품', 400000, 300000, 80);

-- 지역 데이터 삽입
INSERT INTO locations (city, region, latitude, longitude, population) VALUES
('서울', '서울', 37.5665, 126.9780, 9729107),
('부산', '부산', 35.1796, 129.0756, 3413841),
('대구', '대구', 35.8714, 128.6014, 2438031),
('인천', '인천', 37.4563, 126.7052, 2957026),
('광주', '광주', 35.1595, 126.8526, 1456468),
('대전', '대전', 36.3504, 127.3845, 1474870),
('울산', '울산', 35.5384, 129.3114, 1148019),
('수원', '경기', 37.2636, 127.0286, 1194313),
('성남', '경기', 37.4201, 127.1265, 974608);

-- 고객 데이터 삽입
INSERT INTO customers (name, email, region, city, registration_date, tier) VALUES
('김철수', 'kim@example.com', '서울', '서울', '2023-01-15', 'Gold'),
('이영희', 'lee@example.com', '부산', '부산', '2023-02-20', 'Silver'),
('박민수', 'park@example.com', '대구', '대구', '2023-03-10', 'Bronze'),
('정하나', 'jung@example.com', '인천', '인천', '2023-01-25', 'Gold'),
('최지원', 'choi@example.com', '광주', '광주', '2023-04-05', 'Silver');

-- 2024년 판매 데이터 생성 (시계열 분석용)
-- 1월
INSERT INTO sales (date, amount, quantity, product, category, region, city, customer_id, payment_method) VALUES
('2024-01-05', 1200000, 1, '노트북 A', '전자제품', '서울', '서울', 1, '카드'),
('2024-01-10', 50000, 1, '마우스', '액세서리', '부산', '부산', 2, '현금'),
('2024-01-15', 1500000, 1, '노트북 B', '전자제품', '대구', '대구', 3, '카드'),
('2024-01-20', 400000, 1, '모니터', '전자제품', '인천', '인천', 4, '카드'),
('2024-01-25', 80000, 1, '키보드', '액세서리', '광주', '광주', 5, '현금');

-- 2월
INSERT INTO sales (date, amount, quantity, product, category, region, city, customer_id, payment_method) VALUES
('2024-02-03', 2400000, 2, '노트북 A', '전자제품', '서울', '서울', 1, '카드'),
('2024-02-08', 100000, 2, '마우스', '액세서리', '경기', '수원', 1, '카드'),
('2024-02-14', 1500000, 1, '노트북 B', '전자제품', '부산', '부산', 2, '카드'),
('2024-02-18', 800000, 2, '모니터', '전자제품', '대전', '대전', 3, '카드'),
('2024-02-23', 160000, 2, '키보드', '액세서리', '울산', '울산', 4, '현금');

-- 3월
INSERT INTO sales (date, amount, quantity, product, category, region, city, customer_id, payment_method) VALUES
('2024-03-05', 3600000, 3, '노트북 A', '전자제품', '서울', '서울', 1, '카드'),
('2024-03-10', 150000, 3, '마우스', '액세서리', '경기', '성남', 2, '카드'),
('2024-03-15', 3000000, 2, '노트북 B', '전자제품', '인천', '인천', 4, '카드'),
('2024-03-20', 1200000, 3, '모니터', '전자제품', '대구', '대구', 3, '카드'),
('2024-03-25', 240000, 3, '키보드', '액세서리', '광주', '광주', 5, '현금');

-- 4월
INSERT INTO sales (date, amount, quantity, product, category, region, city, customer_id, payment_method) VALUES
('2024-04-02', 1200000, 1, '노트북 A', '전자제품', '부산', '부산', 2, '카드'),
('2024-04-08', 200000, 4, '마우스', '액세서리', '서울', '서울', 1, '카드'),
('2024-04-12', 4500000, 3, '노트북 B', '전자제품', '경기', '수원', 1, '카드'),
('2024-04-18', 1600000, 4, '모니터', '전자제품', '대전', '대전', 3, '카드'),
('2024-04-24', 320000, 4, '키보드', '액세서리', '울산', '울산', 4, '현금');

-- 5월
INSERT INTO sales (date, amount, quantity, product, category, region, city, customer_id, payment_method) VALUES
('2024-05-03', 2400000, 2, '노트북 A', '전자제품', '대구', '대구', 3, '카드'),
('2024-05-09', 250000, 5, '마우스', '액세서리', '인천', '인천', 4, '카드'),
('2024-05-15', 1500000, 1, '노트북 B', '전자제품', '광주', '광주', 5, '카드'),
('2024-05-21', 2000000, 5, '모니터', '전자제품', '서울', '서울', 1, '카드'),
('2024-05-27', 400000, 5, '키보드', '액세서리', '부산', '부산', 2, '현금');

-- 월별 매출 요약 뷰
CREATE VIEW monthly_sales AS
SELECT 
    strftime('%Y-%m', date) as month,
    SUM(amount) as total_amount,
    SUM(quantity) as total_quantity,
    COUNT(*) as transaction_count
FROM sales
GROUP BY strftime('%Y-%m', date);

-- 지역별 매출 요약 뷰
CREATE VIEW regional_sales AS
SELECT 
    s.region,
    s.city,
    l.latitude,
    l.longitude,
    SUM(s.amount) as total_sales,
    COUNT(DISTINCT s.customer_id) as unique_customers,
    COUNT(*) as transaction_count
FROM sales s
JOIN locations l ON s.city = l.city
GROUP BY s.region, s.city, l.latitude, l.longitude;

-- 제품별 성과 뷰
CREATE VIEW product_performance AS
SELECT 
    p.name as product_name,
    p.category,
    SUM(s.quantity) as total_sold,
    SUM(s.amount) as total_revenue,
    SUM(s.amount) - (SUM(s.quantity) * p.cost) as total_profit,
    AVG(s.amount / s.quantity) as avg_selling_price
FROM sales s
JOIN products p ON s.product = p.name
GROUP BY p.name, p.category;

.exit
EOF

echo "테스트 데이터베이스 생성 완료: test-data.sqlite"