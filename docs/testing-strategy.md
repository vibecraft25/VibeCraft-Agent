# 테스트 전략

## 개요
VibeCraft-Agent의 테스트는 Jest를 사용한 단위 테스트와 테스트 데이터베이스를 활용한 검증에 중점을 둡니다.

## 1. 단위 테스트 (Jest)

### 1.1 테스트 환경 설정
```bash
# Jest 및 관련 패키지 설치
npm install --save-dev jest @types/jest ts-jest

# TypeScript 테스트를 위한 Jest 설정
npm install --save-dev @types/node
```

### 1.2 Jest 설정 파일
```javascript
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/index.ts'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html']
};
```

### 1.3 테스트 파일 구조
```
src/
├── core/
│   ├── __tests__/
│   │   ├── schema-analyzer.test.ts
│   │   ├── request-parser.test.ts
│   │   ├── template-engine.test.ts
│   │   └── ...
│   ├── schema-analyzer.ts
│   ├── request-parser.ts
│   └── ...
├── utils/
│   ├── __tests__/
│   │   ├── error-handler.test.ts
│   │   └── logger.test.ts
│   └── ...
```

### 1.4 테스트 작성 예시

#### Schema Analyzer 테스트
```typescript
// src/core/__tests__/schema-analyzer.test.ts
import { SchemaAnalyzer } from '../schema-analyzer';
import path from 'path';

describe('SchemaAnalyzer', () => {
  let analyzer: SchemaAnalyzer;
  
  beforeEach(() => {
    analyzer = new SchemaAnalyzer();
  });
  
  test('should extract table names from SQLite database', async () => {
    const dbPath = path.join(__dirname, '../../../test-data/simple.sqlite');
    const schema = await analyzer.analyze(dbPath);
    
    expect(schema.tables).toBeDefined();
    expect(schema.tables.length).toBeGreaterThan(0);
    expect(schema.tables).toContain('users');
  });
  
  test('should extract column information', async () => {
    const dbPath = path.join(__dirname, '../../../test-data/simple.sqlite');
    const schema = await analyzer.analyze(dbPath);
    
    const usersTable = schema.tables.find(t => t.name === 'users');
    expect(usersTable).toBeDefined();
    expect(usersTable.columns).toBeDefined();
    
    const idColumn = usersTable.columns.find(c => c.name === 'id');
    expect(idColumn).toBeDefined();
    expect(idColumn.isPrimaryKey).toBe(true);
  });
  
  test('should handle non-existent database', async () => {
    const dbPath = '/path/to/non-existent.sqlite';
    
    await expect(analyzer.analyze(dbPath)).rejects.toThrow();
  });
});
```

#### Request Parser 테스트
```typescript
// src/core/__tests__/request-parser.test.ts
import { RequestParser } from '../request-parser';

describe('RequestParser', () => {
  let parser: RequestParser;
  
  beforeEach(() => {
    parser = new RequestParser();
  });
  
  test('should parse valid CLI arguments', () => {
    const args = {
      sqlitePath: './data.sqlite',
      visualizationType: 'time-series',
      userPrompt: '월별 매출 차트',
      outputDir: './output'
    };
    
    const result = parser.parse(args);
    
    expect(result.sqlitePath).toBe(args.sqlitePath);
    expect(result.visualizationType).toBe(args.visualizationType);
    expect(result.userPrompt).toBe(args.userPrompt);
    expect(result.outputDir).toBe(args.outputDir);
  });
  
  test('should validate visualization type', () => {
    const args = {
      sqlitePath: './data.sqlite',
      visualizationType: 'invalid-type',
      userPrompt: 'test',
      outputDir: './output'
    };
    
    expect(() => parser.parse(args)).toThrow('Invalid visualization type');
  });
});
```

## 2. 테스트 데이터베이스

### 2.1 테스트 데이터 구조
```
test-data/
├── simple.sqlite           # 기본 테이블 구조 테스트용
├── time-series.sqlite      # 시계열 데이터 테스트용
├── geo-spatial.sqlite      # 지리공간 데이터 테스트용
├── complex.sqlite          # 복잡한 관계형 데이터 테스트용
├── empty.sqlite            # 빈 데이터베이스 테스트용
└── scripts/
    ├── create-test-db.sql  # 테스트 DB 생성 스크립트
    └── create-test-databases.js  # 모든 테스트 DB 생성
```

### 2.2 테스트 데이터베이스 생성 스크립트

#### SQL 스크립트
```sql
-- test-data/scripts/create-test-db.sql

-- Simple Database
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO users (name, email) VALUES
('Alice', 'alice@example.com'),
('Bob', 'bob@example.com'),
('Charlie', 'charlie@example.com');

-- Time-series Database
CREATE TABLE sales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date DATE NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    product_name TEXT,
    category TEXT,
    region TEXT
);

-- 시계열 샘플 데이터 (최근 12개월)
INSERT INTO sales (date, amount, product_name, category, region) VALUES
('2024-01-01', 15000.00, 'Product A', 'Electronics', 'North'),
('2024-01-15', 12000.00, 'Product B', 'Clothing', 'South'),
('2024-02-01', 18000.00, 'Product A', 'Electronics', 'East'),
('2024-02-15', 14000.00, 'Product C', 'Food', 'West'),
-- ... 더 많은 데이터

-- Geo-spatial Database
CREATE TABLE stores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    revenue DECIMAL(12,2),
    city TEXT,
    country TEXT
);

INSERT INTO stores (name, latitude, longitude, revenue, city, country) VALUES
('Seoul Store', 37.5665, 126.9780, 1500000.00, 'Seoul', 'South Korea'),
('Tokyo Store', 35.6762, 139.6503, 2000000.00, 'Tokyo', 'Japan'),
('New York Store', 40.7128, -74.0060, 2500000.00, 'New York', 'USA'),
('London Store', 51.5074, -0.1278, 1800000.00, 'London', 'UK');

-- Complex Database with Relations
CREATE TABLE products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    price DECIMAL(10,2),
    category_id INTEGER,
    FOREIGN KEY (category_id) REFERENCES categories(id)
);

CREATE TABLE categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    parent_id INTEGER,
    FOREIGN KEY (parent_id) REFERENCES categories(id)
);

CREATE TABLE orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    product_id INTEGER,
    quantity INTEGER,
    order_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
);
```

#### 데이터베이스 생성 스크립트
```javascript
// test-data/scripts/create-test-databases.js
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const databases = [
  { name: 'simple.sqlite', script: 'simple.sql' },
  { name: 'time-series.sqlite', script: 'time-series.sql' },
  { name: 'geo-spatial.sqlite', script: 'geo-spatial.sql' },
  { name: 'complex.sqlite', script: 'complex.sql' },
  { name: 'empty.sqlite', script: null }
];

async function createDatabase(dbName, scriptFile) {
  const dbPath = path.join(__dirname, '..', dbName);
  
  // 기존 파일 삭제
  if (fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
  }
  
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath);
    
    if (!scriptFile) {
      // 빈 데이터베이스
      db.close(resolve);
      return;
    }
    
    const sql = fs.readFileSync(
      path.join(__dirname, scriptFile), 
      'utf8'
    );
    
    db.exec(sql, (err) => {
      if (err) {
        reject(err);
      } else {
        console.log(`✅ Created ${dbName}`);
        db.close(resolve);
      }
    });
  });
}

async function createAllDatabases() {
  console.log('Creating test databases...\n');
  
  for (const { name, script } of databases) {
    try {
      await createDatabase(name, script);
    } catch (error) {
      console.error(`❌ Failed to create ${name}:`, error.message);
    }
  }
  
  console.log('\n✨ All test databases created!');
}

createAllDatabases();
```

## 3. 테스트 실행

### 3.1 NPM Scripts
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:unit": "jest src/**/*.test.ts",
    "test:verbose": "jest --verbose",
    "create-test-db": "node test-data/scripts/create-test-databases.js",
    "pretest": "npm run create-test-db"
  }
}
```

### 3.2 테스트 실행 명령어
```bash
# 모든 테스트 실행
npm test

# 특정 모듈 테스트
npm test schema-analyzer

# 변경사항 감지하며 테스트
npm run test:watch

# 커버리지 리포트 생성
npm run test:coverage

# 테스트 DB만 생성
npm run create-test-db
```

## 4. 개발 중 테스트 가이드라인

### 4.1 TDD (Test-Driven Development) 접근
1. 테스트를 먼저 작성
2. 테스트가 실패하는 것을 확인
3. 최소한의 코드로 테스트 통과
4. 리팩토링

### 4.2 테스트 작성 원칙
- **독립성**: 각 테스트는 독립적으로 실행 가능해야 함
- **명확성**: 테스트 이름은 무엇을 테스트하는지 명확히 표현
- **신속성**: 단위 테스트는 빠르게 실행되어야 함
- **신뢰성**: 동일한 조건에서 항상 같은 결과 보장

### 4.3 테스트 커버리지 목표
- 전체 커버리지: 80% 이상
- 핵심 모듈 커버리지: 90% 이상
- 유틸리티 함수: 100%

## 5. CI/CD 통합 (향후)

### 5.1 GitHub Actions 설정 예시
```yaml
# .github/workflows/test.yml
name: Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    - uses: actions/setup-node@v2
      with:
        node-version: '18'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Create test databases
      run: npm run create-test-db
    
    - name: Run tests
      run: npm test
    
    - name: Upload coverage
      uses: codecov/codecov-action@v1
      with:
        file: ./coverage/lcov.info
```

## 6. 문제 해결

### 6.1 일반적인 테스트 문제
- **SQLite 파일 권한**: 테스트 실행 전 파일 권한 확인
- **경로 문제**: 상대 경로 대신 `__dirname` 사용
- **비동기 테스트**: `async/await` 또는 `done` 콜백 사용

### 6.2 디버깅 팁
```bash
# 특정 테스트만 실행
npm test -- --testNamePattern="should extract table names"

# 디버그 모드로 실행
node --inspect-brk ./node_modules/.bin/jest --runInBand
```