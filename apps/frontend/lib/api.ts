const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_BASE_URL || "http://localhost:8080";

type ChatSession = {
  id: string;
  title: string;
  user_id: string;
  createdAt: string;
  updatedAt: string;
};

type SearchResult = {
  point_score: number;
  document_id: string;
  chunk_index: number;
};

type CreateSessionResponse = {
  success: boolean;
  new_chat_session: ChatSession;
};

type AskResponse = {
  response: SearchResult[];
};

type FileMetadata = {
  id: string;
  fileName: string;
  objectKey: string;
  owner_id: string;
  contentType: string | null;
  fileSize: number | null;
  status: string;
  createdAt: string;
  processedAt: string;
};

type DocumentSession = {
  id: string;
  title: string;
  user_id: string;
  document_id: string;
  created_at: string;
  updated_at: string;
};

type ConversationEntry = {
  id: string;
  session_id: string;
  conversation_type: "user" | "model";
  content: string;
  created_at: string;
  updated_at: string;
};

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${BACKEND_BASE_URL}${endpoint}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Request failed" }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

export async function createChatSession(title: string): Promise<CreateSessionResponse> {
  return apiRequest<CreateSessionResponse>("/api/v1/chat/create/chat-session", {
    method: "POST",
    body: JSON.stringify({ title }),
  });
}

export async function askAI(query: string, limit: number = 10): Promise<AskResponse> {
  return apiRequest<AskResponse>("/api/v1/chat/ask", {
    method: "POST",
    body: JSON.stringify({ query, limit }),
  });
}

export async function getFileMetadata(): Promise<FileMetadata[]> {
  return apiRequest<FileMetadata[]>("/api/v1/file/list");
}

export async function getDocumentSessions(
  documentId: string
): Promise<{ sessions: DocumentSession[] }> {
  return apiRequest<{ sessions: DocumentSession[] }>(
    `/api/v1/document-chat/sessions?documentId=${encodeURIComponent(documentId)}`
  );
}

export async function createDocumentSession(
  title: string,
  documentId: string
): Promise<{ session: DocumentSession }> {
  return apiRequest<{ session: DocumentSession }>(
    "/api/v1/document-chat/sessions",
    {
      method: "POST",
      body: JSON.stringify({ title, documentId }),
    }
  );
}

export async function getSessionConversations(
  sessionId: string
): Promise<{ conversations: ConversationEntry[] }> {
  return apiRequest<{ conversations: ConversationEntry[] }>(
    `/api/v1/document-chat/sessions/${sessionId}/conversations`
  );
}

export type {
  ChatSession,
  SearchResult,
  CreateSessionResponse,
  AskResponse,
  FileMetadata,
  DocumentSession,
  ConversationEntry,
};
