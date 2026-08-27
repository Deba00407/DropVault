"use client";

import { useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import {
  User,
  Robot,
  Lightbulb,
  CaretDown,
  CaretRight,
} from "@phosphor-icons/react";

type ChatMessageProps = {
  content: string;
  type: "user" | "model";
  timestamp?: string;
  thinkingContent?: string;
  isThinking?: boolean;
  isStreaming?: boolean;
};

const ChatMessage = ({
  content,
  type,
  timestamp,
  thinkingContent,
  isThinking,
  isStreaming,
}: ChatMessageProps) => {
  const isUser = type === "user";
  const [isThinkingExpanded, setIsThinkingExpanded] = useState(false);
  const hasThinking = isThinking || (thinkingContent && thinkingContent.length > 0);
  const showResponseBubble = content.length > 0 || !isThinking;

  return (
    <div
      className={cn(
        "flex gap-3 px-4 py-3",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarFallback
          className={cn(
            "text-xs",
            isUser
              ? "bg-[#EFE9D8] text-[#B54708]"
              : "bg-[#1C1B18] text-[#F4F1E8]"
          )}
        >
          {isUser ? (
            <User className="h-4 w-4" weight="duotone" />
          ) : (
            <Robot className="h-4 w-4" weight="duotone" />
          )}
        </AvatarFallback>
      </Avatar>

      <div className="max-w-[80%] space-y-2">
        {hasThinking && (
          <div className="rounded-xl border border-dashed border-amber-300 bg-amber-50/50 px-4 py-2.5">
            <button
              onClick={() => setIsThinkingExpanded(!isThinkingExpanded)}
              className="flex items-center gap-1.5 text-xs font-medium text-amber-700"
            >
              <Lightbulb className="h-3.5 w-3.5" weight="duotone" />
              {isThinking ? (
                <span className="flex items-center gap-1">
                  Thinking
                  <span className="flex gap-0.5">
                    <span className="h-1 w-1 animate-bounce rounded-full bg-amber-500 [animation-delay:0ms]" />
                    <span className="h-1 w-1 animate-bounce rounded-full bg-amber-500 [animation-delay:150ms]" />
                    <span className="h-1 w-1 animate-bounce rounded-full bg-amber-500 [animation-delay:300ms]" />
                  </span>
                </span>
              ) : (
                <>
                  {isThinkingExpanded ? (
                    <CaretDown className="h-3 w-3" />
                  ) : (
                    <CaretRight className="h-3 w-3" />
                  )}
                  Thought
                </>
              )}
            </button>
            {!isThinking && isThinkingExpanded && thinkingContent && (
              <p className="mt-2 whitespace-pre-wrap text-xs leading-relaxed text-amber-800/80">
                {thinkingContent}
              </p>
            )}
          </div>
        )}

        {showResponseBubble && (
          <div
            className={cn(
              "rounded-xl px-4 py-2.5 text-sm leading-relaxed",
              isUser
                ? "bg-[#B54708] text-white"
                : "bg-white border border-[#DBD5C6] text-[#1C1B18]"
            )}
          >
            <p className="whitespace-pre-wrap">
              {content}
              {isStreaming && (
                <span className="ml-0.5 inline-block h-4 w-1.5 animate-pulse rounded-sm bg-[#B54708]" />
              )}
            </p>
            {timestamp && !isStreaming && (
              <p
                className={cn(
                  "mt-1.5 text-[10px]",
                  isUser ? "text-white/70" : "text-[#8A8370]"
                )}
              >
                {new Date(timestamp).toLocaleTimeString()}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export { ChatMessage };
