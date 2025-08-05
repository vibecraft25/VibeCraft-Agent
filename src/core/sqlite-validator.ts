import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';

export interface SchemaValidationResult {
  valid: boolean;
  error?: string;
  tables?: string[];
  totalRows?: number;
}

export interface TableInfo {
  name: string;
  columns: ColumnInfo[];
  rowCount: number;
}

export interface ColumnInfo {
  cid: number;
  name: string;
  type: string;
  notnull: number;
  dflt_value: any;
  pk: number;
}

export class AdvancedValidator {
  async validateSQLiteSchema(sqlitePath: string): Promise<SchemaValidationResult> {
    let db: Database<sqlite3.Database, sqlite3.Statement> | null = null;
    
    try {
      // sqlite3와 sqlite 래퍼를 사용하여 데이터베이스 열기
      db = await open({
        filename: sqlitePath,
        driver: sqlite3.Database,
        mode: sqlite3.OPEN_READONLY
      });
      
      // 테이블 존재 여부 확인
      const tables = await this.getTables(db);
      if (tables.length === 0) {
        return {
          valid: false,
          error: 'Database contains no tables'
        };
      }
      
      // 각 테이블에 대한 기본 검증
      for (const table of tables) {
        const columns = await this.getColumns(db, table);
        if (columns.length === 0) {
          return {
            valid: false,
            error: `Table ${table} has no columns`
          };
        }
      }
      
      // 총 행 수 계산 (선택적)
      const totalRows = await this.getTotalRows(db, tables);
      
      return {
        valid: true,
        tables,
        totalRows
      };
      
    } catch (error: any) {
      return {
        valid: false,
        error: `Failed to validate SQLite schema: ${error.message}`
      };
    } finally {
      if (db) {
        await db.close();
      }
    }
  }
  
  async getTableInfo(sqlitePath: string): Promise<TableInfo[]> {
    let db: Database<sqlite3.Database, sqlite3.Statement> | null = null;
    
    try {
      db = await open({
        filename: sqlitePath,
        driver: sqlite3.Database,
        mode: sqlite3.OPEN_READONLY
      });
      
      const tables = await this.getTables(db);
      const tableInfos: TableInfo[] = [];
      
      for (const table of tables) {
        const columns = await this.getColumns(db, table);
        const rowCount = await this.getRowCount(db, table);
        
        tableInfos.push({
          name: table,
          columns,
          rowCount
        });
      }
      
      return tableInfos;
      
    } catch (error: any) {
      throw new Error(`Failed to get table info: ${error.message}`);
    } finally {
      if (db) {
        await db.close();
      }
    }
  }
  
  private async getTables(db: Database): Promise<string[]> {
    const result = await db.all(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
    );
    return result.map((row: any) => row.name);
  }
  
  private async getColumns(db: Database, tableName: string): Promise<ColumnInfo[]> {
    const result = await db.all(
      `PRAGMA table_info(${tableName})`
    );
    return result as ColumnInfo[];
  }
  
  private async getRowCount(db: Database, tableName: string): Promise<number> {
    try {
      const result = await db.get<{ count: number }>(
        `SELECT COUNT(*) as count FROM ${tableName}`
      );
      return result?.count || 0;
    } catch {
      // 행 수 계산 실패 시 0 반환
      return 0;
    }
  }
  
  private async getTotalRows(db: Database, tables: string[]): Promise<number> {
    let total = 0;
    for (const table of tables) {
      const count = await this.getRowCount(db, table);
      total += count;
    }
    return total;
  }
}