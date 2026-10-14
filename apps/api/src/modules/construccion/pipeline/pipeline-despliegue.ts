import { Inject, Injectable, Logger } from "@nestjs/common";
import { Reloj } from "../../../compartido/reloj";
import type { TrabajoDespliegue } from "../dominio/despliegue";
import { DespliegueCancelado, DespliegueNoEncontrado, FalloDespliegue, ProyectoNoEncontrado } from "../dominio/errores";
import { estaTerminado, type EstadoDespliegue, type Etapa } from "../dominio/estados";
import { LOTE_BITACORA_MS } from "../dominio/motor.constantes";
import { puedeTransicionar, transicionar } from "../dominio/transiciones-despliegue";
import { ProyectosLecturaPuerto } from "../puertos/proyectos-lectura.puerto";
import { RepositorioDespliegues } from "../puertos/repositorio-despliegues.puerto";
import { BitacoraEnLotes } from "./bitacora-en-lotes";
import { OYENTES_DESPLIEGUE, OyenteDespliegue, type DespliegueTerminado } from "../puertos/oyente-despliegue.puerto";
import { VigiaCancelacion } from "./vigia-cancelacion";
import { PLANES_PIPELINE, PasoPipeline, type ContextoDespliegue, type PlanesPipeline } from "./paso-pipeline";

const MOTIVO_ERROR_INTERNO = "Error interno del motor";

/** Recorre los pasos del plan de un despliegue en el trabajador. Consumidor de la cola. */
@Injectable()
export class PipelineDespliegue {
  private readonly registro = new Logger(PipelineDespliegue.name);

  constructor(
    private readonly despliegues: RepositorioDespliegues,
    private readonly proyectos: ProyectosLecturaPuerto,
    private readonly reloj: Reloj,
    @Inject(PLANES_PIPELINE) private readonly planes: PlanesPipeline,
    @Inject(OYENTES_DESPLIEGUE) private readonly oyentes: OyenteDespliegue[],
    private readonly vigia: VigiaCancelacion,
  ) {}

  async ejecutar(trabajo: TrabajoDespliegue, intervaloBitacoraMs = LOTE_BITACORA_MS): Promise<void> {
    const despliegue = await this.despliegues.porId(trabajo.despliegueId);
    if (!despliegue) throw new DespliegueNoEncontrado(trabajo.despliegueId);
    if (estaTerminado(despliegue.estado)) return;
    const proyecto = await this.proyectos.porId(despliegue.proyectoId);
    if (!proyecto) throw new ProyectoNoEncontrado(despliegue.proyectoId);

    const bitacora = new BitacoraEnLotes(this.despliegues, this.reloj, despliegue.id);
    if (intervaloBitacoraMs > 0) bitacora.vaciarCada(intervaloBitacoraMs);
    const controlador = new AbortController();
    const contexto: ContextoDespliegue = { despliegue, proyecto, bitacora, senal: controlador.signal };
    const dejarDeVigilar = this.vigia.vigilar(despliegue.id, controlador);
    try {
      await this.recorrer(contexto, bitacora, this.planes[trabajo.plan], controlador);
    } finally {
      dejarDeVigilar();
      await bitacora.cerrar();
    }
  }

  private async recorrer(
    contexto: ContextoDespliegue,
    bitacora: BitacoraEnLotes,
    pasos: readonly PasoPipeline[],
    controlador: AbortController,
  ): Promise<void> {
    const id = contexto.despliegue.id;
    const ejecutados: PasoPipeline[] = [];
    let estado = contexto.despliegue.estado;
    try {
      for (const paso of pasos) {
        await this.exigirNoCancelado(id, estado, controlador);
        estado = await this.avanzar(id, estado, paso.estado);
        ejecutados.push(paso);
        await this.despliegues.marcarEtapa(id, paso.etapa, "en-curso", this.reloj.ahora());
        await paso.ejecutar(contexto);
        await this.despliegues.marcarEtapa(id, paso.etapa, "completada", this.reloj.ahora());
        await bitacora.vaciar();
      }
      await this.despliegues.cambiarEstado(id, transicionar(estado, "saludable"), { terminado: this.reloj.ahora() });
      await this.anunciar({ proyectoId: contexto.proyecto.id, despliegueId: id, estado: "saludable" });
    } catch (error) {
      const etapa = ejecutados.at(-1)?.etapa ?? "recepcion";
      if (error instanceof DespliegueCancelado) await this.cancelar(contexto, estado, ejecutados);
      else await this.fallar(contexto, estado, this.falloDe(error, etapa), ejecutados);
    } finally {
      await Promise.all(ejecutados.map((paso) => paso.liberar(contexto)));
    }
  }

  /**
   * Revisa la señal antes de cada paso. Solo se honra mientras el estado admite Cancelado
   * (hasta Construyendo o Revirtiendo): desde Aprovisionando la conmutación ya está en marcha.
   */
  private async exigirNoCancelado(id: string, estado: EstadoDespliegue, controlador: AbortController): Promise<void> {
    await this.vigia.revisar(id, controlador);
    if (controlador.signal.aborted && puedeTransicionar(estado, "cancelado")) throw new DespliegueCancelado();
  }

  private async avanzar(id: string, actual: EstadoDespliegue, siguiente: EstadoDespliegue): Promise<EstadoDespliegue> {
    if (actual === siguiente) return actual;
    const nuevo = transicionar(actual, siguiente);
    await this.despliegues.cambiarEstado(id, nuevo);
    return nuevo;
  }

  /** El trabajador, no la API, escribe Cancelado: la etapa en curso queda fallida y la bitácora lo dice. */
  private async cancelar(contexto: ContextoDespliegue, estado: EstadoDespliegue, ejecutados: PasoPipeline[]): Promise<void> {
    const { despliegue, bitacora } = contexto;
    const etapa = ejecutados.at(-1)?.etapa;
    bitacora.escribir(etapa ?? "recepcion", new DespliegueCancelado().message, "aviso");
    for (const paso of [...ejecutados].reverse()) await paso.compensar(contexto);
    if (etapa) await this.despliegues.marcarEtapa(despliegue.id, etapa, "fallida", this.reloj.ahora());
    await this.despliegues.cambiarEstado(despliegue.id, transicionar(estado, "cancelado"), { terminado: this.reloj.ahora() });
    await this.anunciar({ proyectoId: despliegue.proyectoId, despliegueId: despliegue.id, estado: "cancelado" });
  }

  private async fallar(
    contexto: ContextoDespliegue,
    estado: EstadoDespliegue,
    fallo: FalloDespliegue,
    ejecutados: PasoPipeline[],
  ): Promise<void> {
    const { despliegue, bitacora } = contexto;
    bitacora.escribir(fallo.etapa, fallo.motivo, "error");
    for (const paso of [...ejecutados].reverse()) await paso.compensar(contexto);
    await this.despliegues.marcarEtapa(despliegue.id, fallo.etapa, "fallida", this.reloj.ahora());
    await this.despliegues.cambiarEstado(despliegue.id, transicionar(estado, "fallido"), {
      codigoSalida: fallo.codigoSalida,
      motivoFallo: fallo.motivo,
      terminado: this.reloj.ahora(),
    });
    await this.anunciar({ proyectoId: despliegue.proyectoId, despliegueId: despliegue.id, estado: "fallido" });
  }

  /** Un oyente que falla se registra y no cambia el resultado del despliegue. */
  private async anunciar(evento: DespliegueTerminado): Promise<void> {
    for (const oyente of this.oyentes) {
      try {
        await oyente.alTerminar(evento);
      } catch (error) {
        this.registro.warn(`${oyente.constructor.name} falló al recibir el despliegue ${evento.despliegueId}: ${String(error)}`);
      }
    }
  }

  private falloDe(error: unknown, etapa: Etapa): FalloDespliegue {
    if (error instanceof FalloDespliegue) return error;
    this.registro.error(error instanceof Error ? error.stack : String(error));
    return new FalloDespliegue(etapa, MOTIVO_ERROR_INTERNO);
  }
}

