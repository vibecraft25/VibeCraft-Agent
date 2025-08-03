# VibeCraft-Agent 템플릿 작성 가이드

이 가이드는 VibeCraft-Agent의 새로운 시각화 템플릿을 작성하는 방법을 설명합니다.

## 목차

1. [템플릿 시스템 개요](#템플릿-시스템-개요)
2. [템플릿 구조](#템플릿-구조)
3. [메타데이터 작성](#메타데이터-작성)
4. [프롬프트 템플릿 작성](#프롬프트-템플릿-작성)
5. [변수 시스템](#변수-시스템)
6. [모범 사례](#모범-사례)
7. [테스트 및 검증](#테스트-및-검증)
8. [예제](#예제)

## 템플릿 시스템 개요

VibeCraft-Agent의 템플릿 시스템은 다양한 시각화 타입을 지원하기 위한 확장 가능한 구조입니다.

### 주요 특징

- **Markdown 기반**: 읽기 쉽고 유지보수가 간편
- **변수 치환**: 동적 콘텐츠 삽입 지원
- **메타데이터 검증**: 템플릿 요구사항 자동 확인
- **재사용성**: 공통 패턴을 쉽게 공유

## 템플릿 구조

각 템플릿은 다음 구조를 따릅니다:

```
templates/
└── visualization-type/
    ├── meta.json       # 템플릿 메타데이터
    ├── prompt.md       # 프롬프트 템플릿
    └── examples/       # 예제 파일 (선택)
        ├── sample.sql
        └── expected-output.tsx
```

## 메타데이터 작성

### meta.json 구조

```json
{
  "type": "visualization-type",
  "name": "Human Readable Name",
  "description": "Detailed description of what this visualization does",
  "author": "Your Name",
  "version": "1.0.0",
  "tags": ["category", "use-case", "feature"],
  "requirements": {
    "minTables": 1,
    "maxTables": 10,
    "requiredColumns": ["column_type"],
    "optionalColumns": ["date", "value"],
    "supportedDataTypes": ["numeric", "datetime", "text", "boolean"]
  },
  "chartLibraries": ["recharts", "d3", "leaflet"],
  "defaultConfig": {
    "responsive": true,
    "animations": true,
    "interactivity": "high",
    "colorScheme": "default"
  },
  "compatibility": {
    "minReactVersion": "18.0.0",
    "browserSupport": ["chrome", "firefox", "safari", "edge"]
  },
  "examples": [
    {
      "name": "Basic Example",
      "description": "Simple usage scenario",
      "tables": ["sales_data"],
      "query": "SELECT date, revenue FROM sales_data",
      "preview": "examples/basic-preview.png"
    }
  ]
}
```

### 필수 필드 설명

#### type
- 고유한 시각화 타입 식별자
- kebab-case 사용
- 예: `time-series`, `geo-spatial`

#### requirements
```json
{
  "requirements": {
    "minTables": 1,              // 최소 테이블 수
    "maxTables": null,           // 최대 테이블 수 (null = 무제한)
    "requiredColumns": [         // 필수 컬럼 타입
      "datetime",                // 날짜/시간 컬럼 필수
      "numeric"                  // 숫자형 컬럼 필수
    ],
    "optionalColumns": [         // 선택적 컬럼 타입
      "category",                // 카테고리 컬럼 (있으면 활용)
      "text"                     // 텍스트 컬럼
    ],
    "supportedDataTypes": [      // 지원하는 데이터 타입
      "INTEGER",
      "REAL",
      "TEXT",
      "DATE",
      "DATETIME"
    ],
    "dataVolumeLimit": {         // 데이터 볼륨 제한
      "maxRows": 1000000,        // 최대 행 수
      "recommendedRows": 100000  // 권장 행 수
    }
  }
}
```

#### chartLibraries
사용할 차트 라이브러리 목록:
- `recharts`: 일반적인 차트
- `d3`: 고급 시각화
- `leaflet`: 지도
- `chartjs`: Chart.js
- `plotly`: 3D 및 과학적 시각화

## 프롬프트 템플릿 작성

### prompt.md 구조

```markdown
# {{VISUALIZATION_NAME}} 시각화 생성

## 프로젝트 정보
- 프로젝트명: {{PROJECT_NAME}}
- 출력 디렉토리: {{OUTPUT_DIR}}
- 시각화 타입: {{VISUALIZATION_TYPE}}

## 사용자 요구사항
{{USER_PROMPT}}

## 데이터베이스 스키마
{{SCHEMA_INFO}}

## 구현 요구사항

### 1. 기본 구조
- React 18+ 사용
- TypeScript 사용 (선택적)
- sql.js를 통한 브라우저 내 SQLite 실행
- Tailwind CSS로 스타일링

### 2. 필수 컴포넌트

#### 2.1 메인 대시보드 컴포넌트
```typescript
// src/components/Dashboard.tsx
interface DashboardProps {
  // 프롭스 정의
}

export const Dashboard: React.FC<DashboardProps> = () => {
  // 구현
};
```

#### 2.2 데이터 처리 훅
```typescript
// src/hooks/useData.ts
export const useData = () => {
  // SQLite 데이터 로드 및 처리
};
```

### 3. 시각화 구현 세부사항
{{#if HAS_TIME_COLUMN}}
- 시간 축 처리: {{TIME_COLUMNS}}를 사용하여 시계열 분석
- 날짜 포맷팅 및 범위 선택 기능 구현
{{/if}}

{{#if HAS_LOCATION_DATA}}
- 위치 데이터: {{LOCATION_COLUMNS}} 활용
- 지도 시각화 구현 (Leaflet 사용)
{{/if}}

### 4. 인터랙션 요구사항
- 필터링: {{FILTER_COLUMNS}}
- 정렬: {{SORTABLE_COLUMNS}}
- 드릴다운: {{DRILLDOWN_PATHS}}

### 5. 성능 최적화
{{#if LARGE_DATASET}}
- 데이터 페이지네이션 구현
- 가상 스크롤링 사용
- 메모이제이션 적용
{{/if}}

### 6. 반응형 디자인
- 모바일 (< 768px)
- 태블릿 (768px - 1024px)  
- 데스크톱 (> 1024px)

## SQL 쿼리 예제

### 기본 데이터 조회
```sql
{{SAMPLE_QUERIES}}
```

### 집계 쿼리
```sql
{{AGGREGATION_QUERIES}}
```

## 파일 구조
```
src/
├── App.tsx
├── components/
│   ├── Dashboard.tsx
│   ├── charts/
│   │   └── {{CHART_COMPONENTS}}
│   └── filters/
│       └── {{FILTER_COMPONENTS}}
├── hooks/
│   ├── useSQLite.ts
│   └── useData.ts
└── utils/
    └── dataTransform.ts
```

## 추가 고려사항
- 에러 처리 및 로딩 상태
- 데이터 없음 상태 처리  
- 접근성 (ARIA 레이블)
- 다국어 지원 준비
```

### 변수 사용 예제

```markdown
## 데이터 분석
주요 테이블: {{PRIMARY_TABLE}}
총 {{TABLE_COUNT}}개의 테이블 발견

### 컬럼 정보
{{#each TABLES}}
- {{name}} 테이블
  - 컬럼 수: {{columns.length}}
  - 주요 컬럼: {{#each columns}}{{name}} ({{type}}){{/each}}
{{/each}}
```

## 변수 시스템

### 기본 변수

| 변수명 | 설명 | 예시 |
|--------|------|------|
| `{{PROJECT_NAME}}` | 프로젝트 이름 | "Sales Dashboard" |
| `{{OUTPUT_DIR}}` | 출력 디렉토리 | "./output" |
| `{{VISUALIZATION_TYPE}}` | 시각화 타입 | "time-series" |
| `{{USER_PROMPT}}` | 사용자 요구사항 | "월별 매출 추이..." |
| `{{SCHEMA_INFO}}` | 스키마 정보 | 테이블 및 컬럼 정보 |

### 스키마 관련 변수

| 변수명 | 설명 | 타입 |
|--------|------|------|
| `{{TABLES}}` | 테이블 목록 | Array |
| `{{PRIMARY_TABLE}}` | 주요 테이블 | String |
| `{{TABLE_COUNT}}` | 테이블 수 | Number |
| `{{COLUMNS}}` | 모든 컬럼 목록 | Array |
| `{{TIME_COLUMNS}}` | 시간 관련 컬럼 | Array |
| `{{NUMERIC_COLUMNS}}` | 숫자형 컬럼 | Array |

### 조건부 변수

```markdown
{{#if HAS_TIME_COLUMN}}
시계열 분석 가능
{{/if}}

{{#if TABLE_COUNT > 1}}
다중 테이블 조인 필요
{{/if}}

{{#unless HAS_NUMERIC_DATA}}
숫자형 데이터가 없어 차트 생성 불가
{{/unless}}
```

### 반복문

```markdown
{{#each TABLES as table}}
### {{table.name}} 테이블
- 행 수: {{table.rowCount}}
- 컬럼:
  {{#each table.columns as column}}
  - {{column.name}} ({{column.type}})
  {{/each}}
{{/each}}
```

## 모범 사례

### 1. 명확한 구조

```markdown
## 1. 개요
간단한 설명

## 2. 구현 상세
### 2.1 컴포넌트 구조
### 2.2 데이터 처리
### 2.3 시각화 로직

## 3. 코드 예제
실제 구현 코드
```

### 2. 구체적인 지침

❌ 나쁜 예:
```markdown
적절한 차트를 구현하세요.
```

✅ 좋은 예:
```markdown
Recharts 라이브러리를 사용하여 LineChart 컴포넌트를 구현하세요.
- X축: 날짜 (월 단위)
- Y축: 매출액 (단위: 원)
- 툴팁: 호버 시 상세 정보 표시
- 범례: 하단 중앙 배치
```

### 3. 재사용 가능한 패턴

```markdown
## 공통 데이터 로드 패턴
```typescript
const loadData = async () => {
  const SQL = await initSqlJs({
    locateFile: file => `https://sql.js.org/dist/${file}`
  });
  
  const response = await fetch('/data.sqlite');
  const buffer = await response.arrayBuffer();
  const db = new SQL.Database(new Uint8Array(buffer));
  
  return db;
};
```

### 4. 에러 처리 포함

```markdown
## 에러 처리
- 데이터베이스 로드 실패
- 잘못된 쿼리
- 빈 결과셋
- 네트워크 오류
```

### 5. 성능 고려사항

```markdown
## 성능 최적화
{{#if TABLE_ROW_COUNT > 10000}}
- 큰 데이터셋 감지: 페이지네이션 필수
- 초기 로드 시 최근 1000개만 표시
- 나머지는 요청 시 로드
{{/if}}
```

## 테스트 및 검증

### 1. 메타데이터 검증

```typescript
// test/validate-template.ts
import { TemplateValidator } from '../src/validation';

test('template metadata is valid', () => {
  const validator = new TemplateValidator();
  const result = validator.validateMetadata('./templates/my-viz/meta.json');
  
  expect(result.isValid).toBe(true);
  expect(result.errors).toHaveLength(0);
});
```

### 2. 변수 치환 테스트

```typescript
test('template variables are replaced correctly', () => {
  const template = loadTemplate('my-viz');
  const rendered = renderTemplate(template, {
    PROJECT_NAME: 'Test Project',
    TABLES: [{ name: 'users', columns: [] }]
  });
  
  expect(rendered).toContain('Test Project');
  expect(rendered).toContain('users');
});
```

### 3. 통합 테스트

```bash
# 실제 데이터베이스로 테스트
vibecraft-agent \
  --sqlite-path ./test-data.sqlite \
  --visualization-type my-viz \
  --user-prompt "Test visualization" \
  --output-dir ./test-output \
  --debug
```

## 예제

### 완전한 템플릿 예제: 워드 클라우드

#### meta.json

```json
{
  "type": "word-cloud",
  "name": "Word Cloud Visualization",
  "description": "텍스트 데이터의 빈도를 시각화하는 워드 클라우드",
  "author": "VibeCraft Team",
  "version": "1.0.0",
  "tags": ["text", "nlp", "frequency"],
  "requirements": {
    "minTables": 1,
    "requiredColumns": ["text"],
    "supportedDataTypes": ["TEXT", "VARCHAR"]
  },
  "chartLibraries": ["d3", "d3-cloud"],
  "defaultConfig": {
    "maxWords": 100,
    "colorScheme": "category10",
    "fontFamily": "Arial"
  }
}
```

#### prompt.md

```markdown
# Word Cloud 시각화 생성

## 사용자 요구사항
{{USER_PROMPT}}

## 데이터 구조
- 텍스트 컬럼: {{TEXT_COLUMNS}}
- 총 레코드 수: {{TOTAL_ROWS}}

## 구현 상세

### 1. 텍스트 전처리
```typescript
const preprocessText = (text: string): string[] => {
  return text
    .toLowerCase()
    .replace(/[^\w\s가-힣]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 2);
};
```

### 2. 단어 빈도 계산
```sql
SELECT 
  word,
  COUNT(*) as frequency
FROM (
  -- 텍스트를 단어로 분리하는 로직
  {{TEXT_SPLIT_QUERY}}
)
GROUP BY word
ORDER BY frequency DESC
LIMIT {{MAX_WORDS}};
```

### 3. D3 Word Cloud 구현
```typescript
import * as d3 from 'd3';
import cloud from 'd3-cloud';

const WordCloud: React.FC<{ words: Word[] }> = ({ words }) => {
  useEffect(() => {
    const layout = cloud()
      .size([width, height])
      .words(words)
      .padding(5)
      .rotate(() => ~~(Math.random() * 2) * 90)
      .font("Arial")
      .fontSize(d => d.size)
      .on("end", draw);
      
    layout.start();
  }, [words]);
  
  return <svg ref={svgRef} />;
};
```

### 4. 인터랙션
- 단어 클릭 시 상세 정보 표시
- 호버 시 빈도 툴팁
- 필터링 옵션 (최소 빈도)
- 색상 스키마 변경

## 반응형 처리
{{#if IS_MOBILE}}
- 모바일: 상위 50개 단어만 표시
- 폰트 크기 조정
- 세로 모드 최적화
{{else}}
- 데스크톱: 최대 {{MAX_WORDS}}개 단어
- 확대/축소 기능
- 드래그 이동
{{/if}}
```

### 커스텀 헬퍼 함수

```typescript
// src/templates/helpers.ts
export const templateHelpers = {
  // 컬럼 타입별 필터링
  filterColumnsByType: (columns: ColumnInfo[], type: string) => {
    return columns.filter(col => col.dataType === type);
  },
  
  // SQL 쿼리 생성
  generateQuery: (table: string, columns: string[]) => {
    return `SELECT ${columns.join(', ')} FROM ${table}`;
  },
  
  // 차트 컴포넌트 이름 생성
  getChartComponent: (vizType: string) => {
    const mapping = {
      'time-series': 'LineChart',
      'bar': 'BarChart',
      'pie': 'PieChart'
    };
    return mapping[vizType] || 'CustomChart';
  }
};
```

## 템플릿 배포

### 1. 로컬 테스트

```bash
# 템플릿 검증
npm run validate-template word-cloud

# 예제 실행
npm run test-template word-cloud
```

### 2. 문서화

- README.md에 새 템플릿 추가
- 사용 예제 포함
- 스크린샷 추가

### 3. PR 생성

```bash
git add templates/word-cloud
git commit -m "feat(template): add word cloud visualization"
git push origin feature/word-cloud-template
```

## 문제 해결

### 일반적인 문제

1. **변수가 치환되지 않음**
   - 변수 이름 확인 (대소문자 구분)
   - 중괄호 두 개 사용 확인 `{{VAR}}`

2. **템플릿이 로드되지 않음**
   - meta.json 유효성 확인
   - 파일 경로 확인
   - JSON 문법 오류 확인

3. **생성된 코드가 작동하지 않음**
   - 의존성 확인
   - import 경로 확인
   - TypeScript 타입 오류 확인

## 추가 리소스

- [Gemini CLI 문서](https://gemini-cli-docs.example.com)
- [React 시각화 라이브러리](https://github.com/recharts/recharts)
- [sql.js 문서](https://github.com/sql-js/sql.js)
- [템플릿 예제 저장소](https://github.com/vibecraft/template-examples)