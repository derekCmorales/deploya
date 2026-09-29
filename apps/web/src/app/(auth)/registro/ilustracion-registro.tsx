/**
 * Ilustración de acceso de la pantalla 01 (artboard `01-Registro` del canvas v4.1): órbita
 * punteada, círculo de trazo, bloque de tinta, punto de Señal y la barra de progreso que
 * arranca. Solo tokens del sistema, así funciona igual en claro y en oscuro.
 */
export function IlustracionRegistro({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 292 256" fill="none" aria-hidden focusable="false" className={className}>
      <circle cx="117" cy="121" r="109" className="stroke-faint" strokeWidth="1.8" strokeLinecap="round" strokeDasharray="0 8" />
      <circle cx="115" cy="121" r="80" className="stroke-foreground" strokeWidth="1.2" />
      <rect x="131" y="81" width="102" height="102" className="fill-foreground" />
      <circle cx="241" cy="40" r="23" className="fill-signal" />
      <line x1="10" y1="243" x2="282" y2="243" className="stroke-border-stronger" strokeWidth="1.2" />
      <rect x="10" y="240" width="82" height="6" className="fill-signal" />
    </svg>
  );
}
