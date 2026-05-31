import { Logger } from '@nestjs/common';

/**
 * Mock for NestJS Logger
 * Suppresses console output during tests
 */

export const createMockLogger = () => ({
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  verbose: jest.fn(),
});

export const mockLogger = createMockLogger();

/**
 * Suppresses Logger prototype methods during tests.
 * Use this when Logger is instantiated directly (new Logger()) rather than injected.
 * Call in beforeAll() block.
 */
export const suppressLoggerPrototype = (): void => {
  jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
  jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
  jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
  jest.spyOn(Logger.prototype, 'debug').mockImplementation(() => undefined);
  jest.spyOn(Logger.prototype, 'verbose').mockImplementation(() => undefined);
};
