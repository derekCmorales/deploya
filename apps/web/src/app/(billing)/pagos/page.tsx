import type { Metadata } from "next";

import { RequiereSesion } from "@/components/shell/requiere-sesion";

import { PagosContenedor } from "./_componentes/pagos-contenedor";

export const metadata: Metadata = { title: "Historial de pagos · Deploya" };

export default function PagosPage() {
  return (
    <RequiereSesion>
      <PagosContenedor />
    </RequiereSesion>
  );
}
