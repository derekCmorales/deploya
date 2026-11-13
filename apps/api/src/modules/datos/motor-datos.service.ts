import { Injectable, Logger } from "@nestjs/common";
import { Espera } from "../../compartido/espera";
import { Reloj } from "../../compartido/reloj";
import { redDeProyecto } from "../construccion/dominio/motor.constantes";
import { ProyectosLecturaPuerto } from "../construccion/puertos/proyectos-lectura.puerto";
import { EnrutamientoService } from "../enrutamiento/enrutamiento.service";
import { ConexionesDatos } from "./conexiones-datos";
import type { AccionDatos, ComandoDatos, ComandoDe, ComandoSobreRecurso } from "./dominio/comando-datos";
import { nombreRecursoDatos, type RecursoDatos } from "./dominio/recurso-datos";
import { tipoRecursoDe, type VariablesRecurso } from "./dominio/tipo-recurso-datos";
import { juntarVariables, type InyeccionDatos } from "./dominio/variables-inyectadas";
import { subdominioPublico } from "./dominio/vista-recurso";
import { RecursosDatosPuerto } from "./puertos/recursos-datos.puerto";
import { RepositorioRecursosDatos } from "./puertos/repositorio-recursos-datos.puerto";

const LARGO_MAXIMO_DETALLE = 500;
/** Ejecución vuelve a mirar un recurso en `creando` cada 2 s, hasta 2 min (feat/m3-alta-guiada). */
export const PAUSA_RECURSO_CREANDO_MS = 2_000;
export const ESPERA_MAXIMA_RECURSO_CREANDO_MS = 120_000;
const CONSULTAS_MAXIMAS = ESPERA_MAXIMA_RECURSO_CREANDO_MS / PAUSA_RECURSO_CREANDO_MS;

/** Lo que el motor sabe del proyecto que despliega o elimina. */
export interface ProyectoConDatos {
  id: string;
  subdominio: string;
}

type Manejadores = { readonly [A in AccionDatos]: (comando: ComandoDe<A>) => Promise<void> };

/**
 * Los recursos de datos en el trabajador (el único proceso con Docker): ejecuta los comandos de la
 * cola `datos`, conecta los recursos al desplegar, limpia al eliminar un proyecto y mide el disco.
 * Cada acción es una entrada de la tabla `manejadores` (Command → manejador), sin `switch`.
 */
@Injectable()
export class MotorDatosService {
  private readonly registro = new Logger("MotorDatos");
  private readonly manejadores: Manejadores = {
    crear: (c) => this.crear(c.recursoId),
    eliminar: (c) => this.eliminar(c),
    detener: (c) => this.cambiarMarcha(c, "detener"),
    iniciar: (c) => this.cambiarMarcha(c, "iniciar"),
    conectar: (c) => this.conectarRed(c, "conectar"),
    desconectar: (c) => this.conectarRed(c, "desconectar"),
  };

  constructor(
    private readonly repositorio: RepositorioRecursosDatos,
    private readonly proyectos: ProyectosLecturaPuerto,
    private readonly recursos: RecursosDatosPuerto,
    private readonly conexiones: ConexionesDatos,
    private readonly enrutamiento: EnrutamientoService,
    private readonly reloj: Reloj,
    private readonly espera: Espera,
  ) {}

  ejecutar(comando: ComandoDatos): Promise<void> {
    const manejador = this.manejadores[comando.accion] as (comando: ComandoDatos) => Promise<void>;
    return manejador(comando);
  }

  /**
   * Antes de crear el contenedor de la app (Ejecución): espera a los recursos que siguen en `creando`
   * (el alta guiada los pide justo antes del despliegue #1), asegura que cada recurso disponible esté
   * en la red del proyecto y devuelve sus variables. Los recursos en `error` no se inyectan; los que
   * siguen creándose al tope se inyectan igual y quedan en `pendientes`.
   */
  async paraDespliegue(proyecto: ProyectoConDatos): Promise<InyeccionDatos> {
    const conectados = (await this.listosOAlTope(proyecto.id)).filter((r) => r.estado !== "error");
    const partes: VariablesRecurso[] = [];
    const nombres: string[] = [];
    const pendientes = conectados.filter((r) => r.estado === "creando").map((r) => tipoRecursoDe(r.tipo).nombre);
    for (const recurso of conectados) {
      const subdominioDueno = await this.subdominioDueno(recurso, proyecto);
      if (!subdominioDueno) continue;
      if (recurso.estado === "disponible") await this.recursos.conectar(recurso.contenedor, redDeProyecto(proyecto.subdominio));
      partes.push(this.conexiones.variablesDe(recurso, subdominioDueno));
      nombres.push(tipoRecursoDe(recurso.tipo).nombre);
    }
    return { recursos: nombres, variables: juntarVariables(partes), ...(pendientes.length > 0 ? { pendientes } : {}) };
  }

  private async listosOAlTope(proyectoId: string): Promise<RecursoDatos[]> {
    let conectados = await this.repositorio.conectadosA(proyectoId);
    for (let consulta = 0; consulta < CONSULTAS_MAXIMAS && conectados.some((r) => r.estado === "creando"); consulta += 1) {
      await this.espera.esperar(PAUSA_RECURSO_CREANDO_MS);
      conectados = await this.repositorio.conectadosA(proyectoId);
    }
    return conectados;
  }

  /**
   * Eliminar proyecto (M3-04): sus recursos se borran con el volumen y su ruta S3 se retira; los de
   * otros proyectos compartidos con él solo se desconectan. Las filas caen en cascada en la base.
   */
  async liberarProyecto(subdominio: string): Promise<void> {
    await this.recursos.liberarProyecto(subdominio, redDeProyecto(subdominio));
    await this.enrutamiento.retirar(subdominioPublico(subdominio, "s3"));
  }

  /** Cada 5 min en el trabajador: `du` de cada recurso disponible. Avisa, no corta. */
  async medirDiscos(): Promise<number> {
    let medidos = 0;
    for (const recurso of await this.repositorio.disponibles()) {
      if (await this.medir(recurso)) medidos += 1;
    }
    return medidos;
  }

  private async crear(recursoId: string): Promise<void> {
    const recurso = await this.repositorio.porId(recursoId);
    if (recurso?.estado !== "creando") return;
    const dueno = await this.proyectos.porId(recurso.proyectoId);
    if (!dueno) return;
    try {
      await this.levantar(recurso, dueno.subdominio);
      await this.repositorio.cambiarEstado(recurso.id, "disponible");
      await this.medir(recurso);
    } catch (error) {
      this.registro.warn(`No se pudo crear ${recurso.contenedor}: ${textoError(error)}`);
      await this.repositorio.cambiarEstado(recurso.id, "error", textoError(error).slice(0, LARGO_MAXIMO_DETALLE));
    }
  }

  private async levantar(recurso: RecursoDatos, subdominioDueno: string): Promise<void> {
    const tipo = tipoRecursoDe(recurso.tipo);
    const contrasena = this.conexiones.contrasenaDe(recurso);
    await this.recursos.crear({
      nombre: recurso.contenedor,
      imagen: tipo.imagen,
      volumen: recurso.volumen,
      rutaDatos: tipo.rutaDatos,
      red: redDeProyecto(subdominioDueno),
      redesCompartidas: await this.redesCompartidas(recurso),
      memoriaMb: tipo.memoriaMb,
      entorno: tipo.entorno(contrasena),
      comando: tipo.comando(contrasena),
      subdominioDueno,
    });
    await this.recursos.preparar(recurso.contenedor, tipo.preparacion(contrasena));
    if (tipo.publico) {
      await this.enrutamiento.publicar({ subdominio: subdominioPublico(subdominioDueno, tipo.tipo), host: recurso.contenedor, puerto: tipo.puerto });
    }
  }

  private async eliminar(comando: ComandoSobreRecurso): Promise<void> {
    const nombre = nombreRecursoDatos(comando.subdominioDueno, comando.tipo);
    await this.recursos.eliminar(nombre, nombre);
    if (tipoRecursoDe(comando.tipo).publico) await this.enrutamiento.retirar(subdominioPublico(comando.subdominioDueno, comando.tipo));
  }

  /** Suspensión (detener) y reactivación (iniciar): el volumen no se toca. */
  private async cambiarMarcha(comando: ComandoSobreRecurso, accion: "detener" | "iniciar"): Promise<void> {
    const nombre = nombreRecursoDatos(comando.subdominioDueno, comando.tipo);
    await this.recursos[accion](nombre);
    await this.repositorio.cambiarEstado(comando.recursoId, accion === "detener" ? "detenido" : "disponible");
  }

  private async conectarRed(comando: ComandoSobreRecurso & { subdominio: string }, accion: "conectar" | "desconectar"): Promise<void> {
    const nombre = nombreRecursoDatos(comando.subdominioDueno, comando.tipo);
    await this.recursos[accion](nombre, redDeProyecto(comando.subdominio));
  }

  private async medir(recurso: RecursoDatos): Promise<boolean> {
    const uso = await this.recursos.medirUsoMb(recurso.contenedor, tipoRecursoDe(recurso.tipo).rutaDatos);
    if (uso === null) return false;
    await this.repositorio.registrarUso(recurso.id, uso, this.reloj.ahora());
    return true;
  }

  private async redesCompartidas(recurso: RecursoDatos): Promise<string[]> {
    const proyectos = await Promise.all(recurso.compartidoCon.map((id) => this.proyectos.porId(id)));
    return proyectos.flatMap((proyecto) => (proyecto ? [redDeProyecto(proyecto.subdominio)] : []));
  }

  private async subdominioDueno(recurso: RecursoDatos, proyecto: ProyectoConDatos): Promise<string | null> {
    if (recurso.proyectoId === proyecto.id) return proyecto.subdominio;
    return (await this.proyectos.porId(recurso.proyectoId))?.subdominio ?? null;
  }
}

function textoError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
