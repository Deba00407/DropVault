import * as React from "react"

import { cn } from "@/lib/utils"

type ProgressProps = React.ComponentProps<"div"> & {
  value?: number
}

function Progress({ value = 0, className, ...props }: ProgressProps) {
  const boundedValue = Math.max(0, Math.min(100, value))

  return (
    <div
      data-slot="progress"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={boundedValue}
      className={cn("h-1.5 w-full overflow-hidden rounded-full bg-muted", className)}
      {...props}
    >
      <div
        data-slot="progress-indicator"
        className="h-full rounded-full bg-[#00668a] transition-all duration-500 ease-out"
        style={{ width: `${boundedValue}%` }}
      />
    </div>
  )
}

export { Progress }
