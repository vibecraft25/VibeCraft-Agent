# Task 13: 문서화 및 README 작성

## 목표
프로젝트의 사용자 가이드, API 문서, 예제 및 튜토리얼을 작성합니다.

## 작업 내용

### 13.1 메인 README.md
````markdown
# VibeCraft-Agent

SQLite 데이터베이스를 기반으로 Gemini CLI를 활용하여 React 데이터 시각화 애플리케이션을 자동 생성하는 CLI 도구입니다.

## 🚀 주요 기능

- **다양한 시각화 타입 지원**: 시계열, 지리공간, 간트차트, KPI 대시보드 등
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
git clone https://github.com/modelcontextprotocol/servers
cd servers/sqlite
pip install -e .
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
| `MCP_SERVER_PATH` | MCP SQLite 서버 경로 | /usr/local/lib/mcp-server-sqlite |
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

## 📚 추가 문서

- [API 문서](./docs/api.md)
- [아키텍처 가이드](./docs/architecture.md)
- [템플릿 작성 가이드](./docs/templates.md)
- [기여 가이드](./CONTRIBUTING.md)

## 🤝 기여하기

프로젝트에 기여하고 싶으시다면 [기여 가이드](./CONTRIBUTING.md)를 참고해주세요.

## 📄 라이선스

MIT License - 자세한 내용은 [LICENSE](./LICENSE) 파일을 참고하세요.
````

### 13.2 API 문서
````markdown
# API Documentation

## Core Modules

### VibeCraftAgent

메인 에이전트 클래스로 전체 워크플로우를 관리합니다.

#### Methods

##### execute(args: AgentCliArgs): Promise<AgentExecutionResult>

React 애플리케이션을 생성합니다.

**Parameters:**
- `args`: CLI 인자 객체
  - `sqlitePath` (string): SQLite 데이터베이스 경로
  - `visualizationType` (VisualizationType): 시각화 타입
  - `userPrompt` (string): 사용자 요구사항
  - `outputDir` (string): 출력 디렉토리
  - `projectName?` (string): 프로젝트 이름
  - `debug?` (boolean): 디버그 모드

**Returns:**
- `Promise<AgentExecutionResult>`: 실행 결과
  - `success` (boolean): 성공 여부
  - `outputPath` (string): 생성된 앱 경로
  - `executionTime` (number): 실행 시간 (ms)
  - `logs` (LogEntry[]): 실행 로그
  - `error?` (ErrorInfo): 에러 정보

**Example:**
```typescript
const agent = new VibeCraftAgent();
const result = await agent.execute({
  sqlitePath: './data.sqlite',
  visualizationType: 'time-series',
  userPrompt: '월별 매출 대시보드',
  outputDir: './output'
});
```

### SchemaAnalyzer

SQLite 데이터베이스 스키마를 분석합니다.

#### Methods

##### analyze(dbPath: string): Promise<SchemaInfo>

데이터베이스 스키마를 추출합니다.

**Parameters:**
- `dbPath` (string): SQLite 데이터베이스 경로

**Returns:**
- `Promise<SchemaInfo>`: 스키마 정보
  - `tables` (TableInfo[]): 테이블 목록
  - `relationships` (Relationship[]): 관계 정보
  - `metadata` (DatabaseMetadata): 메타데이터

### TemplateEngine

시각화 템플릿을 관리하고 렌더링합니다.

#### Methods

##### loadTemplate(type: VisualizationType): Template

템플릿을 로드합니다.

##### renderTemplate(template: Template, context: TemplateContext): string

템플릿을 렌더링합니다.

## Types

### VisualizationType

```typescript
type VisualizationType = 
  | 'time-series'
  | 'geo-spatial'
  | 'gantt-chart'
  | 'kpi-dashboard'
  | 'comparison'
  | 'funnel-analysis'
  | 'cohort-analysis'
  | 'heatmap'
  | 'network-graph'
  | 'custom';
```

### SchemaInfo

```typescript
interface SchemaInfo {
  tables: TableInfo[];
  relationships: Relationship[];
  metadata: DatabaseMetadata;
}
```

### TableInfo

```typescript
interface TableInfo {
  name: string;
  columns: ColumnInfo[];
  primaryKey?: string;
  foreignKeys: ForeignKey[];
  indexes: Index[];
  rowCount: number;
  sampleData?: any[];
}
```

## Error Codes

| Code | Description | Solution |
|------|-------------|----------|
| `INVALID_ARGS` | 잘못된 인자 | 인자 형식 확인 |
| `FILE_NOT_FOUND` | 파일을 찾을 수 없음 | 파일 경로 확인 |
| `SQLITE_CONNECTION_FAILED` | SQLite 연결 실패 | 데이터베이스 파일 확인 |
| `GEMINI_NOT_FOUND` | Gemini CLI 없음 | Gemini CLI 설치 |
| `VALIDATION_FAILED` | 검증 실패 | 생성된 파일 확인 |
````

### 13.3 튜토리얼
````markdown
# VibeCraft-Agent 튜토리얼

## 시작하기

이 튜토리얼에서는 VibeCraft-Agent를 사용하여 실제 데이터 시각화 애플리케이션을 만드는 과정을 단계별로 안내합니다.

## 1단계: 샘플 데이터베이스 준비

먼저 샘플 SQLite 데이터베이스를 만들어보겠습니다.

```sql
-- sample.sql
CREATE TABLE monthly_sales (
    id INTEGER PRIMARY KEY,
    month DATE NOT NULL,
    revenue DECIMAL(10,2),
    expenses DECIMAL(10,2),
    profit DECIMAL(10,2),
    region VARCHAR(50)
);

INSERT INTO monthly_sales (month, revenue, expenses, profit, region) VALUES
('2024-01-01', 100000, 70000, 30000, 'North'),
('2024-02-01', 120000, 80000, 40000, 'North'),
('2024-03-01', 110000, 75000, 35000, 'North'),
-- ... 더 많은 데이터
;
```

SQLite 데이터베이스 생성:
```bash
sqlite3 sales.sqlite < sample.sql
```

## 2단계: 시계열 대시보드 생성

```bash
vibecraft-agent \
  --sqlite-path ./sales.sqlite \
  --visualization-type time-series \
  --user-prompt "월별 수익, 비용, 이익을 보여주는 대시보드를 만들어주세요. 
                 전월 대비 증감률도 표시하고, 지역별로 필터링할 수 있게 해주세요." \
  --output-dir ./sales-dashboard \
  --project-name "Sales Analytics"
```

## 3단계: 생성된 앱 확인

```bash
cd ./sales-dashboard
ls -la
```

다음과 같은 파일들이 생성됩니다:
- `package.json`: 프로젝트 설정 및 의존성
- `public/index.html`: HTML 템플릿
- `public/data.sqlite`: 복사된 SQLite 데이터베이스
- `src/App.tsx`: 메인 React 컴포넌트
- `src/components/`: 시각화 컴포넌트들
- `src/hooks/`: 데이터 fetching hooks
- `src/utils/`: 유틸리티 함수들

## 4단계: 앱 실행

```bash
npm install
npm start
```

브라우저에서 http://localhost:3000을 열면 대시보드를 볼 수 있습니다.

## 5단계: 커스터마이징

생성된 코드를 수정하여 추가 기능을 구현할 수 있습니다.

### 새로운 차트 추가하기

```typescript
// src/components/ProfitMarginChart.tsx
import { LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts';

export const ProfitMarginChart = ({ data }) => {
  const chartData = data.map(item => ({
    month: item.month,
    margin: (item.profit / item.revenue * 100).toFixed(2)
  }));
  
  return (
    <LineChart width={600} height={300} data={chartData}>
      <XAxis dataKey="month" />
      <YAxis />
      <Tooltip />
      <Line type="monotone" dataKey="margin" stroke="#8884d8" />
    </LineChart>
  );
};
```

### 필터 기능 개선하기

```typescript
// src/hooks/useFilteredData.ts
export const useFilteredData = (data, filters) => {
  return useMemo(() => {
    return data.filter(item => {
      if (filters.region && item.region !== filters.region) {
        return false;
      }
      if (filters.minRevenue && item.revenue < filters.minRevenue) {
        return false;
      }
      return true;
    });
  }, [data, filters]);
};
```

## 고급 사용법

### 복잡한 스키마 처리

여러 테이블이 있는 데이터베이스의 경우:

```bash
vibecraft-agent \
  --sqlite-path ./complex.sqlite \
  --visualization-type kpi-dashboard \
  --user-prompt "orders, customers, products 테이블을 조인하여 
                 고객별 구매 패턴과 제품별 판매 현황을 보여주는 
                 종합 대시보드를 만들어주세요." \
  --output-dir ./complex-dashboard
```

### 지리공간 데이터 시각화

위치 정보가 포함된 데이터의 경우:

```bash
vibecraft-agent \
  --sqlite-path ./locations.sqlite \
  --visualization-type geo-spatial \
  --user-prompt "매장 위치를 지도에 표시하고, 매출액에 따라 
                 마커 크기를 다르게 표현해주세요. 
                 클러스터링 기능도 추가해주세요." \
  --output-dir ./store-map
```

## 문제 해결

### 데이터가 표시되지 않는 경우

1. 브라우저 개발자 도구에서 콘솔 에러 확인
2. SQLite 쿼리가 올바른지 확인
3. 데이터 형식이 차트 컴포넌트와 호환되는지 확인

### 성능 최적화

대용량 데이터의 경우:
- 데이터 집계 쿼리 사용
- 페이지네이션 구현
- 가상 스크롤링 적용

## 다음 단계

- [고급 템플릿 작성](./advanced-templates.md)
- [커스텀 시각화 구현](./custom-visualizations.md)
- [성능 최적화 가이드](./performance-guide.md)
````

### 13.4 기여 가이드 (CONTRIBUTING.md)
````markdown
# Contributing to VibeCraft-Agent

VibeCraft-Agent에 기여해주셔서 감사합니다! 이 문서는 프로젝트에 기여하는 방법을 안내합니다.

## 시작하기

1. 저장소를 Fork합니다
2. 로컬에 Clone합니다: `git clone https://github.com/your-username/vibecraft-agent`
3. 개발 브랜치를 생성합니다: `git checkout -b feature/my-feature`
4. 변경사항을 커밋합니다: `git commit -am 'Add new feature'`
5. 브랜치에 Push합니다: `git push origin feature/my-feature`
6. Pull Request를 생성합니다

## 개발 환경 설정

```bash
# 의존성 설치
npm install

# 개발 모드 실행
npm run dev

# 테스트 실행
npm test

# 빌드
npm run build
```

## 코드 스타일

- TypeScript 사용
- ESLint 규칙 준수
- Prettier로 코드 포맷팅

## 커밋 메시지 규칙

- `feat:` 새로운 기능
- `fix:` 버그 수정
- `docs:` 문서 수정
- `style:` 코드 포맷팅
- `refactor:` 코드 리팩토링
- `test:` 테스트 추가/수정
- `chore:` 빌드 프로세스 등 기타 변경

예시:
```
feat: add heatmap visualization template
fix: correct SQL query generation for time-series
docs: update API documentation for SchemaAnalyzer
```

## 테스트 작성

새로운 기능을 추가할 때는 반드시 테스트를 작성해주세요.

```typescript
describe('MyNewFeature', () => {
  test('should work correctly', () => {
    // 테스트 코드
  });
});
```

## Pull Request 가이드라인

1. PR 제목은 명확하게 작성
2. 변경사항을 상세히 설명
3. 관련 이슈가 있다면 링크
4. 스크린샷이나 예시 제공 (UI 변경시)
5. 모든 테스트가 통과하는지 확인

## 새로운 시각화 타입 추가하기

1. 템플릿 디렉토리 생성: `templates/my-visualization/`
2. 메타데이터 파일 생성: `templates/my-visualization/meta.json`
3. 프롬프트 파일 생성: `templates/my-visualization/prompt.md`
4. 타입 추가: `src/types/index.ts`
5. 템플릿 엔진에 등록
6. 테스트 작성
7. 문서 업데이트

## 문제 신고

버그를 발견하거나 새로운 기능을 제안하고 싶다면:

1. 기존 이슈를 먼저 확인
2. 새 이슈 생성시 템플릿 사용
3. 재현 가능한 단계 제공
4. 환경 정보 포함 (OS, Node 버전 등)

## 질문하기

- GitHub Discussions 사용
- 디스코드 채널 참여
- 이메일: vibecraft@example.com

## 라이선스

기여하신 코드는 프로젝트와 동일한 MIT 라이선스가 적용됩니다.
````

## 완료 기준
- [ ] 메인 README.md 작성
- [ ] API 문서 작성
- [ ] 사용자 튜토리얼 작성
- [ ] 기여 가이드 작성
- [ ] 예제 코드 및 샘플 작성
- [ ] 문서 검증 및 업데이트