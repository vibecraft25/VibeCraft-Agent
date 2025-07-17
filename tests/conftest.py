"""
pytest 설정 파일
"""

import os
import sys
import pytest
from pathlib import Path

# 부모 디렉토리를 Python 경로에 추가
sys.path.insert(0, str(Path(__file__).parent.parent))


@pytest.fixture(autouse=True)
def reset_environment():
    """각 테스트 전후로 환경을 초기화"""
    # 테스트 전 환경 변수 백업
    original_env = os.environ.copy()
    
    yield
    
    # 테스트 후 환경 변수 복원
    os.environ.clear()
    os.environ.update(original_env)


@pytest.fixture
def sample_csv_data(tmp_path):
    """샘플 CSV 데이터 파일 생성"""
    csv_file = tmp_path / "sample_data.csv"
    csv_file.write_text("""날짜,판매량,수익
2024-01-01,100,50000
2024-01-02,150,75000
2024-01-03,120,60000
2024-01-04,180,90000
2024-01-05,200,100000
""")
    return str(csv_file)


@pytest.fixture
def sample_json_data(tmp_path):
    """샘플 JSON 데이터 파일 생성"""
    json_file = tmp_path / "sample_data.json"
    json_file.write_text("""{
  "data": [
    {"date": "2024-01-01", "sales": 100, "revenue": 50000},
    {"date": "2024-01-02", "sales": 150, "revenue": 75000},
    {"date": "2024-01-03", "sales": 120, "revenue": 60000},
    {"date": "2024-01-04", "sales": 180, "revenue": 90000},
    {"date": "2024-01-05", "sales": 200, "revenue": 100000}
  ]
}""")
    return str(json_file)


@pytest.fixture
def mock_gemini_env(tmp_path):
    """Gemini 실행에 필요한 환경 설정"""
    # 시스템 프롬프트 파일 생성
    system_prompt = tmp_path / "vibecraft-system-prompt.md"
    system_prompt.write_text("""# VibeCraft System Prompt
데이터 시각화를 생성하는 시스템 프롬프트입니다.
""")
    
    verbose_prompt = tmp_path / "vibecraft-system-prompt-verbose.md"
    verbose_prompt.write_text("""# VibeCraft Verbose System Prompt
상세 출력을 포함한 시스템 프롬프트입니다.
""")
    
    # 환경 변수 설정
    os.environ['GOOGLE_CLOUD_PROJECT'] = 'test-project'
    os.environ['GEMINI_SYSTEM_MD'] = str(system_prompt)
    
    return {
        'system_prompt': system_prompt,
        'verbose_prompt': verbose_prompt,
        'work_dir': tmp_path
    }