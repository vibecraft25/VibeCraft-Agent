# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 개요

VibeCraft-viz는 Gemini CLI와 SQLite MCP 서버를 활용하여 사용자의 자연어 요청을 기반으로 완전한 React 데이터 시각화 애플리케이션을 자동 생성하는 도구입니다.

## 핵심 아키텍처

### 시스템 흐름

```mermaid
graph TD
    A[사용자 명령어] --> B[VibeCraft-viz 실행]
    B --> C[데이터 처리<br/>CSV/JSON → SQLite]
    C --> D[MCP 서버 설정 업데이트]
    D --> E[간결한 프롬프트 생성<br/>12줄]
    E --> F[Gemini CLI 실행]
    
    F --> G[GEMINI.md 계층적 로딩]
    G --> H[루트 GEMINI.md<br/>기본 설정]
    G --> I[templates/GEMINI.md<br/>공통 패턴]
    G --> J[templates/dashboards/{template}/GEMINI.md<br/>템플릿 특화]
    
    H --> K[통합 시스템 프롬프트<br/>~10,000 토큰]
    I --> K
    J --> K
    
    K --> L[React 앱 생성]
    L --> M[실행 가능한 대시보드]
```

### GEMINI.md 계층적 메모리 시스템

1. **자동 로딩**: Gemini CLI가 디렉토리 구조를 스캔하여 모든 GEMINI.md 파일을 자동으로 로드
2. **계층적 병합**: 상위 → 하위 순서로 명령을 병합하여 특화된 지침이 일반 지침을 보완
3. **템플릿별 특화**: 각 템플릿은 독립적인 GEMINI.md로 관리되어 확장성 확보

### 개선된 프롬프트 시스템

이전 방식 (232줄의 복잡한 프롬프트):
```python
prompt = f"""You are an expert React developer...
(매우 긴 프롬프트)
"""
```

현재 방식 (12줄의 간결한 프롬프트 + GEMINI.md):
```python
prompt = f"""Create a {template} dashboard for the following request:
"{user_request}"
Database Information: ...
IMPORTANT: Use the {template} template guidelines from: {template_path}
"""
```

### 주요 컴포넌트

#### VibeCraft-viz (main.py)
- **ProjectManager**: 프로젝트 생성 및 관리
- **DataProcessor**: CSV/JSON을 SQLite로 변환
- **GeminiSettingsManager**: .gemini/settings.json 생성
- **PromptGenerator**: 템플릿 기반 프롬프트 생성
- **GeminiExecutor**: subprocess로 Gemini CLI 실행

#### 프로젝트 구조
```
vibecraft-viz/
├── .gemini/
│   └── settings.json             # MCP 서버 설정 (루트에 하나만)
├── GEMINI.md                     # 루트 시스템 프롬프트 (React 기본 설정)
├── projects/                     # 생성된 프로젝트들
│   └── [project-id]/
│       ├── data.sqlite           # 변환된 데이터
│       ├── metadata.json         # 프로젝트 메타데이터
│       ├── prompt.txt            # 생성된 프롬프트
│       └── output/               # Gemini CLI 출력 (React 앱)
├── templates/                    # 대시보드 템플릿
│   ├── GEMINI.md                # 공통 대시보드 패턴
│   └── dashboards/
│       ├── time-series/
│       │   └── GEMINI.md        # 시계열 특화 지침
│       ├── comparison/
│       │   └── GEMINI.md        # 비교 분석 특화 지침
│       ├── kpi-dashboard/
│       │   └── GEMINI.md        # KPI 대시보드 특화 지침
│       └── ...
└── src/
    └── main.py                   # 진입점
```

## MCP 서버 설정

VibeCraft-viz 루트의 .gemini/settings.json 구조:
```json
{
  "mcpServers": {
    "sqlite": {
      "command": "uv",
      "args": [
        "--directory",
        "/path/to/mcp-server-sqlite",
        "run",
        "mcp-server-sqlite",
        "--db-path",
        "/absolute/path/to/current/project/data.sqlite"
      ]
    }
  }
}
```

**중요**: .gemini/settings.json은 VibeCraft-viz 루트에 하나만 존재하며, 각 프로젝트 실행 시 해당 프로젝트의 SQLite 경로로 업데이트됩니다.

## 명령어 및 사용법

### 기본 실행
```bash
$ vibecraft-viz "<시각화 요청>" --data <데이터파일> --template <템플릿>
```

### 지원 템플릿
- `time-series`: 시계열 분석
- `geo-spatial`: 지리적 데이터 시각화
- `gantt-chart`: 프로젝트 일정 관리
- `kpi-dashboard`: 핵심 성과 지표
- `comparison`: 비교 분석
- `funnel-analysis`: 전환 퍼널 분석
- `cohort-analysis`: 코호트 분석
- `heatmap`: 히트맵 시각화
- `network-graph`: 네트워크 관계
- `custom`: 사용자 정의

### 실행 예시
```bash
# 시계열 분석
$ vibecraft-viz "월별 매출 추이와 전년 대비 성장률을 보여주는 대시보드 만들어줘" \
  --data sales.csv \
  --template time-series

# 지도 시각화
$ vibecraft-viz "매장별 매출을 지도에 히트맵으로 표시하고 지역별 통계도 보여줘" \
  --data stores.json \
  --template geo-spatial
```

## 프롬프트 구조

### OnehotPromptStructure
```typescript
interface OnehotPromptStructure {
  dataSource: {
    file: string;
    format: 'csv' | 'json' | 'sqlite';
    description?: string;
  };
  visualizationGoal: {
    type: DashboardType;
    description: string;
    metrics?: string[];
  };
  advanced?: {
    filters?: string[];
    timeRange?: string;
    groupBy?: string[];
    customRequirements?: string;
  };
}
```

## 템플릿 시스템

### GEMINI.md 기반 템플릿 관리

각 템플릿은 독립적인 GEMINI.md 파일로 관리되며, 다음 내용을 포함합니다:
- **Overview**: 템플릿의 목적과 사용 사례
- **Required Components**: 필수 React 컴포넌트와 상태 관리
- **SQL Queries**: 템플릿별 특화된 쿼리 패턴
- **Data Processing**: 데이터 변환 및 포맷팅 유틸리티
- **Layout Patterns**: 반응형 레이아웃 구조
- **Interactive Features**: 사용자 상호작용 기능

### 템플릿 확장 방법

새로운 템플릿 추가 시:
1. `templates/dashboards/{새템플릿}/` 디렉토리 생성
2. `GEMINI.md` 파일 작성 (기존 템플릿 참고)
3. Gemini CLI가 자동으로 로드하여 사용

## 개발 시 주의사항

1. **MCP 서버 설정**: VibeCraft-viz 루트의 .gemini/settings.json에 설정
2. **절대 경로 사용**: SQLite 파일 경로는 절대 경로로 지정
3. **프로젝트 격리**: 각 프로젝트는 독립적인 디렉토리와 SQLite 데이터베이스 사용
4. **Gemini CLI 실행**: VibeCraft-viz가 루트에서 subprocess로 실행
5. **사용자 경험**: 사용자는 요청만 전달하고 완성된 React 앱을 받음

## 데이터 처리 플로우

1. **데이터 파일 검증**: CSV/JSON 형식 확인
2. **스키마 추론**: 데이터 타입 자동 감지
3. **SQLite 변환**: pandas를 사용한 데이터베이스 생성
4. **인덱스 최적화**: 성능을 위한 인덱스 생성

## React 앱 생성 규칙

생성되는 React 애플리케이션은:
- 즉시 실행 가능한 완전한 프로젝트 구조
- sql.js를 통한 브라우저 내 SQLite 실행
- Recharts/Chart.js를 사용한 시각화
- Tailwind CSS 스타일링
- 반응형 디자인
- 에러 처리 및 로딩 상태 구현

## 워크플로우 디버깅

문제 발생 시 확인 사항:
1. 프로젝트 디렉토리가 올바르게 생성되었는지
2. data.sqlite 파일이 존재하는지
3. .gemini/settings.json의 경로가 올바른지
4. Gemini CLI 실행 로그 확인 (--debug 모드 활용)
5. 생성된 prompt.txt 내용 검증
6. GEMINI.md 로딩 확인:
   ```
   [Gemini] [DEBUG] [MemoryDiscovery] Final ordered GEMINI.md paths to read: [...]
   ```

## 주요 개선사항 (2025.01)

### 1. GEMINI.md 계층적 메모리 시스템 도입
- 232줄 프롬프트 → 12줄로 단순화
- 템플릿별 독립적 관리로 확장성 향상
- Gemini CLI의 자동 로딩 활용

### 2. 템플릿별 특화 지침
- 각 템플릿마다 전용 GEMINI.md 파일
- SQL 쿼리, 컴포넌트 구조, 레이아웃 패턴 포함
- 새 템플릿 추가 시 파일만 생성하면 자동 적용

### 3. 의존성 관리 개선
- 루트 GEMINI.md에 필수 패키지 명시
- date-fns, recharts 등 누락 방지
- 템플릿별 추가 의존성 지원