Build a minimal chat app that demonstrates resumable streaming — a stream that
survives a page refresh. Stack: React (client), NestJS (server), MongoDB.

CORE IDEA
The text generation must run independently of the client's HTTP connection.
The client only listens to it and can re-attach at any time. Do NOT tie
generation to the request lifecycle and do NOT cancel it on client disconnect.

SERVER (NestJS)

1. Mock the "third-party LLM" with a fake async generator that yields one word
   every ~200ms for a long sentence (no real API needed).
2. Keep an in-memory Map<messageId, session> of active generations, where
   session = { chunks: string[], subscribers: Set<fn>, done: boolean }.
3. POST /messages:
   - Create a chatMessage in MongoDB with status 'streaming' and empty content.
   - Put a session in the Map and start the fake generator as fire-and-forget
     (NOT awaited by the request). For each chunk: push to session.chunks,
     notify subscribers, and persist content to MongoDB debounced (~300ms).
   - On finish: set status 'done', persist final content, delete from Map.
   - Return { messageId } immediately.
4. GET /messages/:id/stream → SSE endpoint (@Sse()):
   - Read Last-Event-ID header (default -1).
   - If session exists in Map: replay session.chunks after Last-Event-ID, then
     subscribe to live chunks. Tag every SSE event with id = chunk index.
   - If session is gone: read the finished message from MongoDB and send it.
   - Emit a 'done' event when generation completes.

CLIENT (React)

1. Send button → POST /messages → get messageId → open EventSource to the
   stream endpoint and append each event to the message text.
2. On mount, fetch the chat and find any message with status 'streaming';
   if found, open an EventSource to its stream endpoint to resume.
   EventSource auto-reconnects and sends Last-Event-ID, so a refresh or a
   network blip continues exactly from the next chunk.

Keep it single-instance and minimal. Provide the full server and client code.
