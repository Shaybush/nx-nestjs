/**
 * Mongoose model mocks for testing
 * Used by chat.service.spec.ts and other tests that interact with mongoose models
 */

/**
 * Creates a mock query object that simulates mongoose query chaining
 */
export const createMockQuery = (result: unknown) => ({
  exec: jest.fn().mockResolvedValue(result),
  sort: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
});

/**
 * Base mock data for Chat document
 */
export const mockChatData = {
  chatId: 'test-chat-id',
  userId: 'test-user-id',
  name: 'Test Chat',
  createdAt: new Date(),
  lastMessageAt: new Date(),
  messageCount: 0,
  archived: false,
  tags: [],
  settings: {},
  activeFilterId: null,
  associatedFilters: [],
  currentFilterConfig: null,
};

/**
 * Base mock data for ChatMessage document
 */
export const mockMessageData = {
  id: 'test-message-id',
  chatId: 'test-chat-id',
  userId: 'test-user-id',
  role: 'user' as const,
  content: 'Test message',
  timestamp: new Date(),
  metadata: {},
  filterId: null,
  filterVersion: null,
};

/**
 * Base mock data for ChatFilter document
 */
export const mockFilterData = {
  filterId: 'test-filter-id',
  version: 1,
  name: 'Test Filter',
  userId: 'test-user-id',
  chatId: 'test-chat-id',
  filterConfig: { dateFilter: { type: 'custom' } },
  isActive: false,
  createdAt: new Date(),
  updatedAt: new Date(),
};

/**
 * Creates a mock Chat document with save method
 */
export const createMockChat = (overrides = {}) => ({
  ...mockChatData,
  ...overrides,
  save: jest.fn().mockResolvedValue({ ...mockChatData, ...overrides }),
});

/**
 * Creates a mock ChatMessage document with save method
 */
export const createMockMessage = (overrides = {}) => ({
  ...mockMessageData,
  ...overrides,
  save: jest.fn().mockResolvedValue({ ...mockMessageData, ...overrides }),
});

/**
 * Creates a mock ChatFilter document with save method
 */
export const createMockFilter = (overrides = {}) => ({
  ...mockFilterData,
  ...overrides,
  save: jest.fn().mockResolvedValue({ ...mockFilterData, ...overrides }),
});

/**
 * Creates mock Chat model with all query methods
 */
export const createMockChatModel = () => ({
  findOne: jest.fn().mockReturnValue(createMockQuery(null)),
  findOneAndUpdate: jest.fn().mockReturnValue(createMockQuery(null)),
  findOneAndDelete: jest.fn().mockReturnValue(createMockQuery(null)),
  find: jest.fn().mockReturnValue(createMockQuery([])),
  deleteMany: jest.fn().mockReturnValue(createMockQuery({ deletedCount: 0 })),
  countDocuments: jest.fn().mockReturnValue(createMockQuery(0)),
  updateMany: jest.fn().mockReturnValue(createMockQuery({ modifiedCount: 0 })),
});

/**
 * Creates mock ChatMessage model with all query methods
 */
export const createMockMessageModel = () => ({
  findOne: jest.fn().mockReturnValue(createMockQuery(null)),
  find: jest.fn().mockReturnValue(createMockQuery([])),
  deleteMany: jest.fn().mockReturnValue(createMockQuery({ deletedCount: 0 })),
  countDocuments: jest.fn().mockReturnValue(createMockQuery(0)),
});

/**
 * Creates mock ChatFilter model with all query methods
 */
export const createMockFilterModel = () => ({
  findOne: jest.fn().mockReturnValue(createMockQuery(null)),
  find: jest.fn().mockReturnValue(createMockQuery([])),
  findOneAndUpdate: jest.fn().mockReturnValue(createMockQuery(null)),
  findOneAndDelete: jest.fn().mockReturnValue(createMockQuery(null)),
  updateMany: jest.fn().mockReturnValue(createMockQuery({ modifiedCount: 0 })),
  deleteMany: jest.fn().mockReturnValue(createMockQuery({ deletedCount: 0 })),
});

/**
 * Creates a constructor mock for Chat model
 */
export const createMockChatConstructor = (mockChat = createMockChat()) => {
  return jest.fn().mockImplementation((data) => ({
    ...mockChat,
    ...data,
    save: jest.fn().mockResolvedValue({ ...mockChat, ...data }),
  }));
};

/**
 * Creates a constructor mock for ChatMessage model
 */
export const createMockMessageConstructor = (mockMessage = createMockMessage()) => {
  return jest.fn().mockImplementation((data) => ({
    ...mockMessage,
    ...data,
    save: jest.fn().mockResolvedValue({ ...mockMessage, ...data }),
  }));
};

/**
 * Creates a constructor mock for ChatFilter model
 */
export const createMockFilterConstructor = (mockFilter = createMockFilter()) => {
  return jest.fn().mockImplementation((data) => ({
    ...mockFilter,
    ...data,
    save: jest.fn().mockResolvedValue({ ...mockFilter, ...data }),
  }));
};
