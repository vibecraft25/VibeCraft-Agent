# Contributing to VibeCraft-Agent

VibeCraft-Agent에 기여해주셔서 감사합니다! 이 문서는 프로젝트에 기여하는 방법을 안내합니다.

## 목차

1. [행동 강령](#행동-강령)
2. [시작하기](#시작하기)
3. [개발 환경 설정](#개발-환경-설정)
4. [기여 방법](#기여-방법)
5. [코드 스타일](#코드-스타일)
6. [커밋 가이드라인](#커밋-가이드라인)
7. [Pull Request 프로세스](#pull-request-프로세스)
8. [이슈 보고](#이슈-보고)
9. [새로운 시각화 타입 추가](#새로운-시각화-타입-추가)
10. [문서화](#문서화)

## 행동 강령

이 프로젝트는 기여자 행동 강령을 따릅니다. 프로젝트에 참여함으로써 이 강령을 준수하는 것에 동의합니다.

- 서로 존중하고 친절하게 대하기
- 건설적인 비판과 피드백 환영
- 커뮤니티의 이익을 우선시하기
- 부적절한 행동 신고하기

## 시작하기

### 1. 저장소 Fork

GitHub에서 저장소를 Fork합니다.

### 2. 로컬에 Clone

```bash
git clone https://github.com/your-username/vibecraft-agent.git
cd vibecraft-agent
```

### 3. Upstream 설정

```bash
git remote add upstream https://github.com/original-org/vibecraft-agent.git
```

### 4. 브랜치 생성

```bash
git checkout -b feature/my-new-feature
```

## 개발 환경 설정

### 필수 도구

- Node.js 18.0+
- npm 또는 yarn
- Git
- SQLite3
- VS Code (권장)

### 설치 및 설정

```bash
# 의존성 설치
npm install

# 개발 모드 실행
npm run dev

# 테스트 실행
npm test

# 린트 실행
npm run lint

# 빌드
npm run build
```

### VS Code 설정

`.vscode/settings.json`:

```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib"
}
```

권장 확장:
- ESLint
- Prettier
- TypeScript and JavaScript Language Features
- Jest

## 기여 방법

### 좋은 첫 기여

`good first issue` 라벨이 붙은 이슈들을 확인하세요:
- 문서 개선
- 테스트 추가
- 간단한 버그 수정
- 코드 리팩토링

### 기여 유형

1. **버그 수정**
   - 이슈 확인 또는 생성
   - 테스트 케이스 추가
   - 수정 구현

2. **새로운 기능**
   - 제안 이슈 생성
   - 설계 논의
   - 구현 및 테스트

3. **문서 개선**
   - 오타 수정
   - 예제 추가
   - 번역

4. **성능 개선**
   - 벤치마크 추가
   - 최적화 구현
   - 결과 문서화

## 코드 스타일

### TypeScript

```typescript
// 좋은 예
export interface UserData {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}

export class UserService {
  constructor(private readonly db: Database) {}
  
  async getUser(id: string): Promise<UserData | null> {
    const user = await this.db.query('SELECT * FROM users WHERE id = ?', [id]);
    return user || null;
  }
}
```

### 명명 규칙

- 클래스: PascalCase (예: `SchemaAnalyzer`)
- 인터페이스: PascalCase with 'I' prefix 피하기
- 함수/메서드: camelCase (예: `analyzeSchema`)
- 상수: UPPER_SNAKE_CASE (예: `MAX_TIMEOUT`)
- 파일명: kebab-case (예: `schema-analyzer.ts`)

### 주석

```typescript
/**
 * SQLite 데이터베이스 스키마를 분석합니다.
 * 
 * @param dbPath - 데이터베이스 파일 경로
 * @returns 스키마 정보
 * @throws {VibeCraftError} 데이터베이스 연결 실패 시
 * 
 * @example
 * ```typescript
 * const analyzer = new SchemaAnalyzer();
 * const schema = await analyzer.analyze('./data.sqlite');
 * ```
 */
async analyze(dbPath: string): Promise<SchemaInfo> {
  // 구현
}
```

## 커밋 가이드라인

### 커밋 메시지 형식

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Type

- `feat`: 새로운 기능
- `fix`: 버그 수정
- `docs`: 문서 수정
- `style`: 코드 포맷팅, 세미콜론 누락 등
- `refactor`: 코드 리팩토링
- `perf`: 성능 개선
- `test`: 테스트 추가/수정
- `build`: 빌드 시스템 또는 외부 의존성 변경
- `ci`: CI 설정 파일 및 스크립트 변경
- `chore`: 기타 변경사항

### 예시

```bash
feat(template): add sankey diagram visualization template

- Implement sankey diagram template for flow analysis
- Add D3.js sankey plugin dependency
- Include example data transformation
- Update template documentation

Closes #123
```

## Pull Request 프로세스

### 1. PR 생성 전 체크리스트

- [ ] 모든 테스트 통과
- [ ] 린트 에러 없음
- [ ] 새로운 기능에 대한 테스트 추가
- [ ] 문서 업데이트
- [ ] CHANGELOG.md 업데이트

### 2. PR 템플릿

```markdown
## 설명
이 PR이 해결하는 문제나 추가하는 기능을 설명해주세요.

## 변경사항
- 주요 변경사항을 나열해주세요
- 각 변경사항에 대한 이유를 설명해주세요

## 테스트
- [ ] 유닛 테스트 추가/수정
- [ ] 통합 테스트 추가/수정
- [ ] 수동 테스트 완료

## 스크린샷 (UI 변경 시)
변경 전/후 스크린샷을 첨부해주세요.

## 관련 이슈
Closes #(이슈 번호)
```

### 3. 리뷰 프로세스

1. 자동 테스트 통과 확인
2. 코드 리뷰 (최소 1명)
3. 피드백 반영
4. 승인 및 머지

## 이슈 보고

### 버그 리포트

```markdown
## 버그 설명
버그에 대한 명확하고 간결한 설명

## 재현 방법
1. '...'로 이동
2. '...' 클릭
3. '...' 입력
4. 에러 발생

## 예상 동작
예상했던 동작 설명

## 스크린샷
가능하면 스크린샷 첨부

## 환경
- OS: [예: macOS 13.0]
- Node.js: [예: 18.12.0]
- VibeCraft-Agent: [예: 1.0.0]

## 추가 정보
문제 해결에 도움이 될 추가 정보
```

### 기능 제안

```markdown
## 기능 설명
제안하는 기능에 대한 명확한 설명

## 해결하려는 문제
이 기능이 해결하는 문제나 필요성

## 제안하는 해결책
구체적인 구현 방법이나 아이디어

## 대안
고려한 다른 방법들

## 추가 정보
관련 자료나 참고 링크
```

## 새로운 시각화 타입 추가

### 1. 템플릿 디렉토리 생성

```bash
mkdir -p templates/my-visualization
```

### 2. 메타데이터 작성

`templates/my-visualization/meta.json`:

```json
{
  "type": "my-visualization",
  "name": "My Visualization",
  "description": "Description of the visualization",
  "author": "Your Name",
  "version": "1.0.0",
  "tags": ["custom", "analysis"],
  "requirements": {
    "minTables": 1,
    "requiredColumns": [],
    "optionalColumns": ["date", "value"],
    "supportedDataTypes": ["numeric", "datetime", "text"]
  },
  "defaultConfig": {
    "chartType": "custom",
    "responsive": true,
    "animations": true
  },
  "examples": [
    {
      "name": "Basic Example",
      "description": "Simple usage example",
      "tables": ["data_table"],
      "query": "SELECT * FROM data_table"
    }
  ]
}
```

### 3. 프롬프트 템플릿 작성

`templates/my-visualization/prompt.md`:

```markdown
## 시각화 요구사항

{{USER_PROMPT}}

## 구현 가이드

### 1. 데이터 구조
- 주요 테이블: {{PRIMARY_TABLE}}
- 사용 가능한 컬럼: {{COLUMNS}}

### 2. 컴포넌트 구조
```

### 4. 타입 추가

`src/types/index.ts`:

```typescript
export type VisualizationType = 
  | 'time-series'
  | 'geo-spatial'
  // ...
  | 'my-visualization';  // 새로운 타입 추가
```

### 5. 테스트 추가

`tests/templates/my-visualization.test.ts`:

```typescript
describe('My Visualization Template', () => {
  test('should load template correctly', async () => {
    const engine = new TemplateEngine();
    const template = await engine.loadTemplate('my-visualization');
    expect(template.type).toBe('my-visualization');
  });
});
```

## 문서화

### 코드 문서화

- 모든 public API에 JSDoc 주석 추가
- 복잡한 알고리즘에 설명 추가
- 예제 코드 포함

### 사용자 문서

- README.md 업데이트
- API 문서 업데이트
- 튜토리얼 추가
- FAQ 업데이트

### 변경 로그

`CHANGELOG.md`:

```markdown
## [1.1.0] - 2024-XX-XX

### Added
- 새로운 시각화 타입 추가 (#123)

### Changed
- 성능 개선 (#124)

### Fixed
- 버그 수정 (#125)
```

## 테스트

### 유닛 테스트

```typescript
describe('SchemaAnalyzer', () => {
  let analyzer: SchemaAnalyzer;
  
  beforeEach(() => {
    analyzer = new SchemaAnalyzer();
  });
  
  test('should analyze simple schema', async () => {
    const schema = await analyzer.analyze('./test.sqlite');
    expect(schema.tables).toHaveLength(3);
    expect(schema.tables[0].name).toBe('users');
  });
});
```

### 통합 테스트

```typescript
test('should generate complete dashboard', async () => {
  const agent = new VibeCraftAgent();
  const result = await agent.execute({
    sqlitePath: './test.sqlite',
    visualizationType: 'kpi-dashboard',
    userPrompt: 'Create KPI dashboard',
    outputDir: './test-output'
  });
  
  expect(result.success).toBe(true);
  expect(fs.existsSync(result.outputPath)).toBe(true);
});
```

## 릴리스 프로세스

1. 버전 업데이트
2. CHANGELOG.md 업데이트
3. 테스트 실행
4. 빌드
5. npm 패키지 게시
6. GitHub 릴리스 생성

## 도움 받기

### 리소스

- [프로젝트 문서](./docs)
- [API 레퍼런스](./docs/api.md)
- [아키텍처 가이드](./docs/technical-architecture.md)

### 커뮤니케이션

- GitHub Issues: 버그 리포트, 기능 제안
- GitHub Discussions: 일반적인 질문, 아이디어 논의
- Discord: 실시간 채팅, 커뮤니티 지원

## 감사의 말

모든 기여자분들께 감사드립니다! 여러분의 노력이 VibeCraft-Agent를 더 나은 도구로 만들어갑니다.

## 라이선스

기여하신 코드는 프로젝트의 MIT 라이선스를 따릅니다.