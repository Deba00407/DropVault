"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { User, Robot } from "@phosphor-icons/react";

type ChatMessageProps = {
  content: string;
  type: "user" | "model";
  timestamp?: string;
};

const ChatMessage = ({ content, type, timestamp }: ChatMessageProps) => {
  const isUser = type === "user";

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

      <div
        className={cn(
          "max-w-[80%] rounded-xl px-4 py-2.5 text-sm leading-relaxed",
          isUser
            ? "bg-[#B54708] text-white"
            : "bg-white border border-[#DBD5C6] text-[#1C1B18]"
        )}
      >
        <p className="whitespace-pre-wrap">{content}</p>
        {timestamp && (
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
    </div>
  );
};

export { ChatMessage };
