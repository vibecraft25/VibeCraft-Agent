# VibeCraft-Agent 사용자 가이드

## 목차

1. [소개](#소개)
2. [설치](#설치)
3. [빠른 시작](#빠른-시작)
4. [시각화 타입별 가이드](#시각화-타입별-가이드)
5. [고급 사용법](#고급-사용법)
6. [문제 해결](#문제-해결)
7. [FAQ](#faq)

## 소개

VibeCraft-Agent는 SQLite 데이터베이스를 입력으로 받아 자동으로 React 기반 데이터 시각화 애플리케이션을 생성하는 강력한 CLI 도구입니다. Gemini CLI의 AI 기능을 활용하여 사용자의 요구사항에 맞는 맞춤형 대시보드를 생성합니다.

### 주요 특징

- **코드 작성 불필요**: SQL과 시각화 요구사항만 설명하면 완전한 React 앱 생성
- **즉시 실행 가능**: 생성된 앱은 바로 실행 가능한 상태로 제공
- **맞춤형 시각화**: 10가지 템플릿과 사용자 요구사항을 결합한 맞춤형 결과
- **브라우저 기반**: sql.js를 사용하여 서버 없이 브라우저에서 직접 데이터 처리

## 설치

### 전제 조건

- Node.js 18.0 이상
- npm 또는 yarn
- Git (소스 설치 시)

### 단계별 설치

#### 1. VibeCraft-Agent 설치

**npm으로 설치 (권장)**
```bash
npm install -g vibecraft-agent
```

**소스에서 설치**
```bash
git clone https://github.com/your-org/vibecraft-agent
cd vibecraft-agent
npm install
npm run build
npm link
```

#### 2. Gemini CLI 설치

```bash
npm install -g @google/gemini-cli
```

설치 확인:
```bash
gemini --version
```

#### 3. MCP SQLite Server 설치 (선택사항)

Python이 설치된 경우:
```bash
pip install mcp-server-sqlite
```

UV를 사용하는 경우:
```bash
uv pip install mcp-server-sqlite
```

## 빠른 시작

### 첫 번째 시각화 앱 만들기

1. **샘플 데이터베이스 준비**

```sql
-- sample_sales.sql
CREATE TABLE monthly_sales (
    id INTEGER PRIMARY KEY,
    month DATE,
    revenue DECIMAL(10,2),
    profit DECIMAL(10,2)
);

INSERT INTO monthly_sales VALUES
(1, '2024-01-01', 100000, 20000),
(2, '2024-02-01', 120000, 25000),
(3, '2024-03-01', 110000, 22000);
```

```bash
sqlite3 sales.sqlite < sample_sales.sql
```

2. **시각화 앱 생성**

```bash
vibecraft-agent \
  --sqlite-path ./sales.sqlite \
  --visualization-type time-series \
  --user-prompt "월별 매출과 이익을 라인 차트로 보여주세요" \
  --output-dir ./my-first-dashboard
```

3. **생성된 앱 실행**

```bash
cd ./my-first-dashboard
npm install
npm start
```

브라우저에서 http://localhost:3000 열기

## 시각화 타입별 가이드

### 1. 시계열 분석 (time-series)

**적합한 경우**
- 시간에 따른 변화 추적
- 트렌드 분석
- 계절성 패턴 파악

**예시**
```bash
vibecraft-agent \
  --sqlite-path ./sales.sqlite \
  --visualization-type time-series \
  --user-prompt "월별 매출 트렌드와 전월 대비 증감률을 보여주세요. 
                 이동평균선도 추가하고 특정 기간을 선택할 수 있게 해주세요." \
  --output-dir ./sales-trends
```

**데이터 요구사항**
- 날짜/시간 컬럼 필수
- 수치형 데이터 1개 이상

### 2. 지리공간 시각화 (geo-spatial)

**적합한 경우**
- 위치 기반 데이터 표시
- 지역별 통계 시각화
- 히트맵, 클러스터링

**예시**
```bash
vibecraft-agent \
  --sqlite-path ./stores.sqlite \
  --visualization-type geo-spatial \
  --user-prompt "매장 위치를 지도에 표시하고 매출액에 따라 마커 크기를 다르게 해주세요.
                 지역별로 클러스터링하고 클릭 시 상세 정보를 보여주세요." \
  --output-dir ./store-map
```

**데이터 요구사항**
- 위도(latitude), 경도(longitude) 컬럼
- 또는 주소 정보

### 3. 간트 차트 (gantt-chart)

**적합한 경우**
- 프로젝트 일정 관리
- 작업 진행 상황 추적
- 리소스 할당 시각화

**예시**
```bash
vibecraft-agent \
  --sqlite-path ./projects.sqlite \
  --visualization-type gantt-chart \
  --user-prompt "프로젝트별 작업 일정을 간트차트로 표시하고,
                 진행률과 담당자를 함께 보여주세요.
                 마일스톤과 의존성도 표시해주세요." \
  --output-dir ./project-timeline
```

**데이터 요구사항**
- 작업명, 시작일, 종료일
- 선택: 진행률, 담당자, 의존성

### 4. KPI 대시보드 (kpi-dashboard)

**적합한 경우**
- 핵심 지표 모니터링
- 실시간 현황 파악
- 목표 대비 실적 추적

**예시**
```bash
vibecraft-agent \
  --sqlite-path ./metrics.sqlite \
  --visualization-type kpi-dashboard \
  --user-prompt "매출, 이익률, 고객수, 만족도 등 주요 KPI를 한눈에 볼 수 있는 대시보드.
                 전월/전년 대비 변화율과 목표 달성률을 게이지로 표시해주세요." \
  --output-dir ./kpi-dashboard
```

### 5. 비교 분석 (comparison)

**적합한 경우**
- A/B 테스트 결과
- 제품/서비스 비교
- 경쟁사 분석

**예시**
```bash
vibecraft-agent \
  --sqlite-path ./products.sqlite \
  --visualization-type comparison \
  --user-prompt "제품별 판매량, 수익, 고객 만족도를 비교하는 차트.
                 막대그래프와 레이더 차트를 함께 사용하고
                 필터링 기능을 추가해주세요." \
  --output-dir ./product-comparison
```

### 6. 퍼널 분석 (funnel-analysis)

**적합한 경우**
- 전환율 분석
- 사용자 여정 추적
- 병목 지점 파악

**예시**
```bash
vibecraft-agent \
  --sqlite-path ./conversions.sqlite \
  --visualization-type funnel-analysis \
  --user-prompt "웹사이트 방문부터 구매까지의 전환 퍼널을 시각화.
                 각 단계별 이탈률과 체류 시간을 표시하고
                 기간별 비교가 가능하게 해주세요." \
  --output-dir ./conversion-funnel
```

### 7. 코호트 분석 (cohort-analysis)

**적합한 경우**
- 사용자 리텐션 분석
- 행동 패턴 추적
- LTV 예측

**예시**
```bash
vibecraft-agent \
  --sqlite-path ./users.sqlite \
  --visualization-type cohort-analysis \
  --user-prompt "월별 가입자 코호트의 리텐션을 히트맵으로 표시.
                 코호트별 수익과 활동 지표도 함께 분석해주세요." \
  --output-dir ./cohort-retention
```

### 8. 히트맵 (heatmap)

**적합한 경우**
- 패턴 발견
- 상관관계 분석
- 밀도 시각화

**예시**
```bash
vibecraft-agent \
  --sqlite-path ./activity.sqlite \
  --visualization-type heatmap \
  --user-prompt "요일별, 시간대별 사용자 활동량을 히트맵으로 표시.
                 색상 강도로 활동량을 나타내고 
                 클릭 시 상세 데이터를 보여주세요." \
  --output-dir ./activity-heatmap
```

### 9. 네트워크 그래프 (network-graph)

**적합한 경우**
- 관계 시각화
- 영향력 분석
- 클러스터 발견

**예시**
```bash
vibecraft-agent \
  --sqlite-path ./relationships.sqlite \
  --visualization-type network-graph \
  --user-prompt "사용자 간 연결 관계를 네트워크 그래프로 표시.
                 노드 크기는 영향력, 엣지 굵기는 상호작용 빈도를 반영.
                 커뮤니티 탐지 기능도 추가해주세요." \
  --output-dir ./social-network
```

### 10. 사용자 정의 (custom)

**적합한 경우**
- 특수한 시각화 요구사항
- 여러 시각화 타입 조합
- 독특한 인터랙션 필요

**예시**
```bash
vibecraft-agent \
  --sqlite-path ./complex.sqlite \
  --visualization-type custom \
  --user-prompt "판매 데이터를 3D 산점도로 표시하고,
                 시간에 따른 애니메이션 재생 기능 추가.
                 VR 모드도 지원해주세요." \
  --output-dir ./custom-viz
```

## 고급 사용법

### 복잡한 SQL 스키마 처리

여러 테이블을 조인해야 하는 경우:

```bash
vibecraft-agent \
  --sqlite-path ./ecommerce.sqlite \
  --visualization-type kpi-dashboard \
  --user-prompt "orders, customers, products 테이블을 조인하여
                 고객 세그먼트별 구매 패턴 분석.
                 RFM 분석과 제품 추천 기능도 포함해주세요." \
  --output-dir ./customer-analytics
```

### 대용량 데이터 처리

```bash
vibecraft-agent \
  --sqlite-path ./big_data.sqlite \
  --visualization-type time-series \
  --user-prompt "1000만 건의 로그 데이터를 효율적으로 시각화.
                 데이터 샘플링과 집계를 사용하고
                 점진적 로딩을 구현해주세요." \
  --output-dir ./big-data-viz \
  --debug
```

### 실시간 업데이트 구현

```bash
vibecraft-agent \
  --sqlite-path ./realtime.sqlite \
  --visualization-type kpi-dashboard \
  --user-prompt "5초마다 데이터를 다시 로드하여 실시간 대시보드 구현.
                 WebSocket 연결을 시뮬레이션하고
                 부드러운 전환 애니메이션을 추가해주세요." \
  --output-dir ./realtime-dashboard
```

### 다국어 지원

```bash
vibecraft-agent \
  --sqlite-path ./international.sqlite \
  --visualization-type comparison \
  --user-prompt "한국어, 영어, 일본어를 지원하는 다국어 대시보드.
                 언어별로 숫자 포맷과 날짜 형식을 적절히 변경.
                 RTL 언어도 고려해주세요." \
  --output-dir ./multilingual-dashboard
```

## 문제 해결

### 일반적인 오류와 해결 방법

#### 1. Gemini CLI 실행 오류

**증상**
```
Error: Gemini CLI execution failed
```

**해결**
1. Gemini CLI 설치 확인: `gemini --version`
2. 환경 변수 확인: `echo $PATH`
3. 권한 확인: `which gemini`

#### 2. SQLite 파일 오류

**증상**
```
Error: Invalid SQLite database
```

**해결**
1. 파일 무결성 확인: `sqlite3 data.sqlite "PRAGMA integrity_check;"`
2. 파일 권한 확인: `ls -la data.sqlite`
3. SQLite 버전 호환성 확인

#### 3. 메모리 부족

**증상**
```
JavaScript heap out of memory
```

**해결**
```bash
# Node.js 메모리 한계 증가
export NODE_OPTIONS="--max-old-space-size=4096"
vibecraft-agent --sqlite-path ./large.sqlite ...
```

#### 4. 생성된 앱 실행 오류

**증상**
```
Module not found: Can't resolve 'sql.js'
```

**해결**
```bash
cd generated-app
rm -rf node_modules package-lock.json
npm install
npm start
```

### 디버그 모드 활용

상세한 로그를 보려면 `--debug` 플래그 사용:

```bash
vibecraft-agent \
  --sqlite-path ./data.sqlite \
  --visualization-type time-series \
  --user-prompt "..." \
  --output-dir ./output \
  --debug
```

디버그 모드에서는:
- 상세한 실행 로그 출력
- 생성된 프롬프트 저장
- 중간 파일 보존
- 성능 메트릭 표시

## FAQ

### Q: 어떤 SQLite 버전을 지원하나요?
A: SQLite 3.x 버전을 모두 지원합니다. sql.js를 사용하므로 브라우저 호환성도 보장됩니다.

### Q: 생성된 앱을 커스터마이징할 수 있나요?
A: 네, 생성된 코드는 표준 React 앱이므로 자유롭게 수정 가능합니다.

### Q: 대용량 데이터베이스도 처리 가능한가요?
A: 브라우저 메모리 한계 내에서 가능합니다. 일반적으로 100MB 이하를 권장하며, 그 이상은 서버 사이드 처리를 고려하세요.

### Q: 프라이빗 데이터 보안은 어떻게 되나요?
A: 모든 데이터 처리는 로컬에서 이루어지며, 생성된 앱도 클라이언트 사이드에서만 동작합니다.

### Q: 다른 데이터베이스도 지원하나요?
A: 현재는 SQLite만 지원하지만, 다른 데이터베이스의 데이터를 SQLite로 내보내서 사용할 수 있습니다.

### Q: 생성된 앱을 배포하려면?
A: 일반적인 React 앱 배포 방법을 따르면 됩니다:
```bash
npm run build
# build 폴더를 정적 호스팅 서비스에 업로드
```

### Q: 커스텀 템플릿을 만들 수 있나요?
A: 네, `templates/` 디렉토리에 새 템플릿을 추가할 수 있습니다. 자세한 내용은 [템플릿 가이드](./template-guide.md)를 참조하세요.

## 다음 단계

- [API 문서](./api.md) - 프로그래매틱 사용법
- [템플릿 가이드](./template-guide.md) - 커스텀 템플릿 작성
- [아키텍처 문서](./technical-architecture.md) - 내부 구조 이해
- [기여 가이드](../CONTRIBUTING.md) - 프로젝트 기여 방법