"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/app/(utils)/auth";
import { ChatSessionList } from "@/app/(components)/ChatSessionList";
import { ChatInterface } from "@/app/(components)/ChatInterface";
import { NavBar } from "@/app/(components)/NavBar";
import { createChatSession } from "@/lib/api";
import { Loader } from "@/app/(components)/Loader";

type ChatSession = {
  id: string;
  title: string;
  createdAt: string;
};

const ChatPage = () => {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);

  useEffect(() => {
    if (!isPending && !session) {
      router.replace("/getting-started/sign-in");
    }
  }, [session, isPending, router]);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      setIsLoadingSessions(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/api/v1/chat/sessions`,
        {
          credentials: "include",
        }
      );

      if (response.ok) {
        const data = await response.json();
        setSessions(data);
      }
    } catch (err) {
      console.error("Failed to fetch sessions:", err);
    } finally {
      setIsLoadingSessions(false);
    }
  };

  const handleCreateSession = useCallback(async () => {
    const title = `Chat ${sessions.length + 1}`;
    try {
      const response = await createChatSession(title);
      if (response.success) {
        const newSession: ChatSession = {
          id: response.new_chat_session.id,
          title: response.new_chat_session.title,
          createdAt: response.new_chat_session.createdAt,
        };
        setSessions((prev) => [newSession, ...prev]);
        setActiveSessionId(newSession.id);
      }
    } catch (err) {
      console.error("Failed to create session:", err);
    }
  }, [sessions.length]);

  const handleSelectSession = useCallback((id: string) => {
    setActiveSessionId(id);
  }, []);

  if (isPending || !session) {
    return <Loader />;
  }

  return (
    <div className="flex h-screen flex-col bg-[#F4F1E8]">
      <header className="flex items-center justify-between border-b border-[#DBD5C6] px-6 py-4">
        <div className="flex items-baseline gap-3">
          <h1 className="font-serif text-2xl font-semibold tracking-tight text-[#1C1B18]">
            DropVault
          </h1>
          <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-[#8A8370]">
            AI Chat
          </span>
        </div>
        <NavBar />
      </header>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-64 shrink-0">
          <ChatSessionList
            sessions={sessions}
            activeSessionId={activeSessionId}
            onSelectSession={handleSelectSession}
            onCreateSession={handleCreateSession}
            isLoading={isLoadingSessions}
          />
        </div>

        <div className="flex-1 overflow-hidden">
          <ChatInterface sessionId={activeSessionId} />
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
