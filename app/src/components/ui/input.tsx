import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-12 w-full rounded-xl border border-[#2A3338] bg-[#0E1518] px-4 py-2 text-base text-[#E9E1D8] placeholder:text-[#5F6A6E] focus:outline-none focus:border-[#9FA6A3] disabled:cursor-not-allowed disabled:opacity-40 transition-colors duration-150 font-feature-settings-tnum",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
