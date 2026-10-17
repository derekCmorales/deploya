"use client";

import { useSondeo, type Sondeo } from "@/hooks/use-sondeo";
import { pedirApi } from "@/lib/api";
import type { FilaPago } from "@/lib/pagos";

const leerPagos = () => pedirApi<FilaPago[]>("/suscripciones/pagos");
const nunca = () => false;

/** `GET /suscripciones/pagos` (09 y 09b). */
export function usePagos(): Sondeo<FilaPago[]> {
  return useSondeo(leerPagos, nunca);
}
