#!/usr/bin/env python3
"""
VibeCraft-viz: React 데이터 시각화 애플리케이션 생성기
메인 진입점
"""

import argparse
import subprocess
import os
import sys
from typing import Dict, Any
from pathlib import Path

from data_processor import DataProcessor
from project_manager import ProjectManager
from settings_manager import GeminiSettingsManager
from prompt_generator import PromptGenerator


class VibeCraftViz:
    def __init__(self):
        self.project_manager = ProjectManager()
        self.data_processor = DataProcessor()
        self.prompt_generator = PromptGenerator()
        self.settings_manager = GeminiSettingsManager()
    
    def process_request(self, user_request: str, data_file: str, template: str) -> Dict[str, Any]:
        """사용자 요청을 처리하고 React 앱을 생성"""
        try:
            # 1. 프로젝트 생성
            project_id, project_path = self.project_manager.create_project()
            print(f"[1/5] 📁 프로젝트 생성: {project_id}")
            
            # 2. 데이터 처리
            data_info = self.data_processor.process_data_to_sqlite(
                data_file, 
                project_path
            )
            print(f"[2/5] 📊 데이터 처리 완료: {data_info['row_count']} rows")
            
            # 3. MCP 설정 생성
            self.settings_manager.create_gemini_settings(
                project_id, 
                project_path
            )
            print(f"[3/5] ⚙️ Gemini 설정 생성 완료")
            
            # 4. 프롬프트 생성
            prompt = self.prompt_generator.generate(
                user_request=user_request,
                template=template,
                data_info=data_info
            )
            
            # 프롬프트를 파일로 저장
            prompt_file = os.path.join(project_path, "prompt.txt")
            with open(prompt_file, 'w', encoding='utf-8') as f:
                f.write(prompt)
            
            print(f"[4/5] 📝 프롬프트 생성 완료")
            
            # 5. Gemini CLI 실행
            print(f"[5/5] 🚀 Gemini CLI 실행 중...")
            react_app_path = self.execute_gemini_cli(
                project_path, 
                prompt
            )
            
            print(f"\n✅ React 앱이 생성되었습니다!")
            print(f"📂 위치: {react_app_path}")
            print(f"\n실행 방법:")
            print(f"cd {react_app_path}")
            print(f"npm install")
            print(f"npm start")
            
            return {
                "success": True,
                "project_id": project_id,
                "app_path": react_app_path
            }
            
        except Exception as e:
            print(f"\n❌ 오류 발생: {e}")
            return {"success": False, "error": str(e)}
    
    def execute_gemini_cli(self, project_path: str, prompt: str) -> str:
        """Gemini CLI를 subprocess로 실행"""
        # Gemini CLI 명령어 구성
        cmd = [
            "gemini",
            "-p", prompt
        ]
        
        # 프로젝트 디렉토리에서 실행
        result = subprocess.run(
            cmd,
            cwd=project_path,
            capture_output=True,
            text=True
        )
        
        if result.returncode != 0:
            raise Exception(f"Gemini CLI 실행 실패: {result.stderr}")
        
        # 생성된 React 앱 경로 반환
        output_path = os.path.join(project_path, "output")
        return output_path


def validate_template(template: str) -> bool:
    """템플릿 타입 검증"""
    valid_templates = [
        'time-series', 'geo-spatial', 'gantt-chart', 
        'kpi-dashboard', 'comparison', 'funnel-analysis',
        'cohort-analysis', 'heatmap', 'network-graph', 'custom'
    ]
    return template in valid_templates


def main():
    """CLI 진입점"""
    parser = argparse.ArgumentParser(
        description="VibeCraft-viz: React 데이터 시각화 앱 생성기",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
사용 가능한 템플릿:
  time-series       시간에 따른 데이터 변화 분석
  geo-spatial       지리적 데이터 시각화
  gantt-chart       프로젝트 일정 관리
  kpi-dashboard     핵심 성과 지표 대시보드
  comparison        비교 분석 대시보드
  funnel-analysis   전환 퍼널 분석
  cohort-analysis   코호트 분석
  heatmap          히트맵 시각화
  network-graph     네트워크 관계 시각화
  custom           사용자 정의

예시:
  vibecraft-viz "월별 매출 추이를 보여주는 대시보드 만들어줘" --data sales.csv --template time-series
        """
    )
    
    parser.add_argument("request", help="시각화 요청 설명")
    parser.add_argument("--data", required=True, help="데이터 파일 경로 (CSV/JSON)")
    parser.add_argument("--template", required=True, help="대시보드 템플릿 타입")
    parser.add_argument("--version", action="version", version="%(prog)s 0.1.0")
    
    args = parser.parse_args()
    
    # 데이터 파일 존재 확인
    if not os.path.exists(args.data):
        print(f"❌ 데이터 파일을 찾을 수 없습니다: {args.data}")
        sys.exit(1)
    
    # 템플릿 타입 검증
    if not validate_template(args.template):
        print(f"❌ 잘못된 템플릿 타입: {args.template}")
        print("사용 가능한 템플릿 타입을 확인하려면 --help 옵션을 사용하세요.")
        sys.exit(1)
    
    # VibeCraft-viz 실행
    viz = VibeCraftViz()
    result = viz.process_request(
        user_request=args.request,
        data_file=args.data,
        template=args.template
    )
    
    sys.exit(0 if result["success"] else 1)


if __name__ == "__main__":
    main()