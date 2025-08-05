import { VisualizationType } from '../types';
import { SchemaInfo } from '../core/schema-analyzer';
import { Template, TemplateMetadata } from '../core/template-engine';

export interface TemplateCompatibility {
  compatible: boolean;
  score: number;
  reasons: string[];
}

export class TemplateSelector {
  /**
   * 스키마 정보를 기반으로 가장 적합한 시각화 타입을 추천
   */
  static suggestVisualizationType(schemaInfo: SchemaInfo): VisualizationType[] {
    const suggestions: { type: VisualizationType; score: number }[] = [];
    
    // 날짜/시간 컬럼이 있는지 확인
    const hasDateColumn = schemaInfo.tables.some(table => 
      table.columns.some(col => col.dataDistribution?.dataType === 'date')
    );
    
    // 숫자형 컬럼이 있는지 확인
    const hasNumericColumn = schemaInfo.tables.some(table =>
      table.columns.some(col => 
        col.dataDistribution?.dataType === 'numeric' && !col.isPrimaryKey
      )
    );
    
    // 관계가 있는지 확인
    const hasRelationships = schemaInfo.relationships.length > 0;
    
    // 테이블 수
    const tableCount = schemaInfo.tables.length;
    
    // Time Series: 날짜 컬럼과 숫자형 컬럼이 있으면 높은 점수
    if (hasDateColumn && hasNumericColumn) {
      suggestions.push({ type: 'time-series', score: 90 });
    }
    
    // KPI Dashboard: 숫자형 컬럼이 많으면 높은 점수
    if (hasNumericColumn) {
      const numericColumnCount = schemaInfo.tables.reduce((sum, table) => 
        sum + table.columns.filter(col => 
          col.dataDistribution?.dataType === 'numeric' && !col.isPrimaryKey
        ).length, 0
      );
      
      if (numericColumnCount >= 3) {
        suggestions.push({ type: 'kpi-dashboard', score: 85 });
      }
    }
    
    // Comparison: 여러 테이블 또는 카테고리형 데이터가 있으면
    if (tableCount > 1 || hasRelationships) {
      suggestions.push({ type: 'comparison', score: 70 });
    }
    
    // Heatmap: 2차원 매트릭스 데이터 구조 확인
    const hasMatrixStructure = schemaInfo.tables.some(table => {
      const textColumns = table.columns.filter(col => 
        col.dataDistribution?.dataType === 'text' && !col.isPrimaryKey
      ).length;
      const numericColumns = table.columns.filter(col =>
        col.dataDistribution?.dataType === 'numeric' && !col.isPrimaryKey
      ).length;
      
      return textColumns >= 2 && numericColumns >= 1;
    });
    
    // Heatmap과 Network Graph는 지원하지 않음
    
    // 점수 순으로 정렬하여 반환
    return suggestions
      .sort((a, b) => b.score - a.score)
      .map(s => s.type);
  }
  
  /**
   * 템플릿과 스키마의 호환성 검사
   */
  static checkTemplateCompatibility(
    template: Template, 
    schemaInfo: SchemaInfo
  ): TemplateCompatibility {
    const reasons: string[] = [];
    let score = 100;
    
    const metadata = template.metadata;
    
    // 필수 테이블 수 확인
    if (metadata.requiredTables && schemaInfo.tables.length < metadata.requiredTables) {
      score -= 50;
      reasons.push(
        `Template requires at least ${metadata.requiredTables} tables, ` +
        `but schema has only ${schemaInfo.tables.length}`
      );
    }
    
    // 필수 컬럼 타입 확인
    if (metadata.requiredColumns && metadata.requiredColumns.length > 0) {
      for (const requiredType of metadata.requiredColumns) {
        const hasRequiredColumn = schemaInfo.tables.some(table =>
          table.columns.some(col => {
            if (requiredType === 'date') {
              return col.dataDistribution?.dataType === 'date';
            } else if (requiredType === 'numeric') {
              return col.dataDistribution?.dataType === 'numeric' && !col.isPrimaryKey;
            } else if (requiredType === 'text') {
              return col.dataDistribution?.dataType === 'text' && !col.isPrimaryKey;
            }
            return false;
          })
        );
        
        if (!hasRequiredColumn) {
          score -= 30;
          reasons.push(`No ${requiredType} column found in schema`);
        }
      }
    }
    
    // 특정 시각화 타입별 추가 검증
    switch (template.type) {
      case 'time-series':
        const hasDateColumn = schemaInfo.tables.some(table =>
          table.columns.some(col => col.dataDistribution?.dataType === 'date')
        );
        if (!hasDateColumn) {
          score -= 40;
          reasons.push('Time series visualization requires at least one date column');
        }
        break;
        
      case 'geo-spatial':
        const hasGeoColumns = schemaInfo.tables.some(table =>
          table.columns.some(col => 
            col.name.toLowerCase().includes('lat') || 
            col.name.toLowerCase().includes('lon') ||
            col.name.toLowerCase().includes('location') ||
            col.name.toLowerCase().includes('address')
          )
        );
        if (!hasGeoColumns) {
          score -= 40;
          reasons.push('Geo-spatial visualization requires location-related columns');
        }
        break;
        
    }
    
    return {
      compatible: score >= 60,
      score,
      reasons
    };
  }
  
  /**
   * 스키마에서 주요 메트릭 추출
   */
  static extractKeyMetrics(schemaInfo: SchemaInfo): Record<string, any> {
    const metrics: Record<string, any> = {
      totalTables: schemaInfo.metadata.tableCount,
      totalRows: schemaInfo.metadata.totalRowCount,
      relationships: schemaInfo.relationships.length,
      primaryMetrics: [],
      dateColumns: [],
      categoricalColumns: []
    };
    
    // 주요 숫자형 메트릭 찾기
    for (const table of schemaInfo.tables) {
      for (const col of table.columns) {
        if (col.dataDistribution?.dataType === 'numeric' && !col.isPrimaryKey) {
          metrics.primaryMetrics.push({
            table: table.name,
            column: col.name,
            uniqueValues: col.dataDistribution.uniqueValues,
            min: col.dataDistribution.minValue,
            max: col.dataDistribution.maxValue
          });
        } else if (col.dataDistribution?.dataType === 'date') {
          metrics.dateColumns.push({
            table: table.name,
            column: col.name
          });
        } else if (
          col.dataDistribution?.dataType === 'text' && 
          !col.isPrimaryKey &&
          col.dataDistribution.uniqueValues < 50 // 카테고리형으로 간주
        ) {
          metrics.categoricalColumns.push({
            table: table.name,
            column: col.name,
            uniqueValues: col.dataDistribution.uniqueValues
          });
        }
      }
    }
    
    return metrics;
  }
}