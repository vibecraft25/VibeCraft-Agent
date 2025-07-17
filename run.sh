#!/bin/bash

# VibeCraft v2.0 실행 스크립트

# 색상 정의
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 사용법 표시
if [ $# -lt 2 ]; then
    echo "사용법: $0 <데이터파일> <시각화 요청>"
    echo "예시: $0 sales.csv \"월별 매출 추이를 보여줘\""
    exit 1
fi

# Python 3 확인
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}❌ Python 3가 설치되지 않았습니다.${NC}"
    exit 1
fi

# Gemini CLI 확인
if ! command -v gemini &> /dev/null; then
    echo -e "${RED}❌ Gemini CLI가 설치되지 않았습니다.${NC}"
    echo "설치 방법: https://github.com/google-gemini/gemini-cli"
    exit 1
fi

# 스크립트 디렉토리 확인
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Python 스크립트 실행
echo -e "${GREEN}🚀 VibeCraft v2.0 시작...${NC}"
python3 "$SCRIPT_DIR/vibecraft.py" "$@"