# Task 1: 프로젝트 초기 설정 및 기본 구조 생성

## 목표
VibeCraft-Agent 프로젝트의 기본 구조를 설정하고 필요한 의존성을 설치합니다.

## 작업 내용

### 1.1 프로젝트 초기화
```bash
npm init -y
```

### 1.2 TypeScript 설정
```bash
npm install --save-dev typescript @types/node ts-node
npm install --save-dev @typescript-eslint/parser @typescript-eslint/eslint-plugin
npm install --save-dev prettier eslint
```

### 1.3 필수 의존성 설치
```bash
# CLI 관련
npm install commander chalk

# SQLite 관련
npm install sqlite3 @types/sqlite3

# 파일 시스템 및 유틸리티
npm install fs-extra

# 개발 도구
npm install --save-dev jest @types/jest ts-jest
npm install --save-dev nodemon
```

### 1.4 디렉토리 구조 생성
```
vibecraft-agent/
├── src/
│   ├── cli.ts              # CLI 진입점
│   ├── core/               # 핵심 모듈
│   │   ├── agent.ts
│   │   ├── parser.ts
│   │   ├── schema-analyzer.ts
│   │   ├── template-engine.ts
│   │   ├── settings-manager.ts
│   │   ├── prompt-builder.ts
│   │   ├── execution-engine.ts
│   │   └── output-validator.ts
│   ├── templates/          # 프롬프트 템플릿
│   │   ├── system.ts
│   │   ├── time-series.ts
│   │   ├── geo-spatial.ts
│   │   └── index.ts
│   ├── utils/              # 유틸리티
│   │   ├── error-handler.ts
│   │   ├── logger.ts
│   │   ├── file-manager.ts
│   │   └── process-manager.ts
│   └── types/              # TypeScript 타입 정의
│       └── index.ts
├── templates/              # 템플릿 리소스
│   ├── prompts/
│   └── components/
├── tests/                  # 테스트 파일
├── package.json
├── tsconfig.json
├── .eslintrc.js
├── .prettierrc
└── README.md
```

### 1.5 TypeScript 설정 (tsconfig.json)
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

### 1.6 package.json scripts 설정
```json
{
  "scripts": {
    "build": "tsc",
    "dev": "nodemon --watch src --exec ts-node src/cli.ts",
    "start": "node dist/cli.js",
    "test": "jest",
    "lint": "eslint src/**/*.ts",
    "format": "prettier --write src/**/*.ts"
  },
  "bin": {
    "vibecraft-agent": "./dist/cli.js"
  }
}
```

### 1.7 기본 타입 정의 (src/types/index.ts)
```typescript
export type VisualizationType = 
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

export interface AgentCliArgs {
  sqlitePath: string;
  visualizationType: VisualizationType;
  userPrompt: string;
  outputDir: string;
  projectName?: string;
  debug?: boolean;
}

export interface AgentExecutionResult {
  success: boolean;
  outputPath: string;
  executionTime: number;
  logs: string[];
  error?: string;
}
```

## 완료 기준
- [ ] 프로젝트 디렉토리 구조 생성 완료
- [ ] 모든 필수 의존성 설치 완료
- [ ] TypeScript 설정 완료
- [ ] 기본 타입 정의 완료
- [ ] npm scripts 설정 완료