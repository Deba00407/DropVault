"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { ChatMessage } from "./ChatMessage";
import { useWebSocket } from "./useWebSocket";
import { getSessionConversations } from "@/lib/api";
import { PaperPlaneRight, WifiSlash } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

type Message = {
  id: string;
  content: string;
  type: "user" | "model";
  timestamp: string;
};

type ChunkData = {
  chunkIndex: number;
  content: string;
  documentId: string;
};

type ChatInterfaceProps = {
  sessionId: string;
};

const ChatInterface = ({ sessionId }: ChatInterfaceProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoadingResponse, setIsLoadingResponse] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const loadedSessionRef = useRef<string | null>(null);

  const { isConnected, isConnecting, sendMessage, addMessageListener } =
    useWebSocket({
      sessionId,
      enabled: !!sessionId,
    });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    const unsub1 = addMessageListener("chunks_retrieved", (msg) => {
      setIsLoadingResponse(false);
      const chunks = msg.chunks as ChunkData[];
      const modelContent = formatChunks(chunks);

      const modelMessage: Message = {
        id: `msg-${Date.now()}`,
        content: modelContent,
        type: "model",
        timestamp: (msg.timestamp as string) || new Date().toISOString(),
      };
      setMessages((prev) => [...prev, modelMessage]);
    });

    const unsub2 = addMessageListener("error", (msg) => {
      setIsLoadingResponse(false);
      const errorMessage: Message = {
        id: `msg-${Date.now()}`,
        content:
          (msg.message as string) ||
          "Sorry, I encountered an error processing your request.",
        type: "model",
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    });

    return () => {
      unsub1();
      unsub2();
    };
  }, [addMessageListener]);

  useEffect(() => {
    if (!sessionId || loadedSessionRef.current === sessionId) return;

    loadedSessionRef.current = sessionId;
    setIsLoadingHistory(true);
    setMessages([]);
    setInputValue("");
    setIsLoadingResponse(false);

    getSessionConversations(sessionId)
      .then((data) => {
        const loaded: Message[] = data.conversations.map((c) => ({
          id: c.id,
          content: c.content,
          type: c.conversation_type,
          timestamp: c.created_at,
        }));
        setMessages(loaded);
      })
      .catch(() => {
        // history unavailable, start fresh
      })
      .finally(() => {
        setIsLoadingHistory(false);
      });
  }, [sessionId]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const query = inputValue.trim();
      if (!query || isLoadingResponse || !isConnected) return;

      const userMessage: Message = {
        id: `msg-${Date.now()}`,
        content: query,
        type: "user",
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setInputValue("");
      setIsLoadingResponse(true);

      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }

      sendMessage(query);
    },
    [inputValue, isLoadingResponse, isConnected, sendMessage]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  };

  const connectionStatus = !isConnected && !isConnecting;
  const inputDisabled = !sessionId || isLoadingResponse || !isConnected;

  return (
    <div className="flex h-full flex-col bg-[#F4F1E8]">
      {connectionStatus && sessionId && (
        <div className="flex items-center gap-2 border-b border-[#DBD5C6] bg-amber-50 px-4 py-2 text-xs text-amber-700">
          <WifiSlash className="h-3.5 w-3.5" weight="fill" />
          Reconnecting to server...
        </div>
      )}

      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <ScrollArea className="h-full">
          {isLoadingHistory ? (
            <div className="space-y-3 px-4 py-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex gap-3">
                  <Skeleton className="h-8 w-8 shrink-0 rounded-full bg-[#E7E2D3]" />
                  <Skeleton className="h-16 w-64 rounded-xl bg-[#E7E2D3]" />
                </div>
              ))}
            </div>
          ) : messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center px-4 py-20 text-center">
              <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-[#EFE9D8]">
                <span className="font-serif text-2xl text-[#B54708]">?</span>
              </div>
              <h3 className="font-serif text-lg font-medium text-[#1C1B18]">
                Ask about this document
              </h3>
              <p className="mt-1 max-w-sm text-sm text-[#8A8370]">
                Query your PDF using natural language. The AI will search
                through the document and find relevant chunks of information.
              </p>
              {!isConnected && (
                <p className="mt-3 text-xs text-amber-600">
                  {isConnecting
                    ? "Connecting to server..."
                    : "Waiting for connection..."}
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-1 py-4">
              {messages.map((message) => (
                <ChatMessage
                  key={message.id}
                  content={message.content}
                  type={message.type}
                  timestamp={message.timestamp}
                />
              ))}
              {isLoadingResponse && (
                <div className="flex gap-3 px-4 py-3">
                  <Skeleton className="h-8 w-8 rounded-full bg-[#E7E2D3]" />
                  <div className="space-y-2 rounded-xl bg-white border border-[#DBD5C6] px-4 py-3">
                    <Skeleton className="h-3 w-32 bg-[#E7E2D3]" />
                    <Skeleton className="h-3 w-24 bg-[#E7E2D3]" />
                  </div>
                </div>
              )}
            </div>
          )}
        </ScrollArea>
      </div>

      <div className="border-t border-[#DBD5C6] bg-white p-4">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder={
              isConnected
                ? "Ask about this document..."
                : "Connecting to server..."
            }
            disabled={inputDisabled}
            rows={1}
            className={cn(
              "flex-1 resize-none rounded-lg border border-[#DBD5C6] bg-[#FBFAF4] px-4 py-2.5 text-sm text-[#1C1B18] placeholder:text-[#C9C2AC] outline-none transition-colors",
              "focus:border-[#B54708] focus:ring-1 focus:ring-[#B54708]/20",
              "disabled:cursor-not-allowed disabled:opacity-50"
            )}
          />
          <Button
            type="submit"
            disabled={inputDisabled || !inputValue.trim()}
            className="shrink-0 bg-[#B54708] text-white hover:bg-[#9A3D07] disabled:bg-[#C9C2AC]"
            size="icon"
          >
            <PaperPlaneRight className="h-4 w-4" weight="fill" />
          </Button>
        </form>
        <p className="mt-2 text-center text-[10px] text-[#C9C2AC]">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
};

function formatChunks(chunks: ChunkData[]): string {
  if (!chunks || chunks.length === 0) {
    return "I couldn't find any relevant information in this document for your query.";
  }

  let response = "Here are the relevant chunks from the document:\n\n";
  chunks.forEach((chunk, index) => {
    response += `--- Chunk ${index + 1} (Document: ${chunk.documentId.slice(0, 8)}..., Index: ${chunk.chunkIndex}) ---\n`;
    response += `${chunk.content}\n\n`;
  });

  return response;
}

export { ChatInterface };
