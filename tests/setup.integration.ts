// 통합 테스트를 위한 전역 설정
import { GeminiCLIMock } from './mocks/gemini-cli.mock';

// 테스트 타임아웃 증가
jest.setTimeout(30000);

// 환경 변수 설정
process.env.NODE_ENV = 'test';
process.env.VIBECRAFT_TEST = 'true';

// 콘솔 경고 억제 (필요시)
if (process.env.SUPPRESS_WARNINGS === 'true') {
  global.console.warn = jest.fn();
}

// 전역 모의 설정
beforeAll(() => {
  // Gemini CLI를 모의로 대체 (E2E가 아닌 통합 테스트용)
  if (process.env.MOCK_GEMINI === 'true') {
    GeminiCLIMock.setup();
  }
});

afterAll(() => {
  // 모의 복원
  if (process.env.MOCK_GEMINI === 'true') {
    GeminiCLIMock.restore();
  }
});

// 각 테스트 후 정리
afterEach(() => {
  jest.clearAllMocks();
});