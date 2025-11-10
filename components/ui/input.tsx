import * as React from "react"

import { cn } from "@/lib/utils"

type InputProps = React.ComponentProps<"input"> & {
  variant?: "default" | "glass"
}

function Input({ className, type, variant = "default", ...props }: InputProps) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground h-10 w-full min-w-0 rounded-md border px-4 py-2 text-base shadow-sm transition-all outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm backdrop-blur-md",
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

export { Input }
