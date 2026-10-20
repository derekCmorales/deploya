import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Área de texto con el mismo trato que `Input`: sobre `sunken`, error con `aria-invalid` y foco
 * con anillo de Señal. Sin redimensionar; la altura se fija con `rows`.
 */
const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<"textarea">>(({ className, ...props }, ref) => (
  <textarea
    className={cn(
      "flex w-full min-w-0 resize-none rounded-md border border-input bg-sunken px-2.5 py-2 text-sm text-foreground transition-[border-color,box-shadow] placeholder:text-faint focus-visible:border-signal focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-signal-soft disabled:cursor-not-allowed disabled:opacity-55 aria-invalid:border-bad aria-invalid:focus-visible:ring-bad/15",
      className,
    )}
    ref={ref}
    {...props}
  />
));
Textarea.displayName = "Textarea";

export { Textarea };
