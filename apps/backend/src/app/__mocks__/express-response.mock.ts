/**
 * Mock for Express Response object
 * Used by streaming.controller.spec.ts and other tests that need Response mocking
 */

import type { Response } from 'express';

export interface MockResponse extends Partial<Response> {
  setHeader: jest.Mock;
  write: jest.Mock;
  end: jest.Mock;
  on: jest.Mock;
  closed: boolean;
  headersSent: boolean;
  _headers: Record<string, string>;
}

export const createMockResponse = (): MockResponse => {
  const headers: Record<string, string> = {};

  return {
    setHeader: jest.fn((name: string, value: string) => {
      headers[name] = value;
    }),
    write: jest.fn().mockReturnValue(true),
    end: jest.fn(),
    on: jest.fn(),
    closed: false,
    headersSent: false,
    _headers: headers,
  };
};

export const mockResponse = createMockResponse();
