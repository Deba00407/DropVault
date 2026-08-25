"use client";

import { useCallback, useRef, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

type TicketStatus = "signing" | "uploading" | "done" | "error";

type Ticket = {
  id: string;
  name: string;
  size: number;
  progress: number;
  status: TicketStatus;
  error: string | null;
  loggedAt: Date | null;
  fileKey?: string;
};

const STATUS_LABEL: Record<TicketStatus, string> = {
  signing: "Requesting slot",
  uploading: "Transmitting",
  done: "Logged",
  error: "Rejected",
};

const STATUS_BADGE_CLASS: Record<TicketStatus, string> = {
  signing: "bg-amber-100 text-amber-800 border-amber-300",
  uploading: "bg-amber-100 text-amber-800 border-amber-300",
  done: "bg-emerald-100 text-emerald-800 border-emerald-300",
  error: "bg-red-100 text-red-800 border-red-300",
};

let ticketSeq = 0;
const nextId = () => {
  ticketSeq += 1;
  return `t${Date.now().toString(36)}${ticketSeq}`;
};

function formatBytes(bytes: number) {
  if (!bytes) return "0 KB";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** i).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

function stampCode(id: string) {
  return id.slice(-6).toUpperCase();
}

function uploadWithProgress(
  url: string,
  file: File,
  onProgress: (pct: number) => void
) {
  console.log("uploadWithProgress called");
  console.log("URL:", url);
  console.log("File:", file.name, file.size, file.type);

  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    console.log("XHR created");

    xhr.upload.onprogress = (e) => {
      console.log("S3 progress", e.loaded, e.total);

      if (e.lengthComputable) {
        onProgress(
          Math.round((e.loaded / e.total) * 100)
        );
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(
          new Error(
            `Upload rejected (${xhr.status}): ${xhr.responseText}`
          )
        );
      }
    };

    xhr.onerror = () => {
      console.error("XHR ERROR");
      reject(new Error("Connection dropped"));
    };

    xhr.onabort = () => {
      console.error("XHR ABORTED");
      reject(new Error("Upload aborted"));
    };

    console.log("Opening XHR");

    xhr.open("PUT", url);

    xhr.setRequestHeader(
      "Content-Type",
      file.type || "application/pdf"
    );

    xhr.send(file);
  });
}

const DashBoard = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const patchTicket = (id: string, patch: Partial<Ticket>) => {
    setTickets((current) => current.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  };

  const processFile = useCallback(async (file: File) => {
    const id = nextId();
    setTickets((current) => [
      {
        id,
        name: file.name,
        size: file.size,
        progress: 4,
        status: "signing",
        error: null,
        loggedAt: null,
      },
      ...current,
    ]);

    try {
      const signRes = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/api/v1/pre-sign/signature`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mime : file.type.split('/').pop() || "application/pdf" }),
      });

      if (!signRes.ok) throw new Error("Intake desk did not issue a slot");
      const { uploadUrl, fileKey } = (await signRes.json()) as {
        uploadUrl: string;
        fileKey: string;
      };

      patchTicket(id, { status: "uploading", progress: 10, fileKey });

      await uploadWithProgress(uploadUrl, file, (pct) => {
        patchTicket(id, { progress: Math.max(10, pct) });
      });

      patchTicket(id, { status: "done", progress: 100, loggedAt: new Date() });
    } catch (err) {
      patchTicket(id, {
        status: "error",
        progress: 100,
        error: err instanceof Error ? err.message : "Upload failed",
      });
    }
  }, []);

  const handleFiles = useCallback(
    (fileList: FileList) => {
      const incoming = Array.from(fileList);
      const pdfs = incoming.filter(
        (f) => f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf")
      );

      if (pdfs.length === 0) {
        setBanner("Only PDF files are accepted at this desk.");
        return;
      }
      setBanner(
        pdfs.length < incoming.length
          ? `${incoming.length - pdfs.length} file(s) skipped — PDF only.`
          : null
      );

      pdfs.forEach((file) => void processFile(file));
    },
    [processFile]
  );

  const loggedCount = tickets.filter((t) => t.status === "done").length;

  return (
    <div className="min-h-screen bg-[#F4F1E8] text-[#1C1B18]">
      <header className="flex flex-wrap items-baseline justify-between gap-3 border-b border-[#DBD5C6] px-6 py-6 md:px-16">
        <div className="flex items-baseline gap-3">
          <h1 className="font-serif text-2xl font-semibold tracking-tight text-[#1C1B18]">
            DropVault
          </h1>
          <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-[#8A8370]">
            Document Receiving
          </span>
        </div>
        <div className="font-mono text-xs text-[#5C5747]">{loggedCount} logged today</div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-10 md:px-16">
        <section
          onClick={() => inputRef.current?.click()}
          onDragEnter={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            handleFiles(e.dataTransfer.files);
          }}
          className={cn(
            "cursor-pointer rounded-2xl border-2 border-dashed bg-[#FBFAF4] px-6 py-12 text-center transition-colors duration-200",
            isDragging ? "border-[#B54708] bg-[#FBF0E4]" : "border-[#C9C2AC]"
          )}
        >
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf,.pdf"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.length) {
                handleFiles(e.target.files);
                e.target.value = "";
              }
            }}
          />
          <div className="mx-auto mb-4 flex size-11 items-center justify-center rounded-full bg-[#EFE9D8] font-mono text-lg text-[#B54708]">
            ↑
          </div>
          <p className="mb-1 font-serif text-lg text-[#1C1B18]">Drop PDFs at the window</p>
          <p className="text-sm text-[#6E6856]">
            or click to browse — each one gets a ticket and a slot on the shelf.
          </p>
          {banner ? (
            <p className="mt-4 font-mono text-xs text-red-700">{banner}</p>
          ) : null}
          <Button
            type="button"
            variant="outline"
            className="mt-6 border-[#C9C2AC] bg-white font-mono text-xs uppercase tracking-[0.08em] text-[#1C1B18] hover:bg-[#EFE9D8]"
            onClick={(e) => {
              e.stopPropagation();
              inputRef.current?.click();
            }}
          >
            Select PDFs
          </Button>
        </section>

        <section className="mt-10">
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="font-serif text-lg font-medium text-[#1C1B18]">Ticket log</h2>
            <span className="font-mono text-[11px] text-[#8A8370]">
              {tickets.length ? `${tickets.length} total` : "empty"}
            </span>
          </div>

          {tickets.length === 0 ? (
            <Card className="border-dashed border-[#DBD5C6] bg-transparent shadow-none">
              <CardContent className="py-8 text-center text-sm text-[#8A8370]">
                No tickets yet. The first PDF you drop will show up here.
              </CardContent>
            </Card>
          ) : (
            <div className="flex flex-col gap-3.5">
              {tickets.map((ticket) => (
                <TicketRow key={ticket.id} ticket={ticket} />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

const TicketRow = ({ ticket }: { ticket: Ticket }) => {
  const isActive = ticket.status === "signing" || ticket.status === "uploading";
  const isSettled = ticket.status === "done" || ticket.status === "error";

  return (
    <Card className="relative overflow-visible border-[#DBD5C6] bg-white before:absolute before:left-[-8px] before:top-1/2 before:size-3.5 before:-translate-y-1/2 before:rounded-full before:border before:border-[#DBD5C6] before:bg-[#F4F1E8] before:content-[''] after:absolute after:right-[-8px] after:top-1/2 after:size-3.5 after:-translate-y-1/2 after:rounded-full after:border after:border-[#DBD5C6] after:bg-[#F4F1E8] after:content-['']">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="truncate text-[15px] font-medium text-[#1C1B18]" title={ticket.name}>
              {ticket.name}
            </p>
            <p className="mt-0.5 font-mono text-[11px] tracking-wide text-[#8A8370]">
              #{stampCode(ticket.id)} · {formatBytes(ticket.size)}
            </p>
          </div>

          <Badge
            key={ticket.status}
            className={cn(
              "shrink-0 rounded-full border font-mono text-[10.5px] font-medium uppercase tracking-[0.08em]",
              STATUS_BADGE_CLASS[ticket.status],
              isSettled && "animate-in zoom-in-75 -rotate-6 duration-300"
            )}
          >
            {STATUS_LABEL[ticket.status]}
          </Badge>
        </div>

        {ticket.status === "error" ? (
          <p className="mt-2.5 text-[12.5px] text-red-700">{ticket.error}</p>
        ) : (
          <div className="mt-3">
            <Progress
              value={ticket.progress}
              className={cn(
                "h-1.5 bg-[#E7E2D3]",
                ticket.status === "done"
                  ? "[&_[data-slot=progress-indicator]]:bg-emerald-600"
                  : "[&_[data-slot=progress-indicator]]:bg-[#B54708]"
              )}
            />
            <p className="mt-1.5 font-mono text-[10.5px] text-[#8A8370]">
              {ticket.status === "done"
                ? `Logged at ${ticket.loggedAt ? ticket.loggedAt.toLocaleTimeString() : "—"}`
                : isActive
                  ? `${ticket.progress}% transferred`
                  : null}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export { DashBoard };
export default DashBoard;