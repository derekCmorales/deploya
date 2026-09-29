import { Injectable } from "@nestjs/common";
import { ProveedorFuente } from "./puertos/proveedor-fuente.puerto";
import { RepositorioProyectos } from "./puertos/repositorio-proyectos.puerto";
import { CuotaProyectosPuerto } from "./puertos/cuota-proyectos.puerto";
import { ConstruccionService } from "../construccion/construccion.service";
import { AltaProyecto, ValidacionRepositorio } from "./dominio/proyecto";
import { subdominioDesdeNombre } from "./dominio/subdominio";
import { validarAltaProyecto } from "./dominio/alta-proyecto";
import { SubdominioEnUso, LimiteProyectosAlcanzado } from "./dominio/errores";
import { RUTA_DOCKERFILE, RAMA_POR_DEFECTO } from "./dominio/proyectos.constantes";

@Injectable()
export class ProyectosService {
  constructor(
    private readonly proveedorFuente: ProveedorFuente,
    private readonly repositorioProyectos: RepositorioProyectos,
    private readonly cuotaProyectos: CuotaProyectosPuerto,
    private readonly construccionService: ConstruccionService
  ) {}

  async validarRepositorio(url: string, rama?: string): Promise<ValidacionRepositorio> {
    const ramaElegida = rama && rama.trim() !== "" ? rama : RAMA_POR_DEFECTO;
    return this.proveedorFuente.validar(url, ramaElegida);
  }

  async listar(usuarioId: string) {
    const proyectos = await this.repositorioProyectos.deUsuario(usuarioId);
    const maximo = await this.cuotaProyectos.maxProyectosDe(usuarioId);
    const usados = proyectos.length;

    const ids = proyectos.map((p) => p.id);
    const ultimos = ids.length > 0 ? await this.construccionService.ultimosDespliegues(ids) : {};

    const proyectosConDespliegue = proyectos.map((p) => ({
      ...p,
      ultimoDespliegue: ultimos[p.id] ?? null,
    }));

    return {
      proyectos: proyectosConDespliegue,
      usados,
      maximo,
    };
  }

  async crear(usuarioId: string, altaCuerpo: unknown) {
    const alta = validarAltaProyecto(altaCuerpo);
    const maximo = await this.cuotaProyectos.maxProyectosDe(usuarioId);
    const existentes = await this.repositorioProyectos.deUsuario(usuarioId);

    if (existentes.length >= maximo) {
      throw new LimiteProyectosAlcanzado();
    }

    const validacion = await this.proveedorFuente.validar(alta.url, alta.rama);
    const subdominio = subdominioDesdeNombre(alta.nombre);

    const subdominioOcupado = await this.repositorioProyectos.existeSubdominio(subdominio);
    if (subdominioOcupado) {
      throw new SubdominioEnUso();
    }

    const proyecto = await this.repositorioProyectos.guardar({
      usuarioId,
      nombre: alta.nombre,
      subdominio,
      urlRepositorio: validacion.urlNormalizada,
      rama: alta.rama,
      rutaDockerfile: RUTA_DOCKERFILE,
      puertoInterno: alta.puerto,
    });

    const despliegue = await this.construccionService.crearDespliegue(proyecto.id, "alta");

    return {
      proyecto,
      despliegue,
    };
  }
}