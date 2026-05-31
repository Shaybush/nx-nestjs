import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { StreamingController } from './streaming.controller';
import { ChatService } from '../services/chat.service';
import {
  createMockChatService,
  createMockHttpService,
  createMockResponse,
  createMockChatMessageDto,
  MockResponse,
  suppressLoggerPrototype,
} from '../__mocks__';
import { ChatMessageDto } from '../dto/chat.dto';

// Suppress Logger output during tests
suppressLoggerPrototype();

// Type for accessing private methods
type StreamingControllerPrivate = {
  validateRequest: (
    chatId: string | undefined,
    auth: { userId?: string } | undefined,
    messages: ChatMessageDto[] | undefined
  ) => void;
  ensureChatExists: (chatId: string, userId: string, messages: ChatMessageDto[]) => Promise<void>;
  saveUserMessage: (
    chatId: string,
    userId: string,
    message: { id: string; role: 'user' | 'assistant' | 'system'; content: string; timestamp: Date },
    messageDto: ChatMessageDto,
    sessionId: string
  ) => Promise<void>;
  saveAssistantMessage: (
    chatId: string,
    userId: string,
    assistantDto: ChatMessageDto,
    userMessageDto: ChatMessageDto | undefined,
    content: string,
    sessionId: string
  ) => Promise<void>;
  setStreamingHeaders: (res: MockResponse) => void;
  handleProxyError: (res: MockResponse, error: unknown, sessionId: string) => void;
  deriveChatName: (messages: ChatMessageDto[]) => string;
};

describe('StreamingController - Private Methods', () => {
  let controller: StreamingController;
  let controllerPrivate: StreamingControllerPrivate;
  let chatService: ReturnType<typeof createMockChatService>;
  let httpService: ReturnType<typeof createMockHttpService>;

  beforeEach(async () => {
    chatService = createMockChatService();
    httpService = createMockHttpService();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [StreamingController],
      providers: [
        { provide: ChatService, useValue: chatService },
        { provide: HttpService, useValue: httpService },
      ],
    }).compile();

    controller = module.get<StreamingController>(StreamingController);
    // Access private methods via type assertion
    controllerPrivate = controller as unknown as StreamingControllerPrivate;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validateRequest', () => {
    it('should throw BadRequestException when auth is undefined', () => {
      expect(() => {
        controllerPrivate.validateRequest('chat-id', undefined, [createMockChatMessageDto()]);
      }).toThrow(BadRequestException);
      expect(() => {
        controllerPrivate.validateRequest('chat-id', undefined, [createMockChatMessageDto()]);
      }).toThrow('Missing or invalid auth object with userId');
    });

    it('should throw BadRequestException when auth.userId is undefined', () => {
      expect(() => {
        controllerPrivate.validateRequest('chat-id', {}, [createMockChatMessageDto()]);
      }).toThrow(BadRequestException);
      expect(() => {
        controllerPrivate.validateRequest('chat-id', { userId: undefined }, [createMockChatMessageDto()]);
      }).toThrow('Missing or invalid auth object with userId');
    });

    it('should throw BadRequestException when auth.userId is empty string', () => {
      expect(() => {
        controllerPrivate.validateRequest('chat-id', { userId: '' }, [createMockChatMessageDto()]);
      }).toThrow(BadRequestException);
    });

    it('should throw BadRequestException when chatId is undefined', () => {
      expect(() => {
        controllerPrivate.validateRequest(undefined, { userId: 'user-id' }, [createMockChatMessageDto()]);
      }).toThrow(BadRequestException);
      expect(() => {
        controllerPrivate.validateRequest(undefined, { userId: 'user-id' }, [createMockChatMessageDto()]);
      }).toThrow('chatId is required');
    });

    it('should throw BadRequestException when chatId is empty string', () => {
      expect(() => {
        controllerPrivate.validateRequest('', { userId: 'user-id' }, [createMockChatMessageDto()]);
      }).toThrow(BadRequestException);
      expect(() => {
        controllerPrivate.validateRequest('', { userId: 'user-id' }, [createMockChatMessageDto()]);
      }).toThrow('chatId is required');
    });

    it('should throw BadRequestException when messages is undefined', () => {
      expect(() => {
        controllerPrivate.validateRequest('chat-id', { userId: 'user-id' }, undefined);
      }).toThrow(BadRequestException);
      expect(() => {
        controllerPrivate.validateRequest('chat-id', { userId: 'user-id' }, undefined);
      }).toThrow('messages array is required and must not be empty');
    });

    it('should throw BadRequestException when messages is not an array', () => {
      expect(() => {
        controllerPrivate.validateRequest('chat-id', { userId: 'user-id' }, 'not-an-array' as unknown as ChatMessageDto[]);
      }).toThrow(BadRequestException);
    });

    it('should throw BadRequestException when messages array is empty', () => {
      expect(() => {
        controllerPrivate.validateRequest('chat-id', { userId: 'user-id' }, []);
      }).toThrow(BadRequestException);
      expect(() => {
        controllerPrivate.validateRequest('chat-id', { userId: 'user-id' }, []);
      }).toThrow('messages array is required and must not be empty');
    });

    it('should not throw when all parameters are valid', () => {
      expect(() => {
        controllerPrivate.validateRequest(
          'chat-id',
          { userId: 'user-id' },
          [createMockChatMessageDto()]
        );
      }).not.toThrow();
    });

    it('should not throw with multiple valid messages', () => {
      const messages = [
        createMockChatMessageDto({ id: 'msg-1', role: 'user' }),
        createMockChatMessageDto({ id: 'msg-2', role: 'assistant' }),
      ];
      expect(() => {
        controllerPrivate.validateRequest('chat-id', { userId: 'user-id' }, messages);
      }).not.toThrow();
    });
  });

  describe('ensureChatExists', () => {
    it('should call chatService.ensureChatExists with derived chat name', async () => {
      const messages = [
        createMockChatMessageDto({ role: 'user', content: 'Hello world' }),
      ];

      await controllerPrivate.ensureChatExists('chat-id', 'user-id', messages);

      expect(chatService.ensureChatExists).toHaveBeenCalledWith({
        chatId: 'chat-id',
        userId: 'user-id',
        name: 'Hello world',
      });
    });

    it('should use "New Chat" when no user message exists', async () => {
      const messages = [
        createMockChatMessageDto({ role: 'assistant', content: 'I am ready to help' }),
      ];

      await controllerPrivate.ensureChatExists('chat-id', 'user-id', messages);

      expect(chatService.ensureChatExists).toHaveBeenCalledWith({
        chatId: 'chat-id',
        userId: 'user-id',
        name: 'New Chat',
      });
    });

    it('should not throw when chatService.ensureChatExists fails', async () => {
      chatService.ensureChatExists.mockRejectedValue(new Error('Database error'));
      const messages = [createMockChatMessageDto({ role: 'user', content: 'Test' })];

      // Should not throw, error is logged internally
      await expect(
        controllerPrivate.ensureChatExists('chat-id', 'user-id', messages)
      ).resolves.not.toThrow();
    });

    it('should truncate long chat names', async () => {
      const longContent = 'A'.repeat(100);
      const messages = [
        createMockChatMessageDto({ role: 'user', content: longContent }),
      ];

      await controllerPrivate.ensureChatExists('chat-id', 'user-id', messages);

      expect(chatService.ensureChatExists).toHaveBeenCalledWith({
        chatId: 'chat-id',
        userId: 'user-id',
        name: 'A'.repeat(57) + '...',
      });
    });
  });

  describe('saveUserMessage', () => {
    const mockMessage = {
      id: 'msg-id',
      role: 'user' as const,
      content: 'Test content',
      timestamp: new Date(),
    };

    it('should call chatService.addMessage with correct parameters', async () => {
      const messageDto = createMockChatMessageDto({ id: 'msg-id', role: 'user', content: 'Test content' });

      await controllerPrivate.saveUserMessage('chat-id', 'user-id', mockMessage, messageDto, 'session-123');

      expect(chatService.addMessage).toHaveBeenCalledWith({
        id: 'msg-id',
        chatId: 'chat-id',
        userId: 'user-id',
        role: 'user',
        content: 'Test content',
        timestamp: mockMessage.timestamp,
        metadata: expect.objectContaining({
          'session-id': 'session-123',
        }),
        filterId: null,
        filterVersion: undefined,
      });
    });

    it('should set active filter when filterId and filterVersion are provided', async () => {
      const messageDto = createMockChatMessageDto({
        id: 'msg-id',
        role: 'user',
        content: 'Test content',
        filterId: 'filter-123',
        filterVersion: 2,
      });

      await controllerPrivate.saveUserMessage('chat-id', 'user-id', mockMessage, messageDto, 'session-123');

      expect(chatService.setActiveFilter).toHaveBeenCalledWith('chat-id', 'user-id', 'filter-123');
      expect(chatService.addMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          filterId: 'filter-123',
          filterVersion: 2,
        })
      );
    });

    it('should not set active filter when only filterId is provided', async () => {
      const messageDto = createMockChatMessageDto({
        id: 'msg-id',
        role: 'user',
        content: 'Test content',
        filterId: 'filter-123',
      });

      await controllerPrivate.saveUserMessage('chat-id', 'user-id', mockMessage, messageDto, 'session-123');

      expect(chatService.setActiveFilter).not.toHaveBeenCalled();
    });

    it('should not throw when chatService.addMessage fails', async () => {
      chatService.addMessage.mockRejectedValue(new Error('Database error'));
      const messageDto = createMockChatMessageDto();

      // Should not throw, error is logged internally
      await expect(
        controllerPrivate.saveUserMessage('chat-id', 'user-id', mockMessage, messageDto, 'session-123')
      ).resolves.not.toThrow();
    });

    it('should not throw when chatService.setActiveFilter fails', async () => {
      chatService.setActiveFilter.mockRejectedValue(new Error('Filter error'));
      const messageDto = createMockChatMessageDto({
        filterId: 'filter-123',
        filterVersion: 1,
      });

      await expect(
        controllerPrivate.saveUserMessage('chat-id', 'user-id', mockMessage, messageDto, 'session-123')
      ).resolves.not.toThrow();
    });
  });

  describe('saveAssistantMessage', () => {
    it('should call chatService.addMessage with correct parameters', async () => {
      const assistantDto = createMockChatMessageDto({ id: 'assistant-id', role: 'assistant' });
      const userMessageDto = createMockChatMessageDto({ id: 'user-id', role: 'user' });

      await controllerPrivate.saveAssistantMessage(
        'chat-id',
        'user-id',
        assistantDto,
        userMessageDto,
        'Assistant response content',
        'session-123'
      );

      expect(chatService.addMessage).toHaveBeenCalledWith({
        id: 'assistant-id',
        chatId: 'chat-id',
        userId: 'user-id',
        role: 'assistant',
        content: 'Assistant response content',
        timestamp: expect.any(Date),
        metadata: expect.objectContaining({
          'session-id': 'session-123',
        }),
        filterId: null,
        filterVersion: null,
      });
    });

    it('should use assistantDto filterId when available', async () => {
      const assistantDto = createMockChatMessageDto({
        id: 'assistant-id',
        role: 'assistant',
        filterId: 'filter-from-assistant',
        filterVersion: 3,
      });

      await controllerPrivate.saveAssistantMessage(
        'chat-id',
        'user-id',
        assistantDto,
        undefined,
        'Response content',
        'session-123'
      );

      expect(chatService.addMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          filterId: 'filter-from-assistant',
          filterVersion: 3,
        })
      );
    });

    it('should fallback to userMessageDto filterId when assistantDto has none', async () => {
      const assistantDto = createMockChatMessageDto({ id: 'assistant-id', role: 'assistant' });
      const userMessageDto = createMockChatMessageDto({
        id: 'user-id',
        role: 'user',
        filterId: 'filter-from-user',
        filterVersion: 2,
      });

      await controllerPrivate.saveAssistantMessage(
        'chat-id',
        'user-id',
        assistantDto,
        userMessageDto,
        'Response content',
        'session-123'
      );

      expect(chatService.addMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          filterId: 'filter-from-user',
          filterVersion: 2,
        })
      );
    });

    it('should handle undefined userMessageDto', async () => {
      const assistantDto = createMockChatMessageDto({ id: 'assistant-id', role: 'assistant' });

      await controllerPrivate.saveAssistantMessage(
        'chat-id',
        'user-id',
        assistantDto,
        undefined,
        'Response content',
        'session-123'
      );

      expect(chatService.addMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          filterId: null,
          filterVersion: null,
        })
      );
    });

    it('should not throw when chatService.addMessage fails', async () => {
      chatService.addMessage.mockRejectedValue(new Error('Database error'));
      const assistantDto = createMockChatMessageDto({ id: 'assistant-id', role: 'assistant' });

      await expect(
        controllerPrivate.saveAssistantMessage(
          'chat-id',
          'user-id',
          assistantDto,
          undefined,
          'Response content',
          'session-123'
        )
      ).resolves.not.toThrow();
    });
  });

  describe('setStreamingHeaders', () => {
    it('should set Content-Type header', () => {
      const res = createMockResponse();

      controllerPrivate.setStreamingHeaders(res);

      expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'application/json; charset=utf-8');
    });

    it('should set Cache-Control header', () => {
      const res = createMockResponse();

      controllerPrivate.setStreamingHeaders(res);

      expect(res.setHeader).toHaveBeenCalledWith('Cache-Control', 'no-cache');
    });

    it('should set Connection header', () => {
      const res = createMockResponse();

      controllerPrivate.setStreamingHeaders(res);

      expect(res.setHeader).toHaveBeenCalledWith('Connection', 'keep-alive');
    });

    it('should set CORS headers', () => {
      const res = createMockResponse();

      controllerPrivate.setStreamingHeaders(res);

      expect(res.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Origin', '*');
      expect(res.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Headers', 'Cache-Control, Content-Type');
    });

    it('should set all five required headers', () => {
      const res = createMockResponse();

      controllerPrivate.setStreamingHeaders(res);

      expect(res.setHeader).toHaveBeenCalledTimes(5);
    });
  });

  describe('handleProxyError', () => {
    it('should set streaming headers if not already sent', () => {
      const res = createMockResponse();
      res.headersSent = false;

      controllerPrivate.handleProxyError(res, new Error('Test error'), 'session-123');

      expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'application/json; charset=utf-8');
    });

    it('should not set headers if already sent', () => {
      const res = createMockResponse();
      res.headersSent = true;

      controllerPrivate.handleProxyError(res, new Error('Test error'), 'session-123');

      expect(res.setHeader).not.toHaveBeenCalled();
    });

    it('should write error chunk with correct structure', () => {
      const res = createMockResponse();

      controllerPrivate.handleProxyError(res, new Error('Test error message'), 'session-123');

      expect(res.write).toHaveBeenCalledTimes(1);
      const writtenData = res.write.mock.calls[0][0];
      const parsed = JSON.parse(writtenData.replace('\n', ''));

      expect(parsed.chunkType).toBe('error');
      expect(parsed.data.error.message).toBe('An error occurred while proxying to agent-api');
      expect(parsed.data.error.code).toBe('PROXY_ERROR');
      expect(parsed.data.error.details).toBe('Test error message');
      expect(parsed.data.error.recoverable).toBe(true);
      expect(parsed.sessionId).toBe('session-123');
    });

    it('should handle non-Error objects', () => {
      const res = createMockResponse();

      controllerPrivate.handleProxyError(res, 'string error', 'session-123');

      const writtenData = res.write.mock.calls[0][0];
      const parsed = JSON.parse(writtenData.replace('\n', ''));

      expect(parsed.data.error.details).toBe('Unknown error');
    });

    it('should handle null error', () => {
      const res = createMockResponse();

      controllerPrivate.handleProxyError(res, null, 'session-123');

      const writtenData = res.write.mock.calls[0][0];
      const parsed = JSON.parse(writtenData.replace('\n', ''));

      expect(parsed.data.error.details).toBe('Unknown error');
    });

    it('should call res.end() after writing error', () => {
      const res = createMockResponse();

      controllerPrivate.handleProxyError(res, new Error('Test'), 'session-123');

      expect(res.end).toHaveBeenCalled();
    });

    it('should handle write failure gracefully', () => {
      const res = createMockResponse();
      res.write.mockImplementation(() => {
        throw new Error('Write failed');
      });

      // Should not throw
      expect(() => {
        controllerPrivate.handleProxyError(res, new Error('Test'), 'session-123');
      }).not.toThrow();

      expect(res.end).toHaveBeenCalled();
    });

    it('should handle both write and end failure gracefully', () => {
      const res = createMockResponse();
      res.write.mockImplementation(() => {
        throw new Error('Write failed');
      });
      res.end.mockImplementation(() => {
        throw new Error('End failed');
      });

      // Should not throw
      expect(() => {
        controllerPrivate.handleProxyError(res, new Error('Test'), 'session-123');
      }).not.toThrow();
    });

    it('should use "unknown" for empty sessionId', () => {
      const res = createMockResponse();

      controllerPrivate.handleProxyError(res, new Error('Test'), '');

      const writtenData = res.write.mock.calls[0][0];
      const parsed = JSON.parse(writtenData.replace('\n', ''));

      expect(parsed.sessionId).toBe('unknown');
    });

    it('should include timestamp in error chunk', () => {
      const res = createMockResponse();

      controllerPrivate.handleProxyError(res, new Error('Test'), 'session-123');

      const writtenData = res.write.mock.calls[0][0];
      const parsed = JSON.parse(writtenData.replace('\n', ''));

      expect(parsed.timestamp).toBeDefined();
      expect(parsed.data.error.timestamp).toBeDefined();
    });
  });

  describe('deriveChatName', () => {
    it('should return first user message content as chat name', () => {
      const messages = [
        createMockChatMessageDto({ role: 'user', content: 'Hello world' }),
      ];

      const result = controllerPrivate.deriveChatName(messages);

      expect(result).toBe('Hello world');
    });

    it('should return "New Chat" when no user message exists', () => {
      const messages = [
        createMockChatMessageDto({ role: 'assistant', content: 'I am ready to help' }),
        createMockChatMessageDto({ role: 'system', content: 'System prompt' }),
      ];

      const result = controllerPrivate.deriveChatName(messages);

      expect(result).toBe('New Chat');
    });

    it('should return "New Chat" when messages array is empty', () => {
      const result = controllerPrivate.deriveChatName([]);

      expect(result).toBe('New Chat');
    });

    it('should skip user messages with empty content', () => {
      const messages = [
        createMockChatMessageDto({ role: 'user', content: '' }),
        createMockChatMessageDto({ role: 'user', content: 'Second message' }),
      ];

      const result = controllerPrivate.deriveChatName(messages);

      expect(result).toBe('Second message');
    });

    it('should skip user messages with whitespace-only content', () => {
      const messages = [
        createMockChatMessageDto({ role: 'user', content: '   ' }),
        createMockChatMessageDto({ role: 'user', content: 'Real message' }),
      ];

      const result = controllerPrivate.deriveChatName(messages);

      expect(result).toBe('Real message');
    });

    it('should truncate content longer than 60 characters', () => {
      const longContent = 'A'.repeat(100);
      const messages = [
        createMockChatMessageDto({ role: 'user', content: longContent }),
      ];

      const result = controllerPrivate.deriveChatName(messages);

      expect(result).toBe('A'.repeat(57) + '...');
      expect(result.length).toBe(60);
    });

    it('should not truncate content exactly 60 characters', () => {
      const exactContent = 'A'.repeat(60);
      const messages = [
        createMockChatMessageDto({ role: 'user', content: exactContent }),
      ];

      const result = controllerPrivate.deriveChatName(messages);

      expect(result).toBe(exactContent);
      expect(result.length).toBe(60);
    });

    it('should normalize whitespace in content', () => {
      const messages = [
        createMockChatMessageDto({ role: 'user', content: '  Hello   world  with   spaces  ' }),
      ];

      const result = controllerPrivate.deriveChatName(messages);

      expect(result).toBe('Hello world with spaces');
    });

    it('should normalize and then truncate long content with spaces', () => {
      const content = 'A '.repeat(50); // 100 chars with spaces
      const messages = [
        createMockChatMessageDto({ role: 'user', content: content }),
      ];

      const result = controllerPrivate.deriveChatName(messages);

      expect(result.length).toBe(60);
      expect(result.endsWith('...')).toBe(true);
    });

    it('should find first user message among mixed message types', () => {
      const messages = [
        createMockChatMessageDto({ role: 'system', content: 'System prompt' }),
        createMockChatMessageDto({ role: 'assistant', content: 'Assistant greeting' }),
        createMockChatMessageDto({ role: 'user', content: 'User question' }),
        createMockChatMessageDto({ role: 'assistant', content: 'Assistant answer' }),
      ];

      const result = controllerPrivate.deriveChatName(messages);

      expect(result).toBe('User question');
    });

    it('should handle undefined content gracefully', () => {
      const messages = [
        { ...createMockChatMessageDto({ role: 'user' }), content: undefined as unknown as string },
      ];

      const result = controllerPrivate.deriveChatName(messages);

      expect(result).toBe('New Chat');
    });

    it('should handle messages with newlines', () => {
      const messages = [
        createMockChatMessageDto({ role: 'user', content: 'Hello\nWorld\nTest' }),
      ];

      const result = controllerPrivate.deriveChatName(messages);

      expect(result).toBe('Hello World Test');
    });

    it('should handle messages with tabs', () => {
      const messages = [
        createMockChatMessageDto({ role: 'user', content: 'Hello\tWorld' }),
      ];

      const result = controllerPrivate.deriveChatName(messages);

      expect(result).toBe('Hello World');
    });
  });
});
