"""
Gemini CLI 설정 관리 모듈
.gemini/settings.json 파일 생성 및 관리
"""

import os
import json
import subprocess
from typing import Dict, Any


class GeminiSettingsManager:
    """.gemini/settings.json 업데이트 및 관리 (VibeCraft-viz 루트)"""
    
    def __init__(self):
        # VibeCraft-viz 루트 디렉토리
        self.vibecraft_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        
        # MCP 서버 실행 로직 - 로컬에서 직접 실행
        self.use_local_mcp = True  # 현재 프로젝트에 설치된 mcp-server-sqlite 사용
        
        print(f"🔧 MCP 서버 설정: uv run mcp-server-sqlite")
    
    def update_gemini_settings(self, project_id: str, project_path: str) -> None:
        """VibeCraft-viz 루트의 settings.json 업데이트"""
        # VibeCraft-viz 루트의 .gemini 디렉토리
        gemini_dir = os.path.join(self.vibecraft_root, '.gemini')
        db_path = os.path.join(project_path, 'data.sqlite')
        
        # .gemini 디렉토리 생성
        os.makedirs(gemini_dir, exist_ok=True)
        
        # 절대 경로로 변환
        absolute_db_path = os.path.abspath(db_path)
        
        # settings.json 업데이트 (루트에 하나만 유지)
        settings = {
            "mcp": {
                "servers": {
                    "sqlite": {
                        "command": "uv",
                        "args": [
                            "run",
                            "mcp-server-sqlite",
                            "--db-path",
                            absolute_db_path
                        ]
                    }
                }
            }
        }
        
        # settings.json 저장 (VibeCraft-viz 루트)
        settings_path = os.path.join(gemini_dir, 'settings.json')
        with open(settings_path, 'w', encoding='utf-8') as f:
            json.dump(settings, f, indent=2, ensure_ascii=False)
        
        # .gemini 디렉토리 권한 설정 (읽기/쓰기 가능)
        os.chmod(gemini_dir, 0o755)
        os.chmod(settings_path, 0o644)
        
        # MCP 서버 연결 테스트
        print("   🔍 MCP 서버 설정 확인:")
        print(f"      - DB 파일: {absolute_db_path}")
        print(f"      - DB 존재: {'✅' if os.path.exists(absolute_db_path) else '❌'}")
        print(f"      - MCP 서버: uv run mcp-server-sqlite (로컬 설치)")
    
    def validate_settings(self) -> bool:
        """루트 설정 파일 유효성 검증"""
        settings_path = os.path.join(self.vibecraft_root, '.gemini', 'settings.json')
        
        if not os.path.exists(settings_path):
            return False
        
        try:
            with open(settings_path, 'r', encoding='utf-8') as f:
                settings = json.load(f)
            
            # 필수 키 확인
            if 'mcp' not in settings:
                return False
            
            if 'servers' not in settings['mcp']:
                return False
            
            if 'sqlite' not in settings['mcp']['servers']:
                return False
            
            sqlite_config = settings['mcp']['servers']['sqlite']
            if 'command' not in sqlite_config or 'args' not in sqlite_config:
                return False
            
            return True
        
        except (json.JSONDecodeError, KeyError):
            return False
    
    def get_settings(self) -> Dict[str, Any]:
        """루트 설정 파일 읽기"""
        settings_path = os.path.join(self.vibecraft_root, '.gemini', 'settings.json')
        
        if not os.path.exists(settings_path):
            raise FileNotFoundError(f"설정 파일을 찾을 수 없습니다: {settings_path}")
        
        with open(settings_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    
    def check_mcp_server_availability(self) -> bool:
        """MCP 서버 실행 가능 여부 확인"""
        print("\n   🔍 MCP 서버 가용성 확인...")
        try:
            # uv 명령어 존재 여부 확인
            result = subprocess.run(
                ["which", "uv"],
                capture_output=True,
                text=True
            )
            if result.returncode != 0:
                print("   ⚠️  uv 명령어를 찾을 수 없습니다. uv를 설치해주세요.")
                return False
            else:
                print(f"   ✅ uv 위치: {result.stdout.strip()}")
            
            # mcp-server-sqlite 패키지 확인
            print("   🔍 MCP SQLite 서버 확인 중...")
            test_cmd = [
                "uv", "run", "mcp-server-sqlite", "--help"
            ]
            result = subprocess.run(
                test_cmd,
                capture_output=True,
                text=True
            )
            if result.returncode == 0:
                print("   ✅ MCP SQLite 서버 사용 가능")
                return True
            else:
                print(f"   ❌ MCP SQLite 서버 실행 실패: {result.stderr}")
                return False
        except Exception as e:
            print(f"   ❌ MCP 서버 확인 중 오류: {e}")
            return False