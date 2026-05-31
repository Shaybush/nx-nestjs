/**
 * Mock for HttpService (@nestjs/axios)
 * Used by streaming.controller.spec.ts and other tests that make HTTP requests
 */

import { of } from 'rxjs';

export const createMockHttpService = () => ({
  post: jest.fn().mockReturnValue(of({ data: {} })),
  get: jest.fn().mockReturnValue(of({ data: {} })),
  put: jest.fn().mockReturnValue(of({ data: {} })),
  delete: jest.fn().mockReturnValue(of({ data: {} })),
  patch: jest.fn().mockReturnValue(of({ data: {} })),
});

export const mockHttpService = createMockHttpService();
