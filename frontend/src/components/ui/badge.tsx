import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-primary/30 bg-primary/15 text-primary hover:bg-primary/25",
        secondary:
          "border-white/10 bg-white/5 text-gray-300 hover:bg-white/10",
        destructive:
          "border-destructive/30 bg-destructive/15 text-destructive hover:bg-destructive/25",
        outline: "border-white/10 text-foreground",
        success:
          "border-emerald-500/30 bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
