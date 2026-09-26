import { cva, type VariantProps } from "class-variance-authority";
import { CircleAlert, Info, Loader, TriangleAlert } from "lucide-react";
import type * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Aviso en línea. `warn` (suscripción Vencida, límite cerca), `bad` (error que
 * bloquea), `signal` (algo en curso), `muted` (información).
 */
const bannerVariants = cva(
  "flex items-start gap-3 rounded-lg border px-3.5 py-3 text-sm [&>svg]:mt-px [&>svg]:size-[18px] [&>svg]:shrink-0",
  {
    variants: {
      variant: {
        muted: "border-border-strong bg-card [&>svg]:text-muted-foreground",
        warn: "border-warn/40 bg-[color-mix(in_oklab,var(--warn)_7%,var(--background))] [&>svg]:text-warn",
        bad: "border-bad/40 bg-[color-mix(in_oklab,var(--bad)_7%,var(--background))] [&>svg]:text-bad",
        signal: "border-signal-line bg-signal-soft [&>svg]:text-signal",
      },
    },
    defaultVariants: { variant: "muted" },
  },
);

const iconos = { muted: Info, warn: TriangleAlert, bad: CircleAlert, signal: Loader };

export interface BannerProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "title">,
    VariantProps<typeof bannerVariants> {
  title: React.ReactNode;
  /** Acciones a la derecha (botones sm). */
  actions?: React.ReactNode;
}

function Banner({ className, variant, title, actions, children, ...props }: BannerProps) {
  const Icono = iconos[variant ?? "muted"];
  return (
    <div
      role={variant === "bad" ? "alert" : "status"}
      className={cn(bannerVariants({ variant }), className)}
      {...props}
    >
      <Icono aria-hidden />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p className="font-medium">{title}</p>
        {children ? <div className="text-muted-foreground">{children}</div> : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export { Banner, bannerVariants };
