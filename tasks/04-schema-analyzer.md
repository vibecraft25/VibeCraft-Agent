# Task 4: Schema Analyzer 모듈 구현

## 목표
SQLite 데이터베이스의 스키마를 분석하고 추출하는 Schema Analyzer 모듈을 구현합니다.

## 작업 내용

### 4.1 Schema Analyzer 인터페이스 및 타입 정의
```typescript
// src/core/schema-analyzer.ts
import { Database } from 'sqlite3';
import { promisify } from 'util';

export interface ISchemaAnalyzer {
  analyze(dbPath: string): Promise<SchemaInfo>;
  getTableInfo(db: Database, tableName: string): TableInfo;
  getRelationships(db: Database): Relationship[];
}

export interface SchemaInfo {
  tables: TableInfo[];
  relationships: Relationship[];
  metadata: DatabaseMetadata;
}

export interface TableInfo {
  name: string;
  columns: ColumnInfo[];
  primaryKey?: string;
  foreignKeys: ForeignKey[];
  indexes: Index[];
  rowCount: number;
  sampleData?: any[];
}

export interface ColumnInfo {
  name: string;
  type: string;
  nullable: boolean;
  defaultValue?: any;
  isPrimaryKey: boolean;
  isForeignKey: boolean;
  isUnique: boolean;
  dataDistribution?: DataDistribution;
}

export interface ForeignKey {
  column: string;
  referencedTable: string;
  referencedColumn: string;
}

export interface Index {
  name: string;
  columns: string[];
  unique: boolean;
}

export interface Relationship {
  fromTable: string;
  fromColumn: string;
  toTable: string;
  toColumn: string;
  type: 'one-to-one' | 'one-to-many' | 'many-to-many';
}

export interface DatabaseMetadata {
  version: string;
  encoding: string;
  pageSize: number;
  totalSize: number;
  tableCount: number;
  totalRowCount: number;
  createdAt?: Date;
  lastModified?: Date;
}

export interface DataDistribution {
  uniqueValues: number;
  nullCount: number;
  minValue?: any;
  maxValue?: any;
  avgLength?: number;
  dataType: 'numeric' | 'text' | 'date' | 'boolean' | 'mixed';
}
```

### 4.2 Schema Analyzer 구현
```typescript
// src/core/schema-analyzer.ts (계속)
export class SchemaAnalyzer implements ISchemaAnalyzer {
  async analyze(dbPath: string): Promise<SchemaInfo> {
    const db = new Database(dbPath, { readonly: true });
    const dbAll = promisify(db.all.bind(db));
    const dbGet = promisify(db.get.bind(db));
    
    try {
      // 데이터베이스 메타데이터 수집
      const metadata = await this.getDatabaseMetadata(db, dbPath);
      
      // 모든 테이블 목록 가져오기
      const tables = await dbAll(
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
      );
      
      // 각 테이블의 상세 정보 수집
      const tableInfos: TableInfo[] = [];
      for (const { name } of tables) {
        const tableInfo = await this.getTableInfo(db, name);
        tableInfos.push(tableInfo);
      }
      
      // 관계 정보 추출
      const relationships = await this.getRelationships(db);
      
      return {
        tables: tableInfos,
        relationships,
        metadata
      };
      
    } finally {
      db.close();
    }
  }
  
  private async getTableInfo(db: Database, tableName: string): Promise<TableInfo> {
    const dbAll = promisify(db.all.bind(db));
    const dbGet = promisify(db.get.bind(db));
    
    // 컬럼 정보 가져오기
    const columns = await dbAll(`PRAGMA table_info('${tableName}')`);
    
    // 외래 키 정보
    const foreignKeys = await dbAll(`PRAGMA foreign_key_list('${tableName}')`);
    
    // 인덱스 정보
    const indexes = await dbAll(`PRAGMA index_list('${tableName}')`);
    
    // 행 수 계산
    const rowCountResult = await dbGet(`SELECT COUNT(*) as count FROM '${tableName}'`);
    const rowCount = rowCountResult.count;
    
    // 컬럼 정보 상세 분석
    const columnInfos: ColumnInfo[] = [];
    for (const col of columns) {
      const columnInfo: ColumnInfo = {
        name: col.name,
        type: col.type,
        nullable: !col.notnull,
        defaultValue: col.dflt_value,
        isPrimaryKey: col.pk === 1,
        isForeignKey: foreignKeys.some(fk => fk.from === col.name),
        isUnique: false // 인덱스에서 확인
      };
      
      // 데이터 분포 분석 (샘플링)
      if (rowCount > 0) {
        columnInfo.dataDistribution = await this.analyzeColumnDistribution(
          db, tableName, col.name, col.type
        );
      }
      
      columnInfos.push(columnInfo);
    }
    
    // 샘플 데이터 가져오기 (최대 5행)
    let sampleData: any[] = [];
    if (rowCount > 0) {
      sampleData = await dbAll(`SELECT * FROM '${tableName}' LIMIT 5`);
    }
    
    // Primary Key 찾기
    const primaryKey = columnInfos.find(col => col.isPrimaryKey)?.name;
    
    return {
      name: tableName,
      columns: columnInfos,
      primaryKey,
      foreignKeys: this.parseForeignKeys(foreignKeys),
      indexes: this.parseIndexes(indexes),
      rowCount,
      sampleData
    };
  }
  
  private async analyzeColumnDistribution(
    db: Database, 
    tableName: string, 
    columnName: string, 
    columnType: string
  ): Promise<DataDistribution> {
    const dbGet = promisify(db.get.bind(db));
    
    // 기본 통계 쿼리
    const stats = await dbGet(`
      SELECT 
        COUNT(DISTINCT "${columnName}") as unique_values,
        COUNT(*) - COUNT("${columnName}") as null_count,
        MIN("${columnName}") as min_value,
        MAX("${columnName}") as max_value,
        AVG(LENGTH(CAST("${columnName}" AS TEXT))) as avg_length
      FROM "${tableName}"
    `);
    
    // 데이터 타입 추론
    const dataType = this.inferDataType(columnType, stats);
    
    return {
      uniqueValues: stats.unique_values,
      nullCount: stats.null_count,
      minValue: stats.min_value,
      maxValue: stats.max_value,
      avgLength: stats.avg_length,
      dataType
    };
  }
  
  private inferDataType(sqliteType: string, stats: any): DataDistribution['dataType'] {
    const upperType = sqliteType.toUpperCase();
    
    if (upperType.includes('INT') || upperType.includes('REAL') || upperType.includes('NUMERIC')) {
      return 'numeric';
    } else if (upperType.includes('TEXT') || upperType.includes('CHAR')) {
      // 날짜 패턴 검사
      if (stats.min_value && this.isDateFormat(stats.min_value)) {
        return 'date';
      }
      return 'text';
    } else if (upperType.includes('BLOB')) {
      return 'mixed';
    }
    
    return 'text';
  }
  
  private isDateFormat(value: string): boolean {
    const datePatterns = [
      /^\d{4}-\d{2}-\d{2}$/,  // YYYY-MM-DD
      /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/,  // YYYY-MM-DD HH:MM:SS
      /^\d{2}\/\d{2}\/\d{4}$/  // MM/DD/YYYY
    ];
    
    return datePatterns.some(pattern => pattern.test(value));
  }
  
  private async getRelationships(db: Database): Promise<Relationship[]> {
    const dbAll = promisify(db.all.bind(db));
    const relationships: Relationship[] = [];
    
    // 모든 테이블의 외래 키 정보 수집
    const tables = await dbAll(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
    );
    
    for (const { name: tableName } of tables) {
      const foreignKeys = await dbAll(`PRAGMA foreign_key_list('${tableName}')`);
      
      for (const fk of foreignKeys) {
        relationships.push({
          fromTable: tableName,
          fromColumn: fk.from,
          toTable: fk.table,
          toColumn: fk.to,
          type: 'one-to-many' // 기본값, 실제로는 더 정교한 분석 필요
        });
      }
    }
    
    return relationships;
  }
  
  private parseForeignKeys(rawForeignKeys: any[]): ForeignKey[] {
    return rawForeignKeys.map(fk => ({
      column: fk.from,
      referencedTable: fk.table,
      referencedColumn: fk.to
    }));
  }
  
  private parseIndexes(rawIndexes: any[]): Index[] {
    return rawIndexes.map(idx => ({
      name: idx.name,
      columns: [], // PRAGMA index_info로 추가 조회 필요
      unique: idx.unique === 1
    }));
  }
  
  private async getDatabaseMetadata(db: Database, dbPath: string): Promise<DatabaseMetadata> {
    const dbGet = promisify(db.get.bind(db));
    const fs = require('fs').promises;
    
    // 파일 정보
    const stats = await fs.stat(dbPath);
    
    // 데이터베이스 정보
    const pragmaInfo = await dbGet('PRAGMA page_size');
    const tableCount = await dbGet(
      "SELECT COUNT(*) as count FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
    );
    
    return {
      version: '3', // SQLite 3
      encoding: 'UTF-8',
      pageSize: pragmaInfo.page_size,
      totalSize: stats.size,
      tableCount: tableCount.count,
      totalRowCount: 0, // 각 테이블의 rowCount 합계로 계산
      createdAt: stats.birthtime,
      lastModified: stats.mtime
    };
  }
}
```

### 4.3 스키마 요약 유틸리티
```typescript
// src/utils/schema-summarizer.ts
import { SchemaInfo, TableInfo } from '../core/schema-analyzer';

export class SchemaSummarizer {
  static generateSchemaSummary(schema: SchemaInfo): string {
    let summary = '## Database Schema Summary\n\n';
    
    // 메타데이터
    summary += `### Database Information\n`;
    summary += `- Tables: ${schema.metadata.tableCount}\n`;
    summary += `- Total Size: ${(schema.metadata.totalSize / 1024 / 1024).toFixed(2)} MB\n`;
    summary += `- Last Modified: ${schema.metadata.lastModified}\n\n`;
    
    // 테이블 정보
    summary += `### Tables\n\n`;
    for (const table of schema.tables) {
      summary += `#### ${table.name} (${table.rowCount} rows)\n`;
      summary += `Columns:\n`;
      for (const col of table.columns) {
        const pk = col.isPrimaryKey ? ' [PK]' : '';
        const fk = col.isForeignKey ? ' [FK]' : '';
        const nullable = col.nullable ? ' (nullable)' : ' (not null)';
        summary += `- ${col.name}: ${col.type}${pk}${fk}${nullable}\n`;
      }
      summary += '\n';
    }
    
    // 관계 정보
    if (schema.relationships.length > 0) {
      summary += `### Relationships\n\n`;
      for (const rel of schema.relationships) {
        summary += `- ${rel.fromTable}.${rel.fromColumn} → ${rel.toTable}.${rel.toColumn}\n`;
      }
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
          nullable: col.nullable
        })),
        rowCount: table.rowCount
      }))
    };
    
    return JSON.stringify(formatted, null, 2);
  }
}
```

### 4.4 스키마 분석 테스트
```typescript
// tests/schema-analyzer.test.ts
import { SchemaAnalyzer } from '../src/core/schema-analyzer';
import { Database } from 'sqlite3';

describe('SchemaAnalyzer', () => {
  let analyzer: SchemaAnalyzer;
  let testDb: Database;
  
  beforeAll(async () => {
    analyzer = new SchemaAnalyzer();
    // 테스트용 SQLite 데이터베이스 생성
    testDb = new Database(':memory:');
    
    // 테스트 스키마 생성
    await new Promise((resolve, reject) => {
      testDb.serialize(() => {
        testDb.run(`
          CREATE TABLE users (
            id INTEGER PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT UNIQUE,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);
        
        testDb.run(`
          CREATE TABLE orders (
            id INTEGER PRIMARY KEY,
            user_id INTEGER,
            total REAL,
            order_date DATE,
            FOREIGN KEY (user_id) REFERENCES users (id)
          )
        `);
        
        resolve(null);
      });
    });
  });
  
  test('should analyze database schema correctly', async () => {
    const schema = await analyzer.analyze(':memory:');
    
    expect(schema.tables).toHaveLength(2);
    expect(schema.tables[0].name).toBe('users');
    expect(schema.tables[0].columns).toHaveLength(4);
    expect(schema.relationships).toHaveLength(1);
  });
  
  afterAll(() => {
    testDb.close();
  });
});
```

## 완료 기준
- [ ] Schema Analyzer 인터페이스 정의
- [ ] 테이블 및 컬럼 정보 추출
- [ ] 관계 정보 분석
- [ ] 데이터 분포 통계 수집
- [ ] 스키마 요약 유틸리티
- [ ] 단위 테스트 작성