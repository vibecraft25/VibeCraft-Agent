#!/usr/bin/env python3
"""
VibeCraft Agent - Gemini CLI 기반 데이터 시각화 도구
원샷 프롬프팅으로 데이터 시각화 생성
"""

import os
import sys
import json
import subprocess
import select
from pathlib import Path
import tempfile
import argparse
from typing import Optional, List, Dict, Any

# 상수 정의
DEFAULT_OUTPUT_FILE = "vibecraft-dashboard.html"
GEMINI_SYSTEM_PROMPT = "vibecraft-system-prompt.md"
GEMINI_SYSTEM_PROMPT_VERBOSE = "vibecraft-system-prompt-verbose.md"
GEMINI_TIMEOUT = 300  # 5분

# 커스텀 예외 클래스
class VibeCraftError(Exception):
    """VibeCraft 기본 예외 클래스"""
    pass

class EnvironmentError(VibeCraftError):
    """환경 설정 관련 오류"""
    pass

class GeminiExecutionError(VibeCraftError):
    """Gemini CLI 실행 오류"""
    pass

def setup_environment(verbose: bool = False) -> None:
    """
    환경 변수 설정
    
    Args:
        verbose: 상세 출력 모드 활성화 여부
        
    Raises:
        SystemExit: 필수 환경 변수가 설정되지 않았거나 파일을 찾을 수 없을 때
    """
    # .env 파일 로드 (있을 경우)
    env_path = Path(__file__).parent / '.env'
    if env_path.exists():
        print("📄 .env 파일 발견, 환경 변수 로드 중...")
        try:
            # 간단한 .env 파일 로더
            with open(env_path, 'r', encoding='utf-8') as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith('#') and '=' in line:
                        key, value = line.split('=', 1)
                        # 따옴표 제거
                        value = value.strip()
                        if value.startswith('"') and value.endswith('"'):
                            value = value[1:-1]
                        elif value.startswith("'") and value.endswith("'"):
                            value = value[1:-1]
                        os.environ[key.strip()] = value
        except Exception as e:
            print(f"⚠️  .env 파일 로드 중 오류 발생: {e}")
    
    # GEMINI_SYSTEM_MD 환경변수 설정
    system_prompt_path = Path(__file__).parent / GEMINI_SYSTEM_PROMPT
    if not system_prompt_path.exists():
        raise EnvironmentError(f"시스템 프롬프트 파일을 찾을 수 없습니다: {system_prompt_path}")
    
    # verbose 모드에서는 다른 시스템 프롬프트 사용
    if verbose:
        verbose_prompt_path = Path(__file__).parent / GEMINI_SYSTEM_PROMPT_VERBOSE
        if verbose_prompt_path.exists():
            os.environ['GEMINI_SYSTEM_MD'] = str(verbose_prompt_path)
            print(f"🔧 GEMINI_SYSTEM_MD 설정 (Verbose): {verbose_prompt_path}")
        else:
            os.environ['GEMINI_SYSTEM_MD'] = str(system_prompt_path)
            print(f"🔧 GEMINI_SYSTEM_MD 설정: {system_prompt_path}")
    else:
        os.environ['GEMINI_SYSTEM_MD'] = str(system_prompt_path)
        print(f"🔧 GEMINI_SYSTEM_MD 설정: {system_prompt_path}")
    
    # GOOGLE_CLOUD_PROJECT 확인
    if not os.environ.get('GOOGLE_CLOUD_PROJECT'):
        raise EnvironmentError(
            "GOOGLE_CLOUD_PROJECT 환경변수가 설정되지 않았습니다.\n"
            "💡 .env 파일에 GOOGLE_CLOUD_PROJECT=your-project-id를 추가하거나\n"
            "   export GOOGLE_CLOUD_PROJECT=your-project-id 명령을 실행하세요."
        )

def create_enhanced_prompt(data_file: str, user_query: str, verbose: bool = False) -> str:
    """
    강화된 프롬프트 생성 - AI가 파일을 직접 읽도록 유도
    
    Args:
        data_file: 분석할 데이터 파일 경로
        user_query: 사용자의 시각화 요구사항
        verbose: 상세 출력 모드 활성화 여부
        
    Returns:
        Gemini CLI에 전달할 강화된 프롬프트
    """
    # 절대 경로로 변환
    abs_data_path = os.path.abspath(data_file)
    
    verbose_instruction = "각 단계를 수행할 때마다 무엇을 하고 있는지 출력하세요." if verbose else ""
    
    return f"""다음 작업을 즉시 실행하세요. 질문하지 말고 바로 실행하세요:

1. 파일 읽기: {abs_data_path}
2. 데이터 구조와 내용 분석
3. 시각화 타입 결정: {user_query}
4. 완전한 HTML 코드 생성 (Plotly.js 사용)
5. vibecraft-dashboard.html 파일로 저장
6. 완료 메시지 출력: "✅ 시각화 생성 완료: vibecraft-dashboard.html"

{verbose_instruction}

지금 바로 시작하세요.
데이터 파일: {abs_data_path}
사용자 요구사항: {user_query}"""

def run_gemini_cli(prompt: str, output_file: str, stream: bool = False, debug: bool = False) -> bool:
    """
    Gemini CLI 실행 - 환경변수와 함께, 스트리밍 옵션 추가
    
    Args:
        prompt: Gemini에 전달할 프롬프트
        output_file: 생성될 출력 파일 경로
        stream: 실시간 출력 스트리밍 활성화 여부
        debug: 디버그 모드 활성화 여부
        
    Returns:
        실행 성공 여부
        
    Raises:
        Exception: Gemini CLI 실행 중 오류 발생 시
    """
    try:
        # Gemini CLI 명령 구성
        # -y 옵션으로 YOLO 모드 활성화 (모든 액션 자동 수락)
        cmd = [
            "gemini",
            "-y",  # YOLO 모드
        ]
        
        if debug:
            cmd.append("-d")  # 디버그 모드
            # Gemini의 상세 로깅을 위한 환경변수 설정
            os.environ['GEMINI_LOG_LEVEL'] = 'DEBUG'
            os.environ['GEMINI_TOOL_LOG'] = '1'
        
        if stream:
            cmd.append("--show_memory_usage")  # 메모리 사용량 표시 (도구 실행 확인용)
            
        cmd.extend(["-p", prompt])  # 프롬프트 전달
        
        print("🤖 Gemini AI로 시각화 생성 중...")
        print("📂 작업 디렉토리:", os.getcwd())
        print("🔧 시스템 프롬프트:", os.environ.get('GEMINI_SYSTEM_MD', 'Not set'))
        print("\n" + "="*70)
        print("🔄 Gemini CLI 실행 과정 스트리밍")
        print("="*70 + "\n")
        
        if stream:
            # 스트리밍 모드 - 실시간 출력
            process = subprocess.Popen(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                bufsize=1,
                universal_newlines=True,
                env=os.environ.copy(),
                encoding='utf-8'
            )
            
            # stdout과 stderr를 동시에 처리
            output_lines: List[str] = []
            
            while True:
                # stdout과 stderr를 비차단 모드로 설정
                reads = [process.stdout, process.stderr]
                ret = select.select(reads, [], [])
                
                for fd in ret[0]:
                    if fd == process.stdout:
                        line = fd.readline()
                        if line:
                            print(f"🤖 | {line}", end='')  # Gemini 출력
                            output_lines.append(line)
                    elif fd == process.stderr:
                        line = fd.readline()
                        if line:
                            # stderr는 다른 프리픽스로 출력
                            print(f"🔧 | {line}", end='')  # 도구 실행 로그
                
                # 프로세스가 종료되었는지 확인
                if process.poll() is not None:
                    break
            
            # 남은 출력 처리
            for line in process.stdout:
                print(f"🤖 | {line}", end='')
                output_lines.append(line)
            
            for line in process.stderr:
                print(f"🔧 | {line}", end='')
            
            return_code = process.wait()
            
            if return_code != 0:
                print(f"\n❌ Gemini 실행 실패 (return code: {return_code})")
                return False
            
            # 파일 생성 확인
            print("\n" + "="*70)
            print("🎯 실행 완료")
            print("="*70 + "\n")
            
        else:
            # 기존 방식 - 결과만 출력
            result = subprocess.run(
                cmd, 
                capture_output=True, 
                text=True,
                env=os.environ.copy(),
                timeout=GEMINI_TIMEOUT,
                encoding='utf-8'
            )
            
            if result.returncode != 0:
                print(f"❌ Gemini 실행 실패:")
                print(result.stderr)
                return False
            
            # 전체 출력 표시
            print("\n--- Gemini 출력 ---")
            print(result.stdout)
            print("--- 출력 끝 ---\n")
        
        # 파일이 생성되었는지 확인
        if Path(output_file).exists():
            file_size = Path(output_file).stat().st_size
            if file_size > 0:
                print(f"📄 파일 생성 확인: {output_file} ({file_size:,} bytes)")
                return True
            else:
                print(f"⚠️  파일이 비어있습니다: {output_file}")
                return False
        else:
            # 현재 디렉토리 파일 목록 확인
            print(f"❌ 파일이 생성되지 않았습니다: {output_file}")
            print("📁 현재 디렉토리의 HTML 파일:")
            html_files = list(Path('.').glob('*.html'))
            if html_files:
                for f in html_files:
                    print(f"  - {f.name}")
            else:
                print("  (없음)")
            return False
        
    except subprocess.TimeoutExpired:
        print(f"❌ Gemini 실행 시간 초과 ({GEMINI_TIMEOUT}초)")
        return False
    except Exception as e:
        print(f"❌ 오류 발생: {e}")
        return False

def main() -> None:
    """메인 함수 - CLI 인터페이스 제공"""
    parser = argparse.ArgumentParser(
        description="VibeCraft - Gemini CLI 기반 데이터 시각화 도구"
    )
    parser.add_argument("data_file", help="분석할 데이터 파일 (CSV, JSON 등)")
    parser.add_argument("query", help="시각화 요구사항 (자연어)")
    parser.add_argument("-o", "--output", default=DEFAULT_OUTPUT_FILE, 
                        help=f"출력 HTML 파일명 (기본값: {DEFAULT_OUTPUT_FILE})")
    parser.add_argument("-s", "--stream", action="store_true",
                        help="Gemini CLI 실행 과정을 실시간으로 출력")
    parser.add_argument("-d", "--debug", action="store_true",
                        help="Gemini CLI 디버그 모드 활성화")
    
    args = parser.parse_args()
    
    # 데이터 파일 확인
    data_path = Path(args.data_file)
    if not data_path.exists():
        print(f"❌ 데이터 파일을 찾을 수 없습니다: {args.data_file}")
        sys.exit(1)
    
    if not data_path.is_file():
        print(f"❌ 지정한 경로가 파일이 아닙니다: {args.data_file}")
        sys.exit(1)
    
    print("📊 VibeCraft Agent 시작")
    print(f"📁 데이터 파일: {args.data_file}")
    print(f"💬 요구사항: {args.query}")
    
    try:
        # 환경 설정 (스트리밍 모드에서는 verbose 시스템 프롬프트 사용)
        setup_environment(verbose=args.stream)
    except EnvironmentError as e:
        print(f"❌ 환경 설정 오류: {e}")
        sys.exit(1)
    
    # 강화된 프롬프트 생성 (스트리밍 모드에서는 상세 출력)
    enhanced_prompt = create_enhanced_prompt(args.data_file, args.query, verbose=args.stream)
    
    print("\n📝 강화된 프롬프트:")
    print("-" * 50)
    print(enhanced_prompt)
    print("-" * 50)
    print()
    
    # Gemini CLI 실행
    try:
        if run_gemini_cli(enhanced_prompt, args.output, stream=args.stream, debug=args.debug):
            print(f"✅ 시각화 생성 완료: {args.output}")
            print(f"🌐 브라우저에서 열기: file://{os.path.abspath(args.output)}")
        else:
            print("❌ 시각화 생성 실패")
            sys.exit(1)
    except GeminiExecutionError as e:
        print(f"❌ Gemini 실행 오류: {e}")
        sys.exit(1)
    except KeyboardInterrupt:
        print("\n⚠️  사용자에 의해 중단됨")
        sys.exit(130)  # 128 + SIGINT

if __name__ == "__main__":
    main()