import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ChatService } from './chat.service';
import { Chat, ChatMessage, ChatFilter } from '../schemas/chat.schema';
import {
  createMockQuery,
  mockChatData,
  mockMessageData,
  mockFilterData,
  createMockChatModel,
  createMockMessageModel,
  createMockFilterModel,
  createMockChatConstructor,
  createMockMessageConstructor,
  createMockFilterConstructor,
} from '../__mocks__';

describe('ChatService', () => {
  let service: ChatService;
  let mockChatModel: ReturnType<typeof createMockChatModel>;
  let mockMessageModel: ReturnType<typeof createMockMessageModel>;
  let mockFilterModel: ReturnType<typeof createMockFilterModel>;
  let MockChatConstructor: ReturnType<typeof createMockChatConstructor>;
  let MockMessageConstructor: ReturnType<typeof createMockMessageConstructor>;
  let MockFilterConstructor: ReturnType<typeof createMockFilterConstructor>;

  const mockChat = {
    ...mockChatData,
    save: jest.fn().mockResolvedValue(true),
  };

  const mockMessage = {
    ...mockMessageData,
    save: jest.fn().mockResolvedValue(true),
  };

  const mockFilter = {
    ...mockFilterData,
    save: jest.fn().mockResolvedValue(true),
  };

  beforeEach(async () => {
    mockChatModel = createMockChatModel();
    mockMessageModel = createMockMessageModel();
    mockFilterModel = createMockFilterModel();
    MockChatConstructor = createMockChatConstructor(mockChat);
    MockMessageConstructor = createMockMessageConstructor(mockMessage);
    MockFilterConstructor = createMockFilterConstructor(mockFilter);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatService,
        { provide: getModelToken(Chat.name), useValue: Object.assign(MockChatConstructor, mockChatModel) },
        { provide: getModelToken(ChatMessage.name), useValue: Object.assign(MockMessageConstructor, mockMessageModel) },
        { provide: getModelToken(ChatFilter.name), useValue: Object.assign(MockFilterConstructor, mockFilterModel) },
      ],
    }).compile();

    service = module.get<ChatService>(ChatService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Chat Management', () => {
    describe('createChat', () => {
      it('should create a new chat', async () => {
        const input = { userId: 'test-user-id', chatId: 'test-chat-id', name: 'New Chat' };
        mockChatModel.findOne.mockReturnValue(createMockQuery(null));
        const createdChat = { ...mockChat, name: 'New Chat' };
        MockChatConstructor.mockReturnValueOnce({ ...createdChat, save: jest.fn().mockResolvedValue(createdChat) });

        const result = await service.createChat(input);

        expect(mockChatModel.findOne).toHaveBeenCalledWith({ chatId: input.chatId, userId: input.userId });
        expect(MockChatConstructor).toHaveBeenCalledWith(expect.objectContaining({ chatId: input.chatId, userId: input.userId, name: input.name }));
        expect(result.name).toBe('New Chat');
      });

      it('should return existing chat if it already exists', async () => {
        const input = { userId: 'test-user-id', chatId: 'test-chat-id', name: 'Existing Chat' };
        mockChatModel.findOne.mockReturnValue(createMockQuery(mockChat));

        const result = await service.createChat(input);

        expect(result).toEqual(mockChat);
        expect(MockChatConstructor).not.toHaveBeenCalled();
      });

      it('should generate chatId if not provided', async () => {
        mockChatModel.findOne.mockReturnValue(createMockQuery(null));
        await service.createChat({ userId: 'test-user-id', name: 'New Chat' });
        expect(MockChatConstructor).toHaveBeenCalled();
      });

      it('should use default name if not provided', async () => {
        mockChatModel.findOne.mockReturnValue(createMockQuery(null));
        await service.createChat({ userId: 'test-user-id', chatId: 'test-chat-id' });
        expect(MockChatConstructor.mock.calls[0][0].name).toBe('New Chat');
      });
    });

    describe('getChat', () => {
      it('should return a chat by id', async () => {
        mockChatModel.findOne.mockReturnValue(createMockQuery(mockChat));
        const result = await service.getChat('test-chat-id', 'test-user-id');
        expect(mockChatModel.findOne).toHaveBeenCalledWith({ chatId: 'test-chat-id', userId: 'test-user-id' });
        expect(result).toEqual(mockChat);
      });

      it('should throw NotFoundException if chat does not exist', async () => {
        mockChatModel.findOne.mockReturnValue(createMockQuery(null));
        await expect(service.getChat('non-existent-id', 'test-user-id')).rejects.toThrow(NotFoundException);
      });
    });

    describe('updateChatName', () => {
      it('should update chat name', async () => {
        const updatedChat = { ...mockChat, name: 'Updated Name' };
        mockChatModel.findOneAndUpdate.mockReturnValue(createMockQuery(updatedChat));

        const result = await service.updateChatName('test-chat-id', 'test-user-id', 'Updated Name');

        expect(mockChatModel.findOneAndUpdate).toHaveBeenCalledWith(
          { chatId: 'test-chat-id', userId: 'test-user-id' },
          { name: 'Updated Name', updatedAt: expect.any(Date) },
          { new: true }
        );
        expect(result).toEqual(updatedChat);
      });

      it('should throw BadRequestException if name is empty', async () => {
        await expect(service.updateChatName('test-chat-id', 'test-user-id', '   ')).rejects.toThrow(BadRequestException);
      });

      it('should throw NotFoundException if chat does not exist', async () => {
        mockChatModel.findOneAndUpdate.mockReturnValue(createMockQuery(null));
        await expect(service.updateChatName('non-existent-id', 'test-user-id', 'New Name')).rejects.toThrow(NotFoundException);
      });
    });

    describe('listChats', () => {
      it('should return all chats for a user', async () => {
        const chats = [mockChat, { ...mockChat, chatId: 'chat-2' }];
        mockChatModel.find.mockReturnValue(createMockQuery(chats));

        const result = await service.listChats('test-user-id');

        expect(mockChatModel.find).toHaveBeenCalledWith({ userId: 'test-user-id' });
        expect(result).toEqual(chats);
      });
    });

    describe('deleteChat', () => {
      it('should delete a chat and associated messages and filters', async () => {
        mockChatModel.findOneAndDelete.mockReturnValue(createMockQuery(mockChat));
        mockMessageModel.deleteMany.mockReturnValue(createMockQuery({ deletedCount: 5 }));
        mockFilterModel.deleteMany.mockReturnValue(createMockQuery({ deletedCount: 2 }));

        await service.deleteChat('test-chat-id', 'test-user-id');

        expect(mockChatModel.findOneAndDelete).toHaveBeenCalledWith({ chatId: 'test-chat-id', userId: 'test-user-id' });
        expect(mockMessageModel.deleteMany).toHaveBeenCalledWith({ chatId: 'test-chat-id', userId: 'test-user-id' });
        expect(mockFilterModel.deleteMany).toHaveBeenCalledWith({ chatId: 'test-chat-id', userId: 'test-user-id' });
      });

      it('should throw NotFoundException if chat does not exist', async () => {
        mockChatModel.findOneAndDelete.mockReturnValue(createMockQuery(null));
        await expect(service.deleteChat('non-existent-id', 'test-user-id')).rejects.toThrow(NotFoundException);
      });
    });
  });

  describe('Message Management', () => {
    describe('addMessage', () => {
      const baseMessageDto = { id: 'test-message-id', chatId: 'test-chat-id', userId: 'test-user-id', role: 'user' as const, content: 'Test message' };

      it('should add a new message', async () => {
        mockChatModel.findOneAndUpdate.mockReturnValue(createMockQuery(mockChat));
        mockMessageModel.findOne.mockReturnValue(createMockQuery(null));

        const result = await service.addMessage(baseMessageDto);

        expect(mockMessageModel.findOne).toHaveBeenCalledWith({ id: baseMessageDto.id, chatId: baseMessageDto.chatId, userId: baseMessageDto.userId });
        expect(result.chatId).toBe(baseMessageDto.chatId);
        expect(result.userId).toBe(baseMessageDto.userId);
        expect(result.content).toBe(baseMessageDto.content);
      });

      it('should skip duplicate messages', async () => {
        mockChatModel.findOneAndUpdate.mockReturnValue(createMockQuery(mockChat));
        mockMessageModel.findOne.mockReturnValue(createMockQuery(mockMessage));

        const result = await service.addMessage({ ...baseMessageDto, id: 'existing-message-id' });

        expect(MockMessageConstructor).not.toHaveBeenCalled();
        expect(result).toEqual(mockMessage);
      });

      it('should create chat if it does not exist', async () => {
        mockChatModel.findOneAndUpdate.mockReturnValue(createMockQuery(mockChat));
        mockMessageModel.findOne.mockReturnValue(createMockQuery(null));

        await service.addMessage({ ...baseMessageDto, chatId: 'new-chat-id' });

        expect(mockChatModel.findOneAndUpdate).toHaveBeenCalledWith(
          { chatId: 'new-chat-id', userId: baseMessageDto.userId },
          expect.any(Object),
          { upsert: true, new: true }
        );
      });

      it('should apply active filter if message has no filter', async () => {
        mockChatModel.findOneAndUpdate.mockReturnValue(createMockQuery({ ...mockChat, activeFilterId: 'active-filter-id' }));
        mockMessageModel.findOne.mockReturnValue(createMockQuery(null));
        mockFilterModel.findOne.mockReturnValue(createMockQuery({ ...mockFilter, isActive: true }));

        await service.addMessage(baseMessageDto);

        expect(mockFilterModel.findOne).toHaveBeenCalledWith({ filterId: 'active-filter-id', userId: 'test-user-id', isActive: true });
      });
    });

    describe('getChatMessages', () => {
      it('should return all messages for a chat', async () => {
        const messages = [mockMessage, { ...mockMessage, id: 'msg-2' }];
        mockChatModel.findOne.mockReturnValue(createMockQuery(mockChat));
        mockMessageModel.find.mockReturnValue(createMockQuery(messages));

        const result = await service.getChatMessages('test-chat-id', 'test-user-id');

        expect(mockChatModel.findOne).toHaveBeenCalledWith({ chatId: 'test-chat-id', userId: 'test-user-id' });
        expect(mockMessageModel.find).toHaveBeenCalledWith({ chatId: 'test-chat-id', userId: 'test-user-id' });
        expect(result).toEqual(messages);
      });

      it('should return empty array if chat does not exist', async () => {
        mockChatModel.findOne.mockReturnValue(createMockQuery(null));
        const result = await service.getChatMessages('non-existent-id', 'test-user-id');
        expect(result).toEqual([]);
      });
    });

    describe('deleteMessagesFrom', () => {
      it('should delete messages from a specific point', async () => {
        const targetMessage = { ...mockMessage, timestamp: new Date('2024-01-15') };
        const latestMessage = { ...mockMessage, id: 'latest-msg', timestamp: new Date('2024-01-10') };

        mockChatModel.findOne.mockReturnValue(createMockQuery(mockChat));
        mockMessageModel.findOne
          .mockReturnValueOnce(createMockQuery(targetMessage))
          .mockReturnValueOnce(createMockQuery(latestMessage));
        mockMessageModel.deleteMany.mockReturnValue(createMockQuery({ deletedCount: 3 }));
        mockMessageModel.countDocuments.mockReturnValue(createMockQuery(5));
        mockChatModel.findOneAndUpdate.mockReturnValue(createMockQuery(mockChat));

        await service.deleteMessagesFrom('test-chat-id', 'test-user-id', 'test-message-id');

        expect(mockMessageModel.deleteMany).toHaveBeenCalledWith({
          chatId: 'test-chat-id',
          userId: 'test-user-id',
          timestamp: { $gte: targetMessage.timestamp },
        });
      });
    });
  });

  describe('Filter Management', () => {
    describe('createFilter', () => {
      it('should create a new filter', async () => {
        const filterDto = { filterId: 'test-filter-id', name: 'Test Filter', userId: 'test-user-id', chatId: 'test-chat-id', filterConfig: { dateFilter: { type: 'custom' } } };
        mockFilterModel.findOne.mockReturnValue(createMockQuery(null));
        mockChatModel.findOneAndUpdate.mockReturnValue(createMockQuery(mockChat));

        const result = await service.createFilter(filterDto);

        expect(mockFilterModel.findOne).toHaveBeenCalledWith({ filterId: filterDto.filterId, userId: filterDto.userId });
        expect(MockFilterConstructor).toHaveBeenCalledWith(expect.objectContaining({ ...filterDto, version: 1 }));
        expect(mockChatModel.findOneAndUpdate).toHaveBeenCalledWith(
          { chatId: filterDto.chatId, userId: filterDto.userId },
          { $addToSet: { associatedFilters: filterDto.filterId } }
        );
        expect(result.filterId).toBe(filterDto.filterId);
      });
    });

    describe('getFiltersForChat', () => {
      it('should return all filters for a chat including global filters', async () => {
        const chatFilters = [mockFilter, { ...mockFilter, filterId: 'filter-2' }];
        const globalFilters = [{ ...mockFilter, filterId: 'global-filter', chatId: null }];
        mockFilterModel.find
          .mockReturnValueOnce(createMockQuery(chatFilters))
          .mockReturnValueOnce(createMockQuery(globalFilters));

        const result = await service.getFiltersForChat('test-chat-id', 'test-user-id');

        expect(mockFilterModel.find).toHaveBeenCalledWith({ userId: 'test-user-id', chatId: 'test-chat-id' });
        expect(mockFilterModel.find).toHaveBeenCalledWith({ userId: 'test-user-id', chatId: null });
        expect(result).toEqual([...chatFilters, ...globalFilters]);
      });
    });

    describe('updateFilter', () => {
      it('should create a new version when updating a filter', async () => {
        mockFilterModel.findOne.mockReturnValue(createMockQuery(mockFilter));
        mockFilterModel.updateMany.mockReturnValue(createMockQuery({ modifiedCount: 1 }));

        const result = await service.updateFilter('test-filter-id', 'test-user-id', { name: 'Updated Filter' });

        expect(mockFilterModel.findOne).toHaveBeenCalledWith({ filterId: 'test-filter-id', userId: 'test-user-id' });
        expect(mockFilterModel.updateMany).toHaveBeenCalledWith({ filterId: 'test-filter-id', userId: 'test-user-id' }, { isActive: false });
        expect(MockFilterConstructor).toHaveBeenCalledWith(expect.objectContaining({ filterId: 'test-filter-id', version: 2, name: 'Updated Filter' }));
        expect(result.filterId).toBe('test-filter-id');
      });

      it('should throw NotFoundException if filter does not exist', async () => {
        mockFilterModel.findOne.mockReturnValue(createMockQuery(null));
        await expect(service.updateFilter('non-existent-id', 'test-user-id', { name: 'New Name' })).rejects.toThrow(NotFoundException);
      });
    });

    describe('setActiveFilter', () => {
      it('should set a filter as active', async () => {
        const updatedChat = { ...mockChat, activeFilterId: 'test-filter-id', currentFilterConfig: mockFilter.filterConfig };
        mockFilterModel.updateMany.mockReturnValue(createMockQuery({ modifiedCount: 1 }));
        mockFilterModel.findOne.mockReturnValue(createMockQuery(mockFilter));
        mockFilterModel.findOneAndUpdate.mockReturnValue(createMockQuery({ ...mockFilter, isActive: true }));
        mockChatModel.findOneAndUpdate.mockReturnValue(createMockQuery(updatedChat));

        const result = await service.setActiveFilter('test-chat-id', 'test-user-id', 'test-filter-id');

        expect(mockFilterModel.updateMany).toHaveBeenCalledWith({ userId: 'test-user-id', chatId: 'test-chat-id' }, { isActive: false });
        expect(mockFilterModel.findOne).toHaveBeenCalledWith({ filterId: 'test-filter-id', userId: 'test-user-id', $or: [{ chatId: 'test-chat-id' }, { chatId: null }] });
        expect(mockFilterModel.findOneAndUpdate).toHaveBeenCalledWith({ filterId: 'test-filter-id', userId: 'test-user-id', version: mockFilter.version }, { isActive: true });
        expect(mockChatModel.findOneAndUpdate).toHaveBeenCalledWith(
          { chatId: 'test-chat-id', userId: 'test-user-id' },
          { activeFilterId: 'test-filter-id', currentFilterConfig: mockFilter.filterConfig },
          { new: true }
        );
        expect(result).toEqual(updatedChat);
      });

      it('should deactivate all filters when setting to null', async () => {
        const updatedChat = { ...mockChat, activeFilterId: null, currentFilterConfig: null };
        mockFilterModel.updateMany.mockReturnValue(createMockQuery({ modifiedCount: 2 }));
        mockChatModel.findOneAndUpdate.mockReturnValue(createMockQuery(updatedChat));

        const result = await service.setActiveFilter('test-chat-id', 'test-user-id', null);

        expect(mockFilterModel.updateMany).toHaveBeenCalledWith({ userId: 'test-user-id', chatId: 'test-chat-id' }, { isActive: false });
        expect(mockChatModel.findOneAndUpdate).toHaveBeenCalledWith(
          { chatId: 'test-chat-id', userId: 'test-user-id' },
          { activeFilterId: null, currentFilterConfig: null },
          { new: true }
        );
        expect(result).toEqual(updatedChat);
      });

      it('should throw NotFoundException if filter does not exist', async () => {
        mockFilterModel.updateMany.mockReturnValue(createMockQuery({ modifiedCount: 1 }));
        mockFilterModel.findOne.mockReturnValue(createMockQuery(null));
        await expect(service.setActiveFilter('test-chat-id', 'test-user-id', 'non-existent-id')).rejects.toThrow(NotFoundException);
      });

      it('should throw NotFoundException if chat does not exist', async () => {
        mockFilterModel.updateMany.mockReturnValue(createMockQuery({ modifiedCount: 1 }));
        mockFilterModel.findOne.mockReturnValue(createMockQuery(mockFilter));
        mockFilterModel.findOneAndUpdate.mockReturnValue(createMockQuery({ ...mockFilter, isActive: true }));
        mockChatModel.findOneAndUpdate.mockReturnValue(createMockQuery(null));
        await expect(service.setActiveFilter('non-existent-chat-id', 'test-user-id', 'test-filter-id')).rejects.toThrow(NotFoundException);
      });
    });

    describe('deleteFilter', () => {
      it('should delete all versions of a filter', async () => {
        mockFilterModel.find.mockReturnValue(createMockQuery([mockFilter, { ...mockFilter, version: 2 }]));
        mockFilterModel.deleteMany.mockReturnValue(createMockQuery({ deletedCount: 2 }));
        mockChatModel.updateMany.mockReturnValue(createMockQuery({ modifiedCount: 1 }));

        await service.deleteFilter('test-filter-id', 'test-user-id');

        expect(mockFilterModel.find).toHaveBeenCalledWith({ filterId: 'test-filter-id', userId: 'test-user-id' });
        expect(mockFilterModel.deleteMany).toHaveBeenCalledWith({ filterId: 'test-filter-id', userId: 'test-user-id' });
        expect(mockChatModel.updateMany).toHaveBeenCalledWith({ userId: 'test-user-id' }, { $pull: { associatedFilters: 'test-filter-id' } });
        expect(mockChatModel.updateMany).toHaveBeenCalledWith(
          { userId: 'test-user-id', activeFilterId: 'test-filter-id' },
          { $unset: { activeFilterId: 1 }, $set: { currentFilterConfig: null } }
        );
      });

      it('should throw NotFoundException if filter does not exist', async () => {
        mockFilterModel.find.mockReturnValue(createMockQuery([]));
        await expect(service.deleteFilter('non-existent-id', 'test-user-id')).rejects.toThrow(NotFoundException);
      });
    });
  });
});
