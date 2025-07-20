"""
데이터 처리 모듈
CSV/JSON 파일을 SQLite 데이터베이스로 변환
"""

import pandas as pd
import sqlite3
import os
import json
from typing import Dict, Any, List
from datetime import datetime


class DataProcessor:
    def __init__(self):
        pass
        
    def process_data_to_sqlite(self, data_path: str, project_path: str) -> Dict[str, Any]:
        """데이터를 SQLite로 변환하여 프로젝트 폴더에 저장"""
        db_path = os.path.join(project_path, "data.sqlite")
        
        # 데이터 형식에 따라 처리
        if data_path.endswith('.csv'):
            result = self._import_csv(data_path, db_path)
        elif data_path.endswith('.json'):
            result = self._import_json(data_path, db_path)
        else:
            raise ValueError(f"지원하지 않는 데이터 형식: {data_path}")
        
        return result
        
    def _import_csv(self, csv_path: str, db_path: str) -> Dict[str, Any]:
        """CSV 파일을 SQLite로 임포트"""
        # CSV 읽기
        df = pd.read_csv(csv_path)
        
        # 날짜 컬럼 감지 및 변환
        date_columns = self._detect_date_columns(df)
        for col in date_columns:
            df[col] = pd.to_datetime(df[col], errors='coerce')
        
        # 데이터 타입 추론
        schema = self._infer_schema(df)
        
        # SQLite에 저장
        conn = sqlite3.connect(db_path)
        table_name = 'data_table'
        
        # DataFrame을 SQLite에 저장
        df.to_sql(table_name, conn, if_exists='replace', index=False)
        
        # 인덱스 생성
        self._create_indexes(conn, table_name, schema)
        
        # 통계 정보 수집
        stats = self._collect_statistics(conn, table_name)
        
        conn.close()
        
        return {
            "table_name": table_name,
            "columns": list(df.columns),
            "row_count": len(df),
            "schema": schema,
            "db_path": db_path,
            "date_columns": date_columns,
            "statistics": stats
        }
    
    def _import_json(self, json_path: str, db_path: str) -> Dict[str, Any]:
        """JSON 파일을 SQLite로 임포트"""
        # JSON 읽기
        with open(json_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        # JSON 데이터를 DataFrame으로 변환
        if isinstance(data, list):
            df = pd.DataFrame(data)
        elif isinstance(data, dict):
            # 첫 번째 키가 데이터 배열을 가리킨다고 가정
            first_key = list(data.keys())[0]
            if isinstance(data[first_key], list):
                df = pd.DataFrame(data[first_key])
            else:
                df = pd.DataFrame([data])
        else:
            raise ValueError("JSON 데이터 형식이 올바르지 않습니다")
        
        # 날짜 컬럼 감지 및 변환
        date_columns = self._detect_date_columns(df)
        for col in date_columns:
            df[col] = pd.to_datetime(df[col], errors='coerce')
        
        # 데이터 타입 추론
        schema = self._infer_schema(df)
        
        # SQLite에 저장
        conn = sqlite3.connect(db_path)
        table_name = 'data_table'
        df.to_sql(table_name, conn, if_exists='replace', index=False)
        
        # 인덱스 생성
        self._create_indexes(conn, table_name, schema)
        
        # 통계 정보 수집
        stats = self._collect_statistics(conn, table_name)
        
        conn.close()
        
        return {
            "table_name": table_name,
            "columns": list(df.columns),
            "row_count": len(df),
            "schema": schema,
            "db_path": db_path,
            "date_columns": date_columns,
            "statistics": stats
        }
    
    def _infer_schema(self, df: pd.DataFrame) -> Dict[str, str]:
        """데이터프레임에서 스키마 추론"""
        type_mapping = {
            'int64': 'INTEGER',
            'float64': 'REAL',
            'object': 'TEXT',
            'datetime64[ns]': 'TEXT',  # ISO 형식으로 저장
            'bool': 'INTEGER'
        }
        
        schema = {}
        for col, dtype in df.dtypes.items():
            schema[col] = type_mapping.get(str(dtype), 'TEXT')
        
        return schema
    
    def _detect_date_columns(self, df: pd.DataFrame) -> List[str]:
        """날짜로 보이는 컬럼 감지"""
        date_columns = []
        date_keywords = ['date', 'time', 'created', 'updated', 'timestamp', 'day', 'month', 'year']
        
        for col in df.columns:
            # 컬럼 이름으로 추론
            if any(keyword in col.lower() for keyword in date_keywords):
                date_columns.append(col)
                continue
            
            # 샘플 데이터로 추론 (처음 10개 행)
            if df[col].dtype == 'object':
                sample = df[col].dropna().head(10)
                if len(sample) > 0:
                    try:
                        pd.to_datetime(sample)
                        date_columns.append(col)
                    except:
                        pass
        
        return date_columns
    
    def _create_indexes(self, conn: sqlite3.Connection, table_name: str, schema: Dict[str, str]) -> None:
        """성능 최적화를 위한 인덱스 생성"""
        cursor = conn.cursor()
        
        # 날짜 타입 컬럼에 인덱스 생성
        for col, dtype in schema.items():
            if 'date' in col.lower() or 'time' in col.lower():
                try:
                    cursor.execute(f"CREATE INDEX idx_{col} ON {table_name}({col})")
                except sqlite3.Error:
                    pass  # 인덱스가 이미 존재하는 경우 무시
        
        conn.commit()
    
    def _collect_statistics(self, conn: sqlite3.Connection, table_name: str) -> Dict[str, Any]:
        """데이터 통계 정보 수집"""
        cursor = conn.cursor()
        
        # 행 수
        cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
        row_count = cursor.fetchone()[0]
        
        # NULL 값 통계
        cursor.execute(f"PRAGMA table_info({table_name})")
        columns = cursor.fetchall()
        
        null_counts = {}
        for col in columns:
            col_name = col[1]
            cursor.execute(f"SELECT COUNT(*) FROM {table_name} WHERE {col_name} IS NULL")
            null_count = cursor.fetchone()[0]
            null_counts[col_name] = null_count
        
        return {
            "row_count": row_count,
            "null_counts": null_counts
        }