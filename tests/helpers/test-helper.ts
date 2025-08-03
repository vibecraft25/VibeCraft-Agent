import { Database } from 'sqlite3';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';

export class TestHelper {
  private static testDatabases = new Map<string, string>();
  
  static async createTestDirectory(): Promise<string> {
    const tmpDir = path.join(os.tmpdir(), `vibecraft-test-${Date.now()}`);
    await fs.ensureDir(tmpDir);
    return tmpDir;
  }
  
  static async cleanupTestDirectory(dir: string): Promise<void> {
    await fs.remove(dir);
  }
  
  static async createTestDatabase(type: string): Promise<string> {
    // 캐시된 데이터베이스 확인
    if (this.testDatabases.has(type)) {
      return this.testDatabases.get(type)!;
    }
    
    const dbPath = path.join(os.tmpdir(), `test-${type}-${Date.now()}.sqlite`);
    const db = new Database(dbPath);
    
    return new Promise((resolve, reject) => {
      db.serialize(() => {
        switch (type) {
          case 'time-series':
            this.createTimeSeriesSchema(db);
            break;
          case 'geo-spatial':
            this.createGeoSpatialSchema(db);
            break;
          case 'simple':
            this.createSimpleSchema(db);
            break;
          case 'gantt':
            this.createGanttSchema(db);
            break;
          case 'kpi':
            this.createKPISchema(db);
            break;
          default:
            this.createSimpleSchema(db);
        }
        
        db.close((err) => {
          if (err) reject(err);
          else {
            this.testDatabases.set(type, dbPath);
            resolve(dbPath);
          }
        });
      });
    });
  }
  
  static async createLargeDatabase(recordCount: number): Promise<string> {
    const dbPath = path.join(os.tmpdir(), `test-large-${Date.now()}.sqlite`);
    const db = new Database(dbPath);
    
    return new Promise((resolve, reject) => {
      db.serialize(() => {
        db.run(`
          CREATE TABLE large_data (
            id INTEGER PRIMARY KEY,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            value DECIMAL(10,2),
            category VARCHAR(50),
            status VARCHAR(20)
          )
        `);
        
        const stmt = db.prepare(`
          INSERT INTO large_data (value, category, status) 
          VALUES (?, ?, ?)
        `);
        
        for (let i = 0; i < recordCount; i++) {
          stmt.run(
            Math.random() * 10000,
            `Category ${Math.floor(Math.random() * 10)}`,
            ['active', 'inactive', 'pending'][Math.floor(Math.random() * 3)]
          );
        }
        
        stmt.finalize();
        
        db.close((err) => {
          if (err) reject(err);
          else resolve(dbPath);
        });
      });
    });
  }
  
  private static createTimeSeriesSchema(db: Database): void {
    // 시계열 테스트 데이터
    db.run(`
      CREATE TABLE sales (
        id INTEGER PRIMARY KEY,
        date DATE NOT NULL,
        amount DECIMAL(10,2),
        product_id INTEGER,
        region VARCHAR(50)
      )
    `);
    
    db.run(`
      CREATE TABLE products (
        id INTEGER PRIMARY KEY,
        name VARCHAR(100),
        category VARCHAR(50)
      )
    `);
    
    // 샘플 데이터 삽입
    const productStmt = db.prepare(`
      INSERT INTO products (id, name, category) VALUES (?, ?, ?)
    `);
    
    for (let i = 1; i <= 10; i++) {
      productStmt.run(i, `Product ${i}`, `Category ${Math.ceil(i / 3)}`);
    }
    productStmt.finalize();
    
    const stmt = db.prepare(`
      INSERT INTO sales (date, amount, product_id, region) 
      VALUES (?, ?, ?, ?)
    `);
    
    const startDate = new Date('2024-01-01');
    for (let i = 0; i < 365; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      
      // 각 날짜에 여러 거래 생성
      for (let j = 0; j < 10; j++) {
        stmt.run(
          date.toISOString().split('T')[0],
          Math.random() * 10000 + 100,
          Math.floor(Math.random() * 10) + 1,
          ['North', 'South', 'East', 'West'][Math.floor(Math.random() * 4)]
        );
      }
    }
    
    stmt.finalize();
  }
  
  private static createGeoSpatialSchema(db: Database): void {
    // 지리공간 테스트 데이터
    db.run(`
      CREATE TABLE stores (
        id INTEGER PRIMARY KEY,
        name VARCHAR(100),
        latitude DECIMAL(10,8),
        longitude DECIMAL(11,8),
        revenue DECIMAL(12,2),
        city VARCHAR(50),
        country VARCHAR(50)
      )
    `);
    
    // 샘플 매장 데이터
    const stores = [
      { name: 'Seoul Main', lat: 37.5665, lng: 126.9780, revenue: 1000000, city: 'Seoul', country: 'South Korea' },
      { name: 'Gangnam Branch', lat: 37.4979, lng: 127.0276, revenue: 1500000, city: 'Seoul', country: 'South Korea' },
      { name: 'Tokyo Central', lat: 35.6762, lng: 139.6503, revenue: 2000000, city: 'Tokyo', country: 'Japan' },
      { name: 'Osaka Store', lat: 34.6937, lng: 135.5023, revenue: 1200000, city: 'Osaka', country: 'Japan' },
      { name: 'NYC Manhattan', lat: 40.7128, lng: -74.0060, revenue: 2500000, city: 'New York', country: 'USA' },
      { name: 'LA Downtown', lat: 34.0522, lng: -118.2437, revenue: 1800000, city: 'Los Angeles', country: 'USA' },
      { name: 'London Oxford', lat: 51.5074, lng: -0.1278, revenue: 2200000, city: 'London', country: 'UK' },
      { name: 'Paris Champs', lat: 48.8566, lng: 2.3522, revenue: 1900000, city: 'Paris', country: 'France' }
    ];
    
    const stmt = db.prepare(`
      INSERT INTO stores (name, latitude, longitude, revenue, city, country) 
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    stores.forEach(store => {
      stmt.run(store.name, store.lat, store.lng, store.revenue, store.city, store.country);
    });
    
    stmt.finalize();
  }
  
  private static createGanttSchema(db: Database): void {
    // 간트차트 테스트 데이터
    db.run(`
      CREATE TABLE tasks (
        id INTEGER PRIMARY KEY,
        name VARCHAR(200),
        start_date DATE,
        end_date DATE,
        progress INTEGER,
        assignee VARCHAR(100),
        parent_id INTEGER,
        FOREIGN KEY (parent_id) REFERENCES tasks(id)
      )
    `);
    
    const tasks = [
      { id: 1, name: 'Project Planning', start: '2024-01-01', end: '2024-01-15', progress: 100, assignee: 'Alice' },
      { id: 2, name: 'Design Phase', start: '2024-01-16', end: '2024-02-15', progress: 80, assignee: 'Bob' },
      { id: 3, name: 'Development', start: '2024-02-01', end: '2024-04-30', progress: 45, assignee: 'Charlie' },
      { id: 4, name: 'Testing', start: '2024-04-15', end: '2024-05-15', progress: 20, assignee: 'David' },
      { id: 5, name: 'Deployment', start: '2024-05-16', end: '2024-05-31', progress: 0, assignee: 'Eve' }
    ];
    
    const stmt = db.prepare(`
      INSERT INTO tasks (id, name, start_date, end_date, progress, assignee, parent_id) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    tasks.forEach(task => {
      stmt.run(task.id, task.name, task.start, task.end, task.progress, task.assignee, null);
    });
    
    stmt.finalize();
  }
  
  private static createKPISchema(db: Database): void {
    // KPI 대시보드 테스트 데이터
    db.run(`
      CREATE TABLE metrics (
        id INTEGER PRIMARY KEY,
        metric_name VARCHAR(100),
        value DECIMAL(15,2),
        target DECIMAL(15,2),
        date DATE,
        category VARCHAR(50)
      )
    `);
    
    const metrics = [
      'Revenue', 'Active Users', 'Conversion Rate', 'Customer Satisfaction',
      'Page Load Time', 'Error Rate', 'New Signups', 'Churn Rate'
    ];
    
    const stmt = db.prepare(`
      INSERT INTO metrics (metric_name, value, target, date, category) 
      VALUES (?, ?, ?, ?, ?)
    `);
    
    const today = new Date();
    metrics.forEach(metric => {
      // 최근 30일 데이터
      for (let i = 0; i < 30; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        
        const baseValue = Math.random() * 1000 + 500;
        stmt.run(
          metric,
          baseValue + (Math.random() - 0.5) * 200,
          baseValue,
          date.toISOString().split('T')[0],
          metric.includes('Rate') ? 'Percentage' : 'Absolute'
        );
      }
    });
    
    stmt.finalize();
  }
  
  private static createSimpleSchema(db: Database): void {
    db.run(`
      CREATE TABLE users (
        id INTEGER PRIMARY KEY,
        name VARCHAR(100),
        email VARCHAR(100),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    const stmt = db.prepare(`
      INSERT INTO users (name, email) VALUES (?, ?)
    `);
    
    const users = [
      { name: 'John Doe', email: 'john@example.com' },
      { name: 'Jane Smith', email: 'jane@example.com' },
      { name: 'Bob Johnson', email: 'bob@example.com' }
    ];
    
    users.forEach(user => {
      stmt.run(user.name, user.email);
    });
    
    stmt.finalize();
  }
  
  static createMockSchemaInfo(): any {
    return {
      database: 'test.sqlite',
      tables: [
        {
          name: 'sales',
          columns: [
            { name: 'id', type: 'INTEGER', isPrimary: true },
            { name: 'date', type: 'DATE', isNullable: false },
            { name: 'amount', type: 'DECIMAL' },
            { name: 'product_id', type: 'INTEGER' },
            { name: 'region', type: 'VARCHAR' }
          ],
          rowCount: 1000
        }
      ],
      relationships: [],
      indexes: []
    };
  }
}