#!/bin/bash
# VibeCraft Agent 예제 실행 스크립트

echo "🎨 VibeCraft Agent 예제 실행 스크립트"
echo "=================================="
echo ""

# 색상 정의
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 현재 디렉토리 저장
ORIGINAL_DIR=$(pwd)
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# 프로젝트 루트로 이동
cd "$PROJECT_ROOT"

# VibeCraft 실행 가능 확인
if ! command -v vibecraft &> /dev/null && [ ! -f "vibecraft.py" ]; then
    echo -e "${YELLOW}⚠️  VibeCraft가 설치되지 않았습니다.${NC}"
    echo "다음 명령어로 설치하세요:"
    echo "  pip install -e ."
    exit 1
fi

# VibeCraft 명령어 설정
if command -v vibecraft &> /dev/null; then
    VIBECRAFT_CMD="vibecraft"
else
    VIBECRAFT_CMD="python vibecraft.py"
fi

# 메뉴 표시
show_menu() {
    echo -e "${BLUE}실행할 예제를 선택하세요:${NC}"
    echo "1) 제품별 판매량 막대 차트"
    echo "2) 지역별 수익 파이 차트"
    echo "3) 판매 트렌드 라인 차트"
    echo "4) 종합 판매 대시보드"
    echo "5) 날씨 데이터 시각화"
    echo "6) 날씨 종합 분석"
    echo "7) 사용자 정의 프롬프트"
    echo "8) 모든 예제 실행"
    echo "0) 종료"
    echo ""
}

# 예제 실행 함수
run_example() {
    local data_file=$1
    local prompt=$2
    local output_file=$3
    local use_streaming=$4
    
    echo -e "${GREEN}🚀 실행 중: $prompt${NC}"
    
    if [ "$use_streaming" = "true" ]; then
        $VIBECRAFT_CMD -s -o "$output_file" "$data_file" "$prompt"
    else
        $VIBECRAFT_CMD -o "$output_file" "$data_file" "$prompt"
    fi
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ 완료! 결과 파일: $output_file${NC}"
        echo -e "${BLUE}브라우저에서 열기: file://$PROJECT_ROOT/$output_file${NC}"
    else
        echo -e "${YELLOW}❌ 실행 실패${NC}"
    fi
    echo ""
}

# 메인 루프
while true; do
    show_menu
    read -p "선택> " choice
    
    case $choice in
        1)
            run_example "examples/sales_data.csv" \
                "제품별 판매량을 비교하는 막대 차트를 생성하세요. X축은 제품, Y축은 판매량으로 설정하고, 각 막대는 다른 색상으로 표시하세요." \
                "product_sales_bar.html" \
                false
            ;;
        2)
            run_example "examples/sales_data.csv" \
                "지역별 총 수익을 보여주는 파이 차트를 생성하세요. 각 지역의 비율을 퍼센트로 표시하세요." \
                "regional_revenue_pie.html" \
                false
            ;;
        3)
            run_example "examples/sales_data.csv" \
                "날짜별 총 판매량 추이를 보여주는 라인 차트를 생성하세요. 제품별로 다른 라인으로 표시하세요." \
                "sales_trend_line.html" \
                false
            ;;
        4)
            run_example "examples/sales_data.csv" \
                "종합 판매 대시보드를 생성하세요. 4개의 차트를 포함: 1) 일별 총 수익 라인 차트, 2) 제품별 판매량 막대 차트, 3) 지역별 수익 파이 차트, 4) 제품-지역별 판매량 히트맵" \
                "sales_dashboard.html" \
                true
            ;;
        5)
            run_example "examples/weather_data.json" \
                "날짜별 기온 변화를 보여주는 라인 차트를 생성하세요. 최고, 최저, 평균 기온을 각각 다른 라인으로 표시하세요." \
                "weather_temperature.html" \
                false
            ;;
        6)
            run_example "examples/weather_data.json" \
                "날씨 종합 분석 대시보드를 생성하세요. 기온 변화 라인 차트, 습도 막대 그래프, 풍속 산점도를 포함하고, 날씨 상태를 색상으로 구분하세요." \
                "weather_dashboard.html" \
                true
            ;;
        7)
            echo "데이터 파일을 선택하세요:"
            echo "1) examples/sales_data.csv"
            echo "2) examples/weather_data.json"
            read -p "선택> " data_choice
            
            case $data_choice in
                1) data_file="examples/sales_data.csv" ;;
                2) data_file="examples/weather_data.json" ;;
                *) echo "잘못된 선택"; continue ;;
            esac
            
            read -p "시각화 요구사항을 입력하세요: " custom_prompt
            read -p "출력 파일명 (기본: custom_chart.html): " output_name
            output_name=${output_name:-custom_chart.html}
            
            read -p "스트리밍 모드를 사용하시겠습니까? (y/N): " use_stream
            use_stream_flag=false
            [[ "$use_stream" =~ ^[Yy]$ ]] && use_stream_flag=true
            
            run_example "$data_file" "$custom_prompt" "$output_name" $use_stream_flag
            ;;
        8)
            echo -e "${YELLOW}모든 예제를 실행합니다...${NC}"
            echo ""
            
            # 모든 예제 실행
            run_example "examples/sales_data.csv" \
                "제품별 판매량 막대 차트" \
                "all_1_product_sales.html" false
                
            run_example "examples/sales_data.csv" \
                "지역별 수익 파이 차트" \
                "all_2_regional_revenue.html" false
                
            run_example "examples/sales_data.csv" \
                "종합 판매 대시보드" \
                "all_3_sales_dashboard.html" false
                
            run_example "examples/weather_data.json" \
                "날씨 종합 분석" \
                "all_4_weather_dashboard.html" false
            
            echo -e "${GREEN}모든 예제 실행 완료!${NC}"
            ;;
        0)
            echo "프로그램을 종료합니다."
            cd "$ORIGINAL_DIR"
            exit 0
            ;;
        *)
            echo -e "${YELLOW}잘못된 선택입니다. 다시 시도하세요.${NC}"
            ;;
    esac
    
    echo ""
    read -p "계속하려면 Enter를 누르세요..."
    clear
done