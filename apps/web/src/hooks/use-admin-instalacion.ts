"use client";

import { useSondeo, type Sondeo } from "@/hooks/use-sondeo";
import type { EstadoInstalacion, PoliticaRegistro } from "@/lib/admin-instalacion";
import { pedirApi } from "@/lib/api";

const nunca = () => false;
const leer = () => pedirApi<EstadoInstalacion>("/admin/instalacion");

/** `GET /admin/instalacion` (32): una lectura; «Volver a comprobar» llama a `recargar`. */
export function useAdminInstalacion(): Sondeo<EstadoInstalacion> {
  return useSondeo(leer, nunca);
}

export function cambiarRegistro(politica: PoliticaRegistro): Promise<unknown> {
  return pedirApi("/admin/instalacion/registro", { metodo: "PATCH", cuerpo: { politica } });
}

export function cambiarLimites(cuerpo: { cpu: number; memoriaMb: number; proyectosPorUsuario: number | null }): Promise<unknown> {
  return pedirApi("/admin/instalacion/limites", { metodo: "PATCH", cuerpo });
}

export function crearInvitacion(correo: string): Promise<{ id: string; enlace: string; vence: string }> {
  return pedirApi("/admin/invitaciones", { metodo: "POST", cuerpo: { correo } });
}

export function revocarInvitacion(id: string): Promise<unknown> {
  return pedirApi(`/admin/invitaciones/${encodeURIComponent(id)}`, { metodo: "DELETE" });
}
