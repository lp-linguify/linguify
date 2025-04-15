"use client"

import { cn } from "@/core/utils/utils"
import * as React from "react"

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "relative h-2 w-full overflow-hidden rounded-full bg-slate-100",
        className
      )}
      {...props}
    >
      <div
        className="h-full w-full flex-1 bg-gradient-to-r from-brand-purple to-brand-gold transition-all duration-300"
        style={{
          transform: `translateX(-${100 - (value || 0)}%)`
        }}
      />
    </div>
  )
)
Progress.displayName = "Progress"

export { Progress }