import type { CSSProperties } from "react";

/**
 * Colores del sistema leídos como variables CSS (globals.css, claro y `.dark`). Van en
 * `style` y no como clases de Tailwind, así el dibujo no depende de que se generen
 * utilidades `fill-*` o `stroke-*`, y cambia solo con el tema. Equivalencias con el
 * canvas: `--fg` = `--foreground`, `--line-3` = `--border-stronger`.
 */
const TINTA = "var(--foreground)";
const SENAL = "var(--signal)";
const LINEA = "var(--border-stronger)";

/** Retrasos de la entrada (ms): las piezas llegan una tras otra y el halo empieza al final. */
const ENTRADA = { circulo: 80, bloque: 220, punto: 420, barra: 560, halo: 900 } as const;

const trazo = (color: string, ancho: number): CSSProperties => ({ fill: "none", stroke: color, strokeWidth: ancho });
const relleno = (color: string): CSSProperties => ({ fill: color });
const retraso = (ms: number) => ({ "--retraso": `${ms}ms` }) as CSSProperties;
/** El halo y la flotación salen del `viewBox`; sin esto el navegador los corta arriba. */
const SIN_RECORTE: CSSProperties = { overflow: "visible" };

/**
 * Ilustración de acceso de la pantalla 01 (artboard `01-Registro` del canvas v4.1). Al
 * abrir, el círculo, el bloque y el punto aparecen escalonados (`dy-aparece`) y la barra
 * de Señal crece hasta su 30 % de la línea y se queda (`dy-crece-x`). Después la órbita
 * gira (`dy-giro-lento`) y el punto flota (`dy-flota`) y respira (`dy-respira`). El
 * movimiento vive en globals.css y se apaga con `prefers-reduced-motion`. Solo decora.
 */
export function IlustracionRegistro({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 292 256" aria-hidden="true" focusable="false" className={className} style={SIN_RECORTE}>
      <circle
        className="dy-giro-lento"
        cx="117"
        cy="121"
        r="109"
        style={{ ...trazo(LINEA, 1.5), strokeDasharray: "3 9" }}
      />
      <circle
        className="dy-aparece"
        cx="115"
        cy="121"
        r="80"
        style={{ ...trazo(TINTA, 1.2), ...retraso(ENTRADA.circulo) }}
      />
      <rect
        className="dy-aparece"
        x="131"
        y="81"
        width="102"
        height="102"
        style={{ ...relleno(TINTA), ...retraso(ENTRADA.bloque) }}
      />
      <g className="dy-flota">
        <circle className="dy-respira" cx="241" cy="40" r="23" style={{ ...relleno(SENAL), ...retraso(ENTRADA.halo) }} />
        <circle className="dy-aparece" cx="241" cy="40" r="23" style={{ ...relleno(SENAL), ...retraso(ENTRADA.punto) }} />
      </g>
      <line x1="10" y1="243" x2="282" y2="243" style={trazo(LINEA, 1.2)} />
      <rect
        className="dy-crece-x"
        x="10"
        y="240"
        width="82"
        height="6"
        style={{ ...relleno(SENAL), opacity: 0.9, ...retraso(ENTRADA.barra) }}
      />
    </svg>
  );
}
