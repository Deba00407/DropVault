"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { ChatMessage } from "./ChatMessage";
import { askAI } from "@/lib/api";
import { PaperPlaneRight } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

type Message = {
  id: string;
  content: string;
  type: "user" | "model";
  timestamp: string;
};

type ChatInterfaceProps = {
  sessionId: string | null;
};

const ChatInterface = ({ sessionId }: ChatInterfaceProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    setMessages([]);
    setInputValue("");
  }, [sessionId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = inputValue.trim();
    if (!query || isLoading) return;

    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      content: query,
      type: "user",
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    try {
      const response = await askAI(query);
      const modelMessage: Message = {
        id: `msg-${Date.now() + 1}`,
        content: formatSearchResults(response.response),
        type: "model",
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, modelMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: `msg-${Date.now() + 1}`,
        content: "Sorry, I encountered an error processing your request. Please try again.",
        type: "model",
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

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

  return (
    <div className="flex h-full flex-col bg-[#F4F1E8]">
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <ScrollArea className="h-full">
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center px-4 py-20 text-center">
              <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-[#EFE9D8]">
                <span className="font-serif text-2xl text-[#B54708]">?</span>
              </div>
              <h3 className="font-serif text-lg font-medium text-[#1C1B18]">
                Ask about your documents
              </h3>
              <p className="mt-1 max-w-sm text-sm text-[#8A8370]">
                Query your uploaded PDFs using natural language. The AI will search
                through your documents and find relevant information.
              </p>
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
              {isLoading && (
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
            placeholder={sessionId ? "Ask about your documents..." : "Select or create a session first"}
            disabled={!sessionId || isLoading}
            rows={1}
            className={cn(
              "flex-1 resize-none rounded-lg border border-[#DBD5C6] bg-[#FBFAF4] px-4 py-2.5 text-sm text-[#1C1B18] placeholder:text-[#C9C2AC] outline-none transition-colors",
              "focus:border-[#B54708] focus:ring-1 focus:ring-[#B54708]/20",
              "disabled:cursor-not-allowed disabled:opacity-50"
            )}
          />
          <Button
            type="submit"
            disabled={!sessionId || !inputValue.trim() || isLoading}
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

function formatSearchResults(results: Array<{ point_score: number; document_id: string; chunk_index: number }>): string {
  if (!results || results.length === 0) {
    return "I couldn't find any relevant information in your documents for this query.";
  }

  const sorted = [...results].sort((a, b) => b.point_score - a.point_score);
  const topResults = sorted.slice(0, 3);

  let response = "Based on your documents, here's what I found:\n\n";
  topResults.forEach((result, index) => {
    const score = Math.round(result.point_score * 100);
    response += `${index + 1}. Relevant content from document (confidence: ${score}%)\n`;
    response += `   Document ID: ${result.document_id.slice(0, 8)}...\n`;
    response += `   Chunk position: ${result.chunk_index}\n\n`;
  });

  if (results.length > 3) {
    response += `\n...and ${results.length - 3} more relevant sections found.`;
  }

  return response;
}

export { ChatInterface };
