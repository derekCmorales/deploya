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

export interface UsuarioSemilla {
  correo: string;
  nombre: string;
  clave: string;
  rol: RolSemilla;
}

export const ADMIN_CORREO_POR_DEFECTO = "admin@deploya.app";
export const CLIENTE_DEMO_CORREO = "cliente@deploya.app";

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

/** Administrador y cliente de demostración. Sin `ADMIN_CLAVE` el seed no escribe nada. */
export function usuariosSemilla(entorno: NodeJS.ProcessEnv): UsuarioSemilla[] {
  const claveAdmin = entorno.ADMIN_CLAVE;
  if (!claveAdmin) throw new ClaveAdminFaltante();
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
      clave: entorno.CLIENTE_CLAVE || claveAdmin,
      rol: "cliente",
    },
  ];
}
