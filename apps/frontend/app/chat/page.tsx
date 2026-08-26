"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "@/app/(utils)/auth";
import { ChatSessionList } from "@/app/(components)/ChatSessionList";
import { ChatInterface } from "@/app/(components)/ChatInterface";
import { NavBar } from "@/app/(components)/NavBar";
import { Loader } from "@/app/(components)/Loader";
import { FilePdf } from "@phosphor-icons/react";
import { getDocumentSessions, createDocumentSession } from "@/lib/api";

type ChatSession = {
  id: string;
  title: string;
  createdAt: string;
};

const ChatPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const documentId = searchParams.get("document");
  const { data: session, isPending } = useSession();

  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);
  const [documentName, setDocumentName] = useState<string>("");

  useEffect(() => {
    if (!isPending && !session) {
      router.replace("/getting-started/sign-in");
    }
  }, [session, isPending, router]);

  useEffect(() => {
    if (!documentId) {
      router.replace("/documents/select");
    }
  }, [documentId, router]);

  useEffect(() => {
    if (documentId) {
      fetchSessions(documentId);
      fetchDocumentName(documentId);
    }
  }, [documentId]);

  const fetchDocumentName = async (docId: string) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/api/v1/file/list`,
        { credentials: "include" }
      );
      if (response.ok) {
        const data = await response.json();
        const doc = data.documents?.find(
          (d: { id: string }) => d.id === docId
        );
        if (doc) setDocumentName(doc.fileName);
      }
    } catch {
      // silent
    }
  };

  const fetchSessions = async (docId: string) => {
    try {
      setIsLoadingSessions(true);
      const data = await getDocumentSessions(docId);
      setSessions(
        data.sessions.map(
          (s: { id: string; title: string; created_at: string }) => ({
            id: s.id,
            title: s.title,
            createdAt: s.created_at,
          })
        )
      );
    } catch (err) {
      console.error("Failed to fetch sessions:", err);
    } finally {
      setIsLoadingSessions(false);
    }
  };

  const handleCreateSession = useCallback(async () => {
    if (!documentId) return;
    const title = `Session ${sessions.length + 1}`;
    try {
      const data = await createDocumentSession(title, documentId);
      const newSession: ChatSession = {
        id: data.session.id,
        title: data.session.title,
        createdAt: data.session.created_at,
      };
      setSessions((prev) => [newSession, ...prev]);
      setActiveSessionId(newSession.id);
    } catch (err) {
      console.error("Failed to create session:", err);
    }
  }, [sessions.length, documentId]);

  const handleSelectSession = useCallback((id: string) => {
    setActiveSessionId(id);
  }, []);

  if (isPending || !session) {
    return <Loader />;
  }

  if (!documentId) {
    return <Loader />;
  }

  return (
    <div className="flex h-screen flex-col bg-[#F4F1E8]">
      <header className="flex items-center justify-between border-b border-[#DBD5C6] px-6 py-4">
        <div className="flex items-center gap-4">
          <div className="flex items-baseline gap-3">
            <h1 className="font-serif text-2xl font-semibold tracking-tight text-[#1C1B18]">
              DropVault
            </h1>
            <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-[#8A8370]">
              AI Chat
            </span>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-[#DBD5C6] bg-white px-3 py-1">
            <FilePdf className="h-3.5 w-3.5 text-[#B54708]" weight="duotone" />
            <span className="max-w-[200px] truncate text-xs font-medium text-[#1C1B18]">
              {documentName || "Loading..."}
            </span>
          </div>
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
          {activeSessionId ? (
            <ChatInterface sessionId={activeSessionId} />
          ) : (
            <div className="flex h-full flex-col items-center justify-center px-4 text-center">
              <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-[#EFE9D8]">
                <FilePdf
                  className="h-7 w-7 text-[#B54708]"
                  weight="duotone"
                />
              </div>
              <h3 className="font-serif text-lg font-medium text-[#1C1B18]">
                Start a conversation
              </h3>
              <p className="mt-1 max-w-sm text-sm text-[#8A8370]">
                Create a new session or select an existing one from the sidebar
                to start chatting about this document.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
