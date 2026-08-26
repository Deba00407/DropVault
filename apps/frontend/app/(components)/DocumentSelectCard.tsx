"use client";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  FilePdf,
  ArrowRight,
  CheckCircle,
  Clock,
  Spinner,
  Warning,
  type IconProps,
} from "@phosphor-icons/react";

type DocumentStatus =
  | "UPLOADED"
  | "QUEUED"
  | "PROCESSING"
  | "READY"
  | "FAILED"
  | "CHUNKED";

type DocumentSelectCardProps = {
  id: string;
  fileName: string;
  fileSize: number | null;
  status: DocumentStatus;
  createdAt: string;
  onSelect: (id: string) => void;
};

const STATUS_CONFIG: Record<
  DocumentStatus,
  { label: string; className: string; icon: React.ComponentType<IconProps>; selectable: boolean }
> = {
  UPLOADED: {
    label: "Processing",
    className: "bg-amber-100 text-amber-800 border-amber-300",
    icon: Clock,
    selectable: false,
  },
  QUEUED: {
    label: "Queued",
    className: "bg-amber-100 text-amber-800 border-amber-300",
    icon: Clock,
    selectable: false,
  },
  PROCESSING: {
    label: "Processing",
    className: "bg-blue-100 text-blue-800 border-blue-300",
    icon: Spinner,
    selectable: false,
  },
  READY: {
    label: "Ready",
    className: "bg-emerald-100 text-emerald-800 border-emerald-300",
    icon: CheckCircle,
    selectable: true,
  },
  FAILED: {
    label: "Failed",
    className: "bg-red-100 text-red-800 border-red-300",
    icon: Warning,
    selectable: false,
  },
  CHUNKED: {
    label: "Ready",
    className: "bg-emerald-100 text-emerald-800 border-emerald-300",
    icon: CheckCircle,
    selectable: true,
  },
};

function formatBytes(bytes: number) {
  if (!bytes) return "0 KB";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1
  );
  return `${(bytes / 1024 ** i).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

const DocumentSelectCard = ({
  id,
  fileName,
  fileSize,
  status,
  createdAt,
  onSelect,
}: DocumentSelectCardProps) => {
  const config = STATUS_CONFIG[status];
  const StatusIcon = config.icon;
  const isSelectable = config.selectable;

  return (
    <Card
      className={cn(
        "group border-[#DBD5C6] bg-white transition-all",
        isSelectable
          ? "cursor-pointer hover:border-[#B54708] hover:shadow-md"
          : "opacity-60"
      )}
      onClick={isSelectable ? () => onSelect(id) : undefined}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0">
            <div className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#EFE9D8]">
              <FilePdf className="h-5 w-5 text-[#B54708]" weight="duotone" />
            </div>
            <div className="min-w-0">
              <p
                className="truncate text-[15px] font-medium text-[#1C1B18]"
                title={fileName}
              >
                {fileName}
              </p>
              <div className="mt-1 flex items-center gap-2">
                <span className="font-mono text-[11px] text-[#8A8370]">
                  {formatBytes(fileSize || 0)}
                </span>
                <span className="text-[#DBD5C6]">&middot;</span>
                <span className="font-mono text-[11px] text-[#8A8370]">
                  {new Date(createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={cn(
                "shrink-0 rounded-full border px-2 py-0.5 font-mono text-[10.5px] font-medium uppercase tracking-[0.08em]",
                config.className
              )}
            >
              <StatusIcon className="mr-1 inline h-3 w-3" weight="fill" />
              {config.label}
            </span>
            {isSelectable && (
              <ArrowRight
                className="h-4 w-4 text-[#B54708] opacity-0 transition-opacity group-hover:opacity-100"
                weight="bold"
              />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export { DocumentSelectCard };
