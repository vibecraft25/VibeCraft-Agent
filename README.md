# VibeCraft-Agent

SQLite 데이터베이스를 기반으로 Gemini CLI를 활용하여 React 데이터 시각화 애플리케이션을 자동 생성하는 CLI 도구입니다.

## 🚀 주요 기능

- **다양한 시각화 타입 지원**: 시계열, 지리공간, 간트차트, KPI 대시보드 등 10가지 시각화 템플릿
- **Gemini CLI 통합**: Google의 코드 생성 AI를 활용한 자동 코드 생성
- **SQLite 데이터베이스 직접 연동**: sql.js를 통한 브라우저 기반 데이터베이스 접근
- **완전한 React 앱 생성**: 즉시 실행 가능한 React 애플리케이션 생성
- **반응형 디자인**: 모바일부터 데스크톱까지 모든 화면 크기 지원

## 📋 요구사항

- Node.js 18.0 이상
- npm 또는 yarn
- Gemini CLI (별도 설치 필요)
- MCP SQLite Server (선택사항)

## 🔧 설치

### 1. VibeCraft-Agent 설치

```bash
npm install -g vibecraft-agent
```

또는 로컬 개발:

```bash
git clone https://github.com/your-org/vibecraft-agent
cd vibecraft-agent
npm install
npm run build
npm link
```

### 2. Gemini CLI 설치

```bash
npm install -g @google/gemini-cli
```

### 3. MCP SQLite Server 설치 (선택사항)

```bash
# Python 패키지로 설치
pip install mcp-server-sqlite

# 또는 UV로 설치
uv pip install mcp-server-sqlite
```

## 💻 사용법

### 기본 사용법

```bash
vibecraft-agent \
  --sqlite-path /path/to/your/data.sqlite \
  --visualization-type time-series \
  --user-prompt "월별 매출 추이를 보여주는 대시보드를 만들어주세요" \
  --output-dir ./my-dashboard
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
| `--list-types` | 지원하는 시각화 타입 목록 표시 | ❌ | - |

### 지원하는 시각화 타입

- `time-series`: 시계열 데이터 분석 및 트렌드 시각화
- `geo-spatial`: 지리적 데이터 매핑 및 위치 기반 분석
- `gantt-chart`: 프로젝트 일정 및 작업 진행 상황
- `kpi-dashboard`: 핵심 성과 지표 대시보드
- `comparison`: 데이터 비교 및 대조 분석
- `funnel-analysis`: 퍼널 분석 및 전환율 추적
- `cohort-analysis`: 코호트 분석 및 사용자 행동 패턴
- `heatmap`: 히트맵 및 밀도 분석
- `network-graph`: 네트워크 관계 및 연결 시각화
- `custom`: 사용자 정의 시각화

## 📊 사용 예시

### 시계열 대시보드 생성

```bash
vibecraft-agent \
  --sqlite-path ./sales_data.sqlite \
  --visualization-type time-series \
  --user-prompt "2024년 월별 매출 추이와 전년 대비 성장률을 보여주는 대시보드" \
  --output-dir ./sales-dashboard \
  --project-name "Sales Analytics Dashboard"
```

### 지리공간 시각화

```bash
vibecraft-agent \
  --sqlite-path ./store_locations.sqlite \
  --visualization-type geo-spatial \
  --user-prompt "매장별 매출을 지도에 히트맵으로 표시하고 지역별 통계를 제공" \
  --output-dir ./store-map
```

### 간트 차트

```bash
vibecraft-agent \
  --sqlite-path ./project_tasks.sqlite \
  --visualization-type gantt-chart \
  --user-prompt "프로젝트 일정을 담당자별로 구분하고 진행률을 표시" \
  --output-dir ./project-timeline
```

## 🔍 생성된 앱 실행하기

1. 생성된 디렉토리로 이동:
   ```bash
   cd ./my-dashboard
   ```

2. 의존성 설치:
   ```bash
   npm install
   ```

3. 개발 서버 실행:
   ```bash
   npm start
   ```

4. 브라우저에서 http://localhost:3000 접속

## ⚙️ 환경 변수

| 변수명 | 설명 | 기본값 |
|--------|------|--------|
| `MCP_SERVER_PATH` | MCP SQLite 서버 경로 | 자동 탐색 |
| `VIBECRAFT_DEBUG` | 디버그 모드 활성화 | false |
| `VIBECRAFT_TIMEOUT` | 실행 타임아웃 (ms) | 300000 |
| `GEMINI_SETTINGS_DIR` | Gemini 설정 디렉토리 | .gemini |

## 🐛 문제 해결

### Gemini CLI를 찾을 수 없음
```bash
Error: Gemini CLI is not installed
```
해결: `npm install -g @google/gemini-cli` 실행

### SQLite 파일을 열 수 없음
```bash
Error: Cannot open SQLite database
```
해결: 
- 파일 경로가 올바른지 확인
- 파일 권한 확인
- 유효한 SQLite 파일인지 확인

### MCP 서버 연결 실패
```bash
Error: Failed to connect to MCP server
```
해결:
- MCP_SERVER_PATH 환경 변수 확인
- MCP 서버가 설치되어 있는지 확인
- Python 또는 UV로 설치했는지 확인

## 📚 추가 문서

- [API 문서](./docs/api.md)
- [아키텍처 가이드](./docs/technical-architecture.md)
- [템플릿 작성 가이드](./docs/template-guide.md)
- [기여 가이드](./CONTRIBUTING.md)

## 🤝 기여하기

프로젝트에 기여하고 싶으시다면 [기여 가이드](./CONTRIBUTING.md)를 참고해주세요.

## 📄 라이선스

MIT License - 자세한 내용은 [LICENSE](./LICENSE) 파일을 참고하세요.