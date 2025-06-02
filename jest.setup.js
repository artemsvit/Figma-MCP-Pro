// Jest setup file
// Add any global test setup here

// Mock console methods in tests to reduce noise
global.console = {
  ...console,
  // Uncomment to ignore specific console methods in tests
  // log: jest.fn(),
  // debug: jest.fn(),
  // info: jest.fn(),
  // warn: jest.fn(),
  // error: jest.fn(),
};

// Set test timeout
jest.setTimeout(10000);

// Mock environment variables for tests
process.env.NODE_ENV = 'test';
process.env.FIGMA_API_KEY = 'test-api-key';
process.env.CACHE_TTL = '300';
process.env.CACHE_MAX_SIZE = '100';
process.env.RATE_LIMIT_REQUESTS_PER_MINUTE = '60';
process.env.RATE_LIMIT_BURST_SIZE = '10'; 