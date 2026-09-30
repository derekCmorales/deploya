import type { ReactNode } from "react";

import { CabeceraCobro } from "../../_componentes/cabecera-cobro";

export function CabeceraPlanes({ children }: { children: ReactNode }) {
  return (
    <CabeceraCobro
      eyebrow="Cobro · Planes"
      titulo="Planes"
      subtitulo="Precios en USD. Pagas por vigencia; nada se renueva sin tu permiso."
      actual="planes"
    >
      {children}
    </CabeceraCobro>
  );
}
