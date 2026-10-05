import type { CSSProperties } from "react";

/** Colores del sistema como variables CSS: cambian solos con el tema (ver ilustracion-registro.tsx). */
const TINTA = "var(--foreground)";
const SENAL = "var(--signal)";
const PUNTOS = "var(--faint)";
const LINEA = "var(--muted-foreground)";

const trazo = (color: string, ancho: number): CSSProperties => ({ fill: "none", stroke: color, strokeWidth: ancho });
const relleno = (color: string): CSSProperties => ({ fill: color });

/**
 * Movimiento del artboard `03-Iniciar sesión`: el punto de Señal flota detrás de la cúpula
 * (sube hasta apenas tocarla y baja hasta esconderse un poco) y los puntos del arco
 * recorren la media luna. El desplazamiento del trazo es múltiplo del espacio entre
 * puntos (8), así la vuelta no salta. Sin movimiento (`prefers-reduced-motion`) queda quieto.
 */
const MOVIMIENTO = `
.ilus-ingreso-punto { animation: ilus-ingreso-flota 2.8s ease-in-out infinite alternate; }
.ilus-ingreso-arco { animation: ilus-ingreso-recorre 2.8s linear infinite; }
@keyframes ilus-ingreso-flota { from { transform: translateY(0); } to { transform: translateY(6px); } }
@keyframes ilus-ingreso-recorre { to { stroke-dashoffset: -80; } }
@media (prefers-reduced-motion: reduce) { .ilus-ingreso-punto, .ilus-ingreso-arco { animation: none; } }
`;

/**
 * Ilustración de acceso de la pantalla 03 (artboard `03-Iniciar sesión` del canvas v4.1):
 * cúpula de tinta sobre una línea, arco punteado, dos cuadros y el punto de Señal.
 * El punto se dibuja primero para quedar detrás de la cúpula. Solo decora: `aria-hidden`.
 */
export function IlustracionIngreso({ className }: { className?: string }) {
  return (
    <svg viewBox="0 -8 360 360" aria-hidden="true" focusable="false" className={className}>
      <style>{MOVIMIENTO}</style>
      <circle className="ilus-ingreso-punto" cx="180" cy="27" r="25" style={relleno(SENAL)} />
      <path d="M44 187 A136 136 0 0 1 316 187 Z" style={relleno(TINTA)} />
      <line x1="10" y1="197" x2="350" y2="197" style={trazo(LINEA, 1.6)} />
      <path
        className="ilus-ingreso-arco"
        d="M44 208 A136 136 0 0 0 316 208"
        style={{ ...trazo(PUNTOS, 1.8), strokeLinecap: "round", strokeDasharray: "0 8" }}
      />
      <rect x="21" y="276" width="10" height="10" style={relleno(TINTA)} />
      <rect x="302" y="276" width="38" height="38" style={trazo(SENAL, 1.6)} />
    </svg>
  );
}
