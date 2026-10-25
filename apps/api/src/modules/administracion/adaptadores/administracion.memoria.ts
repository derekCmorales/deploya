import { ACCION_REACTIVAR_CUENTA, MOTIVO_REACTIVACION, type Reactivacion } from "../dominio/reactivacion";
import { ACCION_SUSPENDER_CUENTA, type CuentaObjetivo, type Suspension } from "../dominio/suspension";
import {
  contenedoresDetenidos,
  USUARIOS_POR_PAGINA,
  type DetalleUsuario,
  type FiltroUsuarios,
  type PaginaUsuarios,
} from "../dominio/usuarios";
import { ConsultaUsuariosPuerto } from "../puertos/consulta-usuarios.puerto";
import { CuentasSuspensionPuerto } from "../puertos/cuentas-suspension.puerto";

export interface SesionMemoria {
  usuarioId: string;
  revocadaEn: Date | null;
}

export interface AccionMemoria {
  adminId: string;
  usuarioAfectadoId: string;
  accion: string;
  motivo: string;
  detalle: string | null;
  creado: Date;
}

/**
 * Dobles de M9 en memoria sobre el mismo almacén: la consulta de 25 y la suspensión ven las
 * mismas cuentas, sesiones y acciones, como en la base.
 */
export class AdministracionMemoria {
  readonly sesiones: SesionMemoria[] = [];
  readonly acciones: AccionMemoria[] = [];
  private readonly cuentas = new Map<string, DetalleUsuario>();

  agregar(cuenta: DetalleUsuario): this {
    this.cuentas.set(cuenta.id, cuenta);
    return this;
  }

  cuentaDe(usuarioId: string): DetalleUsuario | undefined {
    return this.cuentas.get(usuarioId);
  }

  readonly consulta: ConsultaUsuariosPuerto = new ConsultaMemoria(this.cuentas);
  readonly escritura: CuentasSuspensionPuerto = new SuspensionMemoria(this.cuentas, this.sesiones, this.acciones);
}

class ConsultaMemoria extends ConsultaUsuariosPuerto {
  constructor(private readonly cuentas: Map<string, DetalleUsuario>) {
    super();
  }

  async buscar(filtro: FiltroUsuarios): Promise<PaginaUsuarios> {
    const todas = [...this.cuentas.values()]
      .filter((c) => !filtro.correo || c.correo.toLowerCase().includes(filtro.correo))
      .filter((c) => !filtro.suscripcion || c.suscripcion === filtro.suscripcion)
      .sort((a, b) => b.creado.getTime() - a.creado.getTime());
    const desde = (filtro.pagina - 1) * USUARIOS_POR_PAGINA;
    const usuarios = todas
      .slice(desde, desde + USUARIOS_POR_PAGINA)
      .map(({ id, correo, nombre, rol, estadoCuenta, plan, suscripcion, creado }) => ({ id, correo, nombre, rol, estadoCuenta, plan, suscripcion, creado }));
    return { total: todas.length, pagina: filtro.pagina, porPagina: USUARIOS_POR_PAGINA, usuarios };
  }

  async detalle(usuarioId: string): Promise<DetalleUsuario | null> {
    const cuenta = this.cuentas.get(usuarioId);
    return cuenta ? structuredClone(cuenta) : null;
  }
}

class SuspensionMemoria extends CuentasSuspensionPuerto {
  constructor(
    private readonly cuentas: Map<string, DetalleUsuario>,
    private readonly sesiones: SesionMemoria[],
    private readonly acciones: AccionMemoria[],
  ) {
    super();
  }

  async cuenta(usuarioId: string): Promise<CuentaObjetivo | null> {
    const cuenta = this.cuentas.get(usuarioId);
    return cuenta ? { id: cuenta.id, rol: cuenta.rol, estadoCuenta: cuenta.estadoCuenta, suscripcion: cuenta.suscripcion } : null;
  }

  async suspender(s: Suspension): Promise<void> {
    const cuenta = this.cuentas.get(s.usuarioId);
    if (!cuenta) throw new Error(`Cuenta ${s.usuarioId} fuera del doble`);
    cuenta.estadoCuenta = "suspendida";
    cuenta.suspension = { desde: s.marca, motivo: s.textoMotivo, contenedoresDetenidos: contenedoresDetenidos(cuenta.proyectos) };
    for (const sesion of this.sesiones) if (sesion.usuarioId === s.usuarioId && !sesion.revocadaEn) sesion.revocadaEn = s.marca;
    this.acciones.push({
      adminId: s.adminId,
      usuarioAfectadoId: s.usuarioId,
      accion: ACCION_SUSPENDER_CUENTA,
      motivo: s.motivo,
      detalle: s.detalle,
      creado: s.marca,
    });
  }

  async reactivar(r: Reactivacion): Promise<void> {
    const cuenta = this.cuentas.get(r.usuarioId);
    if (!cuenta) throw new Error(`Cuenta ${r.usuarioId} fuera del doble`);
    cuenta.estadoCuenta = "activa";
    cuenta.suspension = null;
    this.acciones.push({
      adminId: r.adminId,
      usuarioAfectadoId: r.usuarioId,
      accion: ACCION_REACTIVAR_CUENTA,
      motivo: MOTIVO_REACTIVACION,
      detalle: r.detalle,
      creado: r.marca,
    });
  }
}
