"use client";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { ChatCircle, Plus } from "@phosphor-icons/react";

type ChatSession = {
  id: string;
  title: string;
  createdAt: string;
};

type ChatSessionListProps = {
  sessions: ChatSession[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onCreateSession: () => void;
  isLoading?: boolean;
};

const ChatSessionList = ({
  sessions,
  activeSessionId,
  onSelectSession,
  onCreateSession,
  isLoading,
}: ChatSessionListProps) => {
  return (
    <div className="flex h-full flex-col border-r border-[#DBD5C6] bg-[#FBFAF4]">
      <div className="flex items-center justify-between border-b border-[#DBD5C6] px-4 py-3">
        <h2 className="font-serif text-sm font-medium text-[#1C1B18]">
          Sessions
        </h2>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={onCreateSession}
          className="text-[#B54708] hover:bg-[#EFE9D8] hover:text-[#B54708]"
        >
          <Plus className="h-4 w-4" weight="bold" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2">
          {isLoading ? (
            <div className="space-y-2 p-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-lg bg-[#E7E2D3]" />
              ))}
            </div>
          ) : sessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ChatCircle className="mb-2 h-8 w-8 text-[#C9C2AC]" weight="duotone" />
              <p className="text-xs text-[#8A8370]">No sessions yet</p>
              <p className="text-[10px] text-[#C9C2AC]">
                Create one to start chatting
              </p>
            </div>
          ) : (
            sessions.map((session) => (
              <button
                key={session.id}
                onClick={() => onSelectSession(session.id)}
                className={cn(
                  "w-full rounded-lg px-3 py-2.5 text-left transition-colors",
                  activeSessionId === session.id
                    ? "bg-[#EFE9D8] text-[#1C1B18]"
                    : "text-[#6E6856] hover:bg-[#F4F1E8]"
                )}
              >
                <p className="truncate text-sm font-medium">{session.title}</p>
                <p className="mt-0.5 text-[10px] text-[#8A8370]">
                  {new Date(session.createdAt).toLocaleDateString()}
                </p>
              </button>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export { ChatSessionList };
