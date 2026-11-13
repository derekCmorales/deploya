import type { ReactNode } from "react";

import { CabeceraCobro } from "../../_componentes/cabecera-cobro";

export function CabeceraPlanes({ children }: { children: ReactNode }) {
  return (
    <CabeceraCobro
      eyebrow="Cobro · Planes"
      titulo="Planes"
      subtitulo="Tarifa de lanzamiento en USD. Por 365 días pagas 10 meses: dos gratis. Nada se renueva sin tu permiso."
      actual="planes"
    >
      {children}
    </CabeceraCobro>
  );
}
