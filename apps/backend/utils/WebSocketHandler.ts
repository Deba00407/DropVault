import type { Server as HTTPServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import type { IncomingMessage } from "http";
import { URL } from "url";
import { auth } from "../lib/auth";
import { fromNodeHeaders } from "better-auth/node";
import { db } from "../db";
import { eq, and } from "drizzle-orm";
import { SessionDataModel } from "../models/sessionDataModel";
import { ConversationDataModel } from "../models/conversationDataModel";
import { chatHandler } from "../routes/ai_chat/chatHandler";

type BufferedMessage = {
  sessionId: string;
  userId: string;
  conversationType: "user" | "model";
  content: string;
};

type WsClient = {
  ws: WebSocket;
  userId: string;
  sessionId: string;
};

type WsIncomingMessage = {
  type: string;
  [key: string]: unknown;
};

type WsHandler = (
  client: WsClient,
  payload: WsIncomingMessage
) => Promise<void>;

const FLUSH_THRESHOLD = 5;
const FLUSH_INTERVAL_MS = 5000;
const MAX_MESSAGE_LENGTH = 10000;

export class WebSocketHandler {
  private wss: WebSocketServer;
  private clients: Map<string, WsClient[]> = new Map();
  private messageBuffer: BufferedMessage[] = [];
  private flushTimer: ReturnType<typeof setInterval> | null = null;
  private handlers: Map<string, WsHandler> = new Map();

  constructor(server: HTTPServer) {
    this.wss = new WebSocketServer({ noServer: true });

    this.registerHandlers();

    server.on("upgrade", (req, socket, head) => {
      this.handleUpgrade(req, socket, head);
    });

    this.flushTimer = setInterval(() => {
      this.flushMessages();
    }, FLUSH_INTERVAL_MS);
  }

  private registerHandlers() {
    this.handlers.set("chat_message", async (client, payload) => {
      const content = payload.content;

      if (
        typeof content !== "string" ||
        content.trim().length === 0 ||
        content.length > MAX_MESSAGE_LENGTH
      ) {
        this.send(client, {
          type: "error",
          message: "Invalid chat message",
        });
        return;
      }

      const limit = (payload.limit as number) || 10;

      this.messageBuffer.push({
        sessionId: client.sessionId,
        userId: client.userId,
        conversationType: "user",
        content,
      });

      this.send(client, {
        type: "message_received",
        content,
        timestamp: new Date().toISOString(),
      });

      if (this.shouldFlush()) {
        await this.flushMessages();
      }

      const chunks = await chatHandler.getRequiredChunksForModelContext(
        content,
        limit
      );

      const chunksPayload = chunks.map((c) => ({
        chunkIndex: c.chunkIndex,
        content: c.content,
        documentId: c.documentId,
      }));

      this.messageBuffer.push({
        sessionId: client.sessionId,
        userId: client.userId,
        conversationType: "model",
        content: JSON.stringify(chunksPayload),
      });

      this.send(client, {
        type: "chunks_retrieved",
        chunks: chunksPayload,
        timestamp: new Date().toISOString(),
      });

      if (this.shouldFlush()) {
        await this.flushMessages();
      }
    });
  }

  private async handleUpgrade(
    req: IncomingMessage,
    socket: any,
    head: Buffer
  ) {
    const url = new URL(req.url || "/", `http://${req.headers.host}`);
    const sessionId = url.searchParams.get("sessionId");

    console.log("[WS] Upgrade request URL:", req.url);
    console.log("[WS] Cookie header exists:", !!req.headers.cookie);
    console.log("[WS] Requested sessionId:", sessionId);

    if (!sessionId) {
      console.log("[WS] Rejected: missing sessionId");
      socket.write("HTTP/1.1 400 Bad Request\r\n\r\n");
      socket.destroy();
      return;
    }

    if (!req.headers.cookie) {
      console.log("[WS] Rejected: no cookie header");
      socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
      socket.destroy();
      return;
    }

    try {
      const session = await auth.api.getSession({
        headers: fromNodeHeaders(req.headers),
      });

      if (!session) {
        console.log("[WS] Rejected: invalid Better Auth session");
        socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
        socket.destroy();
        return;
      }

      const userId = session.user.id;
      console.log("[WS] Authenticated userId:", userId);

      const [sessionRow] = await db
        .select()
        .from(SessionDataModel)
        .where(
          and(
            eq(SessionDataModel.id, sessionId),
            eq(SessionDataModel.user_id, userId)
          )
        )
        .limit(1);

      if (!sessionRow) {
        console.log(
          `[WS] Rejected: session ${sessionId} does not belong to user ${userId}`
        );
        socket.write("HTTP/1.1 403 Forbidden\r\n\r\n");
        socket.destroy();
        return;
      }

      console.log("[WS] Session ownership verified");

      this.wss.handleUpgrade(req, socket, head, (ws) => {
        const client: WsClient = { ws, userId, sessionId };

        if (!this.clients.has(sessionId)) {
          this.clients.set(sessionId, []);
        }
        this.clients.get(sessionId)!.push(client);

        this.wss.emit("connection", ws, req);

        ws.on("message", (data) =>
          this.handleMessage(client, data.toString())
        );

        ws.on("close", () => {
          this.removeClient(client);
        });

        ws.on("error", () => {
          this.removeClient(client);
        });

        this.send(client, {
          type: "connected",
          message: "WebSocket connection established",
        });

        console.log("[WS] WebSocket connection established for session:", sessionId);
      });
    } catch (err) {
      console.error("[WS] Auth/upgrade error:", err);
      socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
      socket.destroy();
    }
  }

  private async handleMessage(client: WsClient, raw: string) {
    let parsed: WsIncomingMessage;

    try {
      parsed = JSON.parse(raw);
    } catch {
      this.send(client, {
        type: "error",
        message: "Invalid JSON",
      });
      return;
    }

    const handler = this.handlers.get(parsed.type);

    if (!handler) {
      this.send(client, {
        type: "error",
        message: `Unknown message type: ${parsed.type}`,
      });
      return;
    }

    try {
      await handler(client, parsed);
    } catch (err) {
      console.error(`Handler [${parsed.type}] failed:`, err);
      this.send(client, {
        type: "error",
        message:
          err instanceof Error ? err.message : "Internal handler error",
      });
    }
  }

  private send(client: WsClient, data: Record<string, unknown>) {
    if (client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(JSON.stringify(data));
    }
  }

  private shouldFlush(): boolean {
    return this.messageBuffer.length >= FLUSH_THRESHOLD;
  }

  private async flushMessages() {
    if (this.messageBuffer.length === 0) return;

    const toFlush = [...this.messageBuffer];
    this.messageBuffer = [];

    try {
      const values = toFlush.map((msg) => ({
        session_id: msg.sessionId,
        conversation_type: msg.conversationType,
        content: msg.content,
      }));

      if (values.length > 0) {
        await db.insert(ConversationDataModel).values(values);
      }
    } catch (err) {
      console.error("Failed to flush messages to DB:", err);
      this.messageBuffer.unshift(...toFlush);
    }
  }

  private removeClient(client: WsClient) {
    const sessionClients = this.clients.get(client.sessionId);
    if (sessionClients) {
      const idx = sessionClients.indexOf(client);
      if (idx !== -1) sessionClients.splice(idx, 1);
      if (sessionClients.length === 0) {
        this.clients.delete(client.sessionId);
      }
    }
  }

  public async shutdown() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
    await this.flushMessages();
    this.wss.close();
  }
}
