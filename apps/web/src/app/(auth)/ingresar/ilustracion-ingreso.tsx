import type { CSSProperties } from "react";

/**
 * Colores del sistema como variables CSS: cambian solos con el tema (ver
 * ilustracion-registro.tsx). Equivalencias con el canvas: `--fg` = `--foreground`,
 * `--line-3` = `--border-stronger`.
 */
const TINTA = "var(--foreground)";
const SENAL = "var(--signal)";
const LINEA = "var(--border-stronger)";

const trazo = (color: string, ancho: number): CSSProperties => ({ fill: "none", stroke: color, strokeWidth: ancho });
const relleno = (color: string): CSSProperties => ({ fill: color });

/**
 * Ilustración de acceso de la pantalla 03 (artboard `03-Iniciar sesión` del canvas v4.1):
 * cúpula de tinta sobre la línea del horizonte, arco de rayas quieto, dos cuadros y el
 * punto de Señal. El punto se dibuja primero para quedar detrás de la cúpula: en reposo
 * se esconde un poco y al flotar (`dy-flota`) asoma. Es el único movimiento de la
 * pantalla; vive en globals.css y se apaga con `prefers-reduced-motion`. Solo decora.
 */
export function IlustracionIngreso({ className }: { className?: string }) {
  return (
    <svg viewBox="0 -8 360 360" aria-hidden="true" focusable="false" className={className}>
      <circle className="dy-flota" cx="180" cy="35" r="25" style={relleno(SENAL)} />
      <path d="M44 187 A136 136 0 0 1 316 187 Z" style={relleno(TINTA)} />
      <line x1="10" y1="197" x2="350" y2="197" style={trazo(TINTA, 1.4)} />
      <path d="M44 208 A136 136 0 0 0 316 208" style={{ ...trazo(LINEA, 1.4), strokeDasharray: "3 9" }} />
      <rect x="21" y="276" width="10" height="10" style={relleno(TINTA)} />
      <rect x="302" y="276" width="38" height="38" style={trazo(SENAL, 1.6)} />
    </svg>
  );
}
