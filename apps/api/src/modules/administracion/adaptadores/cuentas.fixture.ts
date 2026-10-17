import type { DetalleUsuario } from "../dominio/usuarios";

/** Una cuenta de 25 con valores realistas; las pruebas cambian lo que necesitan. */
export function cuentaDePrueba(cambios: Partial<DetalleUsuario> = {}): DetalleUsuario {
  return {
    id: "u-maria",
    correo: "maria.rios@cafeteriaaurora.com",
    nombre: "María Ríos",
    rol: "cliente",
    estadoCuenta: "activa",
    plan: "Pro",
    suscripcion: "activa",
    creado: new Date("2026-06-14T15:00:00.000Z"),
    ultimoAcceso: new Date("2026-10-11T09:30:00.000Z"),
    vence: new Date("2026-11-14T15:00:00.000Z"),
    suspension: null,
    proyectos: [],
    pagos: [],
    ...cambios,
  };
}
