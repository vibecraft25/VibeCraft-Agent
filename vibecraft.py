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
import logging
from pathlib import Path
import tempfile
import argparse
from typing import Optional, List, Dict, Any
from dotenv import load_dotenv

# 상수 정의
DEFAULT_OUTPUT_FILE = "vibecraft-dashboard.html"
GEMINI_SYSTEM_PROMPT = "vibecraft-system-prompt-verbose.md"  # 기본값을 verbose로 변경
GEMINI_SYSTEM_PROMPT_SIMPLE = "vibecraft-system-prompt-simple.md"
GEMINI_TIMEOUT = 300  # 5분

# 이모지 매핑
EMOJI = {
    'info': '📄',
    'success': '✅',
    'warning': '⚠️',
    'error': '❌',
    'tool': '🔧',
    'robot': '🤖',
    'folder': '📂',
    'chart': '📊',
    'message': '💬',
    'web': '🌐',
    'doc': '📝',
    'target': '🎯',
    'refresh': '🔄',
    'light': '💡'
}

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

# 로거 설정
logger = logging.getLogger(__name__)

class EmojiFormatter(logging.Formatter):
    """이모지를 포함한 커스텀 로그 포매터"""
    
    def __init__(self):
        super().__init__()
        self.formats = {
            logging.DEBUG: f"{EMOJI['tool']} %(message)s",
            logging.INFO: f"{EMOJI['info']} %(message)s",
            logging.WARNING: f"{EMOJI['warning']} %(message)s",
            logging.ERROR: f"{EMOJI['error']} %(message)s",
            logging.CRITICAL: f"{EMOJI['error']} %(message)s"
        }
    
    def format(self, record):
        log_fmt = self.formats.get(record.levelno, "%(message)s")
        formatter = logging.Formatter(log_fmt)
        return formatter.format(record)

def setup_logging(verbose: bool = False) -> None:
    """로깅 시스템 설정"""
    # 기존 핸들러 제거
    logger.handlers.clear()
    
    # 콘솔 핸들러 생성
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(EmojiFormatter())
    
    # 로그 레벨 설정
    if verbose:
        logger.setLevel(logging.DEBUG)
    else:
        logger.setLevel(logging.INFO)
    
    logger.addHandler(console_handler)

def setup_environment(simple_mode: bool = False) -> None:
    """
    환경 변수 설정
    
    Args:
        simple_mode: 간단한 출력 모드 활성화 여부 (기본값은 verbose)
        
    Raises:
        EnvironmentError: 필수 환경 변수가 설정되지 않았거나 파일을 찾을 수 없을 때
    """
    # .env 파일 로드
    env_path = Path(__file__).parent / '.env'
    if env_path.exists():
        logger.info(".env 파일 발견, 환경 변수 로드 중...")
        load_dotenv(env_path)
    
    # GEMINI_SYSTEM_MD 환경변수 설정 - 기본값은 verbose
    if simple_mode:
        # 간단한 모드 사용
        simple_prompt_path = Path(__file__).parent / GEMINI_SYSTEM_PROMPT_SIMPLE
        if simple_prompt_path.exists():
            os.environ['GEMINI_SYSTEM_MD'] = str(simple_prompt_path)
            logger.debug(f"GEMINI_SYSTEM_MD 설정 (Simple): {simple_prompt_path}")
        else:
            # fallback to default (verbose)
            system_prompt_path = Path(__file__).parent / GEMINI_SYSTEM_PROMPT
            os.environ['GEMINI_SYSTEM_MD'] = str(system_prompt_path)
            logger.debug(f"GEMINI_SYSTEM_MD 설정: {system_prompt_path}")
    else:
        # 기본값: verbose 모드
        system_prompt_path = Path(__file__).parent / GEMINI_SYSTEM_PROMPT
        if not system_prompt_path.exists():
            raise EnvironmentError(f"시스템 프롬프트 파일을 찾을 수 없습니다: {system_prompt_path}")
        os.environ['GEMINI_SYSTEM_MD'] = str(system_prompt_path)
        logger.debug(f"GEMINI_SYSTEM_MD 설정 (Verbose): {system_prompt_path}")
    
    # GOOGLE_CLOUD_PROJECT 확인
    if not os.environ.get('GOOGLE_CLOUD_PROJECT'):
        raise EnvironmentError(
            "GOOGLE_CLOUD_PROJECT 환경변수가 설정되지 않았습니다.\n"
            f"{EMOJI['light']} .env 파일에 GOOGLE_CLOUD_PROJECT=your-project-id를 추가하거나\n"
            "   export GOOGLE_CLOUD_PROJECT=your-project-id 명령을 실행하세요."
        )

def create_enhanced_prompt(data_file: str, user_query: str, verbose: bool = True) -> str:
    """
    강화된 프롬프트 생성 - AI가 파일을 직접 읽도록 유도
    
    Args:
        data_file: 분석할 데이터 파일 경로
        user_query: 사용자의 시각화 요구사항
        verbose: 상세 출력 모드 활성화 여부 (기본값 True)
        
    Returns:
        Gemini CLI에 전달할 강화된 프롬프트
    """
    # 절대 경로로 변환
    abs_data_path = os.path.abspath(data_file)
    
    # 기본값이 verbose이므로 대부분의 경우 상세 지침 포함
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

def build_gemini_command(prompt: str, debug: bool = False, stream: bool = False) -> List[str]:
    """
    Gemini CLI 명령 구성
    
    Args:
        prompt: Gemini에 전달할 프롬프트
        debug: 디버그 모드 활성화 여부
        stream: 스트리밍 모드 활성화 여부
        
    Returns:
        명령어 리스트
    """
    cmd = ["gemini", "-y"]  # YOLO 모드
    
    if debug:
        cmd.append("-d")  # 디버그 모드
        # Gemini의 상세 로깅을 위한 환경변수 설정
        os.environ['GEMINI_LOG_LEVEL'] = 'DEBUG'
        os.environ['GEMINI_TOOL_LOG'] = '1'
    
    if stream:
        cmd.append("--show_memory_usage")  # 메모리 사용량 표시
    
    cmd.extend(["-p", prompt])
    return cmd

def execute_streaming(cmd: List[str]) -> bool:
    """
    스트리밍 모드로 Gemini CLI 실행
    
    Args:
        cmd: 실행할 명령어 리스트
        
    Returns:
        실행 성공 여부
    """
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
                    print(f"{EMOJI['robot']} | {line}", end='')  # Gemini 출력
                    output_lines.append(line)
            elif fd == process.stderr:
                line = fd.readline()
                if line:
                    # stderr는 다른 프리픽스로 출력
                    print(f"{EMOJI['tool']} | {line}", end='')  # 도구 실행 로그
        
        # 프로세스가 종료되었는지 확인
        if process.poll() is not None:
            break
    
    # 남은 출력 처리
    for line in process.stdout:
        print(f"{EMOJI['robot']} | {line}", end='')
        output_lines.append(line)
    
    for line in process.stderr:
        print(f"{EMOJI['tool']} | {line}", end='')
    
    return_code = process.wait()
    
    if return_code != 0:
        logger.error(f"Gemini 실행 실패 (return code: {return_code})")
        return False
    
    return True

def execute_normal(cmd: List[str]) -> bool:
    """
    일반 모드로 Gemini CLI 실행
    
    Args:
        cmd: 실행할 명령어 리스트
        
    Returns:
        실행 성공 여부
    """
    result = subprocess.run(
        cmd, 
        capture_output=True, 
        text=True,
        env=os.environ.copy(),
        timeout=GEMINI_TIMEOUT,
        encoding='utf-8'
    )
    
    if result.returncode != 0:
        logger.error("Gemini 실행 실패:")
        print(result.stderr)
        return False
    
    # 전체 출력 표시
    print("\n--- Gemini 출력 ---")
    print(result.stdout)
    print("--- 출력 끝 ---\n")
    
    return True

def validate_output_file(output_file: str) -> bool:
    """
    출력 파일 검증
    
    Args:
        output_file: 검증할 파일 경로
        
    Returns:
        파일이 올바르게 생성되었는지 여부
    """
    output_path = Path(output_file)
    
    if output_path.exists():
        file_size = output_path.stat().st_size
        if file_size > 0:
            logger.info(f"파일 생성 확인: {output_file} ({file_size:,} bytes)")
            return True
        else:
            logger.warning(f"파일이 비어있습니다: {output_file}")
            return False
    else:
        # 현재 디렉토리 파일 목록 확인
        logger.error(f"파일이 생성되지 않았습니다: {output_file}")
        logger.info("현재 디렉토리의 HTML 파일:")
        html_files = list(Path('.').glob('*.html'))
        if html_files:
            for f in html_files:
                print(f"  - {f.name}")
        else:
            print("  (없음)")
        return False

def run_gemini_cli(prompt: str, output_file: str, stream: bool = False, debug: bool = False) -> bool:
    """
    Gemini CLI 실행
    
    Args:
        prompt: Gemini에 전달할 프롬프트
        output_file: 생성될 출력 파일 경로
        stream: 실시간 출력 스트리밍 활성화 여부
        debug: 디버그 모드 활성화 여부
        
    Returns:
        실행 성공 여부
    """
    try:
        # 명령 구성
        cmd = build_gemini_command(prompt, debug, stream)
        
        logger.info("Gemini AI로 시각화 생성 중...")
        logger.info(f"작업 디렉토리: {os.getcwd()}")
        logger.debug(f"시스템 프롬프트: {os.environ.get('GEMINI_SYSTEM_MD', 'Not set')}")
        print("\n" + "="*70)
        print(f"{EMOJI['refresh']} Gemini CLI 실행 과정")
        print("="*70 + "\n")
        
        # 실행 모드에 따라 처리
        if stream:
            success = execute_streaming(cmd)
        else:
            success = execute_normal(cmd)
        
        if success:
            print("\n" + "="*70)
            print(f"{EMOJI['target']} 실행 완료")
            print("="*70 + "\n")
            
            # 파일 검증
            return validate_output_file(output_file)
        
        return False
        
    except subprocess.TimeoutExpired:
        logger.error(f"Gemini 실행 시간 초과 ({GEMINI_TIMEOUT}초)")
        return False
    except Exception as e:
        logger.error(f"오류 발생: {e}")
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
    parser.add_argument("-s", "--simple", action="store_true",
                        help="간단한 출력 모드 (스트리밍 비활성화)")
    parser.add_argument("-d", "--debug", action="store_true",
                        help="Gemini CLI 디버그 모드 활성화")
    
    args = parser.parse_args()
    
    # 로깅 설정 - 기본값이 verbose=True
    setup_logging(verbose=True)  # 항상 verbose 로깅 사용
    
    # 데이터 파일 확인
    data_path = Path(args.data_file)
    if not data_path.exists():
        logger.error(f"데이터 파일을 찾을 수 없습니다: {args.data_file}")
        sys.exit(1)
    
    if not data_path.is_file():
        logger.error(f"지정한 경로가 파일이 아닙니다: {args.data_file}")
        sys.exit(1)
    
    print(f"{EMOJI['chart']} VibeCraft Agent 시작")
    logger.info(f"데이터 파일: {args.data_file}")
    logger.info(f"요구사항: {args.query}")
    
    try:
        # 환경 설정 (기본값은 verbose, --simple 옵션으로 simple 모드 가능)
        setup_environment(simple_mode=False)  # 항상 verbose가 기본값
    except EnvironmentError as e:
        logger.error(f"환경 설정 오류: {e}")
        sys.exit(1)
    
    # 강화된 프롬프트 생성 (기본값은 verbose=True)
    enhanced_prompt = create_enhanced_prompt(args.data_file, args.query)  # verbose=True가 기본값
    
    print(f"\n{EMOJI['doc']} 강화된 프롬프트:")
    print("-" * 50)
    print(enhanced_prompt)
    print("-" * 50)
    print()
    
    # Gemini CLI 실행
    try:
        # 기본값으로 스트리밍 활성화, --simple 옵션으로 비활성화 가능
        if run_gemini_cli(enhanced_prompt, args.output, stream=not args.simple, debug=args.debug):
            logger.info(f"시각화 생성 완료: {args.output}")
            print(f"{EMOJI['web']} 브라우저에서 열기: file://{os.path.abspath(args.output)}")
        else:
            logger.error("시각화 생성 실패")
            sys.exit(1)
    except GeminiExecutionError as e:
        logger.error(f"Gemini 실행 오류: {e}")
        sys.exit(1)
    except KeyboardInterrupt:
        logger.warning("사용자에 의해 중단됨")
        sys.exit(130)  # 128 + SIGINT

if __name__ == "__main__":
    main()