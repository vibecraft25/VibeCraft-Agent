import { SchemaInfo, TableInfo } from '../core/schema-analyzer';

export class SchemaSummarizer {
  static generateSchemaSummary(schema: SchemaInfo): string {
    let summary = '## Database Schema Summary\n\n';
    
    // 메타데이터
    summary += `### Database Information\n`;
    summary += `- Tables: ${schema.metadata.tableCount}\n`;
    summary += `- Total Size: ${(schema.metadata.totalSize / 1024 / 1024).toFixed(2)} MB\n`;
    summary += `- Total Rows: ${schema.metadata.totalRowCount.toLocaleString()}\n`;
    summary += `- Last Modified: ${schema.metadata.lastModified?.toISOString()}\n\n`;
    
    // 테이블 정보
    summary += `### Tables\n\n`;
    for (const table of schema.tables) {
      summary += `#### ${table.name} (${table.rowCount.toLocaleString()} rows)\n`;
      summary += `Columns:\n`;
      for (const col of table.columns) {
        const pk = col.isPrimaryKey ? ' [PK]' : '';
        const fk = col.isForeignKey ? ' [FK]' : '';
        const unique = col.isUnique && !col.isPrimaryKey ? ' [UNIQUE]' : '';
        const nullable = col.nullable ? ' (nullable)' : ' (not null)';
        summary += `- ${col.name}: ${col.type}${pk}${fk}${unique}${nullable}`;
        
        // 데이터 분포 정보 추가
        if (col.dataDistribution) {
          const dist = col.dataDistribution;
          summary += ` - ${dist.uniqueValues} unique values`;
          if (dist.dataType === 'numeric' && dist.minValue !== null && dist.maxValue !== null) {
            summary += `, range: [${dist.minValue}, ${dist.maxValue}]`;
          }
        }
        summary += '\n';
      }
      
      // 인덱스 정보
      if (table.indexes.length > 0) {
        summary += '\nIndexes:\n';
        for (const idx of table.indexes) {
          const unique = idx.unique ? ' (UNIQUE)' : '';
          summary += `- ${idx.name}${unique}: ${idx.columns.join(', ')}\n`;
        }
      }
      
      summary += '\n';
    }
    
    // 관계 정보
    if (schema.relationships.length > 0) {
      summary += `### Relationships\n\n`;
      for (const rel of schema.relationships) {
        summary += `- ${rel.fromTable}.${rel.fromColumn} → ${rel.toTable}.${rel.toColumn} (${rel.type})\n`;
      }
      summary += '\n';
    }
    
    return summary;
  }
  
  static formatSchemaForPrompt(schema: SchemaInfo): string {
    // Prompt Builder에서 사용할 수 있도록 스키마 정보를 포맷팅
    const formatted = {
      tables: schema.tables.map(table => ({
        name: table.name,
        columns: table.columns.map(col => ({
          name: col.name,
          type: col.type,
          nullable: col.nullable,
          isPrimaryKey: col.isPrimaryKey,
          isForeignKey: col.isForeignKey,
          dataDistribution: col.dataDistribution
        })),
        rowCount: table.rowCount,
        sampleData: table.sampleData?.slice(0, 3) // 샘플 데이터는 최대 3개만
      })),
      relationships: schema.relationships
    };
    
    return JSON.stringify(formatted, null, 2);
  }
  
  static generateSQLiteInitScript(schema: SchemaInfo): string {
    // sql.js 초기화를 위한 스키마 정보 생성
    let script = '// SQLite database schema\n';
    script += 'const databaseSchema = {\n';
    script += '  tables: [\n';
    
    for (const table of schema.tables) {
      script += `    {\n`;
      script += `      name: '${table.name}',\n`;
      script += `      columns: [\n`;
      
      for (const col of table.columns) {
        script += `        { name: '${col.name}', type: '${col.type}', nullable: ${col.nullable} },\n`;
      }
      
      script += `      ],\n`;
      script += `      rowCount: ${table.rowCount}\n`;
      script += `    },\n`;
    }
    
    script += '  ]\n';
    script += '};\n\n';
    script += 'export default databaseSchema;\n';
    
    return script;
  }
  
  static generateQueryExamples(schema: SchemaInfo): string[] {
    const queries: string[] = [];
    
    // 각 테이블에 대한 기본 쿼리
    for (const table of schema.tables) {
      // SELECT 쿼리
      queries.push(`SELECT * FROM ${table.name} LIMIT 10;`);
      
      // 집계 쿼리
      const numericColumn = table.columns.find(
        col => col.dataDistribution?.dataType === 'numeric' && !col.isPrimaryKey
      );
      if (numericColumn) {
        queries.push(
          `SELECT COUNT(*), MIN(${numericColumn.name}), MAX(${numericColumn.name}), AVG(${numericColumn.name}) FROM ${table.name};`
        );
      }
      
      // 날짜 기반 쿼리
      const dateColumn = table.columns.find(
        col => col.dataDistribution?.dataType === 'date'
      );
      if (dateColumn) {
        queries.push(
          `SELECT strftime('%Y-%m', ${dateColumn.name}) as month, COUNT(*) FROM ${table.name} GROUP BY month;`
        );
      }
    }
    
    // 관계가 있는 경우 JOIN 쿼리
    for (const rel of schema.relationships.slice(0, 3)) { // 최대 3개의 JOIN 예제
      queries.push(
        `SELECT t1.*, t2.* FROM ${rel.fromTable} t1 JOIN ${rel.toTable} t2 ON t1.${rel.fromColumn} = t2.${rel.toColumn} LIMIT 10;`
      );
    }
    
    return queries;
  }
}