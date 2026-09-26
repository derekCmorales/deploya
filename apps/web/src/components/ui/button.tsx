import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Botón v4.1. Una acción `default` por vista; verbo en infinitivo («Desplegar»).
 * `destructive` solo para eliminar. `icon*` siempre con `aria-label`.
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md border border-transparent text-sm font-medium transition-[background-color,color,box-shadow,transform] duration-150 active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        secondary: "bg-muted text-foreground hover:bg-accent",
        outline: "border-border-strong bg-card text-foreground hover:bg-accent",
        ghost: "text-muted-foreground hover:bg-accent hover:text-foreground",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        "destructive-outline":
          "border-destructive/45 bg-transparent text-destructive hover:bg-destructive/10",
        link: "h-auto border-0 px-0 text-foreground underline decoration-border-stronger underline-offset-[3px] hover:decoration-foreground",
      },
      size: {
        default: "h-9 px-3.5",
        xs: "h-[26px] gap-1.5 rounded-sm px-2 text-xs [&_svg]:size-3.5",
        sm: "h-8 px-2.5 text-[13px]",
        lg: "h-10 px-[18px]",
        icon: "size-9",
        "icon-sm": "size-8",
        "icon-xs": "size-[26px] rounded-sm [&_svg]:size-3.5",
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
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
