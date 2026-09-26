import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Etiqueta corta. Para estados de despliegue o suscripción no la armes a mano:
 * usa `EstadoDespliegue` / `EstadoSuscripcion`, que fijan palabra, icono y tono.
 * Los tonos de estado siempre van con palabra (y de preferencia icono).
 */
const badgeVariants = cva(
  "inline-flex h-[22px] w-fit shrink-0 items-center gap-[5px] rounded-sm px-2 text-xs font-medium whitespace-nowrap [&_svg]:size-3 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        muted: "bg-muted text-muted-foreground",
        outline: "border border-border-strong text-foreground",
        signal: "bg-signal-soft text-signal",
        ok: "bg-ok/14 text-ok",
        warn: "bg-warn/14 text-warn",
        bad: "bg-bad/14 text-bad",
      },
      size: {
        default: "",
        lg: "h-[26px] px-2.5 text-[13px] [&_svg]:size-3.5",
      },
    },
    defaultVariants: {
      variant: "muted",
      size: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant, size }), className)} {...props} />;
}

export { Badge, badgeVariants };
