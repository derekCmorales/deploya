"use client";

import { Check, Copy } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Valor copiable en mono (URL pública, digest, comando). */
function CopyField({ value, label = "Copiar", className }: { value: string; label?: string; className?: string }) {
  const [copiado, setCopiado] = React.useState(false);
  React.useEffect(() => {
    if (!copiado) return;
    const t = setTimeout(() => setCopiado(false), 1600);
    return () => clearTimeout(t);
  }, [copiado]);
  return (
    <div
      className={cn(
        "flex h-9 items-center gap-2 rounded-md border border-border-strong bg-sunken pr-1 pl-3",
        className,
      )}
    >
      <span className="min-w-0 flex-1 truncate font-mono text-[13px]">{value}</span>
      <Button
        type="button"
        variant="ghost"
        size="xs"
        onClick={async () => {
          await navigator.clipboard?.writeText(value);
          setCopiado(true);
        }}
        aria-label={copiado ? "Copiado" : label}
      >
        {copiado ? <Check className="text-ok" /> : <Copy />}
        <span aria-live="polite">{copiado ? "Copiado" : label}</span>
      </Button>
    </div>
  );
}

export { CopyField };
