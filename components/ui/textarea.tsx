import * as React from "react"

import { cn } from "@/lib/utils"

type TextareaProps = React.ComponentProps<"textarea"> & {
  variant?: "default" | "glass"
}

function Textarea({ className, variant = "default", ...props }: TextareaProps) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "placeholder:text-muted-foreground flex field-sizing-content min-h-24 w-full rounded-md border px-4 py-3 text-base shadow-sm transition-all outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm backdrop-blur-md",
        variant === "glass"
          ? "bg-white/10 border-white/25 text-foreground"
          : "border-border/40 bg-input",
        "focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/30 focus-visible:shadow-md",
        "hover:border-ring/60 hover:shadow-md",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
