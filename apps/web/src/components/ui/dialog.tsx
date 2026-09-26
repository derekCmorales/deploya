"use client";

import { X } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Diálogo modal sobre `<dialog>` nativo (foco atrapado y Escape por el navegador).
 * Para confirmaciones destructivas pide escribir el nombre (pantalla 19b).
 */
export interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  footer?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

function Dialog({ open, onOpenChange, title, description, footer, children, className }: DialogProps) {
  const ref = React.useRef<HTMLDialogElement>(null);
  const tituloId = React.useId();
  React.useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      aria-labelledby={tituloId}
      onClose={() => onOpenChange(false)}
      onClick={(e) => {
        if (e.target === ref.current) onOpenChange(false);
      }}
      className={cn(
        "m-auto w-[min(480px,calc(100vw-32px))] rounded-xl border border-border-strong bg-popover p-0 text-foreground shadow-elev backdrop:bg-[var(--overlay)]",
        className,
      )}
    >
      <div className="flex flex-col gap-4 p-5">
        <div className="flex items-start gap-3">
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <h2 id={tituloId} className="text-lg leading-6 font-semibold tracking-[-0.02em]">
              {title}
            </h2>
            {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
          </div>
          <Button variant="ghost" size="icon-sm" aria-label="Cerrar" onClick={() => onOpenChange(false)}>
            <X />
          </Button>
        </div>
        {children}
      </div>
      {footer ? (
        <div className="flex justify-end gap-2 border-t border-border px-5 py-3">{footer}</div>
      ) : null}
    </dialog>
  );
}

export { Dialog };
