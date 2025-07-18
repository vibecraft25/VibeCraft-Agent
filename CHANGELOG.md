# Changelog

모든 주요 변경사항이 이 파일에 기록됩니다.

이 프로젝트는 [Semantic Versioning](https://semver.org/spec/v2.0.0.html)을 따릅니다.

## [2.1.0] - 2025-07-18

### 🎉 주요 변경사항
- 기본 시스템 프롬프트를 verbose 버전으로 변경
- 레거시 파일 정리 및 코드베이스 단순화
- 스트리밍 모드가 기본값으로 설정됨

### 🔧 개선사항
- `vibecraft-system-prompt-verbose.md`가 기본값으로 설정됨
- 모든 실행에서 상세한 진행 상황 출력이 기본 동작
- 스트리밍이 기본 동작으로 변경 (실시간 실행 과정 표시)
- `-s, --simple` 플래그로 스트리밍 비활성화 가능
- `vibecraft-system-prompt.md`를 `vibecraft-system-prompt-simple.md`로 이름 변경
- 리팩터링 과정의 임시 파일들 제거

### 🧹 정리된 파일들
- `vibecraft_original.py` - 삭제됨
- `vibecraft_refactored.py` - 삭제됨  
- `test_refactored.py` - 삭제됨
- `comparison_demo.py` - 삭제됨
- `demo_data.csv` - 삭제됨

### 📚 코드 변경사항
- `setup_environment()` 함수의 파라미터를 `verbose`에서 `simple_mode`로 변경
- `create_enhanced_prompt()` 함수의 `verbose` 기본값을 `True`로 변경
- 테스트 코드 업데이트로 새로운 기본 동작 반영

## [2.0.0] - 2025-07-17

### 🎉 주요 변경사항
- Gemini API 직접 호출에서 Gemini CLI 사용으로 전환
- 더욱 "에이전틱"한 AI 실행 방식 도입
- 실시간 스트리밍 출력 지원

### ✨ 새로운 기능
- `-s, --stream` 옵션으로 Gemini 실행 과정 실시간 확인
- `-d, --debug` 옵션으로 디버그 모드 지원
- Verbose 시스템 프롬프트로 상세 실행 로그 출력
- 환경 변수 기반 설정 관리 (.env 파일 지원)

### 🔧 개선사항
- 타입 힌트 추가로 코드 품질 향상
- 커스텀 예외 클래스로 에러 처리 개선
- 상수 정의로 설정값 중앙 관리
- 파일 인코딩 명시로 다국어 지원 강화

### 📚 문서화
- 포괄적인 README.md 작성
- 기여 가이드라인 (CONTRIBUTING.md) 추가
- 테스트 코드 작성
- CI/CD 파이프라인 구축

### 🏗️ 인프라
- GitHub Actions CI/CD 워크플로우 추가
- 자동화된 테스트, 린팅, 보안 검사
- PyPI 패키지 배포 준비

## [1.0.0] - 2025-07-01

### 🎉 초기 릴리즈
- Python 기반 Gemini API 직접 호출
- 기본적인 데이터 시각화 기능
- CSV, JSON 파일 지원
- Plotly.js 기반 인터랙티브 차트 생성