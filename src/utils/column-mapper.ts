import { TableInfo, ColumnInfo } from '../core/schema-analyzer';

/**
 * 스마트 컬럼 매핑 유틸리티
 * 다양한 스키마에 대해 자동으로 적절한 컬럼을 찾아 매핑
 */
export class ColumnMapper {
  // 일반적인 컬럼 이름 패턴
  private static readonly PATTERNS = {
    // 시간 관련
    timestamp: /^(created|updated|modified|date|time|timestamp|datetime|recorded).*$/i,
    date: /^(date|day|month|year|period|created_at|updated_at).*$/i,
    
    // 지리 정보
    latitude: /^(lat|latitude|geo_lat|location_lat|y_coord).*$/i,
    longitude: /^(lng|lon|longitude|geo_lng|location_lng|x_coord).*$/i,
    location: /^(location|address|city|region|country|place|area).*$/i,
    
    // 숫자/측정값
    amount: /^(amount|price|cost|value|revenue|sales|total|sum).*$/i,
    count: /^(count|quantity|number|num|qty|volume).*$/i,
    percentage: /^(percent|percentage|rate|ratio).*$/i,
    
    // 식별자
    id: /^(id|key|code|identifier|uuid)$/i,
    name: /^(name|title|label|description).*$/i,
    category: /^(category|type|class|group|tag|status).*$/i,
    
    // 프로젝트 관리
    startDate: /^(start|begin|from).*date$/i,
    endDate: /^(end|finish|to|due).*date$/i,
    duration: /^(duration|length|period|time).*$/i,
    progress: /^(progress|completion|done|status).*$/i,
  };

  /**
   * 시각화 타입에 따른 필수 컬럼 자동 매핑
   */
  static mapColumnsForVisualization(
    tables: TableInfo[],
    visualizationType: string
  ): Record<string, any> {
    switch (visualizationType) {
      case 'time-series':
        return this.mapTimeSeriesColumns(tables);
      case 'geo-spatial':
        return this.mapGeoSpatialColumns(tables);
      case 'gantt-chart':
        return this.mapGanttColumns(tables);
      case 'kpi-dashboard':
        return this.mapKPIColumns(tables);
      default:
        return this.mapGenericColumns(tables);
    }
  }

  /**
   * 시계열 분석용 컬럼 매핑
   */
  private static mapTimeSeriesColumns(tables: TableInfo[]) {
    const mapping: any = {};
    
    for (const table of tables) {
      const timeColumn = this.findColumnByPattern(table.columns, [
        this.PATTERNS.timestamp,
        this.PATTERNS.date
      ]);
      
      const valueColumns = this.findColumnsByPattern(table.columns, [
        this.PATTERNS.amount,
        this.PATTERNS.count,
        this.PATTERNS.percentage
      ]);
      
      if (timeColumn && valueColumns.length > 0) {
        mapping[table.name] = {
          timeColumn: timeColumn.name,
          valueColumns: valueColumns.map(c => c.name),
          groupByColumns: this.findColumnsByPattern(table.columns, [
            this.PATTERNS.category,
            this.PATTERNS.name
          ]).map(c => c.name)
        };
      }
    }
    
    return mapping;
  }

  /**
   * 지리공간 분석용 컬럼 매핑
   */
  private static mapGeoSpatialColumns(tables: TableInfo[]) {
    const mapping: any = {};
    
    for (const table of tables) {
      const latColumn = this.findColumnByPattern(table.columns, [this.PATTERNS.latitude]);
      const lngColumn = this.findColumnByPattern(table.columns, [this.PATTERNS.longitude]);
      
      // 위도/경도가 없으면 지역명으로 시도
      const locationColumn = this.findColumnByPattern(table.columns, [this.PATTERNS.location]);
      
      if ((latColumn && lngColumn) || locationColumn) {
        mapping[table.name] = {
          latColumn: latColumn?.name,
          lngColumn: lngColumn?.name,
          locationColumn: locationColumn?.name,
          nameColumn: this.findColumnByPattern(table.columns, [this.PATTERNS.name])?.name,
          valueColumns: this.findColumnsByPattern(table.columns, [
            this.PATTERNS.amount,
            this.PATTERNS.count
          ]).map(c => c.name)
        };
      }
    }
    
    return mapping;
  }

  /**
   * 간트차트용 컬럼 매핑
   */
  private static mapGanttColumns(tables: TableInfo[]) {
    const mapping: any = {};
    
    for (const table of tables) {
      const startColumn = this.findColumnByPattern(table.columns, [this.PATTERNS.startDate]);
      const endColumn = this.findColumnByPattern(table.columns, [this.PATTERNS.endDate]);
      const nameColumn = this.findColumnByPattern(table.columns, [this.PATTERNS.name]);
      
      if (startColumn && (endColumn || this.findColumnByPattern(table.columns, [this.PATTERNS.duration]))) {
        mapping[table.name] = {
          taskColumn: nameColumn?.name || 'id',
          startColumn: startColumn.name,
          endColumn: endColumn?.name,
          durationColumn: this.findColumnByPattern(table.columns, [this.PATTERNS.duration])?.name,
          progressColumn: this.findColumnByPattern(table.columns, [this.PATTERNS.progress])?.name,
          categoryColumn: this.findColumnByPattern(table.columns, [this.PATTERNS.category])?.name
        };
      }
    }
    
    return mapping;
  }

  /**
   * KPI 대시보드용 컬럼 매핑
   */
  private static mapKPIColumns(tables: TableInfo[]) {
    const mapping: any = {};
    
    for (const table of tables) {
      const metrics = this.findColumnsByPattern(table.columns, [
        this.PATTERNS.amount,
        this.PATTERNS.count,
        this.PATTERNS.percentage
      ]);
      
      if (metrics.length > 0) {
        mapping[table.name] = {
          metricColumns: metrics.map(c => ({
            name: c.name,
            type: this.inferMetricType(c.name),
            aggregation: this.suggestAggregation(c)
          })),
          dimensionColumns: this.findColumnsByPattern(table.columns, [
            this.PATTERNS.category,
            this.PATTERNS.date,
            this.PATTERNS.location
          ]).map(c => c.name)
        };
      }
    }
    
    return mapping;
  }

  /**
   * 일반적인 컬럼 매핑
   */
  private static mapGenericColumns(tables: TableInfo[]) {
    const mapping: any = {};
    
    for (const table of tables) {
      mapping[table.name] = {
        idColumn: this.findColumnByPattern(table.columns, [this.PATTERNS.id])?.name,
        nameColumn: this.findColumnByPattern(table.columns, [this.PATTERNS.name])?.name,
        numericColumns: table.columns
          .filter(c => c.dataDistribution?.dataType === 'numeric')
          .map(c => c.name),
        textColumns: table.columns
          .filter(c => c.dataDistribution?.dataType === 'text')
          .map(c => c.name),
        dateColumns: table.columns
          .filter(c => c.dataDistribution?.dataType === 'date')
          .map(c => c.name)
      };
    }
    
    return mapping;
  }

  /**
   * 패턴에 맞는 첫 번째 컬럼 찾기
   */
  private static findColumnByPattern(
    columns: ColumnInfo[],
    patterns: RegExp[]
  ): ColumnInfo | undefined {
    for (const pattern of patterns) {
      const column = columns.find(c => pattern.test(c.name));
      if (column) return column;
    }
    return undefined;
  }

  /**
   * 패턴에 맞는 모든 컬럼 찾기
   */
  private static findColumnsByPattern(
    columns: ColumnInfo[],
    patterns: RegExp[]
  ): ColumnInfo[] {
    return columns.filter(c => 
      patterns.some(pattern => pattern.test(c.name))
    );
  }

  /**
   * 메트릭 타입 추론
   */
  private static inferMetricType(columnName: string): string {
    if (/revenue|sales|price|cost|amount/i.test(columnName)) return 'currency';
    if (/percent|rate|ratio/i.test(columnName)) return 'percentage';
    if (/count|quantity|number/i.test(columnName)) return 'count';
    return 'number';
  }

  /**
   * 집계 함수 제안
   */
  private static suggestAggregation(column: ColumnInfo): string {
    if (/sum|total|amount|revenue/i.test(column.name)) return 'SUM';
    if (/avg|average|mean/i.test(column.name)) return 'AVG';
    if (/count|quantity/i.test(column.name)) return 'COUNT';
    if (/max|maximum|highest/i.test(column.name)) return 'MAX';
    if (/min|minimum|lowest/i.test(column.name)) return 'MIN';
    
    // 데이터 분포 기반 추론
    if (column.dataDistribution?.dataType === 'numeric') {
      return column.dataDistribution.uniqueValues < 10 ? 'COUNT' : 'SUM';
    }
    
    return 'COUNT';
  }

  /**
   * 지역명을 좌표로 변환하기 위한 매핑 테이블 생성 SQL
   */
  static generateLocationMappingSQL(locationColumn: string): string {
    return `
      -- 한국 주요 도시 좌표 매핑
      WITH location_coords AS (
        SELECT '서울' as location, 37.5665 as lat, 126.9780 as lng
        UNION SELECT '부산', 35.1796, 129.0756
        UNION SELECT '대구', 35.8714, 128.6014
        UNION SELECT '인천', 37.4563, 126.7052
        UNION SELECT '광주', 35.1595, 126.8526
        UNION SELECT '대전', 36.3504, 127.3845
        UNION SELECT '울산', 35.5384, 129.3114
        UNION SELECT '세종', 36.4801, 127.2890
        UNION SELECT '경기', 37.4138, 127.5183
        UNION SELECT '강원', 37.8228, 128.1555
        UNION SELECT '충북', 36.8, 127.7
        UNION SELECT '충남', 36.5184, 126.8
        UNION SELECT '전북', 35.7175, 127.1530
        UNION SELECT '전남', 34.8679, 126.9910
        UNION SELECT '경북', 36.4919, 128.8889
        UNION SELECT '경남', 35.4606, 128.2132
        UNION SELECT '제주', 33.4996, 126.5312
      )
      SELECT 
        t.*,
        lc.lat,
        lc.lng
      FROM your_table t
      LEFT JOIN location_coords lc ON t.${locationColumn} = lc.location
    `;
  }
}