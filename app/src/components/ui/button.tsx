import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-opacity duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#E9E1D8]/30 disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-[#E9E1D8] text-[#0E1518] hover:opacity-90 rounded-xl",
        danger: "bg-transparent border border-[#8C3A32] text-[#8C3A32] hover:bg-[#8C3A32]/5 rounded-xl",
        outline: "border border-[#2A3338] bg-transparent text-[#E9E1D8] hover:bg-[#141D21] rounded-xl",
        ghost: "text-[#9FA6A3] hover:text-[#E9E1D8] hover:bg-[#141D21] rounded-lg",
        link: "text-[#E9E1D8] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-6 py-2",
        sm: "h-9 px-4 text-xs",
        lg: "h-12 px-8 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
