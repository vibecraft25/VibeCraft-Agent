# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 개요

VibeCraft-Agent는 SQLite 데이터베이스를 입력으로 받아 Gemini CLI를 통해 React 기반 데이터 시각화 애플리케이션을 자동 생성하는 CLI 도구입니다.

## 핵심 아키텍처

### 시스템 역할 분담
- **VibeCraft-Agent**: 프롬프트 준비, settings.json 생성, Gemini CLI 실행, 결과 검증
- **Gemini CLI**: 실제 React 코드 생성, 파일 생성, MCP 서버와 통신
- **MCP SQLite Server**: SQLite 데이터베이스 접근 제공

### 주요 컴포넌트
1. **CLI Interface**: 명령행 인터페이스 제공
2. **RequestParser**: CLI 인자 파싱 및 검증
3. **SchemaAnalyzer**: SQLite 스키마 분석
4. **TemplateEngine**: 시각화 타입별 템플릿 처리
5. **SettingsManager**: Gemini CLI settings.json 생성
6. **PromptBuilder**: 최종 프롬프트 조합
7. **ExecutionEngine**: Gemini CLI 실행 관리
8. **OutputValidator**: 생성된 앱 검증

### 실행 플로우
1. 입력 검증
2. 작업 디렉토리 생성
3. SQLite 스키마 추출
4. Settings 파일 생성 (.gemini/settings.json)
5. 프롬프트 생성 (시스템 + 타입별 + 사용자 프롬프트)
6. Gemini CLI 실행
7. SQLite 파일을 public/ 디렉토리로 복사
8. 결과 검증
9. 성공/실패 반환

## 프롬프트 시스템

### 프롬프트 구성
- **시스템 프롬프트**: VibeCraft-viz 역할 정의, 기술 스택, 프로젝트 구조
- **타입별 템플릿**: time-series, geo-spatial, gantt-chart 등 시각화 타입별 특화 템플릿
- **사용자 프롬프트**: 백엔드에서 전달받은 구체적인 요구사항

### 필수 기술 스택
- React 18.x
- TypeScript (선택적)
- Recharts/Chart.js (시각화)
- sql.js (브라우저 SQLite)
- Tailwind CSS (스타일링)

## 개발 가이드

### 디렉토리 구조
```
vibecraft-agent/
├── src/
│   ├── cli.ts              # CLI 진입점
│   ├── core/               # 핵심 모듈
│   ├── templates/          # 프롬프트 템플릿
│   ├── settings/           # Settings 생성
│   ├── schema/             # 스키마 추출
│   └── utils/              # 유틸리티
├── templates/              # 템플릿 리소스
└── package.json
```

### CLI 사용법
```bash
vibecraft-agent \
  --sqlite-path /path/to/data.sqlite \
  --visualization-type time-series \
  --user-prompt "월별 매출 추이 대시보드" \
  --output-dir ./output
```

### 주요 인터페이스
```typescript
interface AgentCliArgs {
  sqlitePath: string;
  visualizationType: VisualizationType;
  userPrompt: string;
  outputDir: string;
  projectName?: string;
  debug?: boolean;
}

type VisualizationType = 
  | 'time-series' | 'geo-spatial' | 'gantt-chart' 
  | 'kpi-dashboard' | 'comparison' | 'funnel-analysis'
  | 'cohort-analysis' | 'heatmap' | 'network-graph' | 'custom';
```

## 중요 구현 세부사항

### MCP 서버 설정
- settings.json은 작업 디렉토리의 `.gemini/` 폴더에 생성
- SQLite 파일 경로는 절대 경로로 변환
- MCP 서버는 Python 기반 (`mcp-server-sqlite`)

### 프롬프트 최적화
- 스키마 정보를 구체적으로 포함
- 실제 SQL 쿼리 예시 추가
- sql.js 사용 패턴 명시

### Output Validator 검증 항목
- package.json 존재 및 유효성
- React 앱 필수 파일 (App.tsx, index.html)
- SQLite 파일이 public/에 복사되었는지 확인

### Gemini CLI 실행
- 별도 프로세스로 실행
- GEMINI_SETTINGS_DIR 환경변수로 settings 위치 지정
- 작업 디렉토리를 --working-directory로 지정

## 새 시각화 타입 추가
1. `templates/` 디렉토리에 새 템플릿 디렉토리 생성 (예: `templates/my-visualization/`)
2. `meta.json` 파일 작성 - 시각화 타입의 메타데이터와 구조 정의
3. `prompt.md` 파일 작성 - 실제 프롬프트 내용
4. VisualizationType enum에 새 타입 추가
5. 필요시 TemplateEngine에서 추가 처리 로직 구현

## 테스트 전략
테스트 전략과 가이드라인은 `docs/testing-strategy.md` 참조

## 프로젝트 문서
- 시스템 개요: `docs/gemini-cli-data-visualization-report.md`
- 기술 아키텍처: `docs/technical-architecture.md`
- 테스트 전략: `docs/testing-strategy.md`

## 개발 진행 상황

### 태스크 진행 추적
**중요**: 각 태스크가 완료될 때마다 반드시 다음 파일들을 업데이트해야 합니다:
1. `tasks/task-progress-tracker.md` - 태스크 진행 상황 업데이트
2. `CLAUDE.md` - 개발 진행 상황 섹션 업데이트
3. TodoWrite 도구 - 태스크 상태 업데이트

### 완료된 작업
- **Task 1**: 프로젝트 초기 설정 및 기본 구조 생성 ✓
  - package.json 및 설정 파일 생성
  - TypeScript, ESLint, Prettier, Jest 설정
  - 디렉토리 구조 생성
  - 타입 정의 (src/types/index.ts)
  - 모든 핵심 모듈 placeholder 파일 생성

- **Task 2**: CLI 인터페이스 구현 (Commander.js 사용) ✓
  - 단일 명령 구조 구현 (협의된 대로)
  - --list-types 옵션 구현
  - 입력 검증 유틸리티 (src/utils/validation.ts)
  - 에러 처리 및 사용자 피드백
  - Agent 기본 구조 구현

- **Task 3**: Request Parser 모듈 구현 ✓
  - RequestParser 클래스 구현 (입력 파싱/검증)
  - AdvancedValidator 클래스 구현 (SQLite 스키마 검증)
  - RequestNormalizer 클래스 구현 (요청 정규화)
  - 작업 디렉토리 생성 로직
  - 유닛 테스트 작성 완료
  - Agent 클래스와 통합 완료

- **Task 4**: Schema Analyzer 모듈 구현 ✓
  - SchemaAnalyzer 클래스 구현 (SQLite 스키마 분석)
  - 포괄적인 타입 시스템 정의
  - 테이블, 컬럼, 관계 정보 추출
  - 데이터 분포 통계 및 타입 추론
  - SchemaSummarizer 유틸리티 클래스
  - 테스트 작성 완료 (9개 테스트 통과)
  - Agent 클래스와 통합 완료

- **Task 5**: Template Engine 모듈 구현 ✓
  - TemplateEngine 클래스 구현 (Markdown 기반)
  - 템플릿 로드, 캐싱, 렌더링 기능
  - 변수 치환 시스템 ({{VARIABLE_NAME}} 형식)
  - 템플릿 검증 및 호환성 검사
  - TemplateSelector 유틸리티 (시각화 추천)
  - 테스트 작성 완료 (12개 테스트 통과)
  - Agent 클래스와 통합 완료
  - 예제 템플릿 작성 (time-series, kpi-dashboard)

- **Task 6**: Settings Manager 모듈 구현 ✓
  - SettingsManager 클래스 구현 (settings.json 생성)
  - MCP SQLite 서버 설정 자동 생성
  - 실행 방식 자동 결정 (Python 모듈 vs UV)
  - SettingsHelper 유틸리티 클래스
  - EnvironmentManager 클래스 (환경 변수 관리)
  - 테스트 작성 완료 (24개 테스트 통과)
  - Agent 클래스와 통합 완료

- **Task 7**: Prompt Builder 모듈 구현 ✓
  - PromptBuilder 클래스 구현 (buildPrompt, optimizePrompt)
  - 시스템 프롬프트 템플릿 정의
  - 스키마 정보 포맷팅
  - 템플릿 콘텐츠 및 사용자 요구사항 통합
  - 프롬프트 최적화 기능 (토큰 제한, 포커스 영역)
  - PromptValidator 유틸리티 클래스
  - 테스트 작성 완료 (18개 테스트 통과)
  - Agent 클래스와 통합 완료 (프롬프트 생성/검증/저장)

- **Task 8**: Execution Engine 모듈 구현 ✓
  - ExecutionEngine 클래스 구현 (execute, monitorExecution, cancelExecution)
  - Gemini CLI 실행 로직 (-p 옵션 vs stdin 자동 선택)
  - 프로세스 관리 및 모니터링 (EventEmitter 기반)
  - ProcessManager 유틸리티 클래스 (Singleton 패턴)
  - ExecutionMonitor 클래스 (메트릭 수집)
  - 테스트 작성 완료 (14개 테스트 통과)
  - Agent 클래스와 통합 완료 (Gemini CLI 실행 및 기본 검증)

- **Task 9**: Output Validator 모듈 구현 ✓
  - OutputValidator 클래스 구현 (검증 규칙 기반)
  - 8개 기본 검증 규칙 구현
  - 파일 구조, package.json, SQLite 파일 검증
  - 추가 검증 (sql.js 사용, Tailwind CSS, npm scripts)
  - ValidationReporter 유틸리티 클래스
  - 테스트 작성 완료 (10개 테스트 통과)
  - Agent 클래스와 통합 완료 (생성된 앱 검증)

- **Task 10**: Supporting 모듈 구현 ✓
  - Error Handler 구현
    - VibeCraftError 클래스 및 ErrorCode enum
    - 에러 매핑 및 사용자 친화적 메시지 생성
    - 복구 가능성 판단 로직
  - Logger 시스템 구현
    - Singleton 패턴 구현
    - 5개 로그 레벨 지원 (ERROR, WARN, INFO, DEBUG, TRACE)
    - 콘솔/파일 출력, 색상 지원, ChildLogger
  - File Manager 유틸리티 구현
    - 파일/디렉토리 작업 유틸리티
    - 해시 계산, 크기 포맷팅, 재귀적 파일 조회
  - Configuration Manager 구현
    - 계층적 설정 로드 (기본값 → 전역 → 로컬 → 환경 변수)
    - 설정 검증, 내보내기/가져오기
  - Progress Tracker 구현
    - ora 기반 시각적 진행 표시
    - 단계별 시간 추적 및 상태 관리
  - 테스트 작성 완료 (77개 테스트 통과)

- **Task 11**: 프롬프트 템플릿 작성 ✓
  - 10개 시각화 타입별 템플릿 작성 완료
  - 각 템플릿: meta.json (메타데이터) + prompt.md (프롬프트)
  - 구현된 템플릿:
    - time-series: 시계열 분석 대시보드
    - geo-spatial: 지리공간 지도 시각화
    - gantt-chart: 프로젝트 간트차트
    - kpi-dashboard: KPI 메트릭 대시보드
    - comparison: 데이터 비교 분석
    - funnel-analysis: 전환 퍼널 분석
    - cohort-analysis: 코호트 리텐션 분석
    - heatmap: 히트맵 시각화
    - network-graph: 네트워크 그래프
    - custom: 사용자 정의 시각화
  - 각 템플릿은 상세한 컴포넌트 구조와 구현 가이드 포함

- **Task 12**: 통합 테스트 및 디버깅 ✓
  - 테스트 인프라 구축
    - TestHelper: 다양한 테스트 DB 생성 유틸리티
    - PerformanceMonitor: 성능 측정 및 분석 도구
  - 통합 테스트 구현 (agent.integration.test.ts)
    - E2E 워크플로우 테스트
    - 10개 시각화 타입 전체 테스트
    - 에러 핸들링 및 엣지 케이스
  - 성능 테스트 구현 (performance.test.ts)
    - 스키마 분석, 템플릿 렌더링 성능
    - 메모리 사용량 모니터링
    - 동시성 및 확장성 테스트
  - 디버깅 도구 구현 (VibeCraftDebugger)
    - 브레이크포인트 및 스텝 디버깅
    - 함수 추적 및 변수 감시
    - 대화형 디버깅 세션
  - E2E 시나리오 테스트
    - 실제 환경에서의 전체 워크플로우
    - 대용량 데이터베이스 처리
    - 다양한 언어 및 특수 케이스

- **Task 13**: 문서화 및 README 작성 ✓
  - README.md 작성 완료
    - 프로젝트 소개 및 주요 기능
    - 설치 가이드 (VibeCraft-Agent, Gemini CLI, MCP Server)
    - 사용법 및 옵션 설명
    - 10가지 시각화 타입별 예시
    - 문제 해결 가이드
  - 사용자 가이드 작성 (docs/user-guide.md)
    - 시각화 타입별 상세 가이드
    - 고급 사용법 (복잡한 스키마, 대용량 데이터)
    - FAQ 섹션
  - API 문서 작성 (docs/api.md)
    - 핵심 클래스 및 메서드 문서화
    - 인터페이스 및 타입 정의
    - 에러 핸들링 가이드
    - 프로그래매틱 사용 예제
  - 튜토리얼 작성 (docs/tutorial.md)
    - 단계별 실습 가이드
    - 샘플 데이터베이스 및 쿼리
    - 커스터마이징 방법
    - 배포 가이드
  - 기여 가이드 작성 (CONTRIBUTING.md)
    - 개발 환경 설정
    - 코드 스타일 가이드
    - 커밋 메시지 규칙
    - PR 프로세스
    - 새 시각화 타입 추가 방법
  - 템플릿 가이드 작성 (docs/template-guide.md)
    - 템플릿 시스템 구조
    - 메타데이터 및 프롬프트 작성법
    - 변수 시스템 설명
    - 모범 사례 및 예제
  - LICENSE 파일 생성 (MIT 라이선스)
  
### 진행 중인 작업
없음

### 구현된 구조

```mermaid
graph TD
    A[CLI Entry Point] --> B[Request Parser]
    B --> C[Schema Analyzer]
    C --> D[Template Engine]
    D --> E[Prompt Builder]
    C --> F[Settings Manager]
    E --> G[Execution Engine]
    F --> G
    G --> H[Output Validator]
```

### 핵심 타입 정의
```typescript
// src/types/index.ts
export type VisualizationType = 
  | 'time-series' | 'geo-spatial' | 'gantt-chart' 
  | 'kpi-dashboard' | 'comparison' | 'funnel-analysis'
  | 'cohort-analysis' | 'heatmap' | 'network-graph' | 'custom';

export interface AgentCliArgs {
  sqlitePath: string;
  visualizationType: VisualizationType;
  userPrompt: string;
  outputDir: string;
  projectName?: string;
  debug?: boolean;
}
```

## Task Master AI Instructions
**Import Task Master's development workflow commands and guidelines, treat as if import is in the main CLAUDE.md file.**
@./.taskmaster/CLAUDE.md
