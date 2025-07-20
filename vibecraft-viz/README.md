# VibeCraft-viz

React 데이터 시각화 애플리케이션을 자동으로 생성하는 CLI 도구입니다. 사용자의 자연어 요청과 데이터 파일만으로 완전한 React 대시보드를 생성합니다.

## 특징

- 🚀 **원샷 프롬프트**: 한 번의 명령으로 완전한 React 앱 생성
- 📊 **다양한 템플릿**: 10가지 전문 시각화 템플릿 제공
- 🔧 **자동화된 프로세스**: 데이터 처리부터 코드 생성까지 자동화
- 💾 **SQLite 기반**: 브라우저에서 실행 가능한 SQLite 데이터베이스
- 🤖 **Gemini CLI 통합**: AI 기반 코드 생성

## 설치

```bash
# 저장소 클론
git clone https://github.com/yourusername/vibecraft-viz.git
cd vibecraft-viz

# 의존성 설치
pip install -r requirements.txt

# 환경 변수 설정 (선택사항)
export MCP_SERVER_SQLITE_PATH="/path/to/mcp-server-sqlite"
```

## 사용법

### 기본 사용법

```bash
# VibeCraft-viz 실행
python src/main.py "<시각화 요청>" --data <데이터파일> --template <템플릿>
```

### 예시

```bash
# 시계열 분석 대시보드
python src/main.py "월별 매출 추이와 전년 대비 성장률을 보여주는 대시보드 만들어줘" \
  --data sales.csv \
  --template time-series

# KPI 대시보드
python src/main.py "분기별 주요 KPI를 보여주고 목표 달성률을 게이지로 표시해줘" \
  --data metrics.csv \
  --template kpi-dashboard

# 비교 분석 대시보드
python src/main.py "제품별 판매량을 비교하고 차이점을 시각화해줘" \
  --data products.json \
  --template comparison
```

## 지원 템플릿

| 템플릿 ID | 설명 | 주요 기능 |
|-----------|------|-----------|
| `time-series` | 시계열 분석 | 날짜 범위 선택, 트렌드 분석, 줌 기능 |
| `kpi-dashboard` | KPI 대시보드 | 메트릭 카드, 게이지 차트, 목표 대비 분석 |
| `comparison` | 비교 분석 | 그룹별 비교, 차이점 하이라이팅, 통계 요약 |
| `geo-spatial` | 지도 시각화 | 히트맵, 마커 클러스터링, 지역별 통계 |
| `gantt-chart` | 프로젝트 일정 | 작업 타임라인, 진행률, 의존성 표시 |
| `funnel-analysis` | 퍼널 분석 | 전환율, 단계별 이탈, 프로세스 최적화 |
| `cohort-analysis` | 코호트 분석 | 유지율, 그룹별 행동 패턴, 시간별 추이 |
| `heatmap` | 히트맵 | 밀도 분석, 패턴 인식, 다차원 데이터 |
| `network-graph` | 네트워크 그래프 | 관계 시각화, 노드 분석, 중심성 계산 |
| `custom` | 사용자 정의 | 자유로운 커스터마이징 |

## 프로젝트 구조

```
vibecraft-viz/
├── src/
│   ├── main.py              # CLI 진입점
│   ├── data_processor.py    # 데이터 처리 모듈
│   ├── project_manager.py   # 프로젝트 관리
│   ├── settings_manager.py  # Gemini 설정 관리
│   └── prompt_generator.py  # 프롬프트 생성
├── templates/
│   └── dashboards/         # 대시보드 템플릿
├── projects/               # 생성된 프로젝트들
├── requirements.txt
└── README.md
```

## 생성되는 React 앱 구조

```
output/
├── package.json            # npm 의존성
├── public/
│   ├── index.html
│   └── data.sqlite        # 데이터베이스
├── src/
│   ├── App.js             # 메인 컴포넌트
│   ├── components/        # UI 컴포넌트
│   └── utils/             # 유틸리티 함수
└── README.md
```

## 워크플로우

1. **데이터 처리**: CSV/JSON 파일을 SQLite 데이터베이스로 변환
2. **프로젝트 생성**: 고유 ID로 프로젝트 디렉토리 생성
3. **설정 생성**: `.gemini/settings.json` 파일 생성
4. **프롬프트 생성**: 템플릿 기반 원샷 프롬프트 생성
5. **Gemini CLI 실행**: AI가 React 코드 생성
6. **결과 전달**: 실행 가능한 React 앱 제공

## 요구사항

- Python 3.8+
- pandas, numpy
- Gemini CLI (별도 설치 필요)
- MCP SQLite Server (별도 설치 필요)

## 환경 변수

- `MCP_SERVER_SQLITE_PATH`: MCP SQLite 서버 경로 (기본값: `/path/to/mcp-server-sqlite`)

## 문제 해결

### 일반적인 문제

1. **Gemini CLI를 찾을 수 없음**
   ```bash
   # Gemini CLI가 PATH에 있는지 확인
   which gemini
   ```

2. **MCP 서버 경로 오류**
   ```bash
   # 환경 변수 설정
   export MCP_SERVER_SQLITE_PATH="/실제/경로/mcp-server-sqlite"
   ```

3. **데이터 파일 형식 오류**
   - CSV: 첫 번째 행은 헤더여야 함
   - JSON: 배열 또는 객체 형식이어야 함

## 기여하기

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.

## 문의

- 이슈: [GitHub Issues](https://github.com/yourusername/vibecraft-viz/issues)
- 이메일: your.email@example.com