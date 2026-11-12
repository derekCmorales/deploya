import { randomUUID } from "node:crypto";
import { Injectable } from "@nestjs/common";
import { Reloj } from "../../compartido/reloj";
import { TipoYaConectado } from "../../modules/datos/dominio/errores";
import type { EstadoRecursoDatos, NuevoRecursoDatos, RecursoDatos } from "../../modules/datos/dominio/recurso-datos";
import { RepositorioRecursosDatos } from "../../modules/datos/puertos/repositorio-recursos-datos.puerto";

/** Recursos de datos en memoria para las pruebas: mismo contrato y mismos errores que Prisma (L). */
@Injectable()
export class RepositorioRecursosDatosMemoria extends RepositorioRecursosDatos {
  private readonly recursos = new Map<string, RecursoDatos>();

  constructor(private readonly reloj: Reloj) {
    super();
  }

  async crear(nuevo: NuevoRecursoDatos): Promise<RecursoDatos> {
    const repetido = [...this.recursos.values()].some((r) => r.proyectoId === nuevo.proyectoId && r.tipo === nuevo.tipo);
    if (repetido) throw new TipoYaConectado(nuevo.tipo);
    const recurso: RecursoDatos = {
      ...nuevo,
      id: randomUUID(),
      estado: "creando",
      detalle: null,
      usoDiscoMb: null,
      medidoEn: null,
      creado: this.reloj.ahora(),
      compartidoCon: [],
    };
    this.recursos.set(recurso.id, recurso);
    return { ...recurso };
  }

  async porId(id: string): Promise<RecursoDatos | null> {
    const recurso = this.recursos.get(id);
    return recurso ? { ...recurso, compartidoCon: [...recurso.compartidoCon] } : null;
  }

  async conectadosA(proyectoId: string): Promise<RecursoDatos[]> {
    return this.copias((r) => r.proyectoId === proyectoId || r.compartidoCon.includes(proyectoId));
  }

  async deDuenos(proyectoIds: readonly string[]): Promise<RecursoDatos[]> {
    return this.copias((r) => proyectoIds.includes(r.proyectoId));
  }

  async disponibles(): Promise<RecursoDatos[]> {
    return this.copias((r) => r.estado === "disponible");
  }

  async compartir(recursoId: string, proyectoId: string): Promise<void> {
    const recurso = this.recursos.get(recursoId);
    if (recurso && !recurso.compartidoCon.includes(proyectoId)) recurso.compartidoCon.push(proyectoId);
  }

  async dejarDeCompartir(recursoId: string, proyectoId: string): Promise<void> {
    const recurso = this.recursos.get(recursoId);
    if (recurso) recurso.compartidoCon = recurso.compartidoCon.filter((id) => id !== proyectoId);
  }

  async cambiarEstado(id: string, estado: EstadoRecursoDatos, detalle: string | null = null): Promise<void> {
    const recurso = this.recursos.get(id);
    if (recurso) Object.assign(recurso, { estado, detalle });
  }

  async registrarUso(id: string, usoDiscoMb: number, medidoEn: Date): Promise<void> {
    const recurso = this.recursos.get(id);
    if (recurso) Object.assign(recurso, { usoDiscoMb, medidoEn });
  }

  async eliminar(id: string): Promise<void> {
    this.recursos.delete(id);
  }

  /** Simula la cascada de la base al borrar un proyecto: caen sus recursos y sus filas de compartido. */
  eliminarProyecto(proyectoId: string): void {
    for (const recurso of [...this.recursos.values()]) {
      if (recurso.proyectoId === proyectoId) this.recursos.delete(recurso.id);
      else recurso.compartidoCon = recurso.compartidoCon.filter((id) => id !== proyectoId);
    }
  }

  private copias(filtro: (recurso: RecursoDatos) => boolean): RecursoDatos[] {
    return [...this.recursos.values()].filter(filtro).map((r) => ({ ...r, compartidoCon: [...r.compartidoCon] }));
  }
}
