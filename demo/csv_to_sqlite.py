#!/usr/bin/env python3
"""
CSV를 SQLite로 변환하는 통합 스크립트
"""

import csv
import sqlite3
import os
from pathlib import Path

def infer_sql_type(value):
    """값의 타입을 추론하여 SQL 타입 반환"""
    try:
        int(value)
        return "INTEGER"
    except ValueError:
        pass

    try:
        float(value)
        return "REAL"
    except ValueError:
        pass

    return "TEXT"

def csv_to_sqlite(csv_file, sqlite_file, table_name):
    """CSV 파일을 SQLite 데이터베이스로 변환"""

    print(f"\n{'='*60}")
    print(f"Converting: {csv_file}")
    print(f"To: {sqlite_file}")
    print(f"Table: {table_name}")
    print(f"{'='*60}")

    if not os.path.exists(csv_file):
        print(f"❌ CSV file not found: {csv_file}")
        return False

    # CSV 파일 읽기
    with open(csv_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        rows = list(reader)
        fieldnames = reader.fieldnames

    if not rows:
        print(f"❌ CSV file is empty: {csv_file}")
        return False

    print(f"📊 Total rows: {len(rows):,}")
    print(f"📋 Columns: {len(fieldnames)}")

    # 각 컬럼의 타입 추론 (첫 100개 행 샘플링)
    column_types = {}
    sample_size = min(100, len(rows))

    for col in fieldnames:
        types = set()
        for row in rows[:sample_size]:
            if row[col] and row[col].strip():
                types.add(infer_sql_type(row[col]))

        # INTEGER와 REAL이 섞여있으면 REAL 사용
        if "INTEGER" in types and "REAL" in types:
            column_types[col] = "REAL"
        elif "REAL" in types:
            column_types[col] = "REAL"
        elif "INTEGER" in types:
            column_types[col] = "INTEGER"
        else:
            column_types[col] = "TEXT"

    # SQLite 연결
    conn = sqlite3.connect(sqlite_file)
    cursor = conn.cursor()

    # 기존 테이블 삭제
    cursor.execute(f"DROP TABLE IF EXISTS {table_name}")

    # 테이블 생성
    columns_def = ", ".join([f'"{col}" {column_types[col]}' for col in fieldnames])
    create_table_sql = f"CREATE TABLE {table_name} ({columns_def})"

    print(f"\n📝 Creating table with schema:")
    for col in fieldnames:
        print(f"  - {col}: {column_types[col]}")

    cursor.execute(create_table_sql)

    # 데이터 삽입
    placeholders = ", ".join(["?" for _ in fieldnames])
    columns_str = ", ".join([f'"{col}"' for col in fieldnames])
    insert_sql = f'INSERT INTO {table_name} ({columns_str}) VALUES ({placeholders})'

    batch_size = 1000
    total_inserted = 0

    for i in range(0, len(rows), batch_size):
        batch = rows[i:i+batch_size]
        values = []

        for row in batch:
            row_values = []
            for col in fieldnames:
                value = row[col]
                if not value or value.strip() == '':
                    row_values.append(None)
                else:
                    # 타입 변환
                    if column_types[col] == "INTEGER":
                        try:
                            row_values.append(int(float(value)))
                        except ValueError:
                            row_values.append(None)
                    elif column_types[col] == "REAL":
                        try:
                            row_values.append(float(value))
                        except ValueError:
                            row_values.append(None)
                    else:
                        row_values.append(value)

            values.append(tuple(row_values))

        cursor.executemany(insert_sql, values)
        total_inserted += len(values)

        if total_inserted % 10000 == 0:
            print(f"  Progress: {total_inserted:,} / {len(rows):,} ({total_inserted/len(rows)*100:.1f}%)")

    conn.commit()

    # 통계 정보
    cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
    count = cursor.fetchone()[0]

    print(f"\n✅ Conversion complete!")
    print(f"  - Rows inserted: {count:,}")

    # 파일 크기
    file_size = os.path.getsize(sqlite_file)
    print(f"  - SQLite file size: {file_size / 1024 / 1024:.2f} MB")

    conn.close()
    return True

def main():
    """메인 함수"""

    demo_dir = Path(__file__).parent

    conversions = [
        {
            "csv": demo_dir / "timeseries_data.csv",
            "sqlite": demo_dir / "timeseries.sqlite",
            "table": "sensor_readings"
        },
        {
            "csv": demo_dir / "geospatial_data.csv",
            "sqlite": demo_dir / "geospatial.sqlite",
            "table": "stores"
        },
        {
            "csv": demo_dir / "kpi_data.csv",
            "sqlite": demo_dir / "kpi.sqlite",
            "table": "transactions"
        }
    ]

    print("\n" + "="*60)
    print("CSV to SQLite Conversion Tool")
    print("="*60)

    success_count = 0
    for conv in conversions:
        if csv_to_sqlite(str(conv["csv"]), str(conv["sqlite"]), conv["table"]):
            success_count += 1

    print("\n" + "="*60)
    print(f"Summary: {success_count}/{len(conversions)} conversions successful")
    print("="*60 + "\n")

if __name__ == "__main__":
    main()
