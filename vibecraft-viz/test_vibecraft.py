#!/usr/bin/env python3
"""
VibeCraft-viz 컴포넌트별 테스트
"""

import os
import sys
from pathlib import Path

# src 디렉토리를 Python 경로에 추가
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

from data_processor import DataProcessor
from project_manager import ProjectManager
from prompt_generator import PromptGenerator
from settings_manager import GeminiSettingsManager

def test_components():
    print("=== VibeCraft-viz 컴포넌트 테스트 ===\n")
    
    # 1. ProjectManager 테스트
    print("[1] ProjectManager 테스트")
    pm = ProjectManager()
    project_id, project_path = pm.create_project(name="test-project")
    print(f"✅ 프로젝트 생성: {project_id}")
    print(f"   경로: {project_path}")
    
    # 2. DataProcessor 테스트
    print("\n[2] DataProcessor 테스트")
    dp = DataProcessor()
    data_info = dp.process_data_to_sqlite("test_data/sales.csv", project_path)
    print(f"✅ 데이터 처리 완료")
    print(f"   테이블: {data_info['table_name']}")
    print(f"   행 수: {data_info['row_count']}")
    print(f"   컬럼: {', '.join(data_info['columns'])}")
    if data_info.get('date_columns'):
        print(f"   날짜 컬럼: {', '.join(data_info['date_columns'])}")
    
    # 3. SettingsManager 테스트
    print("\n[3] SettingsManager 테스트")
    sm = GeminiSettingsManager()
    print(f"   MCP 서버 경로: {sm.mcp_server_path}")
    print(f"   경로 유효성: {sm.check_mcp_server_availability()}")
    sm.update_gemini_settings(project_id, project_path)
    print("✅ .gemini/settings.json 업데이트 완료")
    
    if sm.validate_settings():
        settings = sm.get_settings()
        print("✅ settings.json 검증 성공")
        db_path = settings['mcpServers']['sqlite']['args'][-1]
        print(f"   SQLite 경로: {db_path}")
    
    # 4. PromptGenerator 테스트
    print("\n[4] PromptGenerator 테스트")
    pg = PromptGenerator()
    prompt = pg.generate(
        user_request="월별 매출 추이를 보여주는 대시보드 만들어줘",
        template="time-series",
        data_info=data_info
    )
    print("✅ 프롬프트 생성 완료")
    print(f"   프롬프트 길이: {len(prompt)} 문자")
    
    # 프롬프트 파일 저장
    prompt_file = os.path.join(project_path, "prompt.txt")
    with open(prompt_file, 'w', encoding='utf-8') as f:
        f.write(prompt)
    print(f"   저장 위치: {prompt_file}")
    
    # 5. 생성된 파일 확인
    print("\n[5] 생성된 파일 확인")
    files = os.listdir(project_path)
    for file in sorted(files):
        file_path = os.path.join(project_path, file)
        if os.path.isfile(file_path):
            size = os.path.getsize(file_path)
            print(f"   - {file} ({size:,} bytes)")
    
    return project_path

if __name__ == "__main__":
    try:
        project_path = test_components()
        print(f"\n✅ 모든 테스트 완료!")
        print(f"프로젝트 위치: {project_path}")
    except Exception as e:
        print(f"\n❌ 테스트 실패: {e}")
        import traceback
        traceback.print_exc()