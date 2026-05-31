import type {
  StreamingTokenMetadata,
  StreamingCompletionPayload,
  ParsedMessageContent,
} from '@iagent/shared-renderer';
import { createStreamingMarkupBuilder } from '@iagent/shared-renderer';
import type { Message } from '@iagent/chat-types';

type SectionName = 'reasoning' | 'tool-t' | 'tool-h' | 'tool-f' | 'answer';
type SectionBuilder = ReturnType<typeof createStreamingMarkupBuilder>;
type SectionData = { content: string; parsed: ParsedMessageContent };

interface StreamChunk {
  chunkType: 'start' | 'metadata' | 'section' | 'token' | 'progress' | 'complete' | 'error';
  data?: {
    token?: string;
    cumulativeContent?: string;
    section?: SectionName;
    contentType?: string;
    action?: 'start' | 'end';
    finalContent?: string;
    error?: { message: string };
    [key: string]: unknown;
  };
  timestamp?: string;
  sessionId?: string;
}

function generateChatId(): string {
  return `chat_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

function buildSectionData(builder: SectionBuilder): SectionData {
  const parsed = builder.getCurrent();
  return {
    content: parsed.plainText || '',
    parsed,
  };
}

function collectFinalSections(
  builders: Record<string, SectionBuilder>
): Record<string, SectionData> {
  const sections: Record<string, SectionData> = {};
  for (const [key, builder] of Object.entries(builders)) {
    sections[key] = buildSectionData(builder);
  }
  return sections;
}

export class StreamingClient {
  private abortController: AbortController | null = null;

  async streamChat(
    messages: Message[],
    onToken: (token: string, metadata?: StreamingTokenMetadata) => void,
    onComplete: (result: StreamingCompletionPayload) => void,
    onError: (error: Error) => void,
    baseUrl = 'http://localhost:3030',
    authToken?: string,
    chatId?: string,
    tools?: unknown[],
    dateFilter?: unknown,
    selectedCountries?: string[]
  ): Promise<void> {
    this.abortController = new AbortController();

    try {
      const requestBody = {
        chatId: chatId || generateChatId(),
        auth: {
          token: authToken || '',
          userId: 'user_123456789',
        },
        messages: messages.map((msg) => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          timestamp: new Date().toISOString(),
          filterId: msg.filterId,
          filterVersion: msg.filterVersion,
        })),
        tools: tools || [],
        dateFilter: dateFilter || null,
        selectedCountries: selectedCountries || [],
        requestTimestamp: new Date().toISOString(),
        clientInfo: {
          userAgent:
            (globalThis as { navigator?: { userAgent?: string } })?.navigator?.userAgent ||
            'Unknown',
          timestamp: Date.now(),
        },
      };

      const response = await fetch(`${baseUrl}/api/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken && { Authorization: `Bearer ${authToken}` }),
        },
        body: JSON.stringify(requestBody),
        signal: this.abortController.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        return;
      }

      const decoder = new TextDecoder();
      const markupBuilder = createStreamingMarkupBuilder();
      const sectionBuilders: Record<string, SectionBuilder> = {};

      let buffer = '';
      let latestParsed = markupBuilder.getCurrent();
      let completionMetadata: Record<string, unknown> | undefined;
      let currentSection: SectionName | undefined;
      let sections: Record<string, SectionData> = {};

      try {
        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            Object.assign(sections, collectFinalSections(sectionBuilders));

            onComplete({
              content: latestParsed.plainText || '',
              parsed: latestParsed,
              metadata: {
                ...completionMetadata,
                sections,
                currentSection,
              },
              sessionId: completionMetadata?.sessionId as string | undefined,
            });
            this.abortController = null;
            break;
          }

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (!line.trim()) {
              continue;
            }

            try {
              const chunk: StreamChunk = JSON.parse(line);
              const result = this.processChunk(
                chunk,
                markupBuilder,
                sectionBuilders,
                sections,
                currentSection,
                latestParsed,
                onToken
              );

              latestParsed = result.latestParsed;
              currentSection = result.currentSection;
              sections = result.sections;

              if (result.completionMetadata) {
                completionMetadata = result.completionMetadata;
              }
            } catch {
              // Skip unparseable chunks
            }
          }
        }
      } finally {
        reader.releaseLock();
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        // Stream was intentionally aborted
      } else {
        onError(error instanceof Error ? error : new Error('Unknown API streaming error'));
      }
      this.abortController = null;
    }
  }

  private processChunk(
    chunk: StreamChunk,
    markupBuilder: SectionBuilder,
    sectionBuilders: Record<string, SectionBuilder>,
    sections: Record<string, SectionData>,
    currentSection: SectionName | undefined,
    latestParsed: ParsedMessageContent,
    onToken: (token: string, metadata?: StreamingTokenMetadata) => void
  ): {
    latestParsed: ParsedMessageContent;
    currentSection: SectionName | undefined;
    sections: Record<string, SectionData>;
    completionMetadata?: Record<string, unknown>;
  } {
    let completionMetadata: Record<string, unknown> | undefined;

    switch (chunk.chunkType) {
      case 'start':
        markupBuilder.reset();
        latestParsed = markupBuilder.getCurrent();
        currentSection = undefined;
        sections = {};
        for (const key of Object.keys(sectionBuilders)) {
          delete sectionBuilders[key];
        }
        break;

      case 'section': {
        const sectionName = chunk.data?.section;
        const action = chunk.data?.action;

        if (sectionName && action === 'start') {
          currentSection = sectionName;
          if (!sectionBuilders[sectionName]) {
            sectionBuilders[sectionName] = createStreamingMarkupBuilder();
          }
        } else if (sectionName && action === 'end') {
          if (sectionBuilders[sectionName]) {
            sections[sectionName] = buildSectionData(sectionBuilders[sectionName]);
          }
          currentSection = undefined;
        }
        break;
      }

      case 'token': {
        const tokenSection = chunk.data?.section;
        const tokenContentType = chunk.data?.contentType;

        latestParsed = markupBuilder.append({
          token: chunk.data?.token,
          cumulativeContent: chunk.data?.cumulativeContent,
        });

        if (tokenSection && sectionBuilders[tokenSection]) {
          const sectionBuilder = sectionBuilders[tokenSection];
          sectionBuilder.append({ token: chunk.data?.token });
          sections[tokenSection] = buildSectionData(sectionBuilder);
        }

        onToken(chunk.data?.token || '', {
          ...chunk.data,
          timestamp: chunk.timestamp,
          sessionId: chunk.sessionId,
          parsed: latestParsed,
          section: tokenSection,
          contentType: tokenContentType,
          sectionContent: tokenSection && sectionBuilders[tokenSection]
            ? sectionBuilders[tokenSection].getCurrent().plainText
            : undefined,
          sections: tokenSection ? { ...sections } : undefined,
        } as StreamingTokenMetadata);
        break;
      }

      case 'complete':
        Object.assign(sections, collectFinalSections(sectionBuilders));

        completionMetadata = {
          ...chunk.data,
          timestamp: chunk.timestamp,
          sessionId: chunk.sessionId,
          sections,
          currentSection,
        };

        if (typeof chunk.data?.finalContent === 'string') {
          latestParsed = markupBuilder.append({
            cumulativeContent: chunk.data.finalContent,
          });
        }
        break;

      case 'error':
        throw new Error(chunk.data?.error?.message || 'Unknown streaming error');

      case 'metadata':
      case 'progress':
      default:
        // These chunk types don't require processing
        break;
    }

    return { latestParsed, currentSection, sections, completionMetadata };
  }

  abort(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }

  isStreaming(): boolean {
    return this.abortController !== null && !this.abortController.signal.aborted;
  }
}
