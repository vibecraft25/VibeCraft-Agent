import { SchemaAnalyzer } from '../src/core/schema-analyzer';
import { open } from 'sqlite';
import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs-extra';
import os from 'os';

describe('SchemaAnalyzer', () => {
  let analyzer: SchemaAnalyzer;
  let testDbPath: string;
  let testDir: string;
  
  beforeAll(async () => {
    analyzer = new SchemaAnalyzer();
    
    // 테스트 디렉토리 생성
    testDir = path.join(os.tmpdir(), `schema-analyzer-test-${Date.now()}`);
    await fs.ensureDir(testDir);
    testDbPath = path.join(testDir, 'test.db');
    
    // 테스트용 SQLite 데이터베이스 생성
    const db = await open({
      filename: testDbPath,
      driver: sqlite3.Database
    });
    
    // 테스트 스키마 생성
    await db.exec(`
      CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE,
        age INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE orders (
        id INTEGER PRIMARY KEY,
        user_id INTEGER NOT NULL,
        product_name TEXT NOT NULL,
        total REAL NOT NULL,
        order_date DATE NOT NULL,
        status TEXT DEFAULT 'pending',
        FOREIGN KEY (user_id) REFERENCES users (id)
      );
      
      CREATE TABLE order_items (
        id INTEGER PRIMARY KEY,
        order_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL,
        price REAL NOT NULL,
        FOREIGN KEY (order_id) REFERENCES orders (id)
      );
      
      CREATE INDEX idx_users_email ON users(email);
      CREATE INDEX idx_orders_user_id ON orders(user_id);
      CREATE UNIQUE INDEX idx_orders_date_user ON orders(order_date, user_id);
    `);
    
    // 테스트 데이터 삽입
    await db.run(
      `INSERT INTO users (name, email, age) VALUES (?, ?, ?)`,
      ['John Doe', 'john@example.com', 30]
    );
    await db.run(
      `INSERT INTO users (name, email, age) VALUES (?, ?, ?)`,
      ['Jane Smith', 'jane@example.com', 25]
    );
    
    await db.run(
      `INSERT INTO orders (user_id, product_name, total, order_date) VALUES (?, ?, ?, ?)`,
      [1, 'Product A', 99.99, '2024-01-15']
    );
    await db.run(
      `INSERT INTO orders (user_id, product_name, total, order_date) VALUES (?, ?, ?, ?)`,
      [2, 'Product B', 149.99, '2024-01-16']
    );
    
    await db.run(
      `INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)`,
      [1, 1, 2, 49.99]
    );
    
    await db.close();
  });
  
  afterAll(async () => {
    // 테스트 디렉토리 정리
    await fs.remove(testDir);
  });
  
  describe('analyze', () => {
    test('should analyze database schema correctly', async () => {
      const schema = await analyzer.analyze(testDbPath);
      
      expect(schema.tables).toHaveLength(3);
      expect(schema.metadata.tableCount).toBe(3);
      expect(schema.metadata.totalRowCount).toBe(5); // 2 users + 2 orders + 1 order_item
    });
    
    test('should extract table information correctly', async () => {
      const schema = await analyzer.analyze(testDbPath);
      const usersTable = schema.tables.find(t => t.name === 'users');
      
      expect(usersTable).toBeDefined();
      expect(usersTable!.columns).toHaveLength(5);
      expect(usersTable!.rowCount).toBe(2);
      expect(usersTable!.primaryKey).toBe('id');
    });
    
    test('should identify column properties correctly', async () => {
      const schema = await analyzer.analyze(testDbPath);
      const usersTable = schema.tables.find(t => t.name === 'users');
      
      const idColumn = usersTable!.columns.find(c => c.name === 'id');
      expect(idColumn).toMatchObject({
        name: 'id',
        type: 'INTEGER',
        isPrimaryKey: true,
        nullable: false
      });
      
      const emailColumn = usersTable!.columns.find(c => c.name === 'email');
      expect(emailColumn).toMatchObject({
        name: 'email',
        type: 'TEXT',
        isUnique: true,
        nullable: true
      });
    });
    
    test('should extract foreign key relationships', async () => {
      const schema = await analyzer.analyze(testDbPath);
      
      expect(schema.relationships).toHaveLength(2); // orders->users, order_items->orders
      
      const orderUserRelation = schema.relationships.find(
        r => r.fromTable === 'orders' && r.toTable === 'users'
      );
      expect(orderUserRelation).toMatchObject({
        fromTable: 'orders',
        fromColumn: 'user_id',
        toTable: 'users',
        toColumn: 'id',
        type: 'one-to-many'
      });
    });
    
    test('should extract indexes correctly', async () => {
      const schema = await analyzer.analyze(testDbPath);
      const ordersTable = schema.tables.find(t => t.name === 'orders');
      
      const uniqueIndex = ordersTable!.indexes.find(idx => idx.name === 'idx_orders_date_user');
      expect(uniqueIndex).toBeDefined();
      expect(uniqueIndex!.unique).toBe(true);
      expect(uniqueIndex!.columns).toContain('order_date');
      expect(uniqueIndex!.columns).toContain('user_id');
    });
    
    test('should include sample data', async () => {
      const schema = await analyzer.analyze(testDbPath);
      const usersTable = schema.tables.find(t => t.name === 'users');
      
      expect(usersTable!.sampleData).toHaveLength(2);
      expect(usersTable!.sampleData![0]).toHaveProperty('name', 'John Doe');
    });
    
    test('should analyze data distribution', async () => {
      const schema = await analyzer.analyze(testDbPath);
      const ordersTable = schema.tables.find(t => t.name === 'orders');
      const totalColumn = ordersTable!.columns.find(c => c.name === 'total');
      
      expect(totalColumn!.dataDistribution).toBeDefined();
      expect(totalColumn!.dataDistribution!.dataType).toBe('numeric');
      expect(totalColumn!.dataDistribution!.minValue).toBe(99.99);
      expect(totalColumn!.dataDistribution!.maxValue).toBe(149.99);
    });
    
    test('should identify date columns correctly', async () => {
      const schema = await analyzer.analyze(testDbPath);
      const ordersTable = schema.tables.find(t => t.name === 'orders');
      const orderDateColumn = ordersTable!.columns.find(c => c.name === 'order_date');
      
      expect(orderDateColumn!.dataDistribution).toBeDefined();
      expect(orderDateColumn!.dataDistribution!.dataType).toBe('date');
    });
  });
  
  describe('getDatabaseMetadata', () => {
    test('should extract metadata correctly', async () => {
      const schema = await analyzer.analyze(testDbPath);
      
      expect(schema.metadata.version).toBe('3');
      expect(schema.metadata.encoding).toBe('UTF-8');
      expect(schema.metadata.pageSize).toBeGreaterThan(0);
      expect(schema.metadata.totalSize).toBeGreaterThan(0);
      expect(schema.metadata.createdAt).toBeDefined();
      expect(schema.metadata.lastModified).toBeDefined();
    });
  });
});