import type { Metadata } from "next";

import { RequiereSesion } from "@/components/shell/requiere-sesion";

import { MiSuscripcionContenedor } from "./_componentes/mi-suscripcion-contenedor";

export const metadata: Metadata = { title: "Mi suscripción · Deploya" };

export default function SuscripcionPage() {
  return (
    <RequiereSesion>
      <MiSuscripcionContenedor />
    </RequiereSesion>
  );
}
