import { pedirApi } from "@/lib/api";
import type { UsuarioSesion } from "@/lib/api-identidad";
import type { SmtpParaApi } from "@/lib/asistente";

/** Asistente 31 (SP-17), contrato instalacion.md § Primera configuración. */

export function validarCodigo(codigo: string): Promise<void> {
  return pedirApi("/instalacion/codigo", { metodo: "POST", cuerpo: { codigo } });
}

/** 201 + `Set-Cookie`: al volver, la sesión del administrador ya está iniciada. */
export function crearAdministrador(codigo: string, correo: string, contrasena: string): Promise<{ usuario: UsuarioSesion }> {
  return pedirApi("/instalacion/administrador", { metodo: "POST", cuerpo: { codigo, correo, contrasena } });
}

/** Manda el correo de prueba al administrador; un rechazo llega como `ErrorApi` 502 con `detalle.error`. */
export function probarCorreo(smtp: SmtpParaApi): Promise<{ entregado: true; ms: number }> {
  return pedirApi("/instalacion/correo/prueba", { metodo: "POST", cuerpo: { smtp } });
}

export function guardarCorreo(eleccion: { smtp: SmtpParaApi } | { sinCorreo: true }): Promise<void> {
  return pedirApi("/instalacion/correo", { metodo: "PATCH", cuerpo: eleccion });
}
