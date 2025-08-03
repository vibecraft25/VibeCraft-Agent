module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/performance/**/*.test.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  globals: {
    'ts-jest': {
      tsconfig: {
        compilerOptions: {
          module: 'commonjs'
        }
      }
    }
  },
  testTimeout: 60000,
  maxWorkers: 1, // 성능 테스트는 순차적으로 실행
  verbose: true,
  // 성능 테스트를 위한 Node.js 옵션
  testEnvironmentOptions: {
    customExportConditions: ['node']
  }
};