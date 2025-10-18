#!/usr/bin/env python3
"""
Geo-Spatial 데이터 생성 스크립트
전국 매장/사업장 위치 데이터 생성
"""

import csv
import random
from datetime import datetime, timedelta

def generate_geospatial_csv(filename, num_records=80000):
    """지리공간 매장 데이터 생성"""

    # 대한민국 주요 도시 좌표 범위
    city_coords = {
        "서울": {"lat": (37.4, 37.7), "lng": (126.8, 127.2)},
        "부산": {"lat": (35.0, 35.3), "lng": (128.9, 129.2)},
        "대구": {"lat": (35.7, 36.0), "lng": (128.4, 128.8)},
        "인천": {"lat": (37.3, 37.6), "lng": (126.5, 126.9)},
        "광주": {"lat": (35.0, 35.3), "lng": (126.7, 127.0)},
        "대전": {"lat": (36.2, 36.5), "lng": (127.3, 127.5)},
        "울산": {"lat": (35.4, 35.7), "lng": (129.2, 129.5)},
        "세종": {"lat": (36.4, 36.6), "lng": (127.2, 127.4)},
        "수원": {"lat": (37.2, 37.4), "lng": (126.9, 127.1)},
        "성남": {"lat": (37.3, 37.5), "lng": (127.1, 127.3)},
        "고양": {"lat": (37.6, 37.8), "lng": (126.8, 127.0)},
        "용인": {"lat": (37.2, 37.4), "lng": (127.1, 127.3)},
        "청주": {"lat": (36.5, 36.8), "lng": (127.4, 127.6)},
        "천안": {"lat": (36.7, 37.0), "lng": (127.0, 127.3)},
        "전주": {"lat": (35.7, 36.0), "lng": (127.0, 127.3)},
        "포항": {"lat": (35.9, 36.2), "lng": (129.2, 129.5)},
        "창원": {"lat": (35.1, 35.4), "lng": (128.5, 128.8)},
        "제주": {"lat": (33.4, 33.6), "lng": (126.4, 126.7)},
    }

    # 업종 분류
    business_types = [
        "카페", "편의점", "음식점", "베이커리", "서점",
        "의류매장", "화장품", "전자제품", "약국", "은행",
        "헬스클럽", "학원", "병원", "주유소", "슈퍼마켓"
    ]

    # 브랜드명
    brands = [
        "스타벅스", "이디야", "투썸", "빽다방", "메가커피",
        "CU", "GS25", "세븐일레븐", "이마트24",
        "맥도날드", "버거킹", "롯데리아", "KFC",
        "올리브영", "다이소", "이마트", "홈플러스"
    ]

    print(f"Generating {num_records:,} geo-spatial records...")

    with open(filename, 'w', newline='', encoding='utf-8') as csvfile:
        fieldnames = [
            'store_id', 'store_name', 'business_type', 'brand',
            'city', 'district', 'address',
            'latitude', 'longitude',
            'opening_date', 'square_meters', 'employees',
            'monthly_revenue', 'customer_rating', 'delivery_available',
            'parking_available', 'status'
        ]
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        writer.writeheader()

        for i in range(num_records):
            city = random.choice(list(city_coords.keys()))
            coords = city_coords[city]

            # 좌표 생성 (정규분포를 사용해 도심에 집중)
            lat = random.gauss(
                (coords['lat'][0] + coords['lat'][1]) / 2,
                (coords['lat'][1] - coords['lat'][0]) / 6
            )
            lng = random.gauss(
                (coords['lng'][0] + coords['lng'][1]) / 2,
                (coords['lng'][1] - coords['lng'][0]) / 6
            )

            # 좌표 범위 제한
            lat = max(coords['lat'][0], min(coords['lat'][1], lat))
            lng = max(coords['lng'][0], min(coords['lng'][1], lng))

            business_type = random.choice(business_types)
            brand = random.choice(brands) if random.random() > 0.3 else None

            # 개업일 (최근 10년 내)
            opening_date = datetime.now() - timedelta(days=random.randint(0, 3650))

            # 영업 기간에 따른 매출 조정
            days_open = (datetime.now() - opening_date).days
            revenue_factor = min(1.0, days_open / 365)

            record = {
                'store_id': f"STORE_{i+1:06d}",
                'store_name': f"{brand or business_type} {city}{random.randint(1, 999)}호점" if brand else f"{business_type} {city}{random.randint(1, 999)}",
                'business_type': business_type,
                'brand': brand or 'Independent',
                'city': city,
                'district': f"{random.choice(['동', '서', '남', '북', '중'])}{random.randint(1, 30)}동",
                'address': f"{city} {random.choice(['중앙로', '역삼로', '테헤란로', '강남대로', '신촌로'])} {random.randint(1, 500)}",
                'latitude': round(lat, 6),
                'longitude': round(lng, 6),
                'opening_date': opening_date.strftime('%Y-%m-%d'),
                'square_meters': round(random.uniform(30, 500), 1),
                'employees': random.randint(2, 50),
                'monthly_revenue': round(random.uniform(5000000, 100000000) * revenue_factor, 0),
                'customer_rating': round(random.uniform(3.0, 5.0), 1),
                'delivery_available': random.choice([0, 1]),
                'parking_available': random.choice([0, 1]),
                'status': random.choices(
                    ['active', 'closed', 'renovation'],
                    weights=[90, 8, 2]
                )[0]
            }

            writer.writerow(record)

            if (i + 1) % 10000 == 0:
                print(f"  Progress: {i+1:,} / {num_records:,} ({(i+1)/num_records*100:.1f}%)")

    print(f"✅ Geo-spatial CSV generated: {filename}")

if __name__ == "__main__":
    generate_geospatial_csv("demo/geospatial_data.csv", num_records=80000)
