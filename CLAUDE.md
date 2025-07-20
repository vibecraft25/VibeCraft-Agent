# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 개요

VibeCraft-viz는 Gemini CLI와 SQLite MCP 서버를 활용하여 사용자의 자연어 요청을 기반으로 완전한 React 데이터 시각화 애플리케이션을 자동 생성하는 도구입니다.

## 핵심 아키텍처

### 시스템 흐름
1. **사용자 입력**: 자연어 요청 + 데이터 파일 + 템플릿 타입
2. **VibeCraft-viz 처리**: 
   - 데이터를 SQLite로 변환
   - 프로젝트 환경 구성
   - MCP 서버 설정 생성
   - 원샷 프롬프트 생성
3. **Gemini CLI 실행**: VibeCraft-viz가 subprocess로 자동 실행
4. **결과물**: 실행 가능한 React 애플리케이션

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
├── projects/                      # 생성된 프로젝트들
│   └── [project-id]/
│       ├── .gemini/
│       │   └── settings.json     # MCP 서버 설정
│       ├── data.sqlite           # 변환된 데이터
│       ├── metadata.json         # 프로젝트 메타데이터
│       ├── prompt.txt            # 생성된 프롬프트
│       └── output/               # Gemini CLI 출력 (React 앱)
├── templates/                     # 대시보드 템플릿
└── src/
    └── main.py                   # 진입점
```

## MCP 서버 설정

.gemini/settings.json 구조:
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
        "/absolute/path/to/project/data.sqlite"
      ]
    }
  }
}
```

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

각 템플릿은 다음 구조를 가집니다:
- **requiredDataFields**: 필수 데이터 필드
- **defaultCharts**: 기본 차트 구성
- **layoutStructure**: 레이아웃 구조
- **interactiveFeatures**: 상호작용 기능
- **reactComponents**: React 컴포넌트 구조

## 개발 시 주의사항

1. **MCP 서버 설정**: 반드시 .gemini/settings.json에 설정해야 함
2. **절대 경로 사용**: SQLite 파일 경로는 절대 경로로 지정
3. **프로젝트 격리**: 각 프로젝트는 독립적인 디렉토리와 SQLite 데이터베이스 사용
4. **Gemini CLI 실행**: VibeCraft-viz가 자동으로 subprocess로 실행
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
4. Gemini CLI 실행 로그 확인
5. 생성된 prompt.txt 내용 검증