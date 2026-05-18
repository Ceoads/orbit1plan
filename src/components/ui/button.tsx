import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-mono text-sm font-medium ring-offset-background transition-opacity duration-150 ease-out focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground rounded-[12px] hover:opacity-90",
        destructive: "bg-destructive text-destructive-foreground rounded-[12px] hover:opacity-90",
        outline: "border border-[hsl(var(--border))] bg-transparent text-foreground rounded-[12px] hover:border-[hsl(var(--border-hover))] transition-[border-color] hover:opacity-100",
        secondary: "bg-card border border-[hsl(var(--border))] text-foreground rounded-[12px] hover:border-[hsl(var(--border-hover))]",
        ghost: "text-muted-foreground rounded-[12px] hover:text-foreground hover:opacity-100",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-5 py-2",
        sm: "h-9 px-3 text-xs rounded-[8px]",
        lg: "h-[52px] px-7 text-base rounded-[12px]",
        icon: "h-11 w-11 rounded-[12px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
