# VibeCraft - Gemini CLI Edition

Gemini CLI를 활용한 원샷 프롬프팅 데이터 시각화 도구

## 개요

VibeCraft은 Gemini CLI를 사용하여 자연어 요청을 통해 데이터 시각화를 자동으로 생성하는 도구입니다. 복잡한 설정 없이 단일 명령으로 인터랙티브한 HTML 대시보드를 생성합니다.

## 필수 요구사항

- Python 3.6+
- Gemini CLI (설치: https://github.com/google-gemini/gemini-cli)
- Google Cloud 프로젝트 및 Gemini API 활성화

## 설치

1. Gemini CLI 설치 및 인증:
```bash
# Gemini CLI 설치 (아직 설치하지 않은 경우)
# 설치 가이드: https://github.com/google-gemini/gemini-cli

2. 실행 권한 설정:
```bash
chmod +x run.sh vibecraft.py
```

## 사용법

### 기본 사용법

```bash
# run.sh 사용
./run.sh <데이터파일> "<시각화 요청>"

# 또는 Python 직접 실행
python3 vibecraft.py <데이터파일> "<시각화 요청>"
```

### 예제

```bash
# 월별 매출 추이
./run.sh examples/sales_data.csv "월별 매출과 비용 추이를 라인 차트로 보여줘"

# 카테고리별 비교
./run.sh examples/sales_data_category.csv "카테고리별 매출을 막대 그래프로 비교"

# 출력 파일명 지정
python3 vibecraft.py data.csv "분포를 히스토그램으로" -o my-report.html
```

## 작동 원리

1. **데이터 로드**: 지정된 데이터 파일을 읽고 처음 100줄을 샘플로 추출
2. **프롬프트 생성**: 시스템 프롬프트와 사용자 요청을 결합
3. **Gemini CLI 실행**: YOLO 모드(-y)로 실행하여 파일 작업 자동 승인
4. **파일 저장**: Gemini가 직접 HTML 파일을 생성하고 저장

## 지원 기능

- 📊 **다양한 차트 타입**: 라인, 막대, 산점도, 파이, 히스토그램, 다중 시리즈
- 🤖 **AI 기반 자동 차트 선택**: 데이터와 요청에 맞는 최적의 시각화 자동 결정
- 🌐 **단일 HTML 출력**: 서버 없이 브라우저에서 바로 실행 가능
- 🇰🇷 **한국어 지원**: 자연어 명령 및 차트 UI 완전 한국어 지원
- ⚡ **원샷 프롬프팅**: 복잡한 코드 없이 단일 AI 요청으로 완성

## 파일 구조

```
vibecraft-agent/
├── vibecraft.py                # 메인 Python 스크립트
├── vibecraft-system-prompt.md  # Gemini용 시스템 프롬프트
├── run.sh                      # 실행 편의 스크립트
├── examples/                   # 예제 데이터
│   ├── sales_data.csv
│   └── sales_data_category.csv
└── README.md                   # 이 문서
```

## 트러블슈팅

### API 권한 오류
- Google Cloud Console에서 Gemini API 활성화 확인
- 프로젝트 권한 확인

### 데이터 파일 오류
- UTF-8 인코딩 확인
- CSV 형식 유효성 확인

## 라이선스

Apache License 2.0