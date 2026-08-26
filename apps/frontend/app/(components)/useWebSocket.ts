"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type WsMessage = {
  type: string;
  [key: string]: unknown;
};

type UseWebSocketOptions = {
  sessionId: string;
  enabled?: boolean;
};

type UseWebSocketReturn = {
  isConnected: boolean;
  isConnecting: boolean;
  sendMessage: (content: string) => void;
  lastMessage: WsMessage | null;
  addMessageListener: (type: string, handler: (msg: WsMessage) => void) => () => void;
};

export function useWebSocket({
  sessionId,
  enabled = true,
}: UseWebSocketOptions): UseWebSocketReturn {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const listenersRef = useRef<Map<string, Set<(msg: WsMessage) => void>>>(
    new Map()
  );
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [lastMessage, setLastMessage] = useState<WsMessage | null>(null);

  const connect = useCallback(() => {
    if (!enabled || !sessionId) return;

    console.log("[WS] connect() called, sessionId:", sessionId);

    setIsConnecting(true);

    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_BASE_URL || "http://localhost:8080";
    const backendHost = new URL(backendUrl).host;
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${backendHost}/ws?sessionId=${encodeURIComponent(sessionId)}`;

    console.log("[WS] WebSocket URL:", wsUrl);

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("[WS] WebSocket opened");
      setIsConnected(true);
      setIsConnecting(false);
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data) as WsMessage;
        setLastMessage(msg);

        const handlers = listenersRef.current.get(msg.type);
        if (handlers) {
          handlers.forEach((handler) => handler(msg));
        }
      } catch {
        console.error("Failed to parse WebSocket message");
      }
    };

    ws.onclose = (event) => {
      console.log("[WS] WebSocket closed, code:", event.code);
      setIsConnected(false);
      setIsConnecting(false);
      wsRef.current = null;

      if (enabled) {
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, 3000);
      }
    };

    ws.onerror = (event) => {
      console.error("[WS] WebSocket error:", event);
      ws.close();
    };
  }, [sessionId, enabled]);

  useEffect(() => {
    if (enabled && sessionId) {
      connect();
    }

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      setIsConnected(false);
      setIsConnecting(false);
    };
  }, [sessionId, enabled, connect]);

  const sendMessage = useCallback(
    (content: string) => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: "chat_message",
            content,
          })
        );
      }
    },
    []
  );

  const addMessageListener = useCallback(
    (type: string, handler: (msg: WsMessage) => void) => {
      if (!listenersRef.current.has(type)) {
        listenersRef.current.set(type, new Set());
      }
      listenersRef.current.get(type)!.add(handler);

      return () => {
        const handlers = listenersRef.current.get(type);
        if (handlers) {
          handlers.delete(handler);
          if (handlers.size === 0) {
            listenersRef.current.delete(type);
          }
        }
      };
    },
    []
  );

  return {
    isConnected,
    isConnecting,
    sendMessage,
    lastMessage,
    addMessageListener,
  };
}
