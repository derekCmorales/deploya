import type { Metadata } from "next";

import { PaginaInexistente } from "@/components/estados/pagina-inexistente";

export const metadata: Metadata = { title: "Página inexistente · Deploya" };

/** Pantalla 28 · 404 (WEB-02). */
export default function NotFound() {
  return <PaginaInexistente />;
}
