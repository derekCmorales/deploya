import { Injectable } from "@nestjs/common";
import { ConstruccionService } from "../construccion/construccion.service";
import { AccionesProyectoService } from "../orquestacion/acciones/acciones-proyecto.service";
import { ConfirmacionNoCoincide, LimiteProyectosAlcanzado, ProyectoNoEncontrado, SubdominioEnUso } from "./dominio/errores";
import type { AltaProyecto, ConsultaRepositorio, Proyecto, ValidacionRepositorio } from "./dominio/proyecto";
import { RUTA_DOCKERFILE } from "./dominio/proyectos.constantes";
import { subdominioDesdeNombre } from "./dominio/subdominio";
import { CuotaProyectosPuerto } from "./puertos/cuota-proyectos.puerto";
import { ProveedorFuente } from "./puertos/proveedor-fuente.puerto";
import { RepositorioProyectos } from "./puertos/repositorio-proyectos.puerto";
import { validarConjuntoVariables } from "./dominio/variable";
import { VariablesProyectoService, type VariablePublica } from "./servicios/variables-proyecto.service";

type Ultimos = Awaited<ReturnType<ConstruccionService["ultimosDespliegues"]>>;
type DespliegueCreado = Awaited<ReturnType<ConstruccionService["crearDespliegue"]>>;

export interface ProyectoEnLista extends Proyecto {
  ultimoDespliegue: Ultimos[string] | null;
}

/** `GET /proyectos` (10 / 10b): la lista, el contador y los recursos del plan. */
export interface ListaProyectos {
  proyectos: ProyectoEnLista[];
  usados: number;
  maximo: number;
  plan: { nombre: string; cpus: number; memoriaMb: number };
}

export interface ProyectoCreado {
  proyecto: Proyecto;
  despliegue: DespliegueCreado;
}

export interface VariablesGuardadas {
  variables: VariablePublica[];
  despliegue: DespliegueCreado | null;
}

export interface PedidoVariables {
  variables: { clave: string; valor?: string }[];
  desplegar: boolean;
}

/** Caso de uso de M3: valida la fuente, guarda el proyecto y pide a M4 el despliegue #1. */
@Injectable()
export class ProyectosService {
  constructor(
    private readonly fuente: ProveedorFuente,
    private readonly repositorio: RepositorioProyectos,
    private readonly cuota: CuotaProyectosPuerto,
    private readonly construccion: ConstruccionService,
    private readonly acciones: AccionesProyectoService,
    private readonly variables: VariablesProyectoService,
  ) {}

  validarRepositorio(consulta: ConsultaRepositorio): Promise<ValidacionRepositorio> {
    return this.fuente.validar(consulta);
  }

  async listar(usuarioId: string): Promise<ListaProyectos> {
    const [proyectos, cuota] = await Promise.all([this.repositorio.deUsuario(usuarioId), this.cuota.cuotaDe(usuarioId)]);
    const ultimos = await this.construccion.ultimosDespliegues(proyectos.map((p) => p.id));
    return {
      proyectos: masRecientesPrimero(proyectos).map((p) => ({ ...p, ultimoDespliegue: ultimos[p.id] ?? null })),
      usados: proyectos.filter((proyecto) => cuentaParaElPlan(ultimos[proyecto.id])).length,
      maximo: cuota.maxProyectos,
      plan: { nombre: cuota.plan, cpus: cuota.cpus, memoriaMb: cuota.memoriaMb },
    };
  }

  async crear(usuarioId: string, alta: AltaProyecto): Promise<ProyectoCreado> {
    await this.exigirCupo(usuarioId);
    const validacion = await this.fuente.validar({ url: alta.url, rama: alta.rama });
    const subdominio = subdominioDesdeNombre(alta.nombre);
    if (await this.repositorio.existeSubdominio(subdominio)) throw new SubdominioEnUso(subdominio);
    if (alta.variables) validarConjuntoVariables(alta.variables);
    const proyecto = await this.repositorio.guardar({
      usuarioId,
      nombre: alta.nombre,
      subdominio,
      urlRepositorio: validacion.urlNormalizada,
      rama: alta.rama,
      rutaDockerfile: RUTA_DOCKERFILE,
      puertoInterno: alta.puerto ?? validacion.puerto,
    });
    if (alta.variables?.length) await this.variables.reemplazar(usuarioId, proyecto.id, alta.variables);
    const despliegue = await this.construccion.crearDespliegue(proyecto.id, "alta");
    return { proyecto, despliegue };
  }

  /** 17: guarda el conjunto y, si se pide, encola un despliegue con disparador `variables`. */
  async guardarVariables(usuarioId: string, proyectoId: string, pedido: PedidoVariables): Promise<VariablesGuardadas> {
    const variables = await this.variables.reemplazar(usuarioId, proyectoId, pedido.variables);
    if (!pedido.desplegar) return { variables, despliegue: null };
    return { variables, despliegue: await this.construccion.crearDespliegue(proyectoId, "variables") };
  }

  listarVariables(usuarioId: string, proyectoId: string): Promise<VariablePublica[]> {
    return this.variables.listar(usuarioId, proyectoId);
  }

  mostrarVariable(usuarioId: string, proyectoId: string, clave: string) {
    return this.variables.mostrar(usuarioId, proyectoId, clave);
  }

  /**
   * Elimina el proyecto (19b). Un proyecto ajeno se trata como inexistente; el cliente
   * debe escribir el nombre exacto. Libera el cupo del plan sin importar el estado del despliegue.
   * M5 borra después contenedores, imágenes y ruta por la cola de operación (M5-02).
   */
  async eliminar(usuarioId: string, proyectoId: string, confirmacion: string): Promise<void> {
    const proyecto = await this.repositorio.porId(proyectoId);
    if (!proyecto || proyecto.usuarioId !== usuarioId) throw new ProyectoNoEncontrado(proyectoId);
    if (confirmacion !== proyecto.nombre) throw new ConfirmacionNoCoincide();
    await this.acciones.pedirEliminacion(proyecto);
    await this.repositorio.eliminar(proyecto.id);
  }

  private async exigirCupo(usuarioId: string): Promise<void> {
    const [existentes, cuota] = await Promise.all([this.repositorio.deUsuario(usuarioId), this.cuota.cuotaDe(usuarioId)]);
    const ultimos = await this.construccion.ultimosDespliegues(existentes.map((p) => p.id));
    const usados = existentes.filter((proyecto) => cuentaParaElPlan(ultimos[proyecto.id])).length;
    if (usados >= cuota.maxProyectos) throw new LimiteProyectosAlcanzado(cuota.maxProyectos);
  }
}

/** Un proyecto cuyo último despliegue falló no ocupa cupo del plan (por ahora, hasta definir la política de M2). */
function cuentaParaElPlan(ultimo: Ultimos[string] | undefined): boolean {
  return ultimo?.estado !== "fallido";
}

function masRecientesPrimero(proyectos: Proyecto[]): Proyecto[] {
  return [...proyectos].sort((a, b) => b.creado.getTime() - a.creado.getTime());
}
