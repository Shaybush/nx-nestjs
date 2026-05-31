import { Controller, Post, Body, Res, HttpStatus, Logger, BadRequestException } from '@nestjs/common';
import type { Response } from 'express';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiConsumes,
  ApiProduces,
  ApiUnauthorizedResponse,
  ApiExtraModels,
} from '@nestjs/swagger';
import { ChatService } from '../services/chat.service';
import { environment } from '../../environments/environment';
import { ChatRequestDto, ChatMessageDto } from '../dto/chat.dto';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

interface StreamCompleteChunk {
  chunkType: string;
  data?: { finalContent?: string };
}

function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

function findLastUserMessageIndex(messages: ChatMessageDto[]): number {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === 'user') {
      return i;
    }
  }
  return -1;
}

@ApiTags('Chat Streaming')
@ApiExtraModels(ChatRequestDto)
@Controller('chat')
export class StreamingController {
  private readonly logger = new Logger(StreamingController.name);

  constructor(
    private readonly chatService: ChatService,
    private readonly httpService: HttpService
  ) {}

  @Post('stream')
  @ApiOperation({
    summary: 'Send a chat message with structured streaming response',
    description:
      'Send a message to the AI assistant and receive a streaming response with structured chunks. Each chunk has a specific type (start, token, metadata, progress, complete, error) for better control and visualization. Requires authentication.',
  })
  @ApiConsumes('application/json')
  @ApiProduces('application/json')
  @ApiBody({
    type: ChatRequestDto,
    description: 'Chat request with authentication, chat ID, messages, and optional tools',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Successfully started structured streaming response',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            chunkType: {
              type: 'string',
              enum: ['start', 'token', 'metadata', 'progress', 'complete', 'error'],
              example: 'token',
              description: 'Type of chunk being sent',
            },
            data: {
              type: 'object',
              example: {
                token: 'Hello',
                index: 1,
                totalTokens: 150,
                progress: 1,
                tokenType: 'word',
                confidence: 0.95,
              },
              description: 'Chunk-specific data payload',
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              example: '2024-01-01T12:00:00Z',
            },
            sessionId: {
              type: 'string',
              example: 'session_1640995200000_abc123',
              description: 'Unique session identifier for this streaming response',
            },
          },
        },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication required',
  })
  async streamChat(@Body() request: ChatRequestDto, @Res() res: Response): Promise<void> {
    const { chatId, auth, messages, tools, requestTimestamp } = request;

    this.validateRequest(chatId, auth, messages);

    this.logger.log(
      `Proxying chat request: chatId=${chatId}, userId=${auth.userId}, messageCount=${messages.length}, toolsEnabled=${tools?.length || 0}, timestamp=${requestTimestamp || new Date().toISOString()}`
    );

    const processedMessages: ChatMessage[] = messages.map((msg) => ({
      id: msg.id,
      role: msg.role,
      content: msg.content,
      timestamp: new Date(msg.timestamp),
    }));

    await this.ensureChatExists(chatId, auth.userId, messages);

    const lastUserMessageIndex = findLastUserMessageIndex(messages);
    const lastUserMessageDto = lastUserMessageIndex >= 0 ? messages[lastUserMessageIndex] : undefined;
    const lastUserMessage = lastUserMessageIndex >= 0 ? processedMessages[lastUserMessageIndex] : undefined;
    const assistantPlaceholderDto = messages[messages.length - 1];

    const sessionId = generateSessionId();

    if (lastUserMessage && lastUserMessageDto) {
      await this.saveUserMessage(chatId, auth.userId, lastUserMessage, lastUserMessageDto, sessionId);
    }

    this.setStreamingHeaders(res);

    const abortController = new AbortController();
    let isClientDisconnected = false;

    const handleClientDisconnect = (): void => {
      if (isClientDisconnected) {
        return;
      }
      isClientDisconnected = true;
      this.logger.warn('Client disconnected, canceling stream to agent-api');
      abortController.abort();
    };

    res.on('close', handleClientDisconnect);
    res.on('error', handleClientDisconnect);

    try {
      const agentApiUrl = `${environment.agentApi.url}/api/chat/stream`;
      this.logger.log(`Forwarding request to agent-api: ${agentApiUrl}`);

      const response = await firstValueFrom(
        this.httpService.post(agentApiUrl, request, {
          responseType: 'stream',
          signal: abortController.signal,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const stream = response.data;
      const decoder = new TextDecoder();
      let finalContent = '';
      let completeChunk: StreamCompleteChunk | null = null;
      let buffer = '';

      stream.on('error', (error: Error) => {
        if (error.name === 'AbortError' || isClientDisconnected) {
          this.logger.log('Stream canceled due to client disconnect');
          return;
        }
        this.logger.error('Stream error:', error);
      });

      for await (const chunk of stream) {
        if (isClientDisconnected) {
          this.logger.log('Stopping stream processing - client disconnected');
          break;
        }

        buffer += decoder.decode(chunk, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim() || isClientDisconnected) {
            continue;
          }

          try {
            const parsed = JSON.parse(line);

            if (parsed.chunkType === 'token' && parsed.data?.token) {
              finalContent += parsed.data.token;
            }

            if (parsed.chunkType === 'complete') {
              completeChunk = parsed;
            }

            if (!isClientDisconnected) {
              res.write(line + '\n');
            }
          } catch {
            this.logger.error('Failed to parse chunk');
          }
        }
      }

      if (isClientDisconnected) {
        this.logger.warn('Client disconnected before stream completion');
        if (stream && typeof stream.destroy === 'function') {
          stream.destroy();
        }
        return;
      }

      if (buffer.trim()) {
        try {
          const parsed = JSON.parse(buffer);

          if (parsed.chunkType === 'token' && parsed.data?.token) {
            finalContent += parsed.data.token;
          }

          if (parsed.chunkType === 'complete') {
            completeChunk = parsed;
          }

          res.write(buffer + '\n');
        } catch {
          this.logger.error('Failed to parse final buffer');
        }
      }

      if (completeChunk?.data?.finalContent) {
        finalContent = completeChunk.data.finalContent;
      }

      if (assistantPlaceholderDto?.role === 'assistant' && finalContent) {
        await this.saveAssistantMessage(
          chatId,
          auth.userId,
          assistantPlaceholderDto,
          lastUserMessageDto,
          finalContent,
          sessionId
        );
      }

      if (!res.closed) {
        res.end();
      }
    } catch (error) {
      this.handleProxyError(res, error, sessionId);
    }
  }

  private validateRequest(
    chatId: string | undefined,
    auth: { userId?: string } | undefined,
    messages: ChatMessageDto[] | undefined
  ): void {
    if (!auth?.userId) {
      throw new BadRequestException('Missing or invalid auth object with userId');
    }

    if (!chatId) {
      throw new BadRequestException('chatId is required');
    }

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      throw new BadRequestException('messages array is required and must not be empty');
    }
  }

  private async ensureChatExists(
    chatId: string,
    userId: string,
    messages: ChatMessageDto[]
  ): Promise<void> {
    const chatName = this.deriveChatName(messages);
    try {
      await this.chatService.ensureChatExists({ chatId, userId, name: chatName });
    } catch (error) {
      this.logger.error('Failed to ensure chat exists:', error);
    }
  }

  private async saveUserMessage(
    chatId: string,
    userId: string,
    message: ChatMessage,
    messageDto: ChatMessageDto,
    sessionId: string
  ): Promise<void> {
    try {
      let filterId = null;
      let filterVersion = null;

      if (messageDto.filterId && messageDto.filterVersion) {
        filterId = messageDto.filterId;
        filterVersion = messageDto.filterVersion;
        await this.chatService.setActiveFilter(chatId, userId, filterId);
        this.logger.log(`Filter set as active: ${filterId}, version: ${filterVersion}`);
      }

      await this.chatService.addMessage({
        id: message.id,
        chatId,
        userId,
        role: message.role,
        content: message.content,
        timestamp: message.timestamp,
        metadata: {
          'iagent-version': environment.app.version,
          'session-id': sessionId,
        },
        filterId,
        filterVersion: filterVersion || undefined,
      });

      this.logger.log('User message saved with filter data');
    } catch (error) {
      this.logger.error('Failed to save user message with filter data:', error);
    }
  }

  private async saveAssistantMessage(
    chatId: string,
    userId: string,
    assistantDto: ChatMessageDto,
    userMessageDto: ChatMessageDto | undefined,
    content: string,
    sessionId: string
  ): Promise<void> {
    try {
      await this.chatService.addMessage({
        id: assistantDto.id,
        chatId,
        userId,
        role: 'assistant',
        content,
        timestamp: new Date(),
        metadata: {
          'iagent-version': environment.app.version,
          'session-id': sessionId,
        },
        filterId: assistantDto.filterId || userMessageDto?.filterId || null,
        filterVersion: assistantDto.filterVersion || userMessageDto?.filterVersion || null,
      });
      this.logger.log('Assistant message saved to chat history');
    } catch (error) {
      this.logger.error('Failed to save assistant message:', error);
    }
  }

  private setStreamingHeaders(res: Response): void {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Cache-Control, Content-Type');
  }

  private handleProxyError(res: Response, error: unknown, sessionId: string): void {
    this.logger.error('Error proxying to agent-api:', error);

    if (!res.headersSent) {
      this.setStreamingHeaders(res);
    }

    const errorChunk = {
      chunkType: 'error',
      data: {
        error: {
          message: 'An error occurred while proxying to agent-api',
          code: 'PROXY_ERROR',
          details: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString(),
          recoverable: true,
        },
      },
      timestamp: new Date().toISOString(),
      sessionId: sessionId || 'unknown',
    };

    try {
      res.write(JSON.stringify(errorChunk) + '\n');
      res.end();
    } catch (writeError) {
      this.logger.error('Failed to write error chunk:', writeError);
      try {
        res.end();
      } catch (endError) {
        this.logger.error('Failed to end response:', endError);
      }
    }
  }

  private deriveChatName(messages: ChatMessageDto[]): string {
    const firstUserMessage = messages.find((msg) => msg.role === 'user' && msg.content?.trim().length);
    if (!firstUserMessage) {
      return 'New Chat';
    }

    const normalized = firstUserMessage.content.trim().replace(/\s+/g, ' ');
    if (normalized.length <= 60) {
      return normalized;
    }

    return `${normalized.slice(0, 57)}...`;
  }
}
