import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from '../services/chat.service';
import {
  createMockChatService,
  mockControllerFilter,
  mockControllerChat,
} from '../__mocks__';

// Mock the Logger to suppress console output during tests
jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
jest.spyOn(Logger.prototype, 'debug').mockImplementation(() => undefined);
jest.spyOn(Logger.prototype, 'verbose').mockImplementation(() => undefined);

describe('ChatController - Filter Endpoints', () => {
  let controller: ChatController;
  let chatService: ChatService;
  let mockChatService: ReturnType<typeof createMockChatService>;

  beforeEach(async () => {
    mockChatService = createMockChatService();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChatController],
      providers: [
        {
          provide: ChatService,
          useValue: mockChatService,
        },
      ],
    }).compile();

    controller = module.get<ChatController>(ChatController);
    chatService = module.get<ChatService>(ChatService);

    jest.clearAllMocks();
  });

  afterAll(async () => {
    // Cleanup if needed
  });

  describe('createFilter', () => {
    it('should create a new filter', async () => {
      const filterData = {
        filterId: 'test-filter-id',
        name: 'Test Filter',
        filterConfig: mockControllerFilter.filterConfig,
        isActive: false,
      };

      mockChatService.createFilter.mockResolvedValue(mockControllerFilter);

      const result = await controller.createFilter('test-chat-id', 'test-user-id', filterData);

      expect(chatService.createFilter).toHaveBeenCalledWith({
        ...filterData,
        userId: 'test-user-id',
        chatId: 'test-chat-id',
      });
      expect(result).toEqual(mockControllerFilter);
    });

    it('should throw BadRequestException on service error', async () => {
      const filterData = {
        filterId: 'test-filter-id',
        name: 'Test Filter',
        filterConfig: mockControllerFilter.filterConfig,
      };

      mockChatService.createFilter.mockRejectedValue(new Error('Service error'));

      await expect(
        controller.createFilter('test-chat-id', 'test-user-id', filterData)
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getChatFilters', () => {
    it('should return all filters for a chat', async () => {
      const filters = [mockControllerFilter, { ...mockControllerFilter, filterId: 'filter-2' }];
      mockChatService.getFiltersForChat.mockResolvedValue(filters);

      const result = await controller.getChatFilters('test-chat-id', 'test-user-id');

      expect(chatService.getFiltersForChat).toHaveBeenCalledWith('test-chat-id', 'test-user-id');
      expect(result).toEqual(filters);
    });

    it('should throw InternalServerErrorException on service error', async () => {
      mockChatService.getFiltersForChat.mockRejectedValue(new Error('Service error'));

      await expect(
        controller.getChatFilters('test-chat-id', 'test-user-id')
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('updateFilter', () => {
    it('should update a filter', async () => {
      const updateData = { name: 'Updated Filter Name' };
      const updatedFilter = { ...mockControllerFilter, ...updateData };

      mockChatService.updateFilter.mockResolvedValue(updatedFilter);

      const result = await controller.updateFilter('test-filter-id', 'test-user-id', updateData);

      expect(chatService.updateFilter).toHaveBeenCalledWith('test-filter-id', 'test-user-id', updateData);
      expect(result).toEqual(updatedFilter);
    });

    it('should throw NotFoundException if filter does not exist', async () => {
      const updateData = { name: 'Updated Filter Name' };
      const notFoundError = new NotFoundException('Filter with ID test-filter-id not found');

      mockChatService.updateFilter.mockRejectedValue(notFoundError);

      await expect(
        controller.updateFilter('test-filter-id', 'test-user-id', updateData)
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteFilter', () => {
    it('should delete a filter', async () => {
      mockChatService.deleteFilter.mockResolvedValue(undefined);

      await controller.deleteFilter('test-filter-id', 'test-user-id');

      expect(chatService.deleteFilter).toHaveBeenCalledWith('test-filter-id', 'test-user-id');
    });

    it('should throw NotFoundException if filter does not exist', async () => {
      const notFoundError = new NotFoundException('Filter with ID test-filter-id not found');

      mockChatService.deleteFilter.mockRejectedValue(notFoundError);

      await expect(
        controller.deleteFilter('test-filter-id', 'test-user-id')
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('setActiveFilter', () => {
    it('should set a filter as active', async () => {
      const updatedChat = { ...mockControllerChat, activeFilterId: 'test-filter-id' };

      mockChatService.setActiveFilter.mockResolvedValue(updatedChat);

      const result = await controller.setActiveFilter('test-chat-id', 'test-user-id', {
        filterId: 'test-filter-id',
      });

      expect(chatService.setActiveFilter).toHaveBeenCalledWith(
        'test-chat-id',
        'test-user-id',
        'test-filter-id'
      );
      expect(result).toEqual(updatedChat);
    });

    it('should deactivate all filters when filterId is null', async () => {
      const updatedChat = { ...mockControllerChat, activeFilterId: null, currentFilterConfig: null };

      mockChatService.setActiveFilter.mockResolvedValue(updatedChat);

      const result = await controller.setActiveFilter('test-chat-id', 'test-user-id', {
        filterId: null,
      });

      expect(chatService.setActiveFilter).toHaveBeenCalledWith(
        'test-chat-id',
        'test-user-id',
        null
      );
      expect(result).toEqual(updatedChat);
    });

    it('should throw NotFoundException if filter does not exist', async () => {
      const notFoundError = new NotFoundException('Filter with ID test-filter-id not found');

      mockChatService.setActiveFilter.mockRejectedValue(notFoundError);

      await expect(
        controller.setActiveFilter('test-chat-id', 'test-user-id', {
          filterId: 'test-filter-id',
        })
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if chat does not exist', async () => {
      const notFoundError = new NotFoundException('Chat with ID test-chat-id not found');

      mockChatService.setActiveFilter.mockRejectedValue(notFoundError);

      await expect(
        controller.setActiveFilter('test-chat-id', 'test-user-id', {
          filterId: 'test-filter-id',
        })
      ).rejects.toThrow(NotFoundException);
    });
  });
});
