/**
 * 향상된 데이터 타입 추론 유틸리티
 */
export class DataTypeInference {
  /**
   * 샘플 데이터를 기반으로 컬럼의 실제 데이터 타입 추론
   */
  static inferColumnType(values: any[]): {
    type: 'date' | 'time' | 'datetime' | 'number' | 'currency' | 'percentage' | 
          'email' | 'url' | 'phone' | 'boolean' | 'category' | 'text' | 'json' | 'unknown';
    format?: string;
    confidence: number;
  } {
    if (!values || values.length === 0) {
      return { type: 'unknown', confidence: 0 };
    }

    // null이 아닌 값들만 필터링
    const nonNullValues = values.filter(v => v !== null && v !== undefined);
    if (nonNullValues.length === 0) {
      return { type: 'unknown', confidence: 0 };
    }

    // 각 타입별 매칭 점수 계산
    const typeScores = {
      datetime: this.scoreDatetime(nonNullValues),
      date: this.scoreDate(nonNullValues),
      time: this.scoreTime(nonNullValues),
      currency: this.scoreCurrency(nonNullValues),
      percentage: this.scorePercentage(nonNullValues),
      number: this.scoreNumber(nonNullValues),
      email: this.scoreEmail(nonNullValues),
      url: this.scoreUrl(nonNullValues),
      phone: this.scorePhone(nonNullValues),
      boolean: this.scoreBoolean(nonNullValues),
      json: this.scoreJson(nonNullValues),
      category: this.scoreCategory(nonNullValues),
      text: 0.5 // 기본값
    };

    // 가장 높은 점수의 타입 선택
    let bestType: any = 'text';
    let bestScore = 0;
    let format: string | undefined;

    for (const [type, score] of Object.entries(typeScores)) {
      if (score > bestScore) {
        bestScore = score;
        bestType = type;
      }
    }

    // 특정 타입의 포맷 결정
    if (bestType === 'date' || bestType === 'datetime') {
      format = this.detectDateFormat(nonNullValues);
    } else if (bestType === 'time') {
      format = this.detectTimeFormat(nonNullValues);
    }

    return {
      type: bestType,
      format,
      confidence: bestScore
    };
  }

  private static scoreDatetime(values: any[]): number {
    const patterns = [
      /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}/,  // ISO format
      /^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}/,         // MM/DD/YYYY HH:mm
      /^\d{4}년 \d{1,2}월 \d{1,2}일 \d{1,2}:\d{2}/, // Korean format
    ];
    
    return this.scoreByPatterns(values, patterns);
  }

  private static scoreDate(values: any[]): number {
    const patterns = [
      /^\d{4}-\d{2}-\d{2}$/,           // YYYY-MM-DD
      /^\d{2}\/\d{2}\/\d{4}$/,         // MM/DD/YYYY
      /^\d{4}년 \d{1,2}월 \d{1,2}일$/, // Korean format
      /^\d{8}$/,                        // YYYYMMDD
    ];
    
    return this.scoreByPatterns(values, patterns);
  }

  private static scoreTime(values: any[]): number {
    const patterns = [
      /^\d{2}:\d{2}(:\d{2})?$/,        // HH:mm or HH:mm:ss
      /^\d{1,2}시 \d{1,2}분$/,          // Korean format
    ];
    
    return this.scoreByPatterns(values, patterns);
  }

  private static scoreCurrency(values: any[]): number {
    let matches = 0;
    const patterns = [
      /^[\$₩￥€£]\s*[\d,]+(\.\d{2})?$/,  // Currency symbols
      /^[\d,]+(\.\d{2})?\s*원$/,         // Korean Won
      /^-?[\d,]+\.\d{2}$/,               // Decimal with 2 places
    ];
    
    for (const value of values) {
      const strValue = String(value);
      if (patterns.some(p => p.test(strValue))) {
        matches++;
      } else if (typeof value === 'number' && value > 100) {
        // 큰 숫자는 통화일 가능성이 높음
        matches += 0.3;
      }
    }
    
    return matches / values.length;
  }

  private static scorePercentage(values: any[]): number {
    let matches = 0;
    
    for (const value of values) {
      const strValue = String(value);
      if (/%$/.test(strValue)) {
        matches++;
      } else if (typeof value === 'number' && value >= 0 && value <= 100) {
        // 0-100 범위의 숫자
        matches += 0.5;
      }
    }
    
    return matches / values.length;
  }

  private static scoreNumber(values: any[]): number {
    let matches = 0;
    
    for (const value of values) {
      if (typeof value === 'number') {
        matches++;
      } else if (/^-?\d+(\.\d+)?$/.test(String(value))) {
        matches++;
      }
    }
    
    return matches / values.length;
  }

  private static scoreEmail(values: any[]): number {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return this.scoreByPatterns(values, [emailPattern]);
  }

  private static scoreUrl(values: any[]): number {
    const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
    return this.scoreByPatterns(values, [urlPattern]);
  }

  private static scorePhone(values: any[]): number {
    const patterns = [
      /^(\+\d{1,3}[- ]?)?\d{10}$/,           // International
      /^\d{3}-\d{3,4}-\d{4}$/,                // Korean format
      /^0\d{1,2}-\d{3,4}-\d{4}$/,             // Korean local
    ];
    
    return this.scoreByPatterns(values, patterns);
  }

  private static scoreBoolean(values: any[]): number {
    const booleanValues = new Set(['true', 'false', '1', '0', 'yes', 'no', 'y', 'n', 't', 'f']);
    let matches = 0;
    
    for (const value of values) {
      if (typeof value === 'boolean') {
        matches++;
      } else if (booleanValues.has(String(value).toLowerCase())) {
        matches++;
      }
    }
    
    return matches / values.length;
  }

  private static scoreJson(values: any[]): number {
    let matches = 0;
    
    for (const value of values) {
      try {
        if (typeof value === 'string' && (value.startsWith('{') || value.startsWith('['))) {
          JSON.parse(value);
          matches++;
        }
      } catch {
        // Not JSON
      }
    }
    
    return matches / values.length;
  }

  private static scoreCategory(values: any[]): number {
    // 고유값이 전체의 50% 미만이면 카테고리일 가능성이 높음
    const uniqueValues = new Set(values.map(v => String(v)));
    const uniqueRatio = uniqueValues.size / values.length;
    
    if (uniqueRatio < 0.5 && uniqueValues.size < 100) {
      return 0.8;
    } else if (uniqueRatio < 0.3) {
      return 0.9;
    }
    
    return 0.2;
  }

  private static scoreByPatterns(values: any[], patterns: RegExp[]): number {
    let matches = 0;
    
    for (const value of values) {
      const strValue = String(value);
      if (patterns.some(pattern => pattern.test(strValue))) {
        matches++;
      }
    }
    
    return matches / values.length;
  }

  private static detectDateFormat(values: any[]): string {
    const formats = {
      'YYYY-MM-DD': /^\d{4}-\d{2}-\d{2}$/,
      'MM/DD/YYYY': /^\d{2}\/\d{2}\/\d{4}$/,
      'DD/MM/YYYY': /^\d{2}\/\d{2}\/\d{4}$/,
      'YYYYMMDD': /^\d{8}$/,
      'YYYY년 MM월 DD일': /^\d{4}년 \d{1,2}월 \d{1,2}일$/,
    };
    
    for (const [format, pattern] of Object.entries(formats)) {
      if (values.some(v => pattern.test(String(v)))) {
        return format;
      }
    }
    
    return 'YYYY-MM-DD'; // 기본값
  }

  private static detectTimeFormat(values: any[]): string {
    if (values.some(v => /:\d{2}:\d{2}/.test(String(v)))) {
      return 'HH:mm:ss';
    }
    return 'HH:mm';
  }

  /**
   * 컬럼 이름과 데이터를 기반으로 시각화 추천
   */
  static recommendVisualization(columnName: string, dataType: string, distribution: any): string[] {
    const recommendations: string[] = [];
    
    // 시계열 데이터
    if (dataType === 'date' || dataType === 'datetime' || /date|time|year|month/i.test(columnName)) {
      recommendations.push('time-series', 'gantt-chart', 'heatmap');
    }
    
    // 지리 데이터
    if (/lat|lng|longitude|latitude|location|address|city|country/i.test(columnName)) {
      recommendations.push('geo-spatial');
    }
    
    // 카테고리 데이터
    if (dataType === 'category' || distribution?.uniqueValues < 20) {
      recommendations.push('comparison', 'funnel-analysis');
    }
    
    // 수치 데이터
    if (dataType === 'number' || dataType === 'currency' || dataType === 'percentage') {
      recommendations.push('kpi-dashboard', 'comparison');
      
      // 비율 데이터
      if (dataType === 'percentage' || /rate|ratio|percent/i.test(columnName)) {
        recommendations.push('funnel-analysis');
      }
    }
    
    // 관계형 데이터
    if (/from|to|source|target|parent|child/i.test(columnName)) {
      recommendations.push('network-graph');
    }
    
    return [...new Set(recommendations)]; // 중복 제거
  }
}