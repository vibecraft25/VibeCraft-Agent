"""
프로젝트 관리 모듈
프로젝트 생성 및 메타데이터 관리
"""

import os
import json
import uuid
from datetime import datetime
from typing import Tuple, Dict, Any, List


class ProjectManager:
    """프로젝트 생성 및 관리"""
    
    def __init__(self, base_dir: str = None):
        if base_dir:
            self.projects_dir = os.path.join(base_dir, "projects")
        else:
            # 현재 디렉토리 기준으로 프로젝트 폴더 생성
            self.projects_dir = os.path.join(os.getcwd(), "projects")
        
        os.makedirs(self.projects_dir, exist_ok=True)
    
    def create_project(self, name: str = None) -> Tuple[str, str]:
        """새 프로젝트 생성 및 ID, 경로 반환"""
        timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
        unique_id = uuid.uuid4().hex[:8]
        
        # 프로젝트 ID 생성
        if name:
            # 이름에서 특수문자 제거
            safe_name = "".join(c for c in name if c.isalnum() or c in ('-', '_'))[:20]
            project_id = f"{timestamp}-{safe_name}-{unique_id}"
        else:
            project_id = f"{timestamp}-{unique_id}"
        
        # 프로젝트 디렉토리 생성
        project_dir = os.path.join(self.projects_dir, project_id)
        os.makedirs(project_dir, exist_ok=True)
        
        # output 디렉토리 미리 생성
        output_dir = os.path.join(project_dir, "output")
        os.makedirs(output_dir, exist_ok=True)
        
        # 프로젝트 메타데이터 저장
        metadata = {
            "id": project_id,
            "name": name,
            "created_at": datetime.now().isoformat(),
            "status": "active",
            "vibecraft_version": "0.1.0"
        }
        
        metadata_path = os.path.join(project_dir, "metadata.json")
        with open(metadata_path, 'w', encoding='utf-8') as f:
            json.dump(metadata, f, indent=2, ensure_ascii=False)
        
        return project_id, project_dir
    
    def get_project_path(self, project_id: str) -> str:
        """프로젝트 ID로 경로 조회"""
        return os.path.join(self.projects_dir, project_id)
    
    def list_projects(self) -> List[Dict[str, Any]]:
        """모든 프로젝트 목록 조회"""
        projects = []
        
        if not os.path.exists(self.projects_dir):
            return projects
        
        for project_id in os.listdir(self.projects_dir):
            project_dir = os.path.join(self.projects_dir, project_id)
            if os.path.isdir(project_dir):
                metadata_path = os.path.join(project_dir, "metadata.json")
                if os.path.exists(metadata_path):
                    try:
                        with open(metadata_path, 'r', encoding='utf-8') as f:
                            metadata = json.load(f)
                            projects.append({
                                "id": project_id,
                                "name": metadata.get("name", ""),
                                "created_at": metadata.get("created_at", ""),
                                "status": metadata.get("status", "unknown"),
                                "path": project_dir
                            })
                    except json.JSONDecodeError:
                        continue
        
        # 생성 날짜 기준 정렬 (최신순)
        projects.sort(key=lambda x: x["created_at"], reverse=True)
        return projects
    
    def update_project_status(self, project_id: str, status: str) -> None:
        """프로젝트 상태 업데이트"""
        project_dir = self.get_project_path(project_id)
        metadata_path = os.path.join(project_dir, "metadata.json")
        
        if os.path.exists(metadata_path):
            with open(metadata_path, 'r', encoding='utf-8') as f:
                metadata = json.load(f)
            
            metadata["status"] = status
            metadata["updated_at"] = datetime.now().isoformat()
            
            with open(metadata_path, 'w', encoding='utf-8') as f:
                json.dump(metadata, f, indent=2, ensure_ascii=False)
    
    def delete_project(self, project_id: str) -> bool:
        """프로젝트 삭제"""
        import shutil
        
        project_dir = self.get_project_path(project_id)
        if os.path.exists(project_dir):
            try:
                shutil.rmtree(project_dir)
                return True
            except Exception as e:
                print(f"프로젝트 삭제 실패: {e}")
                return False
        return False