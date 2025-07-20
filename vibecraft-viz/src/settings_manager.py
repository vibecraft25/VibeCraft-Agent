"""
Gemini CLI 설정 관리 모듈
.gemini/settings.json 파일 생성 및 관리
"""

import os
import json
from typing import Dict, Any


class GeminiSettingsManager:
    """.gemini/settings.json 생성 및 관리"""
    
    def __init__(self, mcp_server_path: str = None):
        # MCP 서버 경로 설정 (기본값은 환경변수에서 가져오기)
        if mcp_server_path:
            self.mcp_server_path = mcp_server_path
        else:
            self.mcp_server_path = os.environ.get(
                'MCP_SERVER_SQLITE_PATH', 
                '/path/to/mcp-server-sqlite'
            )
    
    def create_gemini_settings(self, project_id: str, project_path: str) -> None:
        """Gemini CLI를 위한 settings.json 생성"""
        gemini_dir = os.path.join(project_path, '.gemini')
        db_path = os.path.join(project_path, 'data.sqlite')
        
        # .gemini 디렉토리 생성
        os.makedirs(gemini_dir, exist_ok=True)
        
        # 절대 경로로 변환
        absolute_db_path = os.path.abspath(db_path)
        absolute_mcp_path = os.path.abspath(self.mcp_server_path)
        
        # settings.json 생성
        settings = {
            "mcpServers": {
                "sqlite": {
                    "command": "uv",
                    "args": [
                        "--directory",
                        absolute_mcp_path,
                        "run",
                        "mcp-server-sqlite",
                        "--db-path",
                        absolute_db_path
                    ]
                }
            }
        }
        
        # settings.json 저장
        settings_path = os.path.join(gemini_dir, 'settings.json')
        with open(settings_path, 'w', encoding='utf-8') as f:
            json.dump(settings, f, indent=2, ensure_ascii=False)
        
        # .gemini 디렉토리 권한 설정 (읽기/쓰기 가능)
        os.chmod(gemini_dir, 0o755)
        os.chmod(settings_path, 0o644)
    
    def update_mcp_server_path(self, new_path: str) -> None:
        """MCP 서버 경로 업데이트"""
        self.mcp_server_path = new_path
    
    def validate_settings(self, project_path: str) -> bool:
        """설정 파일 유효성 검증"""
        settings_path = os.path.join(project_path, '.gemini', 'settings.json')
        
        if not os.path.exists(settings_path):
            return False
        
        try:
            with open(settings_path, 'r', encoding='utf-8') as f:
                settings = json.load(f)
            
            # 필수 키 확인
            if 'mcpServers' not in settings:
                return False
            
            if 'sqlite' not in settings['mcpServers']:
                return False
            
            sqlite_config = settings['mcpServers']['sqlite']
            if 'command' not in sqlite_config or 'args' not in sqlite_config:
                return False
            
            return True
        
        except (json.JSONDecodeError, KeyError):
            return False
    
    def get_settings(self, project_path: str) -> Dict[str, Any]:
        """설정 파일 읽기"""
        settings_path = os.path.join(project_path, '.gemini', 'settings.json')
        
        if not os.path.exists(settings_path):
            raise FileNotFoundError(f"설정 파일을 찾을 수 없습니다: {settings_path}")
        
        with open(settings_path, 'r', encoding='utf-8') as f:
            return json.load(f)