import type { EstadoDespliegue } from "./estados";

/** Despliegues por página en la pantalla 14 (`GET /proyectos/:id/despliegues`). */
export const PAGINA_HISTORIAL = 20;

export const FILTROS_HISTORIAL = ["todos", "saludables", "fallidos"] as const;
export type FiltroHistorial = (typeof FILTROS_HISTORIAL)[number];

export function esFiltroHistorial(valor: string): valor is FiltroHistorial {
  return (FILTROS_HISTORIAL as readonly string[]).includes(valor);
}

/** Estado que selecciona cada filtro; `todos` no filtra. */
export const ESTADO_POR_FILTRO: Readonly<Record<FiltroHistorial, EstadoDespliegue | null>> = {
  todos: null,
  saludables: "saludable",
  fallidos: "fallido",
};
