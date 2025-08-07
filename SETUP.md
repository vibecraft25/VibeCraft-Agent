# VibeCraft-Agent 설치 트러블슈팅

## 🚨 Clone 후 발생할 수 있는 문제들

### 1. Gemini CLI를 찾을 수 없음
```bash
Error: Gemini CLI not found. Please install it first.
```

**해결 방법:**
```bash
# Gemini CLI는 별도 설치 필요
# 설치 방법은 Anthropic 문서 참조
# https://github.com/anthropics/gemini

# 설치 확인
gemini --version
```

### 2. GEMINI_API_KEY 설정 안 됨
```bash
❌ Error: GEMINI_API_KEY is not set
```

**해결 방법:**
```bash
# 1. API Key 발급
# https://makersuite.google.com/app/apikey

# 2. .env 파일 생성
cp .env.example .env

# 3. .env 파일에 API Key 입력
echo "GEMINI_API_KEY=your-actual-key" > .env
```

### 3. TypeScript 컴파일 에러
```bash
error TS2307: Cannot find module '../package.json'
```

**해결 방법:**
```bash
# tsconfig.json 수정
# "resolveJsonModule": true 추가
```

### 4. 샘플 대시보드 실행 시 에러
```bash
Error: Cannot find module 'react'
```

**해결 방법:**
```bash
# 각 샘플 폴더에서 개별적으로 설치 필요
cd samples/kpi-dashboard
npm install
npm run dev
```

### 5. MCP Server 관련 경고
```bash
[WARN] failed to start or connect to MCP server
```

**해결 방법:**
이 경고는 무시해도 됩니다. MCP Server는 선택사항이며, 없어도 정상 작동합니다.

설치하려면:
```bash
pip install mcp-server-sqlite
# 또는
uv pip install mcp-server-sqlite
```

## 📋 전체 설치 체크리스트

```bash
# 1. 프로젝트 클론
git clone <repo-url>
cd vibecraft-agent

# 2. 의존성 설치
npm install

# 3. 빌드
npm run build

# 4. 환경 설정
cp .env.example .env
# .env 파일 편집하여 GEMINI_API_KEY 설정

# 5. Gemini CLI 확인
gemini --version

# 6. 테스트 실행
npm run start -- \
  --sqlite-path ./samples/sample-business.sqlite \
  --visualization-type kpi-dashboard \
  --user-prompt "테스트" \
  --output-dir ./output

# 7. 샘플 확인
cd samples/kpi-dashboard
npm install
npm run dev
```

## 🔧 시스템 요구사항

- **Node.js**: v18.0.0 이상
- **npm**: v8.0.0 이상  
- **Python**: v3.8 이상 (MCP Server 사용 시)
- **OS**: macOS, Linux, Windows (WSL 권장)

## 💡 추가 팁

### 전역 설치 없이 사용
```bash
# npm link 대신 npx 사용
npx . --sqlite-path ./samples/sample-business.sqlite ...
```

### 디버그 모드
```bash
# 상세한 로그 출력
npm run start -- --debug ...
```

### 환경 변수 우선순위
1. `.env` 파일
2. 시스템 환경 변수
3. 기본값