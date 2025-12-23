import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-medium uppercase tracking-wide",
  {
    variants: {
      variant: {
        default: "bg-[#2A3338] text-[#E9E1D8]",
        secondary: "bg-[#0E1518] text-[#9FA6A3] border border-[#2A3338]",
        penalty: "bg-transparent text-[#8C3A32] border border-[#8C3A32]",
        neutral: "bg-[#0E1518] text-[#5F6A6E] border border-[#2A3338]",
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
