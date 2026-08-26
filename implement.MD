I need you to fix the authenticated WebSocket chat connection in my DropVault application.

Context:
- Frontend: Next.js 16 + React + TypeScript
- Backend: Node.js + Express + TypeScript
- Authentication: Better Auth
- Database: PostgreSQL + Drizzle ORM
- AI/RAG server: FastAPI
- Vector DB: Qdrant
- WebSocket library: ws
- Backend runs on localhost:8080
- Frontend connects to the backend over HTTP/WS
- Each chat has a sessionId.
- A user must only be able to connect to sessions belonging to that user.

Current architecture:

Frontend:
ChatInterface -> useWebSocket()

The frontend currently creates a WebSocket roughly like:

ws://localhost:8080/ws?token=<better-auth-token>&sessionId=<session-id>

The useWebSocket hook currently tries to obtain the Better Auth token using document.cookie and then puts the token in the WebSocket URL.

Backend:
WebSocketHandler receives an HTTPServer and currently uses:

new WebSocketServer({ server })

It has an upgrade handler which:
1. Reads token and sessionId from query parameters.
2. Calls Better Auth getSession().
3. Creates a WsClient containing:
   - ws
   - userId
   - sessionId
4. Handles "chat_message".
5. Calls chatHandler.getRequiredChunksForModelContext().
6. Sends "chunks_retrieved" back to the frontend.
7. Buffers conversations and periodically inserts them into PostgreSQL.

Important existing server-side flow:

chat_message
    -> chatHandler.getRequiredChunksForModelContext()
    -> FastAPI /query
    -> Qdrant similarity search
    -> PostgreSQL document_chunks
    -> chunks returned to Node
    -> chunks_retrieved WebSocket message
    -> frontend

The RAG retrieval itself is already working. Do NOT rewrite or break the RAG retrieval implementation.

The current frontend remains stuck in a reconnecting/connecting state and never successfully establishes a usable authenticated WebSocket connection.

I want you to implement/fix ALL required changes so that this flow works end-to-end:

Browser
  -> authenticated WebSocket handshake
  -> Node WebSocket server
  -> Better Auth session validation
  -> verify sessionId belongs to authenticated user
  -> establish WebSocket connection
  -> frontend receives "connected"
  -> frontend sends "chat_message"
  -> backend receives it
  -> backend retrieves relevant chunks
  -> backend sends "chunks_retrieved"
  -> frontend receives and displays the response

Requirements:

1. FIX WEBSOCKET SERVER SETUP

Use the proper authenticated upgrade architecture with ws.

Do NOT use:

new WebSocketServer({ server })

together with a separate server upgrade handler in a way that causes competing upgrade handling.

Instead, use:

new WebSocketServer({
    noServer: true
})

and attach:

server.on("upgrade", ...)

Perform authentication before calling:

wss.handleUpgrade(...)

After successful authentication:

wss.handleUpgrade(req, socket, head, (ws) => {
    wss.emit("connection", ws, req);
});

Make sure the existing message/close/error handlers continue to work.

2. FIX BETTER AUTHENTICATION

Do NOT rely on:

document.cookie

to read the Better Auth session token.

The Better Auth session cookie may be HttpOnly and therefore unavailable to JavaScript.

Do NOT expose the Better Auth session token through the WebSocket URL query string unless absolutely required.

Prefer authenticating the WebSocket upgrade using the HTTP Cookie header sent by the browser.

The WebSocket URL should therefore be approximately:

ws://localhost:8080/ws?sessionId=<sessionId>

The backend should obtain:

req.headers.cookie

and pass the cookie header to Better Auth.

Use the existing Better Auth integration already present in the project, including fromNodeHeaders where appropriate.

Do not invent a second authentication system.

3. VERIFY THE SESSION BELONGS TO THE USER

After Better Auth returns the authenticated session:

const userId = session.user.id;

The backend must verify that the supplied sessionId belongs to this user.

Query SessionDataModel using both:

sessionId
userId

Reject the WebSocket upgrade with HTTP 403 if the session does not belong to the authenticated user.

Do NOT trust sessionId supplied by the browser.

4. KEEP AUTHENTICATION BEFORE WEBSOCKET ACCEPTANCE

The server should reject unauthenticated/unauthorized upgrades before accepting the WebSocket.

Expected flow:

HTTP upgrade
    |
    +-- no cookie -> 401
    |
    +-- invalid Better Auth session -> 401
    |
    +-- session does not belong to user -> 403
    |
    +-- valid -> wss.handleUpgrade()

Use proper HTTP status responses and destroy the socket on rejection.

5. FIX FRONTEND useWebSocket

Remove the logic which attempts to extract:

better-auth.session_token

from document.cookie.

Do not put the auth token in the WebSocket URL.

Construct the WebSocket URL using only the backend host and sessionId, for example:

ws://localhost:8080/ws?sessionId=<sessionId>

The browser should handle the applicable authentication cookie during the connection handshake.

Keep:
- reconnect behavior
- isConnected
- isConnecting
- sendMessage
- addMessageListener
- lastMessage

Do not unnecessarily rewrite the hook.

6. VERIFY CROSS-ORIGIN COOKIE/SESSION CONFIGURATION

Inspect the existing Better Auth and Express configuration.

Make sure the authentication cookie can actually be sent by the browser during the WebSocket handshake from the Next.js frontend to the backend.

Do not blindly change cookie security settings.

For local development, make the minimum necessary configuration changes so that:

Frontend:
http://localhost:<frontend-port>

Backend:
http://localhost:8080

can authenticate correctly.

Check existing CORS and Better Auth trustedOrigins configuration before modifying them.

Do not break the existing REST authentication endpoints.

7. ADD TEMPORARY DIAGNOSTIC LOGGING

Add useful server-side logs around the WebSocket upgrade:

- upgrade request URL
- whether Cookie header exists
- authentication success/failure
- authenticated user ID
- requested session ID
- whether session ownership validation succeeded
- WebSocket upgrade success

Do NOT log the actual authentication token/session cookie value.

Add frontend logs for:

- connect() called
- sessionId
- WebSocket URL (without credentials)
- WebSocket onopen
- WebSocket onclose
- WebSocket onerror

Again, never log credentials.

8. FIX THE "connected" EVENT

After successful connection the backend should send:

{
    "type": "connected",
    "message": "WebSocket connection established"
}

The frontend should be able to receive this through the existing message handling mechanism.

9. FIX chat_message VALIDATION

The backend currently does:

const content = payload.content as string;

Do not blindly trust the payload.

Validate:
- payload.type === "chat_message"
- content exists
- content is a non-empty string
- optionally enforce a reasonable maximum length

If invalid, send:

{
    "type": "error",
    "message": "Invalid chat message"
}

Do not call the AI server for invalid messages.

10. KEEP THE CURRENT RAG FLOW

Do not change the working retrieval pipeline.

For a valid chat_message:

const chunks =
    await chatHandler.getRequiredChunksForModelContext(
        content,
        limit
    );

Then send:

{
    "type": "chunks_retrieved",
    "chunks": [
        {
            "chunkIndex": ...,
            "content": ...,
            "documentId": ...
        }
    ],
    "timestamp": ...
}

The frontend currently understands "chunks_retrieved", so preserve that message type.

11. FIX DATABASE CONVERSATION STORAGE

Continue buffering conversations as the current implementation does.

However, make sure the stored model conversation contains the actual model response, not merely the retrieved chunks.

For now, since actual LLM generation may not yet exist, do not pretend that retrieved chunks are an AI answer.

Keep the existing chunks_retrieved event working.

If the current code stores JSON.stringify(chunksPayload) as the "model" conversation, identify this clearly and avoid incorrectly treating retrieval results as an actual model answer.

12. HANDLE WEBSOCKET CONNECTION CLEANUP

Make sure:
- closed clients are removed
- errored clients are removed
- reconnect timers are cleared
- WebSocket connections are not duplicated unnecessarily when sessionId changes
- the server can shut down cleanly
- flush timer is cleared during shutdown

13. IMPORTANT: DO NOT CHANGE UNRELATED CODE

Do not rewrite:
- authentication architecture
- RAG embedding generation
- Qdrant schema
- document chunking
- document upload
- existing REST routes
- frontend UI

Only modify code required to make authenticated WebSocket chat work correctly.

14. CHECK THE ACTUAL PROJECT STRUCTURE

Before making changes:
- inspect the existing WebSocketHandler
- inspect useWebSocket
- inspect Better Auth configuration
- inspect Express/server startup
- inspect SessionDataModel
- inspect auth middleware
- inspect CORS configuration
- inspect package versions

Do not assume filenames or APIs if the project already has an implementation.

15. IMPORTANT ws SERVER DETAIL

The HTTP server passed to WebSocketHandler is the Node HTTPServer created from Express.

The expected architecture should be equivalent to:

const server = http.createServer(app);

new WebSocketHandler(server);

server.listen(...);

WebSocketHandler should internally use:

const wss = new WebSocketServer({
    noServer: true
});

server.on("upgrade", ...);

Do not create a second HTTP server.

16. EXPECTED FINAL BEHAVIOR

After the changes, opening a chat session should produce approximately:

Frontend:
WS connect()
WS URL: ws://localhost:8080/ws?sessionId=...
WebSocket opened

Backend:
WS upgrade received
Authentication successful
Session ownership verified
WebSocket connection established

Frontend:
connected

Then when user sends:

"What is Dijkstra's algorithm?"

Frontend:
send({
    type: "chat_message",
    content: "What is Dijkstra's algorithm?"
})

Backend:
receives chat_message
calls chatHandler
calls FastAPI /query
gets Qdrant results
gets PostgreSQL chunks

Backend -> Frontend:

{
    "type": "chunks_retrieved",
    "chunks": [...]
}

Frontend:
displays the result.

17. ERROR DIAGNOSIS

If the implementation still doesn't connect, do not guess.

Use the diagnostic logs to determine exactly which stage fails:

Browser connect()
    ↓
WebSocket constructor
    ↓
HTTP upgrade reaches backend
    ↓
Cookie exists
    ↓
Better Auth session valid
    ↓
Session ownership valid
    ↓
wss.handleUpgrade()
    ↓
ws.onopen

Report the exact failing stage and fix it.

After making the changes, give me:
1. A concise summary of files changed.
2. The important code changes.
3. Any configuration changes required.
4. How to test the WebSocket connection manually.
5. The expected browser/server logs for a successful connection.