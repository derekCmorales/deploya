import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Campo de 36px sobre `sunken`. Error con `aria-invalid`; foco con anillo de Señal.
 * Variables, puertos, URLs y comandos: `className="font-mono"`.
 */
const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      className={cn(
        "flex h-9 w-full min-w-0 rounded-md border border-input bg-sunken px-2.5 text-sm text-foreground transition-[border-color,box-shadow] placeholder:text-faint file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:border-signal focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-signal-soft disabled:cursor-not-allowed disabled:opacity-55 aria-invalid:border-bad aria-invalid:focus-visible:ring-bad/15",
        className,
      )}
      ref={ref}
      {...props}
    />
  ),
);
Input.displayName = "Input";

export { Input };
