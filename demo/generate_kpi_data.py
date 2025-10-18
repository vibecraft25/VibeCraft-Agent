#!/usr/bin/env python3
"""
KPI Dashboard 데이터 생성 스크립트
비즈니스 성과 지표 데이터 생성
"""

import csv
import random
from datetime import datetime, timedelta

def generate_kpi_csv(filename, num_records=100000):
    """KPI 대시보드 데이터 생성"""

    # 시작 날짜: 5년 전
    start_date = datetime.now() - timedelta(days=1825)

    # 제품 카테고리
    categories = [
        "전자제품", "의류", "식품", "화장품", "도서",
        "스포츠용품", "가구", "생활용품", "완구", "건강식품"
    ]

    # 판매 채널
    channels = ["온라인", "오프라인", "모바일앱", "전화주문", "도매"]

    # 지역
    regions = [
        "서울", "경기", "인천", "부산", "대구",
        "광주", "대전", "울산", "강원", "충북",
        "충남", "전북", "전남", "경북", "경남", "제주"
    ]

    # 고객 세그먼트
    customer_segments = ["VIP", "일반", "신규", "휴면복귀", "단골"]

    print(f"Generating {num_records:,} KPI records...")

    with open(filename, 'w', newline='', encoding='utf-8') as csvfile:
        fieldnames = [
            'transaction_id', 'date', 'year', 'quarter', 'month', 'weekday',
            'category', 'product_name', 'channel', 'region',
            'customer_segment', 'customer_id',
            'quantity_sold', 'unit_price', 'total_revenue', 'cost',
            'profit', 'discount_rate',
            'customer_satisfaction', 'return_flag',
            'marketing_cost', 'acquisition_cost',
            'lifetime_value', 'churn_risk'
        ]
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        writer.writeheader()

        current_date = start_date
        customer_ltv = {}  # 고객별 LTV 추적

        for i in range(num_records):
            # 날짜 증가 (무작위)
            current_date += timedelta(minutes=random.randint(1, 120))

            category = random.choice(categories)
            channel = random.choice(channels)
            region = random.choice(regions)
            segment = random.choice(customer_segments)
            customer_id = f"CUST_{random.randint(1, 50000):06d}"

            # 채널별 가격 조정
            channel_multiplier = {
                "온라인": 0.9,
                "오프라인": 1.0,
                "모바일앱": 0.85,
                "전화주문": 1.05,
                "도매": 0.7
            }

            # 세그먼트별 할인율
            segment_discount = {
                "VIP": 0.15,
                "일반": 0.05,
                "신규": 0.10,
                "휴면복귀": 0.20,
                "단골": 0.08
            }

            # 기본 가격 및 수량
            unit_price = round(random.uniform(5000, 500000) * channel_multiplier[channel], 0)
            quantity = random.randint(1, 10)
            discount = segment_discount[segment]

            # 수익 계산
            total_revenue = unit_price * quantity * (1 - discount)
            cost = total_revenue * random.uniform(0.4, 0.7)
            profit = total_revenue - cost

            # 마케팅 비용 (신규 고객은 높음)
            marketing_cost = random.uniform(5000, 50000) if segment == "신규" else random.uniform(1000, 10000)

            # LTV 계산 (고객별 누적)
            if customer_id not in customer_ltv:
                customer_ltv[customer_id] = 0
            customer_ltv[customer_id] += profit
            ltv = customer_ltv[customer_id]

            # 요일 효과 (주말 = 더 많은 거래)
            weekday = current_date.weekday()
            is_weekend = weekday >= 5

            # 계절 효과
            month = current_date.month
            season_factor = 1.0
            if month in [11, 12]:  # 연말
                season_factor = 1.5
            elif month in [1, 2]:  # 설 연휴
                season_factor = 1.3

            record = {
                'transaction_id': f"TXN_{i+1:08d}",
                'date': current_date.strftime('%Y-%m-%d'),
                'year': current_date.year,
                'quarter': f"Q{(current_date.month-1)//3 + 1}",
                'month': current_date.month,
                'weekday': weekday,
                'category': category,
                'product_name': f"{category}_{random.randint(1, 1000):04d}",
                'channel': channel,
                'region': region,
                'customer_segment': segment,
                'customer_id': customer_id,
                'quantity_sold': quantity,
                'unit_price': round(unit_price, 0),
                'total_revenue': round(total_revenue, 0),
                'cost': round(cost, 0),
                'profit': round(profit, 0),
                'discount_rate': round(discount * 100, 1),
                'customer_satisfaction': round(random.uniform(3.0, 5.0), 1),
                'return_flag': random.choices([0, 1], weights=[95, 5])[0],
                'marketing_cost': round(marketing_cost, 0),
                'acquisition_cost': round(random.uniform(10000, 100000), 0) if segment == "신규" else 0,
                'lifetime_value': round(ltv, 0),
                'churn_risk': round(random.uniform(0, 1), 3)
            }

            writer.writerow(record)

            if (i + 1) % 10000 == 0:
                print(f"  Progress: {i+1:,} / {num_records:,} ({(i+1)/num_records*100:.1f}%)")

    print(f"✅ KPI CSV generated: {filename}")

if __name__ == "__main__":
    generate_kpi_csv("demo/kpi_data.csv", num_records=100000)
