import { sumarDias } from "../dominio/cambio-plan";
import type { CambioSuscripcion, EstadoSuscripcionValor } from "../dominio/suscripcion";

export interface PlanSemilla {
  codigo: string;
  nombre: string;
  descripcion: string;
  precio30: number;
  precio365: number | null;
  maxProyectos: number;
  cpus: number;
  memoriaMb: number;
  construccionesMes: number;
  orden: number;
}

export type RolSemilla = "cliente" | "administrador";

/** Estados de suscripción que el seed deja listos para demostrar los bloqueos de M5-03. */
export type EstadoDemo = Extract<EstadoSuscripcionValor, "vencida" | "suspendida">;

export interface UsuarioSemilla {
  correo: string;
  nombre: string;
  clave: string;
  rol: RolSemilla;
  /** Sin valor: la cuenta se queda con la Sandbox que asigna `asignarSandbox`. */
  estadoDemo?: EstadoDemo;
}

export const ADMIN_CORREO_POR_DEFECTO = "admin@deploya.app";
export const CLIENTE_DEMO_CORREO = "cliente@deploya.app";
export const VENCIDA_DEMO_CORREO = "vencida@deploya.app";
export const SUSPENDIDA_DEMO_CORREO = "suspendida@deploya.app";

/** Las cuentas de demo de bloqueos tienen Starter de 30 días con `vence` en el pasado. */
export const CODIGO_PLAN_DEMO = "starter";
const VIGENCIA_DEMO_DIAS = 30;
/** Días de Vencida antes de pasar a Suspendida (§4.4). */
const DIAS_GRACIA = 5;

/** Cuántos días lleva vencida la suscripción y cuántos después de `vence` empezó su estado. */
const FECHAS_DEMO: Record<EstadoDemo, { diasDesdeVence: number; diasHastaEstado: number }> = {
  vencida: { diasDesdeVence: 2, diasHastaEstado: 0 },
  suspendida: { diasDesdeVence: 10, diasHastaEstado: DIAS_GRACIA },
};

export class ClaveAdminFaltante extends Error {
  constructor() {
    super("Falta ADMIN_CLAVE: defínela en .env antes de correr el seed (no tiene valor por defecto)");
    this.name = "ClaveAdminFaltante";
  }
}

/** Planes v4.1 (docs/alcance.md). El precio de 365 días es 10 × el de 30: dos meses gratis. */
export function planesSemilla(): PlanSemilla[] {
  return [
    {
      codigo: "sandbox",
      nombre: "Sandbox",
      descripcion: "Para probar deploya con un proyecto.",
      precio30: 0,
      precio365: null,
      maxProyectos: 1,
      cpus: 0.25,
      memoriaMb: 256,
      construccionesMes: 30,
      orden: 1,
    },
    {
      codigo: "starter",
      nombre: "Starter",
      descripcion: "Para un servicio pequeño en producción.",
      precio30: 5,
      precio365: 50,
      maxProyectos: 3,
      cpus: 0.5,
      memoriaMb: 512,
      construccionesMes: 150,
      orden: 2,
    },
    {
      codigo: "pro",
      nombre: "Pro",
      descripcion: "Para varios servicios pequeños.",
      precio30: 15,
      precio365: 150,
      maxProyectos: 10,
      cpus: 1,
      memoriaMb: 1024,
      construccionesMes: 500,
      orden: 3,
    },
    {
      codigo: "business",
      nombre: "Business",
      descripcion: "Para servicios con más carga.",
      precio30: 40,
      precio365: 400,
      maxProyectos: 25,
      cpus: 2,
      memoriaMb: 2048,
      construccionesMes: 2000,
      orden: 4,
    },
  ];
}

/**
 * Administrador, cliente de demostración y las cuentas Vencida y Suspendida de M5-03, las tres de
 * cliente con la misma contraseña. Sin `ADMIN_CLAVE` el seed no escribe nada.
 */
export function usuariosSemilla(entorno: NodeJS.ProcessEnv): UsuarioSemilla[] {
  const claveAdmin = entorno.ADMIN_CLAVE;
  if (!claveAdmin) throw new ClaveAdminFaltante();
  const claveCliente = entorno.CLIENTE_CLAVE || claveAdmin;
  return [
    {
      correo: (entorno.ADMIN_CORREO || ADMIN_CORREO_POR_DEFECTO).trim().toLowerCase(),
      nombre: "Administrador",
      clave: claveAdmin,
      rol: "administrador",
    },
    {
      correo: CLIENTE_DEMO_CORREO,
      nombre: "Cliente de demostración",
      clave: claveCliente,
      rol: "cliente",
    },
    {
      correo: VENCIDA_DEMO_CORREO,
      nombre: "Cliente con suscripción vencida",
      clave: claveCliente,
      rol: "cliente",
      estadoDemo: "vencida",
    },
    {
      correo: SUSPENDIDA_DEMO_CORREO,
      nombre: "Cliente con suscripción suspendida",
      clave: claveCliente,
      rol: "cliente",
      estadoDemo: "suspendida",
    },
  ];
}

/**
 * Starter de 30 días que venció hace unos días, sin descenso pendiente. Vencida desde `vence`;
 * Suspendida desde que terminó la gracia de 5 días.
 */
export function cambioDemo(estado: EstadoDemo, planId: string, ahora: Date): CambioSuscripcion {
  const { diasDesdeVence, diasHastaEstado } = FECHAS_DEMO[estado];
  const vence = sumarDias(ahora, -diasDesdeVence);
  return {
    planId,
    estado,
    estadoDesde: sumarDias(vence, diasHastaEstado),
    vigenciaDias: VIGENCIA_DEMO_DIAS,
    inicio: sumarDias(vence, -VIGENCIA_DEMO_DIAS),
    vence,
    planSiguienteId: null,
  };
}
