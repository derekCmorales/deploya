import { cn } from "@/lib/utils";

export interface LineaBitacora {
  n: number;
  /** Hora con milisegundos, p. ej. «12:04:01.112». */
  marca: string;
  etapa?: string;
  texto: string;
  nivel?: "info" | "aviso" | "error";
}

/**
 * Bitácora en Geist Mono: número, marca de tiempo y mensaje. La línea del error se
 * resalta en `bad`; `resaltada` marca una línea citada (Señal). Contenido no confiable:
 * se muestra como texto, nunca como HTML.
 */
function Bitacora({
  lineas,
  resaltada,
  enCurso,
  className,
  "aria-label": ariaLabel = "Bitácora de construcción",
}: {
  lineas: LineaBitacora[];
  resaltada?: number;
  enCurso?: boolean;
  className?: string;
  "aria-label"?: string;
}) {
  return (
    <div
      role="log"
      aria-label={ariaLabel}
      aria-live={enCurso ? "polite" : "off"}
      className={cn(
        "overflow-auto rounded-lg border border-border bg-sunken py-2 font-mono text-xs leading-5 text-foreground",
        className,
      )}
    >
      {lineas.map((l) => (
        <div
          key={l.n}
          id={`linea-${l.n}`}
          className={cn(
            "grid grid-cols-[44px_100px_1fr] gap-x-3 pr-4 whitespace-pre",
            l.nivel === "error" && "bg-bad/11 text-bad",
            l.nivel === "aviso" && "text-warn",
            resaltada === l.n && "bg-signal-soft",
          )}
        >
          <span className="text-right text-faint select-none">{l.n}</span>
          <span className="text-muted-foreground">{l.marca}</span>
          <span className="min-w-0 overflow-hidden text-ellipsis">
            {l.etapa ? <span className="inline-block w-[13ch] text-muted-foreground">{l.etapa}</span> : null}
            {l.texto}
          </span>
        </div>
      ))}
      {enCurso ? (
        <div className="grid grid-cols-[44px_100px_1fr] gap-x-3">
          <span />
          <span />
          <span className="dy-cursor inline-block h-3.5 w-[7px] bg-signal align-[-2px]" aria-hidden />
        </div>
      ) : null}
    </div>
  );
}

export { Bitacora };
