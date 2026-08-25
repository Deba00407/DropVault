import * as React from "react"

import { cn } from "@/lib/utils"

function Badge({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="badge"
      className={cn(
        "inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-[10px] font-medium leading-none text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}

export { Badge }
