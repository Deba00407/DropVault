"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { FilePdf, CheckCircle, Clock, Warning, Spinner, type IconProps } from "@phosphor-icons/react";

type DocumentStatus = "UPLOADED" | "QUEUED" | "PROCESSING" | "READY" | "FAILED" | "CHUNKED";

type DocumentCardProps = {
  id: string;
  fileName: string;
  fileSize: number | null;
  status: DocumentStatus;
  createdAt: string;
};

const STATUS_CONFIG: Record<DocumentStatus, { label: string; className: string; icon: React.ComponentType<IconProps> }> = {
  UPLOADED: {
    label: "Uploaded",
    className: "bg-[#EFE9D8] text-[#B54708] border-[#C9C2AC]",
    icon: Clock,
  },
  QUEUED: {
    label: "Queued",
    className: "bg-amber-100 text-amber-800 border-amber-300",
    icon: Clock,
  },
  PROCESSING: {
    label: "Processing",
    className: "bg-blue-100 text-blue-800 border-blue-300",
    icon: Spinner,
  },
  READY: {
    label: "Ready",
    className: "bg-emerald-100 text-emerald-800 border-emerald-300",
    icon: CheckCircle,
  },
  FAILED: {
    label: "Failed",
    className: "bg-red-100 text-red-800 border-red-300",
    icon: Warning,
  },
  CHUNKED: {
    label: "Ready",
    className: "bg-emerald-100 text-emerald-800 border-emerald-300",
    icon: CheckCircle,
  },
};

function formatBytes(bytes: number) {
  if (!bytes) return "0 KB";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** i).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

const DocumentCard = ({
  id,
  fileName,
  fileSize,
  status,
  createdAt,
}: DocumentCardProps) => {
  const config = STATUS_CONFIG[status];
  const StatusIcon = config.icon;

  return (
    <Card className="relative overflow-visible border-[#DBD5C6] bg-white before:absolute before:left-[-8px] before:top-1/2 before:size-3.5 before:-translate-y-1/2 before:rounded-full before:border before:border-[#DBD5C6] before:bg-[#F4F1E8] before:content-[''] after:absolute after:right-[-8px] after:top-1/2 after:size-3.5 after:-translate-y-1/2 after:rounded-full after:border after:border-[#DBD5C6] after:bg-[#F4F1E8] after:content-['']">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0">
            <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#EFE9D8]">
              <FilePdf className="h-5 w-5 text-[#B54708]" weight="duotone" />
            </div>
            <div className="min-w-0">
              <p
                className="truncate text-[15px] font-medium text-[#1C1B18]"
                title={fileName}
              >
                {fileName}
              </p>
              <div className="mt-0.5 flex items-center gap-2">
                <span className="font-mono text-[11px] text-[#8A8370]">
                  {formatBytes(fileSize || 0)}
                </span>
                <span className="text-[#DBD5C6]">·</span>
                <span className="font-mono text-[11px] text-[#8A8370]">
                  {new Date(createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          <Badge
            className={cn(
              "shrink-0 rounded-full border font-mono text-[10.5px] font-medium uppercase tracking-[0.08em]",
              config.className
            )}
          >
            <StatusIcon className="mr-1 h-3 w-3" weight="fill" />
            {config.label}
          </Badge>
        </div>

        <div className="mt-3 flex items-center gap-2 border-t border-[#E7E2D3] pt-3">
          <span className="font-mono text-[10px] text-[#C9C2AC]">
            ID: {id.slice(0, 8)}...
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

export { DocumentCard };
