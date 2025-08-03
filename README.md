# VibeCraft-Agent

SQLite 데이터베이스를 기반으로 Gemini CLI를 활용하여 React 데이터 시각화 애플리케이션을 자동 생성하는 CLI 도구입니다.

## 설치

```bash
npm install -g vibecraft-agent
```

## 사용법

### 기본 사용법
```bash
vibecraft-agent \
  --sqlite-path /path/to/data.sqlite \
  --visualization-type time-series \
  --user-prompt "월별 매출 추이를 보여주는 대시보드를 만들어주세요" \
  --output-dir ./my-dashboard
```

### 시각화 타입 목록 확인
```bash
vibecraft-agent --list-types
```

### 모든 옵션 사용 예시
```bash
vibecraft-agent \
  --sqlite-path ./sales.sqlite \
  --visualization-type kpi-dashboard \
  --user-prompt "주요 KPI를 실시간으로 모니터링하는 대시보드" \
  --output-dir ./sales-dashboard \
  --project-name "Sales KPI Dashboard" \
  --debug
```

### 옵션 설명
- `--sqlite-path`: SQLite 데이터베이스 파일 경로 (필수)
- `--visualization-type`: 시각화 타입 (필수)
- `--user-prompt`: 사용자의 시각화 요청 (필수)
- `--output-dir`: 생성된 React 앱 출력 디렉토리 (기본: ./output)
- `--project-name`: 프로젝트 이름 (선택)
- `--debug`: 디버그 모드 활성화 (선택)
- `--list-types`: 사용 가능한 시각화 타입 목록 표시

## 개발

```bash
# 의존성 설치
npm install

# 개발 모드 실행
npm run dev

# 빌드
npm run build

# 테스트
npm test
```

## 라이선스

MIT