import { Injectable } from "@nestjs/common";
import { DatosService } from "../../datos/datos.service";
import { ErrorDatos } from "../../datos/dominio/errores";
import { RecursosDatosNoPermitidos } from "../dominio/errores";
import type { TipoRecursoAlta } from "../dominio/proyecto";
import { RecursosDatosAlta, type LimiteDatosCuenta } from "../puertos/recursos-datos-alta.puerto";

/**
 * Adapter sobre la Facade de M5 (`DatosService`): traduce sus errores de dominio a uno de M3 para que
 * `ErroresProyectosFilter` responda el alta con un solo formato.
 */
@Injectable()
export class RecursosDatosAltaDatos extends RecursosDatosAlta {
  constructor(private readonly datos: DatosService) {
    super();
  }

  verificar(usuarioId: string, tipos: readonly TipoRecursoAlta[]): Promise<void> {
    return traducir(() => this.datos.verificarAltaInicial(usuarioId, tipos));
  }

  limite(usuarioId: string): Promise<LimiteDatosCuenta> {
    return this.datos.limiteDe(usuarioId);
  }

  /** En orden: cada `crear` vuelve a validar el plan con lo ya creado. */
  async crear(usuarioId: string, proyectoId: string, tipos: readonly TipoRecursoAlta[]): Promise<void> {
    for (const tipo of tipos) await traducir(() => this.datos.crear(usuarioId, proyectoId, tipo));
  }
}

async function traducir(accion: () => Promise<unknown>): Promise<void> {
  try {
    await accion();
  } catch (error) {
    if (error instanceof ErrorDatos) throw new RecursosDatosNoPermitidos(error.codigo, error.message);
    throw error;
  }
}

/** Doble para pruebas y para el bootstrap sin M5: anota lo pedido y deja pasar. */
export class RecursosDatosAltaMemoria extends RecursosDatosAlta {
  readonly verificados: TipoRecursoAlta[][] = [];
  readonly creados: { proyectoId: string; tipos: TipoRecursoAlta[] }[] = [];
  rechazo: RecursosDatosNoPermitidos | null = null;

  async verificar(_usuarioId: string, tipos: readonly TipoRecursoAlta[]): Promise<void> {
    this.verificados.push([...tipos]);
    if (this.rechazo) throw this.rechazo;
  }

  async limite(): Promise<LimiteDatosCuenta> {
    return { usados: 0, maximo: Number.POSITIVE_INFINITY };
  }

  async crear(_usuarioId: string, proyectoId: string, tipos: readonly TipoRecursoAlta[]): Promise<void> {
    this.creados.push({ proyectoId, tipos: [...tipos] });
  }
}
