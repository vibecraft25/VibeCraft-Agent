# Task 5: Template Engine 모듈 구현

## 개요
시각화 타입별 템플릿을 관리하고 렌더링하는 Template Engine을 구현합니다. Markdown 형식의 템플릿을 사용하여 유연하고 관리하기 쉬운 시스템을 구축합니다.

## 목표
- Markdown 기반 템플릿 시스템 구축
- 템플릿 로드 및 캐싱 메커니즘
- 동적 변수 치환 기능
- 템플릿 검증 및 호환성 검사
- 시각화 타입 추천 기능

## 구현 내용

### 1. 핵심 인터페이스 정의

```typescript
export interface ITemplateEngine {
  loadTemplate(visualizationType: VisualizationType): Promise<Template>;
  renderTemplate(template: Template, context: TemplateContext): string;
  getAvailableTemplates(): Promise<TemplateInfo[]>;
  validateTemplate(template: Template): TemplateValidationResult;
}

export interface Template {
  id: string;
  type: VisualizationType;
  name: string;
  description: string;
  metadata: TemplateMetadata;
  content: string; // Markdown content
  variables: TemplateVariable[];
}

export interface TemplateContext {
  schemaInfo: SchemaInfo;
  userPrompt: string;
  projectName: string;
  visualizationType: VisualizationType;
  timestamp: Date;
  additionalContext?: Record<string, any>;
}
```

### 2. TemplateEngine 구현

#### 2.1 템플릿 로드
- 파일 시스템에서 템플릿 디렉토리 구조 읽기
- `meta.json`과 `prompt.md` 파일 로드
- 메모리 캐싱으로 성능 최적화

```typescript
async loadTemplate(visualizationType: VisualizationType): Promise<Template> {
  // 캐시 확인
  if (this.templateCache.has(visualizationType)) {
    return this.templateCache.get(visualizationType)!;
  }
  
  // 템플릿 파일 로드
  const templateDir = path.join(this.templatesDir, visualizationType);
  const metadata = await fs.readJson(path.join(templateDir, 'meta.json'));
  const content = await fs.readFile(path.join(templateDir, 'prompt.md'), 'utf8');
  
  // Template 객체 생성 및 캐싱
  const template = { ... };
  this.templateCache.set(visualizationType, template);
  
  return template;
}
```

#### 2.2 템플릿 렌더링
- 변수 치환 시스템 ({{VARIABLE_NAME}} 형식)
- 시스템 변수와 사용자 정의 변수 지원
- 스키마 정보 자동 포맷팅

```typescript
renderTemplate(template: Template, context: TemplateContext): string {
  let rendered = template.content;
  
  // 기본 변수 준비
  const variables = {
    PROJECT_NAME: context.projectName,
    USER_PROMPT: context.userPrompt,
    SCHEMA_DETAILS: this.formatSchemaDetails(context.schemaInfo),
    QUERY_EXAMPLES: this.generateQueryExamples(context.schemaInfo),
    ...
  };
  
  // 변수 치환
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
    rendered = rendered.replace(regex, String(value));
  }
  
  return rendered;
}
```

### 3. TemplateSelector 유틸리티

#### 3.1 시각화 타입 추천
```typescript
static suggestVisualizationType(schemaInfo: SchemaInfo): VisualizationType[] {
  const suggestions: { type: VisualizationType; score: number }[] = [];
  
  // 날짜 컬럼 + 숫자 컬럼 → time-series
  if (hasDateColumn && hasNumericColumn) {
    suggestions.push({ type: 'time-series', score: 90 });
  }
  
  // 다수의 숫자형 컬럼 → kpi-dashboard
  if (numericColumnCount >= 3) {
    suggestions.push({ type: 'kpi-dashboard', score: 85 });
  }
  
  // 복잡한 관계 → network-graph
  if (schemaInfo.relationships.length >= 3) {
    suggestions.push({ type: 'network-graph', score: 80 });
  }
  
  return suggestions.sort((a, b) => b.score - a.score).map(s => s.type);
}
```

#### 3.2 템플릿 호환성 검사
```typescript
static checkTemplateCompatibility(
  template: Template, 
  schemaInfo: SchemaInfo
): TemplateCompatibility {
  const reasons: string[] = [];
  let score = 100;
  
  // 필수 테이블 수 확인
  if (metadata.requiredTables && schemaInfo.tables.length < metadata.requiredTables) {
    score -= 50;
    reasons.push(`Template requires at least ${metadata.requiredTables} tables`);
  }
  
  // 필수 컬럼 타입 확인
  for (const requiredType of metadata.requiredColumns || []) {
    if (!hasRequiredColumn(schemaInfo, requiredType)) {
      score -= 30;
      reasons.push(`No ${requiredType} column found`);
    }
  }
  
  return { compatible: score >= 60, score, reasons };
}
```

### 4. 템플릿 디렉토리 구조

```
templates/
├── time-series/
│   ├── meta.json
│   └── prompt.md
├── kpi-dashboard/
│   ├── meta.json
│   └── prompt.md
└── [visualization-type]/
    ├── meta.json
    └── prompt.md
```

### 5. 템플릿 메타데이터 (meta.json)

```json
{
  "name": "Time Series Visualization",
  "description": "Interactive time-based data visualization",
  "version": "1.0.0",
  "author": "VibeCraft Team",
  "tags": ["time", "series", "chart"],
  "requiredTables": 1,
  "requiredColumns": ["date", "numeric"],
  "dependencies": ["recharts", "date-fns"],
  "variables": [
    {
      "name": "CHART_TITLE",
      "type": "string",
      "required": false,
      "defaultValue": "Time Series Analysis"
    }
  ]
}
```

### 6. 템플릿 변수 시스템

#### 시스템 제공 변수
- `{{PROJECT_NAME}}` - 프로젝트 이름
- `{{USER_PROMPT}}` - 사용자 요구사항
- `{{VISUALIZATION_TYPE}}` - 시각화 타입
- `{{TIMESTAMP}}` - 생성 시간
- `{{SCHEMA_TABLES}}` - 테이블 목록
- `{{TABLE_COUNT}}` - 테이블 수
- `{{TOTAL_ROWS}}` - 전체 행 수
- `{{SCHEMA_DETAILS}}` - 포맷된 스키마 정보
- `{{QUERY_EXAMPLES}}` - SQL 쿼리 예제

#### 사용자 정의 변수
템플릿별 `meta.json`의 `variables` 배열에서 정의

### 7. Agent 통합

```typescript
// Template Engine 통합
try {
  const template = await this.templateEngine.loadTemplate(visualizationType);
  
  // 호환성 검사
  const compatibility = TemplateSelector.checkTemplateCompatibility(template, schemaInfo);
  if (!compatibility.compatible) {
    console.warn('Template compatibility issues:', compatibility.reasons);
  }
  
  // 템플릿 렌더링
  const renderedPrompt = this.templateEngine.renderTemplate(template, {
    schemaInfo,
    userPrompt,
    projectName,
    visualizationType,
    timestamp: new Date()
  });
  
} catch (error) {
  // 템플릿이 없는 경우 추천 제공
  const suggestions = TemplateSelector.suggestVisualizationType(schemaInfo);
  console.log('Suggested visualization types:', suggestions);
}
```

## 테스트

### 단위 테스트
- 템플릿 로드 및 캐싱
- 변수 치환 기능
- 템플릿 검증
- 시각화 타입 추천
- 호환성 검사

### 통합 테스트
- Agent와의 통합
- 다양한 스키마에 대한 템플릿 렌더링
- 에러 처리

## 구현 결과
- ✅ TemplateEngine 클래스 구현 완료
- ✅ TemplateSelector 유틸리티 구현 완료
- ✅ 예제 템플릿 2개 작성 (time-series, kpi-dashboard)
- ✅ 단위 테스트 작성 (12개 테스트 통과)
- ✅ Agent 클래스와 통합 완료

## 다음 단계
- Task 6: Settings Manager 구현 (MCP 설정 생성)
- 추가 템플릿 작성 (geo-spatial, gantt-chart 등)
- 템플릿 변수 확장