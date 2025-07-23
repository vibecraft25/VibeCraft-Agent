#!/usr/bin/env python3
"""
VibeCraft-viz: React 데이터 시각화 애플리케이션 생성기
메인 진입점
"""

import argparse
import subprocess
import os
import sys
import shutil
import json
import re
from typing import Dict, Any, List
from pathlib import Path

# .env 파일 로드
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

try:
    from data_processor import DataProcessor
    from project_manager import ProjectManager
    from settings_manager import GeminiSettingsManager
    from prompt_generator import PromptGenerator
except ImportError:
    # 상대 경로로 import 시도
    from .data_processor import DataProcessor
    from .project_manager import ProjectManager
    from .settings_manager import GeminiSettingsManager
    from .prompt_generator import PromptGenerator


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
            
            # 3. MCP 설정 업데이트 (루트)
            self.settings_manager.update_gemini_settings(
                project_id, 
                project_path
            )
            print(f"[3/5] ⚙️ Gemini 설정 업데이트 완료")
            
            # MCP 서버 테스트
            if self.settings_manager.check_mcp_server_availability():
                print(f"   ✅ MCP 서버 사용 가능")
            else:
                print(f"   ⚠️  MCP 서버를 사용할 수 없습니다")
            
            # 4. 프롬프트 생성
            output_path = os.path.join(project_path, "output")
            prompt = self.prompt_generator.generate(
                user_request=user_request,
                template=template,
                data_info=data_info,
                output_path=output_path
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
            
            # React 앱 검증
            if not self.validate_react_app(react_app_path):
                raise Exception("생성된 React 앱이 완전하지 않습니다.")
            
            return {
                "success": True,
                "project_id": project_id,
                "app_path": react_app_path,
                "project_path": project_path
            }
            
        except Exception as e:
            print(f"\n❌ 오류 발생: {e}")
            # 실패 시 cleanup
            if 'project_path' in locals() and os.path.exists(project_path):
                print(f"   프로젝트 파일 정리 중...")
                self.cleanup_project(project_path)
            return {"success": False, "error": str(e)}
    
    def execute_gemini_cli(self, project_path: str, prompt: str) -> str:
        """Gemini CLI를 subprocess로 실행"""
        # 프롬프트를 파일로 저장 (Gemini CLI가 파일에서 읽도록)
        prompt_file = os.path.join(project_path, "prompt.txt")
        
        # Gemini CLI 명령어 구성
        output_path = os.path.join(project_path, "output")
        os.makedirs(output_path, exist_ok=True)
        
        # 프롬프트 직접 전달 (@ 제거)
        with open(prompt_file, 'r', encoding='utf-8') as f:
            prompt_content = f.read()
        
        cmd = [
            "gemini",
            "--debug",  # 디버그 모드 활성화 - 더 자세한 로그 출력
            "-p", prompt_content,  # 프롬프트 직접 전달 (@ 없이)
            "-y"  # YOLO 모드 - 모든 작업 자동 승인
        ]
        
        # VibeCraft-viz 루트 디렉토리에서 실행
        vibecraft_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        
        # MCP 서버 설정 확인
        settings_path = os.path.join(vibecraft_root, '.gemini', 'settings.json')
        if os.path.exists(settings_path):
            print(f"   🔍 MCP 설정 파일: {settings_path}")
            with open(settings_path, 'r') as f:
                settings = json.load(f)
                if 'mcp' in settings and 'servers' in settings['mcp'] and 'sqlite' in settings['mcp']['servers']:
                    db_path = settings['mcp']['servers']['sqlite']['args'][-1]
                    print(f"   🗃️ SQLite DB: {db_path}")
                    if os.path.exists(db_path):
                        print(f"   ✅ DB 파일 확인 완료")
                        # DB 파일 크기 확인
                        db_size = os.path.getsize(db_path)
                        print(f"   📊 DB 파일 크기: {db_size:,} bytes")
                    else:
                        print(f"   ⚠️  DB 파일을 찾을 수 없음")
                    
                    # MCP 서버 설정 상세 출력
                    print(f"   🔧 MCP 서버 설정:")
                    print(f"      - Command: {settings['mcp']['servers']['sqlite']['command']}")
                    print(f"      - Args: {settings['mcp']['servers']['sqlite']['args']}")
        else:
            print(f"   ❌ MCP 설정 파일이 없습니다: {settings_path}")
        
        print(f"   🚀 Gemini CLI 실행: {' '.join(cmd)}")
        print(f"   📂 실행 디렉토리: {vibecraft_root}")
        
        # 프롬프트 샘플 출력
        with open(prompt_file, 'r', encoding='utf-8') as f:
            prompt_sample = f.read()[:500]
            print(f"   📝 프롬프트 샘플:\n{prompt_sample}...\n")
        
        # Gemini CLI 실행 (VibeCraft-viz 루트에서 실행)
        import threading
        import queue
        
        # 환경변수 설정 (디버깅용)
        env = os.environ.copy()
        env['DEBUG'] = 'gemini:*'  # Gemini CLI 디버그 로그 활성화
        env['GEMINI_DEBUG'] = '1'
        
        process = subprocess.Popen(
            cmd,
            cwd=vibecraft_root,  # VibeCraft-viz 루트에서 실행 (MCP 설정 읽기를 위해)
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            bufsize=1,
            universal_newlines=True,
            env=env
        )
        
        # 실시간 출력 표시를 위한 큐
        output_queue = queue.Queue()
        stdout_lines = []
        stderr_lines = []
        
        def read_output(pipe, pipe_name, lines_list):
            """파이프에서 라인을 읽어 큐에 추가"""
            for line in iter(pipe.readline, ''):
                if line:
                    output_queue.put((pipe_name, line.rstrip()))
                    lines_list.append(line.rstrip())
            pipe.close()
        
        # stdout과 stderr를 동시에 읽기 위한 스레드
        stdout_thread = threading.Thread(target=read_output, args=(process.stdout, "stdout", stdout_lines))
        stderr_thread = threading.Thread(target=read_output, args=(process.stderr, "stderr", stderr_lines))
        
        stdout_thread.start()
        stderr_thread.start()
        
        print(f"\n   📝 Gemini CLI 출력 시작 (--debug 모드):\n   {'-'*60}")
        
        # 실시간으로 출력 표시
        while stdout_thread.is_alive() or stderr_thread.is_alive() or not output_queue.empty():
            try:
                pipe_name, line = output_queue.get(timeout=0.1)
                if pipe_name == "stdout":
                    print(f"   [Gemini] {line}")
                    
                    # 특정 패턴 감지
                    if "Error executing tool" in line:
                        print(f"   ⚠️  MCP 도구 오류 감지!")
                    elif "**File:**" in line or "FILE:" in line:
                        print(f"   📦 파일 패턴 감지!")
                    elif "Thinking" in line or "thinking" in line:
                        print(f"   🤔 AI 사고 중...")
                    elif "MCP" in line or "mcp" in line:
                        print(f"   🔌 MCP 관련 활동 감지")
                else:  # stderr
                    print(f"   [Gemini Debug] {line}")
            except queue.Empty:
                continue
        
        # 스레드 종료 대기
        stdout_thread.join()
        stderr_thread.join()
        
        # 프로세스 종료 대기
        process.wait()
        print(f"\n   {'-'*60}\n   📝 Gemini CLI 출력 종료 (종료 코드: {process.returncode})")
        
        if process.returncode != 0:
            error_msg = '\n'.join(stderr_lines) if stderr_lines else "Unknown error"
            raise Exception(f"Gemini CLI 실행 실패 (code {process.returncode}): {error_msg}")
        
        # Gemini 출력에서 파일 추출 및 생성
        print(f"\n   🔍 파일 추출 시작...")
        created_files = self._extract_and_create_files(stdout_lines, output_path)
        print(f"   📊 총 {len(created_files)}개 파일 생성됨")
        
        # output 디렉토리에 파일이 생성되었는지 확인
        print(f"   📂 생성된 파일 확인 중...")
        output_files = os.listdir(output_path) if os.path.exists(output_path) else []
        if output_files:
            print(f"   ✅ {len(output_files)}개의 파일/디렉토리가 생성됨")
            for file in output_files[:5]:  # 처음 5개만 표시
                print(f"      - {file}")
            if len(output_files) > 5:
                print(f"      ... 외 {len(output_files)-5}개")
        
        # data.sqlite 파일을 output/public으로 복사
        db_source = os.path.join(project_path, 'data.sqlite')
        db_target_dir = os.path.join(output_path, 'public')
        db_target = os.path.join(db_target_dir, 'data.sqlite')
        
        if os.path.exists(db_source) and os.path.exists(db_target_dir):
            shutil.copy2(db_source, db_target)
            print(f"   📋 데이터베이스 파일 복사 완료: public/data.sqlite")
        
        return output_path
    
    def _extract_and_create_files(self, output_lines: List[str], output_path: str) -> List[str]:
        """Gemini 출력에서 파일 내용을 추출하여 생성"""
        full_output = '\n'.join(output_lines)
        print(f"   📄 전체 출력 길이: {len(full_output)} characters")
        
        # 여러 파일 패턴 시도
        patterns = [
            # Pattern 1: **File:** 형식
            r'\*\*File:\*\*\s*`([^`]+)`\s*\n```(?:javascript|js|json|html|css|jsx)?\n(.*?)\n```',
            # Pattern 2: // FILE: 형식
            r'// FILE: (.+?)\n(.*?)(?=// FILE:|$)',
            # Pattern 3: 파일 경로만 있는 경우
            r'`([^`]+\.(js|jsx|json|html|css|ts|tsx))`\s*\n```(?:javascript|js|json|html|css|jsx)?\n(.*?)\n```'
        ]
        
        all_matches = []
        for i, pattern in enumerate(patterns):
            matches = re.findall(pattern, full_output, re.DOTALL | re.MULTILINE)
            if pattern == patterns[2]:  # 세 번째 패턴은 형식이 다름
                matches = [(m[0], m[2]) for m in matches]
            if matches:
                print(f"   ✅ 패턴 {i+1}에서 {len(matches)}개 매치 발견")
            all_matches.extend(matches)
        
        print(f"   📊 총 {len(all_matches)}개 파일 후보 발견")
        
        # 중복 제거를 위한 처리된 파일 추적
        processed_files = set()
        
        for file_path, content in all_matches:
            # 파일 경로 정리
            file_path = file_path.strip()
            content = content.strip()
            
            # 절대 경로에서 파일명만 추출
            if '/' in file_path and file_path.startswith('/'):
                # 프로젝트 경로 제거
                parts = file_path.split('/')
                if 'output' in parts:
                    idx = parts.index('output')
                    file_path = '/'.join(parts[idx+1:])
                else:
                    # 마지막 몇 개 부분만 사용
                    if 'src' in parts or 'public' in parts:
                        start_idx = max(parts.index(x) for x in ['src', 'public'] if x in parts)
                        file_path = '/'.join(parts[start_idx:])
                    else:
                        file_path = parts[-1]
            
            # 중복 확인
            if file_path in processed_files:
                print(f"   ➿ 중복 파일 건너뛰기: {file_path}")
                continue
            processed_files.add(file_path)
            
            # 전체 경로 생성
            full_path = os.path.join(output_path, file_path)
            
            # 디렉토리 생성
            os.makedirs(os.path.dirname(full_path), exist_ok=True)
            
            # 파일 쓰기
            with open(full_path, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"   📝 파일 생성: {file_path}")
        
        # 아무 파일도 찾지 못한 경우 백업 로직
        if not all_matches:
            print(f"   ⚠️  파일 패턴을 찾지 못함. 코드 블록으로 추측...")
            code_pattern = r'```(?:javascript|js|json|html|css)?\n(.*?)\n```'
            code_blocks = re.findall(code_pattern, full_output, re.DOTALL)
            print(f"   📊 {len(code_blocks)}개 코드 블록 발견")
            
            # 파일 이름 추측
            file_mappings = {
                'package.json': r'"name":\s*".*?"',
                'src/App.js': r'(function App|const App|export default App)',
                'public/index.html': r'<!DOCTYPE html>',
            }
            
            for content in code_blocks:
                for filename, pattern in file_mappings.items():
                    if re.search(pattern, content):
                        if filename not in processed_files:
                            full_path = os.path.join(output_path, filename)
                            os.makedirs(os.path.dirname(full_path), exist_ok=True)
                            with open(full_path, 'w', encoding='utf-8') as f:
                                f.write(content)
                            print(f"   📝 파일 생성 (추측): {filename}")
                            processed_files.add(filename)
                        break
        
        return list(processed_files)
    
    def validate_react_app(self, output_path: str) -> bool:
        """생성된 React 앱의 필수 파일 존재 여부 확인"""
        required_files = [
            'package.json',
            'src/App.js',
            'public/index.html'
        ]
        
        # 필수 파일 확인
        missing_files = []
        for file in required_files:
            file_path = os.path.join(output_path, file)
            if not os.path.exists(file_path):
                missing_files.append(file)
        
        if missing_files:
            print(f"\n⚠️  누락된 필수 파일: {', '.join(missing_files)}")
            return False
        
        print(f"\n✅ React 앱 검증 성공")
        return True
    
    def cleanup_project(self, project_path: str) -> None:
        """실패한 프로젝트 파일 정리"""
        try:
            if os.path.exists(project_path):
                shutil.rmtree(project_path)
                print(f"   프로젝트 파일이 정리되었습니다: {project_path}")
        except Exception as e:
            print(f"   파일 정리 중 오류: {e}")


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