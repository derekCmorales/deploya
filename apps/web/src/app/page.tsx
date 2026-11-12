import type { Metadata } from "next";

import { tituloDePagina } from "@/lib/titulos";

import { Inicio } from "./_inicio/inicio";
import { RedirigeAConfigurar } from "./redirige-a-configurar";

/** La portada comparte segmento con el layout raíz, así que la plantilla de título no le aplica. */
export const metadata: Metadata = { title: tituloDePagina("Inicio") };

/** Pantalla 00 · Inicio: el panel al entrar. Sin sesión, la raíz lleva a la landing o a iniciar sesión. */
export default function InicioPage() {
  return (
    <>
      <RedirigeAConfigurar />
      <Inicio />
    </>
  );
}
