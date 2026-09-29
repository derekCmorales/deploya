import { Injectable } from "@nestjs/common";
import { ConstruccionService } from "../construccion/construccion.service";
import { LimiteProyectosAlcanzado, SubdominioEnUso } from "./dominio/errores";
import type { AltaProyecto, ConsultaRepositorio, Proyecto, ValidacionRepositorio } from "./dominio/proyecto";
import { RUTA_DOCKERFILE } from "./dominio/proyectos.constantes";
import { subdominioDesdeNombre } from "./dominio/subdominio";
import { CuotaProyectosPuerto } from "./puertos/cuota-proyectos.puerto";
import { ProveedorFuente } from "./puertos/proveedor-fuente.puerto";
import { RepositorioProyectos } from "./puertos/repositorio-proyectos.puerto";

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

/** Caso de uso de M3: valida la fuente, guarda el proyecto y pide a M4 el despliegue #1. */
@Injectable()
export class ProyectosService {
  constructor(
    private readonly fuente: ProveedorFuente,
    private readonly repositorio: RepositorioProyectos,
    private readonly cuota: CuotaProyectosPuerto,
    private readonly construccion: ConstruccionService,
  ) {}

  validarRepositorio(consulta: ConsultaRepositorio): Promise<ValidacionRepositorio> {
    return this.fuente.validar(consulta);
  }

  async listar(usuarioId: string): Promise<ListaProyectos> {
    const [proyectos, cuota] = await Promise.all([this.repositorio.deUsuario(usuarioId), this.cuota.cuotaDe(usuarioId)]);
    const ultimos = await this.construccion.ultimosDespliegues(proyectos.map((p) => p.id));
    return {
      proyectos: masRecientesPrimero(proyectos).map((p) => ({ ...p, ultimoDespliegue: ultimos[p.id] ?? null })),
      usados: proyectos.length,
      maximo: cuota.maxProyectos,
      plan: { nombre: cuota.plan, cpus: cuota.cpus, memoriaMb: cuota.memoriaMb },
    };
  }

  async crear(usuarioId: string, alta: AltaProyecto): Promise<ProyectoCreado> {
    await this.exigirCupo(usuarioId);
    const validacion = await this.fuente.validar({ url: alta.url, rama: alta.rama });
    const subdominio = subdominioDesdeNombre(alta.nombre);
    if (await this.repositorio.existeSubdominio(subdominio)) throw new SubdominioEnUso(subdominio);
    const proyecto = await this.repositorio.guardar({
      usuarioId,
      nombre: alta.nombre,
      subdominio,
      urlRepositorio: validacion.urlNormalizada,
      rama: alta.rama,
      rutaDockerfile: RUTA_DOCKERFILE,
      puertoInterno: alta.puerto ?? validacion.puerto,
    });
    const despliegue = await this.construccion.crearDespliegue(proyecto.id, "alta");
    return { proyecto, despliegue };
  }

  private async exigirCupo(usuarioId: string): Promise<void> {
    const [existentes, cuota] = await Promise.all([this.repositorio.deUsuario(usuarioId), this.cuota.cuotaDe(usuarioId)]);
    if (existentes.length >= cuota.maxProyectos) throw new LimiteProyectosAlcanzado(cuota.maxProyectos);
  }
}

function masRecientesPrimero(proyectos: Proyecto[]): Proyecto[] {
  return [...proyectos].sort((a, b) => b.creado.getTime() - a.creado.getTime());
}
