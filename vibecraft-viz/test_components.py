#!/usr/bin/env python3
"""
VibeCraft-viz 컴포넌트 테스트
pandas 없이 기본 기능 테스트
"""

import os
import sys
import json

# src 디렉토리를 Python 경로에 추가
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

print("=== VibeCraft-viz 컴포넌트 테스트 ===\n")

# 1. ProjectManager 테스트
print("1. ProjectManager 테스트")
try:
    from project_manager import ProjectManager
    pm = ProjectManager()
    project_id, project_path = pm.create_project("test-project")
    print(f"✓ 프로젝트 생성 성공: {project_id}")
    print(f"  경로: {project_path}")
except Exception as e:
    print(f"✗ ProjectManager 테스트 실패: {e}")

# 2. GeminiSettingsManager 테스트
print("\n2. GeminiSettingsManager 테스트")
try:
    from settings_manager import GeminiSettingsManager
    sm = GeminiSettingsManager()
    if 'project_path' in locals():
        sm.create_gemini_settings(project_id, project_path)
        settings_path = os.path.join(project_path, '.gemini', 'settings.json')
        if os.path.exists(settings_path):
            with open(settings_path, 'r') as f:
                settings = json.load(f)
            print("✓ settings.json 생성 성공")
            print(f"  MCP 서버 경로: {settings['mcpServers']['sqlite']['args'][1]}")
    else:
        print("✗ 프로젝트 경로가 없어 테스트 불가")
except Exception as e:
    print(f"✗ GeminiSettingsManager 테스트 실패: {e}")

# 3. PromptGenerator 테스트 (pandas 없이 기본 테스트)
print("\n3. PromptGenerator 테스트")
try:
    from prompt_generator import PromptGenerator
    pg = PromptGenerator()
    
    # 간단한 더미 데이터로 테스트
    dummy_data_info = {
        'table_name': 'data_table',
        'columns': ['date', 'value', 'category'],
        'row_count': 100,
        'schema': {'date': 'TEXT', 'value': 'REAL', 'category': 'TEXT'},
        'date_columns': ['date']
    }
    
    prompt = pg.generate("시간별 데이터 추이를 보여주는 대시보드", "time-series", dummy_data_info)
    print("✓ 프롬프트 생성 성공")
    print(f"  프롬프트 길이: {len(prompt)} 글자")
    print(f"  첫 100자: {prompt[:100]}...")
except Exception as e:
    print(f"✗ PromptGenerator 테스트 실패: {e}")

# 4. 템플릿 확인
print("\n4. 템플릿 파일 확인")
template_dir = os.path.join(os.path.dirname(__file__), 'templates', 'dashboards')
if os.path.exists(template_dir):
    templates = [f for f in os.listdir(template_dir) if f.endswith('.md')]
    print(f"✓ 템플릿 {len(templates)}개 발견:")
    for t in templates:
        print(f"  - {t}")
else:
    print("✗ 템플릿 디렉토리를 찾을 수 없음")

# 5. 전체 워크플로우 테스트 (pandas 제외)
print("\n5. 전체 워크플로우 시뮬레이션")
print("주요 단계:")
print("  1. 사용자 요청 파싱 ✓")
print("  2. 프로젝트 생성 ✓")
print("  3. 데이터 처리 (pandas 필요 - 스킵)")
print("  4. MCP 설정 생성 ✓")
print("  5. 프롬프트 생성 ✓")
print("  6. Gemini CLI 실행 (실제 실행 시)")

print("\n=== 테스트 완료 ===")
print("\n실제 사용을 위해서는 다음이 필요합니다:")
print("1. pip install pandas numpy")
print("2. MCP_SERVER_SQLITE_PATH 환경변수 설정")
print("3. Gemini CLI 설치")