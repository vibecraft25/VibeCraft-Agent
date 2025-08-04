import { Database } from 'sqlite3';
import { open, Database as SqliteDatabase } from 'sqlite';
import sqlite3 from 'sqlite3';
import fs from 'fs-extra';

export interface ISchemaAnalyzer {
  analyze(dbPath: string): Promise<SchemaInfo>;
  getTableInfo(db: SqliteDatabase, tableName: string): Promise<TableInfo>;
  getRelationships(db: SqliteDatabase): Promise<Relationship[]>;
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
  inferredType?: string; // 더 구체적인 타입 (currency, email, url 등)
  sampleValues?: any[]; // 샘플 데이터
  format?: string; // 날짜 포맷 등
}

export class SchemaAnalyzer implements ISchemaAnalyzer {
  async analyze(dbPath: string): Promise<SchemaInfo> {
    const db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
      mode: sqlite3.OPEN_READONLY
    });
    
    try {
      // 데이터베이스 메타데이터 수집
      const metadata = await this.getDatabaseMetadata(db, dbPath);
      
      // 모든 테이블 목록 가져오기
      const tables = await db.all(
        `SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'`
      );
      
      // 각 테이블의 상세 정보 수집
      const tableInfos: TableInfo[] = [];
      for (const { name } of tables) {
        const tableInfo = await this.getTableInfo(db, name);
        tableInfos.push(tableInfo);
      }
      
      // 관계 정보 추출
      const relationships = await this.getRelationships(db);
      
      // 전체 행 수 계산
      metadata.totalRowCount = tableInfos.reduce((sum, table) => sum + table.rowCount, 0);
      
      return {
        tables: tableInfos,
        relationships,
        metadata
      };
      
    } finally {
      await db.close();
    }
  }
  
  async getTableInfo(db: SqliteDatabase, tableName: string): Promise<TableInfo> {
    // 컬럼 정보 가져오기
    const columns = await db.all(`PRAGMA table_info('${tableName}')`);
    
    // 외래 키 정보
    const foreignKeys = await db.all(`PRAGMA foreign_key_list('${tableName}')`);
    
    // 인덱스 정보
    const indexes = await db.all(`PRAGMA index_list('${tableName}')`);
    
    // 행 수 계산
    const rowCountResult = await db.get(`SELECT COUNT(*) as count FROM '${tableName}'`);
    const rowCount = rowCountResult?.count || 0;
    
    // 컬럼 정보 상세 분석
    const columnInfos: ColumnInfo[] = [];
    const foreignKeyColumns = new Set(foreignKeys.map(fk => fk.from));
    
    for (const col of columns) {
      const columnInfo: ColumnInfo = {
        name: col.name,
        type: col.type,
        nullable: col.notnull === 0 && col.pk !== 1, // Primary key는 항상 NOT NULL
        defaultValue: col.dflt_value,
        isPrimaryKey: col.pk === 1,
        isForeignKey: foreignKeyColumns.has(col.name),
        isUnique: false // 인덱스에서 확인
      };
      
      // 데이터 분포 분석 (샘플링)
      if (rowCount > 0 && rowCount < 1000000) { // 100만 행 이하일 때만 분석
        columnInfo.dataDistribution = await this.analyzeColumnDistribution(
          db, tableName, col.name, col.type
        );
      }
      
      columnInfos.push(columnInfo);
    }
    
    // Unique 인덱스 확인
    for (const idx of indexes) {
      if (idx.unique === 1) {
        const indexInfo = await db.all(`PRAGMA index_info('${idx.name}')`);
        for (const idxCol of indexInfo) {
          const colInfo = columnInfos.find(c => c.name === idxCol.name);
          if (colInfo) {
            colInfo.isUnique = true;
          }
        }
      }
    }
    
    // 샘플 데이터 가져오기 (최대 5행)
    let sampleData: any[] = [];
    if (rowCount > 0) {
      sampleData = await db.all(`SELECT * FROM '${tableName}' LIMIT 5`);
    }
    
    // Primary Key 찾기
    const primaryKey = columnInfos.find(col => col.isPrimaryKey)?.name;
    
    // 인덱스 정보 파싱
    const parsedIndexes: Index[] = [];
    for (const idx of indexes) {
      const indexColumns = await db.all(`PRAGMA index_info('${idx.name}')`);
      parsedIndexes.push({
        name: idx.name,
        columns: indexColumns.map(ic => ic.name),
        unique: idx.unique === 1
      });
    }
    
    return {
      name: tableName,
      columns: columnInfos,
      primaryKey,
      foreignKeys: this.parseForeignKeys(foreignKeys),
      indexes: parsedIndexes,
      rowCount,
      sampleData
    };
  }
  
  private async analyzeColumnDistribution(
    db: SqliteDatabase, 
    tableName: string, 
    columnName: string, 
    columnType: string
  ): Promise<DataDistribution> {
    // 기본 통계 쿼리
    const stats = await db.get(`
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
      uniqueValues: stats?.unique_values || 0,
      nullCount: stats?.null_count || 0,
      minValue: stats?.min_value,
      maxValue: stats?.max_value,
      avgLength: stats?.avg_length || 0,
      dataType
    };
  }
  
  private inferDataType(sqliteType: string, stats: any): DataDistribution['dataType'] {
    const upperType = sqliteType.toUpperCase();
    
    if (upperType.includes('INT') || upperType.includes('REAL') || upperType.includes('NUMERIC')) {
      return 'numeric';
    } else if (upperType.includes('DATE') || upperType.includes('TIME')) {
      // DATE 또는 DATETIME 타입인 경우
      return 'date';
    } else if (upperType.includes('TEXT') || upperType.includes('CHAR') || upperType === '') {
      // SQLite는 동적 타입이므로 TEXT 또는 타입이 명시되지 않은 경우 내용을 확인
      // 날짜 패턴 검사
      if (stats?.min_value && this.isDateFormat(stats.min_value)) {
        return 'date';
      }
      return 'text';
    } else if (upperType.includes('BLOB')) {
      return 'mixed';
    }
    
    return 'text';
  }
  
  private isDateFormat(value: string): boolean {
    if (!value || typeof value !== 'string') return false;
    
    const datePatterns = [
      /^\d{4}-\d{2}-\d{2}$/,  // YYYY-MM-DD
      /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/,  // YYYY-MM-DD HH:MM:SS
      /^\d{2}\/\d{2}\/\d{4}$/  // MM/DD/YYYY
    ];
    
    return datePatterns.some(pattern => pattern.test(value.toString()));
  }
  
  async getRelationships(db: SqliteDatabase): Promise<Relationship[]> {
    const relationships: Relationship[] = [];
    
    // 모든 테이블의 외래 키 정보 수집
    const tables = await db.all(
      `SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'`
    );
    
    for (const { name: tableName } of tables) {
      const foreignKeys = await db.all(`PRAGMA foreign_key_list('${tableName}')`);
      
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
  
  private async getDatabaseMetadata(db: SqliteDatabase, dbPath: string): Promise<DatabaseMetadata> {
    // 파일 정보
    const stats = await fs.stat(dbPath);
    
    // 데이터베이스 정보
    const pragmaInfo = await db.get('PRAGMA page_size');
    const tableCount = await db.get(
      `SELECT COUNT(*) as count FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'`
    );
    
    return {
      version: '3', // SQLite 3
      encoding: 'UTF-8',
      pageSize: pragmaInfo?.page_size || 4096,
      totalSize: stats.size,
      tableCount: tableCount?.count || 0,
      totalRowCount: 0, // 각 테이블의 rowCount 합계로 계산
      createdAt: stats.birthtime,
      lastModified: stats.mtime
    };
  }
}