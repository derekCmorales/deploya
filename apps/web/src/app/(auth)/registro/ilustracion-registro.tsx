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

const trazo = (color: string, ancho: number): CSSProperties => ({ fill: "none", stroke: color, strokeWidth: ancho });
const relleno = (color: string): CSSProperties => ({ fill: color });

/**
 * Ilustración de acceso de la pantalla 01 (artboard `01-Registro` del canvas v4.1):
 * órbita de rayas que gira (`dy-giro-lento`), círculo de trazo, bloque de tinta, punto de
 * Señal que flota (`dy-flota`) y la barra de Señal quieta al 30 % de la línea. El
 * movimiento vive en globals.css y se apaga con `prefers-reduced-motion`. Solo decora.
 */
export function IlustracionRegistro({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 292 256" aria-hidden="true" focusable="false" className={className}>
      <circle
        className="dy-giro-lento"
        cx="117"
        cy="121"
        r="109"
        style={{ ...trazo(LINEA, 1.5), strokeDasharray: "3 9" }}
      />
      <circle cx="115" cy="121" r="80" style={trazo(TINTA, 1.2)} />
      <rect x="131" y="81" width="102" height="102" style={relleno(TINTA)} />
      <circle className="dy-flota" cx="241" cy="40" r="23" style={relleno(SENAL)} />
      <line x1="10" y1="243" x2="282" y2="243" style={trazo(LINEA, 1.2)} />
      <rect x="10" y="240" width="82" height="6" style={{ ...relleno(SENAL), opacity: 0.9 }} />
    </svg>
  );
}
