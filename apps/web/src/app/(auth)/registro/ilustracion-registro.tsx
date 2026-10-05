import type { CSSProperties } from "react";

/**
 * Colores del sistema leídos como variables CSS (globals.css, claro y `.dark`). Van en
 * `style` y no como clases de Tailwind, así el dibujo no depende de que se generen
 * utilidades `fill-*` o `stroke-*`, y cambia solo con el tema.
 */
const TINTA = "var(--foreground)";
const SENAL = "var(--signal)";
const PUNTOS = "var(--faint)";
const LINEA = "var(--border-stronger)";

const trazo = (color: string, ancho: number): CSSProperties => ({ fill: "none", stroke: color, strokeWidth: ancho });
const relleno = (color: string): CSSProperties => ({ fill: color });

/**
 * Movimiento del artboard `01-Registro`: la órbita punteada gira y la barra de Señal se
 * llena como una carga. Sin movimiento (`prefers-reduced-motion`) queda quieta, con la
 * barra a un tercio como en el diseño.
 */
const MOVIMIENTO = `
.ilus-registro-orbita { transform-box: fill-box; transform-origin: center; animation: ilus-registro-giro 24s linear infinite; }
.ilus-registro-carga { transform-box: fill-box; transform-origin: left center; transform: scaleX(0.3); animation: ilus-registro-llenado 3.2s cubic-bezier(0.65, 0, 0.35, 1) infinite; }
@keyframes ilus-registro-giro { to { transform: rotate(360deg); } }
@keyframes ilus-registro-llenado { 0% { transform: scaleX(0.04); } 80%, 100% { transform: scaleX(1); } }
@media (prefers-reduced-motion: reduce) { .ilus-registro-orbita, .ilus-registro-carga { animation: none; } }
`;

/**
 * Ilustración de acceso de la pantalla 01 (artboard `01-Registro` del canvas v4.1):
 * órbita punteada, círculo de trazo, bloque de tinta, punto de Señal y la barra de
 * progreso. Solo decora: `aria-hidden`.
 */
export function IlustracionRegistro({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 292 256" aria-hidden="true" focusable="false" className={className}>
      <style>{MOVIMIENTO}</style>
      <circle
        className="ilus-registro-orbita"
        cx="117"
        cy="121"
        r="109"
        style={{ ...trazo(PUNTOS, 1.8), strokeLinecap: "round", strokeDasharray: "0 8" }}
      />
      <circle cx="115" cy="121" r="80" style={trazo(TINTA, 1.2)} />
      <rect x="131" y="81" width="102" height="102" style={relleno(TINTA)} />
      <circle cx="241" cy="40" r="23" style={relleno(SENAL)} />
      <line x1="10" y1="243" x2="282" y2="243" style={trazo(LINEA, 1.2)} />
      <rect className="ilus-registro-carga" x="10" y="240" width="272" height="6" style={relleno(SENAL)} />
    </svg>
  );
}
