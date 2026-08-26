"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DocumentCard } from "./DocumentCard";
import { FilePdf } from "@phosphor-icons/react";

type DocumentStatus = "UPLOADED" | "QUEUED" | "PROCESSING" | "READY" | "FAILED" | "CHUNKED";

type Document = {
  id: string;
  fileName: string;
  fileSize: number | null;
  status: DocumentStatus;
  createdAt: string;
};

const DocumentList = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/api/v1/file/list`,
        {
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch documents");
      }

      const data = await response.json();
      setDocuments(data.documents);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load documents");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-xl bg-[#E7E2D3]" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-dashed border-[#DBD5C6] bg-transparent shadow-none">
        <CardContent className="py-12 text-center">
          <p className="text-sm text-[#8A8370]">{error}</p>
          <p className="mt-1 text-xs text-[#C9C2AC]">
            Documents will appear here once the file listing endpoint is available.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (documents.length === 0) {
    return (
      <Card className="border-dashed border-[#DBD5C6] bg-transparent shadow-none">
        <CardContent className="py-12 text-center">
          <FilePdf className="mx-auto mb-3 h-10 w-10 text-[#C9C2AC]" weight="duotone" />
          <p className="text-sm text-[#8A8370]">No documents uploaded yet</p>
          <p className="mt-1 text-xs text-[#C9C2AC]">
            Upload PDFs from the dashboard to get started
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {documents.map((doc) => (
        <DocumentCard
          key={doc.id}
          id={doc.id}
          fileName={doc.fileName}
          fileSize={doc.fileSize}
          status={doc.status}
          createdAt={doc.createdAt}
        />
      ))}
    </div>
  );
};

export { DocumentList };
