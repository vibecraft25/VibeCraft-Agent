# Contributing to VibeCraft Agent

먼저 VibeCraft Agent에 기여하고자 하는 마음에 감사드립니다! 🎉

이 문서는 프로젝트에 기여하는 방법에 대한 가이드라인을 제공합니다.

## 목차

- [행동 강령](#행동-강령)
- [기여 방법](#기여-방법)
- [개발 환경 설정](#개발-환경-설정)
- [코딩 스타일](#코딩-스타일)
- [커밋 메시지 가이드](#커밋-메시지-가이드)
- [Pull Request 프로세스](#pull-request-프로세스)
- [이슈 보고](#이슈-보고)

## 행동 강령

이 프로젝트와 커뮤니티의 모든 참여자는 우리의 행동 강령을 준수해야 합니다. 
모든 사람이 괴롭힘 없는 경험을 할 수 있도록 도와주세요.

## 기여 방법

### 1. 이슈 확인
- 기존 이슈를 먼저 확인하여 중복을 피하세요
- 작업하고 싶은 이슈를 찾았다면 댓글로 알려주세요

### 2. Fork & Clone
```bash
# Fork 후 클론
git clone https://github.com/your-username/vibecraft-agent-v2.git
cd vibecraft-agent-v2

# 원본 저장소를 upstream으로 추가
git remote add upstream https://github.com/original/vibecraft-agent-v2.git
```

### 3. 브랜치 생성
```bash
git checkout -b feature/your-feature-name
# 또는
git checkout -b fix/issue-number
```

## 개발 환경 설정

### 1. Python 환경 설정
```bash
# 가상환경 생성
python -m venv venv

# 활성화
source venv/bin/activate  # Linux/Mac
# 또는
venv\Scripts\activate  # Windows

# 의존성 설치
pip install -r requirements.txt
```

### 2. Gemini CLI 설정
```bash
# Gemini CLI 설치
npm install -g @google/gemini-cli

# 인증
gemini auth login
```

### 3. 환경 변수 설정
```bash
cp .env.example .env
# .env 파일 편집하여 필요한 값 설정
```

## 코딩 스타일

### Python 코드 스타일
- PEP 8을 따릅니다
- Black 포매터를 사용합니다
- Type hints를 사용합니다

```bash
# 코드 포매팅
black vibecraft.py

# 린팅
flake8 vibecraft.py

# 타입 체크
mypy vibecraft.py
```

### 예제 코드
```python
from typing import Optional, Dict, Any

def process_data(
    file_path: str, 
    options: Optional[Dict[str, Any]] = None
) -> bool:
    """
    데이터를 처리합니다.
    
    Args:
        file_path: 처리할 파일 경로
        options: 추가 옵션
        
    Returns:
        처리 성공 여부
    """
    # 구현
    return True
```

## 커밋 메시지 가이드

### 형식
```
<type>: <subject>

<body>

<footer>
```

### Type
- `feat`: 새로운 기능 추가
- `fix`: 버그 수정
- `docs`: 문서 수정
- `style`: 코드 포매팅, 세미콜론 누락 등
- `refactor`: 코드 리팩토링
- `test`: 테스트 추가/수정
- `chore`: 빌드 업무, 패키지 매니저 설정 등

### 예제
```
feat: 실시간 데이터 업데이트 기능 추가

- WebSocket을 통한 실시간 데이터 수신
- 차트 자동 업데이트 구현
- 업데이트 주기 설정 옵션 추가

Closes #123
```

## Pull Request 프로세스

### 1. PR 전 체크리스트
- [ ] 코드가 프로젝트의 코딩 스타일을 따르는가?
- [ ] 모든 테스트가 통과하는가?
- [ ] 문서를 업데이트했는가?
- [ ] 커밋 메시지가 가이드라인을 따르는가?

### 2. PR 생성
- 명확한 제목과 설명 작성
- 관련 이슈 번호 연결
- 변경 사항 요약
- 스크린샷 추가 (UI 변경 시)

### 3. 코드 리뷰
- 리뷰어의 피드백에 적극적으로 응답
- 요청된 변경 사항 반영
- 토론이 필요한 경우 이슈로 이동

## 이슈 보고

### 버그 리포트
다음 정보를 포함해주세요:
- 환경 정보 (OS, Python 버전, Gemini CLI 버전)
- 재현 단계
- 예상 동작
- 실제 동작
- 에러 메시지 (있는 경우)

### 기능 요청
다음 정보를 포함해주세요:
- 제안하는 기능의 명확한 설명
- 사용 사례
- 가능한 구현 방법 (선택사항)

## 테스트

### 테스트 실행
```bash
# 모든 테스트 실행
pytest

# 커버리지 포함
pytest --cov=vibecraft

# 특정 테스트만 실행
pytest tests/test_specific.py
```

### 테스트 작성
```python
import pytest
from vibecraft import process_data

def test_process_data_success():
    """데이터 처리 성공 테스트"""
    result = process_data("test.csv")
    assert result is True

def test_process_data_invalid_file():
    """잘못된 파일 처리 테스트"""
    with pytest.raises(FileNotFoundError):
        process_data("nonexistent.csv")
```

## 도움 요청

질문이나 도움이 필요한 경우:
- [GitHub Discussions](https://github.com/yourusername/vibecraft-agent-v2/discussions) 사용
- [이슈](https://github.com/yourusername/vibecraft-agent-v2/issues) 생성
- 이메일: your-email@example.com

## 감사의 말

모든 기여자분들께 감사드립니다! 여러분의 도움으로 VibeCraft가 더 나은 도구가 됩니다. 🚀