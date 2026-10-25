import type { LimitesInstalacion, PoliticaRegistro } from "../../../suscripciones/modo/configuracion-instalacion";
import { AjusteInvalido } from "../../dominio/errores";

/** Valores nuevos de `AccionAdministrativa.accion` (datos-nucleo.md v2). */
export const ACCION_CAMBIAR_REGISTRO = "cambiar-registro";
export const ACCION_CAMBIAR_LIMITES = "cambiar-limites";
export const ACCION_CREAR_INVITACION = "crear-invitacion";
export const ACCION_REVOCAR_INVITACION = "revocar-invitacion";

const POLITICAS: readonly PoliticaRegistro[] = ["abierto", "invitacion", "cerrado"];
/** Las opciones del `Segmented` de la 32. */
export const OPCIONES_CPU: readonly number[] = [0.5, 1, 2];
export const OPCIONES_MEMORIA_MB: readonly number[] = [512, 1024, 2048];
const MAXIMO_PROYECTOS_POR_USUARIO = 1000;
/** Lo que reserva deploya (api, web, trabajador, postgres, redis, traefik) en la estimación de la 32. */
export const MEMORIA_DEPLOYA_MB = 1024;

/** `PATCH /admin/instalacion/registro { politica }`. */
export function validarPolitica(cuerpo: unknown): PoliticaRegistro {
  const { politica } = (cuerpo ?? {}) as Record<string, unknown>;
  if (!POLITICAS.includes(politica as PoliticaRegistro)) throw new AjusteInvalido("La política es abierto, invitacion o cerrado.");
  return politica as PoliticaRegistro;
}

function proyectosValidos(valor: unknown): number | null {
  if (valor === null) return null;
  if (typeof valor === "number" && Number.isInteger(valor) && valor >= 1 && valor <= MAXIMO_PROYECTOS_POR_USUARIO) return valor;
  throw new AjusteInvalido(`Proyectos por usuario: un entero de 1 a ${MAXIMO_PROYECTOS_POR_USUARIO}, o null para no limitar.`);
}

/** `PATCH /admin/instalacion/limites { cpu, memoriaMb, proyectosPorUsuario }`: los valores de la 32. */
export function validarLimites(cuerpo: unknown): LimitesInstalacion {
  const { cpu, memoriaMb, proyectosPorUsuario } = (cuerpo ?? {}) as Record<string, unknown>;
  if (!OPCIONES_CPU.includes(cpu as number)) throw new AjusteInvalido(`CPU por proyecto: ${OPCIONES_CPU.join(", ")} vCPU.`);
  if (!OPCIONES_MEMORIA_MB.includes(memoriaMb as number)) throw new AjusteInvalido(`Memoria por proyecto: ${OPCIONES_MEMORIA_MB.join(", ")} MB.`);
  return { cpuPorProyecto: cpu as number, memoriaMbPorProyecto: memoriaMb as number, proyectosPorUsuario: proyectosValidos(proyectosPorUsuario) };
}

/**
 * «En este servidor caben unos 3 proyectos activos con 1 GB cada uno»: memoria libre menos lo que
 * usa deploya, dividida por la memoria por proyecto. Orientativa; `null` sin reporte del servidor.
 */
export function capacidadEstimada(memoriaLibreMb: number | null, memoriaPorProyectoMb: number): number | null {
  if (memoriaLibreMb === null) return null;
  return Math.max(0, Math.floor((memoriaLibreMb - MEMORIA_DEPLOYA_MB) / memoriaPorProyectoMb));
}
