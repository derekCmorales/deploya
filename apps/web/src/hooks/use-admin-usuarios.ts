"use client";

import { useCallback } from "react";

import { useSondeo, type Sondeo } from "@/hooks/use-sondeo";
import { consultaUsuarios, type DetalleUsuario, type FiltroUsuarios, type MotivoSuspension, type PaginaUsuarios } from "@/lib/admin-usuarios";
import { pedirApi } from "@/lib/api";

const nunca = () => false;

/** `GET /admin/usuarios` (25) con el filtro actual; una lectura por cambio de filtro. */
export function useUsuariosAdmin({ correo, suscripcion, pagina }: FiltroUsuarios): Sondeo<PaginaUsuarios> {
  const leer = useCallback(() => pedirApi<PaginaUsuarios>(consultaUsuarios({ correo, suscripcion, pagina })), [correo, suscripcion, pagina]);
  return useSondeo(leer, nunca);
}

/** `GET /admin/usuarios/:id`: el panel de detalle; `null` no pide nada. */
export function useDetalleUsuario(id: string | null): Sondeo<DetalleUsuario> {
  const leer = useCallback(() => pedirApi<DetalleUsuario>(`/admin/usuarios/${encodeURIComponent(id ?? "")}`), [id]);
  return useSondeo(id ? leer : null, nunca);
}

const leerMotivos = () => pedirApi<{ motivos: MotivoSuspension[] }>("/admin/usuarios/motivos-suspension");

/** La lista de motivos de 25b. */
export function useMotivosSuspension(): Sondeo<{ motivos: MotivoSuspension[] }> {
  return useSondeo(leerMotivos, nunca);
}

/** `POST /admin/usuarios/:id/suspension` (25b). */
export function suspenderCuenta(id: string, cuerpo: { motivo: string; detalle: string | null }): Promise<unknown> {
  return pedirApi(`/admin/usuarios/${encodeURIComponent(id)}/suspension`, { metodo: "POST", cuerpo });
}
