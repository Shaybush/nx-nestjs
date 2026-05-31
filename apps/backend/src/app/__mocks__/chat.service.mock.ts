/**
 * Mock for ChatService
 * Used by streaming.controller.spec.ts, chat.controller.spec.ts, and other tests that depend on ChatService
 */

/**
 * Mock filter config data
 */
export const mockFilterConfig = {
  dateFilter: {
    type: 'custom',
    customRange: { amount: 7, type: 'days' },
  },
  selectedCountries: ['DE', 'FR'],
  enabledTools: ['tool-t'],
};

/**
 * Mock filter data for controller tests
 */
export const mockControllerFilter = {
  filterId: 'test-filter-id',
  name: 'Test Filter',
  userId: 'test-user-id',
  chatId: 'test-chat-id',
  filterConfig: mockFilterConfig,
  isActive: false,
  createdAt: new Date(),
  updatedAt: new Date(),
};

/**
 * Mock chat data for controller tests
 */
export const mockControllerChat = {
  chatId: 'test-chat-id',
  userId: 'test-user-id',
  name: 'Test Chat',
  activeFilterId: 'test-filter-id',
  currentFilterConfig: mockFilterConfig,
  createdAt: new Date(),
  updatedAt: new Date(),
};

/**
 * Creates a mock ChatService with all methods
 */
export const createMockChatService = () => ({
  ensureChatExists: jest.fn().mockResolvedValue(undefined),
  addMessage: jest.fn().mockResolvedValue({
    id: 'test-message-id',
    chatId: 'test-chat-id',
    userId: 'test-user-id',
    role: 'user',
    content: 'Test message',
    timestamp: new Date(),
  }),
  setActiveFilter: jest.fn().mockResolvedValue({
    chatId: 'test-chat-id',
    activeFilterId: 'test-filter-id',
  }),
  createChat: jest.fn(),
  getChat: jest.fn(),
  updateChatName: jest.fn(),
  listChats: jest.fn(),
  deleteChat: jest.fn(),
  getChatMessages: jest.fn(),
  deleteMessagesFrom: jest.fn(),
  createFilter: jest.fn(),
  getFiltersForChat: jest.fn(),
  updateFilter: jest.fn(),
  deleteFilter: jest.fn(),
});

export const mockChatService = createMockChatService();
