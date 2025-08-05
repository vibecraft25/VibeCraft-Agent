# VibeCraft-Agent

SQLite 데이터베이스를 기반으로 Gemini CLI를 활용하여 React 데이터 시각화 애플리케이션을 자동 생성하는 CLI 도구입니다.

> 🎉 **90%+ 성공률**로 원샷 프롬프트만으로 즉시 실행 가능한 React 앱을 생성합니다!

## 🚀 주요 기능

- **실전 검증된 시각화 타입**: time-series, geo-spatial, kpi-dashboard, comparison 등
- **원샷 프롬프트**: 한 번의 명령으로 완전한 React 앱 생성
- **자체 검증 기능**: 생성 후 자동으로 빌드 검증 및 TypeScript 에러 수정
- **스마트 컬럼 매핑**: 다양한 데이터베이스 스키마에 자동 적응
- **즉시 실행 가능**: `npm install && npm run dev`로 바로 실행

## 📋 기술 스택

생성되는 앱은 다음 기술을 사용합니다:
- **Vite**: 빠른 개발 서버와 빌드
- **React 18**: 최신 React 기능 활용
- **TypeScript**: 타입 안정성
- **Recharts**: 데이터 시각화
- **Tailwind CSS**: 스타일링
- **sql.js**: 브라우저에서 SQLite 실행

## 🔧 설치

### 1. VibeCraft-Agent 설치

```bash
git clone https://github.com/your-org/vibecraft-agent
cd vibecraft-agent
npm install
npm run build
npm link
```

### 2. Gemini CLI 설치

Gemini CLI는 별도로 설치해야 합니다. (설치 방법은 Gemini CLI 문서 참조)

### 3. MCP SQLite Server 설치 (선택사항)

```bash
# Python으로 설치
pip install mcp-server-sqlite

# 또는 UV로 설치
uv pip install mcp-server-sqlite
```

## 💻 사용법

### 기본 명령어

```bash
vibecraft-agent \
  --sqlite-path /path/to/your/data.sqlite \
  --visualization-type <type> \
  --user-prompt "시각화 요구사항" \
  --output-dir ./output
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

```bash
# 사용 가능한 시각화 타입 목록 보기
vibecraft-agent --list-types
```

| 타입 | 설명 | 주요 용도 |
|------|------|-----------|
| `time-series` | 시계열 분석 | 시간에 따른 추이, 트렌드 분석 |
| `geo-spatial` | 지도 시각화 | 위치 기반 데이터, 지역별 통계 |
| `kpi-dashboard` | KPI 대시보드 | 핵심 지표, 메트릭 카드 |
| `comparison` | 비교 분석 | 카테고리별 비교, A/B 분석 |

## 📊 실제 사용 예시

### 1. 시계열 대시보드 (월별 매출 추이)

```bash
vibecraft-agent \
  --sqlite-path /path/to/your/database.sqlite \
  --visualization-type time-series \
  --user-prompt "월별 매출 추이를 라인 차트로 보여주고, 제품별로 구분해서 표시해주세요" \
  --output-dir ./sales-dashboard
```

### 2. KPI 대시보드 (핵심 지표)

```bash
vibecraft-agent \
  --sqlite-path /path/to/your/database.sqlite \
  --visualization-type kpi-dashboard \
  --user-prompt "총 매출, 평균 주문 금액, 베스트셀러 제품, 지역별 매출 비중을 카드 형태로 보여주세요" \
  --output-dir ./kpi-dashboard
```

### 3. 지리공간 시각화 (지역별 매출)

```bash
vibecraft-agent \
  --sqlite-path /path/to/your/database.sqlite \
  --visualization-type geo-spatial \
  --user-prompt "지역별 매출을 한국 지도에 마커로 표시하고, 클릭하면 상세 정보를 보여주세요" \
  --output-dir ./geo-dashboard
```

### 4. 비교 분석 (제품별/지역별)

```bash
vibecraft-agent \
  --sqlite-path /path/to/your/database.sqlite \
  --visualization-type comparison \
  --user-prompt "제품별 매출을 막대 차트로, 지역별 매출을 파이 차트로 나란히 보여주세요" \
  --output-dir ./comparison-dashboard
```

## 🔍 생성된 앱 실행하기

1. 생성된 디렉토리로 이동:
   ```bash
   cd ./sales-dashboard
   ```

2. 의존성 설치:
   ```bash
   npm install
   ```

3. 개발 서버 실행:
   ```bash
   npm run dev
   ```

4. 브라우저에서 http://localhost:5173 접속


## ⚡ 성능 및 특징

### 프롬프트 최적화
- **"Less is More" 원칙**: 단순하고 명확한 프롬프트로 90%+ 성공률
- **자체 검증**: 생성 중 발생한 TypeScript 에러 자동 수정
- **빠른 생성**: 2-3분 내에 완전한 React 앱 생성

### 스마트 기능
- **컬럼 자동 매핑**: 날짜, 금액, 지역 등 자동 인식
- **한국어 지역명 → 좌표 변환**: geo-spatial에서 자동 처리
- **반응형 디자인**: 모바일부터 데스크톱까지 자동 대응

## 🐛 문제 해결

### Gemini CLI를 찾을 수 없음
```bash
Error: Gemini CLI not found. Please install it first.
```
**해결**: Gemini CLI가 설치되어 있고 PATH에 등록되어 있는지 확인

### SQLite 파일 접근 오류
```bash
Error: Cannot access SQLite database
```
**해결**: 
- 파일 경로가 올바른지 확인
- 파일이 유효한 SQLite 데이터베이스인지 확인
- 파일 읽기 권한이 있는지 확인

### 생성된 앱 실행 시 에러
```bash
Error: Cannot find module '@/components/...'
```
**해결**: 대부분 자체 검증으로 해결되지만, 발생 시:
- `tsconfig.json`의 paths 설정 확인
- `vite.config.ts`의 alias 설정 확인

## 📚 추가 문서

- [기술 아키텍처](./docs/technical-architecture.md)
- [템플릿 가이드](./docs/template-guide.md)
- [API 문서](./docs/api.md)
- [기여 가이드](./CONTRIBUTING.md)

## 🤝 기여하기

새로운 시각화 타입을 추가하거나 기능을 개선하고 싶으시다면:

1. Fork & Clone
2. 새 브랜치 생성 (`git checkout -b feature/amazing-visualization`)
3. 변경사항 커밋 (`git commit -m 'Add amazing visualization'`)
4. Push (`git push origin feature/amazing-visualization`)
5. Pull Request 생성

자세한 내용은 [기여 가이드](./CONTRIBUTING.md)를 참조하세요.

## 📄 라이선스

MIT License - 자세한 내용은 [LICENSE](./LICENSE) 파일을 참고하세요.