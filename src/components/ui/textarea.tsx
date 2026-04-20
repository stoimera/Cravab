import * as React from "react"

import { cn } from "@/lib/utils"

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  // This interface extends the base textarea props
  // Add any additional custom props here if needed in the future
  _dummy?: never // This prevents the empty interface error
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-md border border-gray-200 bg-background px-3 py-2 text-sm placeholder:!text-gray-500 transition-all duration-200 hover:border-gray-300 focus:border-gray-400 focus:ring-0 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }