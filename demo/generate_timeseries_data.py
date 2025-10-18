#!/usr/bin/env python3
"""
Time-Series 데이터 생성 스크립트
IoT 센서 데이터를 시뮬레이션하여 대용량 CSV 생성
"""

import csv
import random
from datetime import datetime, timedelta

def generate_timeseries_csv(filename, num_records=100000):
    """시계열 센서 데이터 생성"""

    # 시작 시간: 1년 전
    start_date = datetime.now() - timedelta(days=365)

    # 센서 ID 목록
    sensor_ids = [f"SENSOR_{i:03d}" for i in range(1, 51)]  # 50개 센서

    # 위치 목록
    locations = [
        "서울", "부산", "대구", "인천", "광주",
        "대전", "울산", "세종", "경기", "강원",
        "충북", "충남", "전북", "전남", "경북", "경남", "제주"
    ]

    print(f"Generating {num_records:,} time-series records...")

    with open(filename, 'w', newline='', encoding='utf-8') as csvfile:
        fieldnames = [
            'timestamp', 'sensor_id', 'location', 'device_type',
            'temperature', 'humidity', 'pressure', 'co2_level',
            'light_level', 'motion_detected', 'battery_level', 'status'
        ]
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        writer.writeheader()

        current_time = start_date
        time_increment = timedelta(minutes=5)  # 5분 간격

        # 각 센서별 베이스라인 값 (자연스러운 변화를 위해)
        sensor_baselines = {
            sensor_id: {
                'temp': random.uniform(18, 25),
                'humidity': random.uniform(40, 60),
                'pressure': random.uniform(990, 1020),
            }
            for sensor_id in sensor_ids
        }

        for i in range(num_records):
            sensor_id = random.choice(sensor_ids)
            baseline = sensor_baselines[sensor_id]

            # 시간대별 패턴 추가 (낮/밤)
            hour = current_time.hour
            day_factor = 1.0 if 6 <= hour <= 18 else 0.8

            # 계절별 패턴 추가
            month = current_time.month
            season_factor = 1.0
            if month in [12, 1, 2]:  # 겨울
                season_factor = 0.7
            elif month in [6, 7, 8]:  # 여름
                season_factor = 1.3

            record = {
                'timestamp': current_time.strftime('%Y-%m-%d %H:%M:%S'),
                'sensor_id': sensor_id,
                'location': random.choice(locations),
                'device_type': random.choice(['Indoor', 'Outdoor', 'Industrial', 'Smart Home']),
                'temperature': round(baseline['temp'] + random.uniform(-3, 3) * season_factor, 2),
                'humidity': round(baseline['humidity'] + random.uniform(-10, 10), 2),
                'pressure': round(baseline['pressure'] + random.uniform(-5, 5), 2),
                'co2_level': round(random.uniform(300, 1200) * day_factor, 1),
                'light_level': round(random.uniform(0, 1000) * day_factor, 1),
                'motion_detected': random.choice([0, 0, 0, 1]) if day_factor > 0.9 else 0,
                'battery_level': max(0, 100 - (i / num_records * 100) + random.uniform(-5, 5)),
                'status': random.choices(
                    ['normal', 'warning', 'critical'],
                    weights=[85, 12, 3]
                )[0]
            }

            writer.writerow(record)

            # 시간 증가
            current_time += time_increment

            if (i + 1) % 10000 == 0:
                print(f"  Progress: {i+1:,} / {num_records:,} ({(i+1)/num_records*100:.1f}%)")

    print(f"✅ Time-series CSV generated: {filename}")

if __name__ == "__main__":
    generate_timeseries_csv("demo/timeseries_data.csv", num_records=100000)
