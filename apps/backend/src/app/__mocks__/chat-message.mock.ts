  /**
   * Mock data for ChatMessage DTOs
   * Used by streaming.controller.spec.ts and other tests that need message data
   */

  import { ChatMessageDto, AuthTokenDto } from '../dto/chat.dto';

  export const createMockChatMessageDto = (overrides?: Partial<ChatMessageDto>): ChatMessageDto => ({
    id: `msg_${Date.now()}_test`,
    role: 'user',
    content: 'Test message content',
    timestamp: new Date().toISOString(),
    ...overrides,
  });

  export const createMockAuthDto = (overrides?: Partial<AuthTokenDto>): AuthTokenDto => ({
    token: 'test-jwt-token',
    userId: 'test-user-id',
    ...overrides,
  });

  export const mockUserMessage = createMockChatMessageDto({
    id: 'user-msg-1',
    role: 'user',
    content: 'Hello, this is a test message',
  });

  export const mockAssistantMessage = createMockChatMessageDto({
    id: 'assistant-msg-1',
    role: 'assistant',
    content: '',
  });

  export const mockSystemMessage = createMockChatMessageDto({
    id: 'system-msg-1',
    role: 'system',
    content: 'You are a helpful assistant',
  });

  export const mockAuthDto = createMockAuthDto();

  export const createMockMessages = (count = 2): ChatMessageDto[] => {
    const messages: ChatMessageDto[] = [];
    for (let i = 0; i < count; i++) {
      messages.push(createMockChatMessageDto({
        id: `msg-${i}`,
        role: i % 2 === 0 ? 'user' : 'assistant',
        content: `Message content ${i}`,
      }));
    }
    return messages;
  };
