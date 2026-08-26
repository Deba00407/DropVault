"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/app/(utils)/auth";
import { NavBar } from "@/app/(components)/NavBar";
import { DocumentSelectCard } from "@/app/(components)/DocumentSelectCard";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader } from "@/app/(components)/Loader";
import { FilePdf } from "@phosphor-icons/react";

type DocumentStatus =
  | "UPLOADED"
  | "QUEUED"
  | "PROCESSING"
  | "READY"
  | "FAILED"
  | "CHUNKED";

type Document = {
  id: string;
  fileName: string;
  fileSize: number | null;
  status: DocumentStatus;
  createdAt: string;
};

const DocumentSelectPage = () => {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isPending && !session) {
      router.replace("/getting-started/sign-in");
    }
  }, [session, isPending, router]);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/api/v1/file/list`,
        { credentials: "include" }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch documents");
      }

      const data = await response.json();
      setDocuments(data.documents);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load documents"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectDocument = (id: string) => {
    router.push(`/chat?document=${id}`);
  };

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
            Select a Document
          </span>
        </div>
        <NavBar />
      </header>

      <main className="flex-1 overflow-y-auto px-6 py-8">
        <div className="mx-auto max-w-3xl">
          <div className="mb-6">
            <h2 className="font-serif text-lg font-medium text-[#1C1B18]">
              Choose a PDF to interact with
            </h2>
            <p className="mt-1 text-sm text-[#8A8370]">
              Select a processed document to start a conversation session.
            </p>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton
                  key={i}
                  className="h-20 w-full rounded-xl bg-[#E7E2D3]"
                />
              ))}
            </div>
          ) : error ? (
            <Card className="border-dashed border-[#DBD5C6] bg-transparent shadow-none">
              <CardContent className="py-12 text-center">
                <p className="text-sm text-[#8A8370]">{error}</p>
              </CardContent>
            </Card>
          ) : documents.length === 0 ? (
            <Card className="border-dashed border-[#DBD5C6] bg-transparent shadow-none">
              <CardContent className="py-12 text-center">
                <FilePdf
                  className="mx-auto mb-3 h-10 w-10 text-[#C9C2AC]"
                  weight="duotone"
                />
                <p className="text-sm text-[#8A8370]">
                  No documents uploaded yet
                </p>
                <p className="mt-1 text-xs text-[#C9C2AC]">
                  Upload PDFs from the dashboard to get started
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {documents.map((doc) => (
                <DocumentSelectCard
                  key={doc.id}
                  id={doc.id}
                  fileName={doc.fileName}
                  fileSize={doc.fileSize}
                  status={doc.status}
                  createdAt={doc.createdAt}
                  onSelect={handleSelectDocument}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default DocumentSelectPage;
