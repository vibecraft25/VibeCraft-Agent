# VibeCraft-Agent

SQLite 데이터베이스를 기반으로 Gemini CLI를 활용하여 React 데이터 시각화 애플리케이션을 자동 생성하는 CLI 도구입니다.

> 🎉 **90%+ 성공률**로 원샷 프롬프트만으로 즉시 실행 가능한 React 앱을 생성합니다!

## 🚀 주요 기능

- **실전 검증된 시각화 타입**: time-series, geo-spatial, kpi-dashboard, comparison 등
- **원샷 프롬프트**: 한 번의 명령으로 완전한 React 앱 생성
- **자체 검증 기능**: 생성 후 자동으로 빌드 검증 및 TypeScript 에러 수정
- **스마트 컬럼 매핑**: 다양한 데이터베이스 스키마에 자동 적응
- **즉시 실행 가능**: `npm install && npm run dev`로 바로 실행

## 📋 기술 스택

생성되는 앱은 다음 기술을 사용합니다:
- **Vite**: 빠른 개발 서버와 빌드
- **React 18**: 최신 React 기능 활용
- **TypeScript**: 타입 안정성
- **Recharts**: 데이터 시각화
- **Tailwind CSS**: 스타일링
- **sql.js**: 브라우저에서 SQLite 실행

## 🔧 설치 및 실행

### 방법 1: 프로젝트 Clone 후 바로 실행 (권장)

```bash
# 1. 프로젝트 클론
git clone https://github.com/your-org/vibecraft-agent
cd vibecraft-agent

# 2. 의존성 설치 및 빌드
npm install
npm run build

# 3. 환경 설정 (.env 파일 생성)
cp .env.example .env
# .env 파일을 열어서 GEMINI_API_KEY 설정

# 4. 전역 설치 (선택사항 - 어디서든 vibecraft-agent 명령 사용)
npm link

# 5. 바로 실행 (전역 설치 안 했을 경우)
npm run start -- \
  --sqlite-path ./test-commands/sample-business.sqlite \
  --visualization-type kpi-dashboard \
  --user-prompt "주요 비즈니스 메트릭 대시보드" \
  --output-dir ./output
```

### 방법 2: 전역 설치 후 사용

```bash
# 1. VibeCraft-Agent 전역 설치
git clone https://github.com/your-org/vibecraft-agent
cd vibecraft-agent
npm install
npm run build
npm link

# 2. 이제 어디서든 사용 가능
cd ~/my-project
vibecraft-agent \
  --sqlite-path ./data.sqlite \
  --visualization-type time-series \
  --user-prompt "월별 매출 추이" \
  --output-dir ./dashboard
```

### 필수 사전 요구사항

#### 1. Node.js (v18 이상)

```bash
# Node.js 버전 확인
node --version  # v18.0.0 이상이어야 함
```

#### 2. Gemini API Key (필수)

Google AI Studio에서 API 키를 발급받아야 합니다:

1. [Google AI Studio](https://makersuite.google.com/app/apikey) 방문
2. "Create API Key" 클릭
3. 생성된 키를 `.env` 파일에 설정

```bash
# .env 파일 생성
cp .env.example .env

# .env 파일 편집하여 API 키 추가
GEMINI_API_KEY=your-api-key-here
```

#### 3. Gemini CLI 설치 (필수)

Gemini CLI가 반드시 설치되어 있어야 합니다:

```bash
# Gemini CLI 설치
npm install -g @anthropic/gemini

# 설치 확인
gemini --version
```

⚠️ **주의**: Gemini CLI는 별도로 설치해야 합니다. 
설치 방법: https://github.com/anthropics/gemini

#### 4. MCP SQLite Server 설치 (선택사항)

스키마 분석 기능 강화를 위해 권장:

```bash
# Python으로 설치
pip install mcp-server-sqlite

# 또는 UV로 설치
uv pip install mcp-server-sqlite
```

## 🚀 빠른 시작

### 샘플 데이터베이스로 테스트

프로젝트에 포함된 샘플 데이터베이스로 바로 테스트:

```bash
# KPI 대시보드 생성
npm run start -- \
  --sqlite-path ./samples/sample-business.sqlite \
  --visualization-type kpi-dashboard \
  --user-prompt "주요 비즈니스 메트릭을 카드 형태로 표시" \
  --output-dir ./output

# 생성된 앱 실행
cd ./output/vibecraft-kpi-*
npm run dev
```

## 💻 사용법

### 기본 명령어

```bash
vibecraft-agent \
  --sqlite-path /path/to/your/data.sqlite \
  --visualization-type <type> \
  --user-prompt "시각화 요구사항" \
  --output-dir ./output
```

### 옵션 설명

| 옵션 | 설명 | 필수 | 기본값 |
|------|------|------|--------|
| `--sqlite-path` | SQLite 데이터베이스 파일 경로 | ✅ | - |
| `--visualization-type` | 시각화 타입 (아래 참조) | ✅ | - |
| `--user-prompt` | 시각화 요구사항 설명 | ✅ | - |
| `--output-dir` | 생성될 React 앱 디렉토리 | ❌ | ./output |
| `--project-name` | 프로젝트 이름 | ❌ | 자동 생성 |
| `--debug` | 디버그 모드 활성화 | ❌ | false |

### 지원하는 시각화 타입

```bash
# 사용 가능한 시각화 타입 목록 보기
vibecraft-agent --list-types
```

| 타입 | 설명 | 주요 용도 |
|------|------|-----------|
| `time-series` | 시계열 분석 | 시간에 따른 추이, 트렌드 분석 |
| `geo-spatial` | 지도 시각화 | 위치 기반 데이터, 지역별 통계 |
| `kpi-dashboard` | KPI 대시보드 | 핵심 지표, 메트릭 카드 |
| `comparison` | 비교 분석 | 카테고리별 비교, A/B 분석 |

## 📊 실제 사용 예시

### 1. 시계열 대시보드 (월별 매출 추이)

```bash
vibecraft-agent \
  --sqlite-path /path/to/your/database.sqlite \
  --visualization-type time-series \
  --user-prompt "월별 매출 추이를 라인 차트로 보여주고, 제품별로 구분해서 표시해주세요" \
  --output-dir ./sales-dashboard
```

### 2. KPI 대시보드 (핵심 지표)

```bash
vibecraft-agent \
  --sqlite-path /path/to/your/database.sqlite \
  --visualization-type kpi-dashboard \
  --user-prompt "총 매출, 평균 주문 금액, 베스트셀러 제품, 지역별 매출 비중을 카드 형태로 보여주세요" \
  --output-dir ./kpi-dashboard
```

### 3. 지리공간 시각화 (지역별 매출)

```bash
vibecraft-agent \
  --sqlite-path /path/to/your/database.sqlite \
  --visualization-type geo-spatial \
  --user-prompt "지역별 매출을 한국 지도에 마커로 표시하고, 클릭하면 상세 정보를 보여주세요" \
  --output-dir ./geo-dashboard
```

### 4. 비교 분석 (제품별/지역별)

```bash
vibecraft-agent \
  --sqlite-path /path/to/your/database.sqlite \
  --visualization-type comparison \
  --user-prompt "제품별 매출을 막대 차트로, 지역별 매출을 파이 차트로 나란히 보여주세요" \
  --output-dir ./comparison-dashboard
```

## 🔍 생성된 앱 실행하기

1. 생성된 디렉토리로 이동:
   ```bash
   cd ./sales-dashboard
   ```

2. 의존성 설치:
   ```bash
   npm install
   ```

3. 개발 서버 실행:
   ```bash
   npm run dev
   ```

4. 브라우저에서 http://localhost:5173 접속


## ⚡ 성능 및 특징

### 프롬프트 최적화
- **"Less is More" 원칙**: 단순하고 명확한 프롬프트로 90%+ 성공률
- **자체 검증**: 생성 중 발생한 TypeScript 에러 자동 수정
- **빠른 생성**: 2-3분 내에 완전한 React 앱 생성

### 스마트 기능
- **컬럼 자동 매핑**: 날짜, 금액, 지역 등 자동 인식
- **한국어 지역명 → 좌표 변환**: geo-spatial에서 자동 처리
- **반응형 디자인**: 모바일부터 데스크톱까지 자동 대응

## ⚙️ 환경 설정

### 환경 변수 설정 방법

VibeCraft-Agent는 `.env` 파일을 통해 환경 설정을 관리합니다:

```bash
# 1. .env.example 파일 복사
cp .env.example .env

# 2. .env 파일 편집
nano .env  # 또는 원하는 편집기 사용
```

### 필수 환경 변수

**GEMINI_API_KEY만 있으면 실행 가능합니다!**

```bash
# .env 파일
GEMINI_API_KEY=your-api-key-here
```

Google Cloud 설정이나 다른 복잡한 설정은 필요 없습니다. 
Gemini API Key 하나만 있으면 바로 사용할 수 있습니다.

## 📦 샘플 대시보드

`samples/` 폴더에 실제 생성된 대시보드 예제가 포함되어 있습니다:

### 포함된 샘플:
- **sample-business.sqlite**: 한국 비즈니스 샘플 데이터베이스
- **time-series-dashboard**: 시계열 매출 분석 대시보드
- **kpi-dashboard**: 핵심 비즈니스 메트릭 대시보드  
- **geo-spatial-dashboard**: 지역별 매출 지도 시각화

### 샘플 실행:
```bash
# KPI 대시보드 실행 예시
cd samples/kpi-dashboard
npm install
npm run dev
```

자세한 내용은 [samples/README.md](./samples/README.md) 참조

## 🐛 문제 해결

### Gemini CLI를 찾을 수 없음
```bash
Error: Gemini CLI not found. Please install it first.
```
**해결**: Gemini CLI가 설치되어 있고 PATH에 등록되어 있는지 확인

### SQLite 파일 접근 오류
```bash
Error: Cannot access SQLite database
```
**해결**: 
- 파일 경로가 올바른지 확인
- 파일이 유효한 SQLite 데이터베이스인지 확인
- 파일 읽기 권한이 있는지 확인

### 생성된 앱 실행 시 에러
```bash
Error: Cannot find module '@/components/...'
```
**해결**: 대부분 자체 검증으로 해결되지만, 발생 시:
- `tsconfig.json`의 paths 설정 확인
- `vite.config.ts`의 alias 설정 확인

### 타임아웃 문제
생성 중 5분 타임아웃이 발생해도 앱은 정상적으로 생성됩니다. 생성된 디렉토리에서:
```bash
npm run build  # 빌드 확인
npm run dev    # 개발 서버 실행
```

## 📚 추가 문서

- [설치 트러블슈팅](./SETUP.md)
- [기여 가이드](./CONTRIBUTING.md)
- [샘플 대시보드](./samples/README.md)

## 🤝 기여하기

새로운 시각화 타입을 추가하거나 기능을 개선하고 싶으시다면:

1. Fork & Clone
2. 새 브랜치 생성 (`git checkout -b feature/amazing-visualization`)
3. 변경사항 커밋 (`git commit -m 'Add amazing visualization'`)
4. Push (`git push origin feature/amazing-visualization`)
5. Pull Request 생성

자세한 내용은 [기여 가이드](./CONTRIBUTING.md)를 참조하세요.

## 📄 라이선스

MIT License - 자세한 내용은 [LICENSE](./LICENSE) 파일을 참고하세요.