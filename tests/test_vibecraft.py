#!/usr/bin/env python3
"""
VibeCraft Agent 테스트
"""

import os
import sys
import pytest
import tempfile
from pathlib import Path
from unittest.mock import patch, Mock, MagicMock, call
import subprocess

# 부모 디렉토리를 Python 경로에 추가
sys.path.insert(0, str(Path(__file__).parent.parent))

from vibecraft import (
    setup_environment,
    create_enhanced_prompt,
    run_gemini_cli,
    VibeCraftError,
    EnvironmentError,
    GeminiExecutionError,
    DEFAULT_OUTPUT_FILE,
    GEMINI_SYSTEM_PROMPT,
    GEMINI_SYSTEM_PROMPT_VERBOSE
)


class TestSetupEnvironment:
    """setup_environment 함수 테스트"""
    
    def test_setup_environment_with_env_file(self, tmp_path):
        """env 파일이 있을 때 환경 설정 테스트"""
        # .env 파일 생성
        env_file = tmp_path / ".env"
        env_file.write_text("""
GOOGLE_CLOUD_PROJECT=test-project
TEST_VAR=test_value
# 주석은 무시됨
QUOTED_VAR="quoted value"
""")
        
        # 시스템 프롬프트 파일 생성
        prompt_file = tmp_path / GEMINI_SYSTEM_PROMPT
        prompt_file.write_text("Test prompt")
        
        with patch('vibecraft.Path') as mock_path:
            mock_path.return_value.parent = tmp_path
            mock_path.return_value.parent.__truediv__ = lambda self, other: tmp_path / other
            
            # 환경 변수 초기화
            os.environ.pop('GOOGLE_CLOUD_PROJECT', None)
            
            setup_environment(verbose=False)
            
            # 환경 변수 확인
            assert os.environ.get('TEST_VAR') == 'test_value'
            assert os.environ.get('QUOTED_VAR') == 'quoted value'
    
    def test_setup_environment_missing_system_prompt(self, tmp_path):
        """시스템 프롬프트 파일이 없을 때 에러 테스트"""
        with patch('vibecraft.Path') as mock_path:
            mock_path.return_value.parent = tmp_path
            mock_path.return_value.parent.__truediv__ = lambda self, other: tmp_path / other
            
            os.environ['GOOGLE_CLOUD_PROJECT'] = 'test-project'
            
            with pytest.raises(EnvironmentError, match="시스템 프롬프트 파일을 찾을 수 없습니다"):
                setup_environment()
    
    def test_setup_environment_missing_google_project(self, tmp_path):
        """GOOGLE_CLOUD_PROJECT가 없을 때 에러 테스트"""
        # 시스템 프롬프트 파일 생성
        prompt_file = tmp_path / GEMINI_SYSTEM_PROMPT
        prompt_file.write_text("Test prompt")
        
        with patch('vibecraft.Path') as mock_path:
            mock_path.return_value.parent = tmp_path
            mock_path.return_value.parent.__truediv__ = lambda self, other: tmp_path / other
            
            # 환경 변수 제거
            os.environ.pop('GOOGLE_CLOUD_PROJECT', None)
            
            with pytest.raises(EnvironmentError, match="GOOGLE_CLOUD_PROJECT 환경변수가 설정되지 않았습니다"):
                setup_environment()
    
    def test_setup_environment_verbose_mode(self, tmp_path):
        """Verbose 모드에서 시스템 프롬프트 설정 테스트"""
        # 두 개의 시스템 프롬프트 파일 생성
        prompt_file = tmp_path / GEMINI_SYSTEM_PROMPT
        prompt_file.write_text("Default prompt")
        
        verbose_prompt_file = tmp_path / GEMINI_SYSTEM_PROMPT_VERBOSE
        verbose_prompt_file.write_text("Verbose prompt")
        
        with patch('vibecraft.Path') as mock_path:
            mock_path.return_value.parent = tmp_path
            mock_path.return_value.parent.__truediv__ = lambda self, other: tmp_path / other
            
            os.environ['GOOGLE_CLOUD_PROJECT'] = 'test-project'
            
            setup_environment(verbose=True)
            
            # Verbose 프롬프트가 설정되었는지 확인
            assert os.environ['GEMINI_SYSTEM_MD'] == str(tmp_path / GEMINI_SYSTEM_PROMPT_VERBOSE)


class TestCreateEnhancedPrompt:
    """create_enhanced_prompt 함수 테스트"""
    
    def test_create_enhanced_prompt_basic(self):
        """기본 프롬프트 생성 테스트"""
        prompt = create_enhanced_prompt("data.csv", "막대 그래프 생성", verbose=False)
        
        assert "data.csv" in prompt
        assert "막대 그래프 생성" in prompt
        assert "파일 읽기:" in prompt
        assert "vibecraft-dashboard.html" in prompt
    
    def test_create_enhanced_prompt_verbose(self):
        """Verbose 모드 프롬프트 생성 테스트"""
        prompt = create_enhanced_prompt("data.csv", "막대 그래프 생성", verbose=True)
        
        assert "각 단계를 수행할 때마다 무엇을 하고 있는지 출력하세요" in prompt
    
    def test_create_enhanced_prompt_absolute_path(self):
        """절대 경로 변환 테스트"""
        with patch('os.path.abspath') as mock_abspath:
            mock_abspath.return_value = "/absolute/path/data.csv"
            
            prompt = create_enhanced_prompt("data.csv", "차트 생성")
            
            assert "/absolute/path/data.csv" in prompt


class TestRunGeminiCLI:
    """run_gemini_cli 함수 테스트"""
    
    @patch('subprocess.run')
    def test_run_gemini_cli_success(self, mock_run, tmp_path):
        """Gemini CLI 실행 성공 테스트"""
        # Mock subprocess 결과
        mock_run.return_value = Mock(
            returncode=0,
            stdout="Success output",
            stderr=""
        )
        
        # 출력 파일 생성
        output_file = tmp_path / "test-output.html"
        output_file.write_text("<html>Test</html>")
        
        with patch('vibecraft.Path.exists', return_value=True):
            with patch('vibecraft.Path.stat') as mock_stat:
                mock_stat.return_value.st_size = 100
                
                result = run_gemini_cli("test prompt", str(output_file))
                
                assert result is True
                mock_run.assert_called_once()
    
    @patch('subprocess.run')
    def test_run_gemini_cli_failure(self, mock_run):
        """Gemini CLI 실행 실패 테스트"""
        # Mock subprocess 실패 결과
        mock_run.return_value = Mock(
            returncode=1,
            stdout="",
            stderr="Error occurred"
        )
        
        result = run_gemini_cli("test prompt", "output.html")
        
        assert result is False
    
    @patch('subprocess.run')
    def test_run_gemini_cli_timeout(self, mock_run):
        """Gemini CLI 타임아웃 테스트"""
        mock_run.side_effect = subprocess.TimeoutExpired(cmd="gemini", timeout=300)
        
        result = run_gemini_cli("test prompt", "output.html")
        
        assert result is False
    
    @patch('subprocess.Popen')
    def test_run_gemini_cli_streaming(self, mock_popen, tmp_path):
        """스트리밍 모드 테스트"""
        # Mock 프로세스
        mock_process = MagicMock()
        mock_process.stdout.readline.side_effect = ["Line 1\n", "Line 2\n", ""]
        mock_process.stderr.readline.return_value = ""
        mock_process.poll.side_effect = [None, None, 0]
        mock_process.wait.return_value = 0
        mock_process.stdout.__iter__.return_value = []
        mock_process.stderr.__iter__.return_value = []
        
        mock_popen.return_value = mock_process
        
        # Mock select
        with patch('select.select') as mock_select:
            mock_select.side_effect = [
                ([mock_process.stdout], [], []),
                ([mock_process.stdout], [], []),
                ([mock_process.stdout], [], [])
            ]
            
            # 출력 파일 생성
            output_file = tmp_path / "test-output.html"
            output_file.write_text("<html>Test</html>")
            
            with patch('vibecraft.Path.exists', return_value=True):
                with patch('vibecraft.Path.stat') as mock_stat:
                    mock_stat.return_value.st_size = 100
                    
                    result = run_gemini_cli("test prompt", str(output_file), stream=True)
                    
                    assert result is True
    
    def test_run_gemini_cli_exception(self):
        """예외 발생 테스트"""
        with patch('subprocess.run', side_effect=Exception("Test error")):
            result = run_gemini_cli("test prompt", "output.html")
            
            assert result is False


class TestIntegration:
    """통합 테스트"""
    
    def test_data_file_validation(self, tmp_path):
        """데이터 파일 검증 테스트"""
        from vibecraft import main
        
        # 존재하지 않는 파일
        test_args = ["vibecraft", "nonexistent.csv", "차트 생성"]
        with patch('sys.argv', test_args):
            with pytest.raises(SystemExit):
                main()
        
        # 디렉토리를 파일로 지정
        test_dir = tmp_path / "testdir"
        test_dir.mkdir()
        test_args = ["vibecraft", str(test_dir), "차트 생성"]
        with patch('sys.argv', test_args):
            with pytest.raises(SystemExit):
                main()


class TestExceptions:
    """커스텀 예외 클래스 테스트"""
    
    def test_vibecraft_error(self):
        """VibeCraftError 예외 테스트"""
        with pytest.raises(VibeCraftError):
            raise VibeCraftError("테스트 에러")
    
    def test_environment_error(self):
        """EnvironmentError 예외 테스트"""
        with pytest.raises(EnvironmentError):
            raise EnvironmentError("환경 설정 에러")
    
    def test_gemini_execution_error(self):
        """GeminiExecutionError 예외 테스트"""
        with pytest.raises(GeminiExecutionError):
            raise GeminiExecutionError("Gemini 실행 에러")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])