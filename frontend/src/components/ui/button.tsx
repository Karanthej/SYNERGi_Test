import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-semibold ring-offset-background interactive-glass-button focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 relative overflow-hidden",
  {
    variants: {
      variant: {
        default: "bg-primary/90 text-primary-foreground backdrop-blur-md shadow-[inset_0_1px_1px_rgba(255,255,255,0.3),0_4px_12px_rgba(56,103,255,0.25)] hover:shadow-[0_0_24px_rgba(56,103,255,0.4)] hover:bg-primary",
        destructive:
          "bg-destructive/90 text-destructive-foreground backdrop-blur-md shadow-[inset_0_1px_1px_rgba(255,255,255,0.3),0_4px_12px_rgba(244,63,94,0.25)] hover:shadow-[0_0_24px_rgba(244,63,94,0.4)] hover:bg-destructive",
        outline:
          "glass-surface hover:glass-floating hover:text-foreground",
        secondary:
          "glass text-secondary-foreground hover:glass-surface shadow-sm",
        ghost: "hover:glass text-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-6 py-2",
        sm: "h-9 px-4",
        lg: "h-12 px-8 text-base",
        icon: "h-11 w-11",
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
