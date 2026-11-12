import { Injectable } from "@nestjs/common";
import type { ProyectoDesplegable } from "../construccion/dominio/despliegue";
import { ProyectosLecturaPuerto } from "../construccion/puertos/proyectos-lectura.puerto";
import { CifradorVariables } from "../proyectos/puertos/cifrador-variables.puerto";
import { ConexionesDatos } from "./conexiones-datos";
import { LARGO_CONTRASENA } from "./datos.constantes";
import type { ComandoDatos } from "./dominio/comando-datos";
import { ConfirmacionRecursoNoCoincide, ProyectoDatosNoEncontrado, RecursoNoEncontrado, TipoYaConectado } from "./dominio/errores";
import { tiposDisponibles, verificarAlta, verificarTipoLibre } from "./dominio/politica-recursos-datos";
import { conectadoA, nombreRecursoDatos, TIPOS_RECURSO, type EstadoRecursoDatos, type RecursoDatos, type TipoRecurso } from "./dominio/recurso-datos";
import { enOrden, vistaRecurso, type ContextoVista, type VistaRecursoDatos } from "./dominio/vista-recurso";
import { ColaDatosPuerto } from "./puertos/cola-datos.puerto";
import { CuotaDatosPuerto, type CuotaDatos } from "./puertos/cuota-datos.puerto";
import { GeneradorSecretos } from "./puertos/generador-secretos.puerto";
import { RepositorioRecursosDatos } from "./puertos/repositorio-recursos-datos.puerto";

/** `GET /proyectos/:id/datos`. `maximo` es `Infinity` en autoalojado (en JSON, `null`: sin tope). */
export interface ListaRecursosDatos {
  recursos: VistaRecursoDatos[];
  limite: { usados: number; maximo: number };
  tiposDisponibles: TipoRecurso[];
}

export interface ConexionRecursoDatos {
  variables: Record<string, string>;
}

/** Cuántos comandos quedaron en la cola `datos` tras suspender o reanudar una cuenta. */
export interface ResultadoMasivoDatos {
  encolados: number;
}

/** El proyecto pedido, los demás del usuario y su cuota: todo lo que necesita un caso de uso. */
interface Contexto {
  proyecto: ProyectoDesplegable;
  proyectos: ProyectoDesplegable[];
  cuota: CuotaDatos;
}

/**
 * Facade de los recursos de datos en la API: valida dueño, plan y tipos, persiste y encola el
 * trabajo de Docker en la cola `datos`. Nunca toca Docker; el estado lo actualiza el trabajador.
 */
@Injectable()
export class DatosService {
  constructor(
    private readonly proyectos: ProyectosLecturaPuerto,
    private readonly repositorio: RepositorioRecursosDatos,
    private readonly cola: ColaDatosPuerto,
    private readonly cuota: CuotaDatosPuerto,
    private readonly secretos: GeneradorSecretos,
    private readonly cifrador: CifradorVariables,
    private readonly conexiones: ConexionesDatos,
  ) {}

  async listar(usuarioId: string, proyectoId: string): Promise<ListaRecursosDatos> {
    const contexto = await this.contextoDe(usuarioId, proyectoId);
    const conectados = await this.repositorio.conectadosA(proyectoId);
    return {
      recursos: enOrden(conectados, proyectoId).map((recurso) => vistaRecurso(recurso, this.contextoVista(contexto))),
      limite: { usados: await this.usadosDe(contexto.proyectos), maximo: contexto.cuota.maxRecursosDatos },
      tiposDisponibles: tiposDisponibles(TIPOS_RECURSO, conectados.map((r) => r.tipo)),
    };
  }

  async crear(usuarioId: string, proyectoId: string, tipo: TipoRecurso): Promise<VistaRecursoDatos> {
    const contexto = await this.contextoDe(usuarioId, proyectoId);
    const conectados = await this.repositorio.conectadosA(proyectoId);
    verificarAlta({
      estadoSuscripcion: contexto.cuota.estado,
      usados: await this.usadosDe(contexto.proyectos),
      maximo: contexto.cuota.maxRecursosDatos,
      tiposConectados: conectados.map((r) => r.tipo),
      tipo,
    });
    const nombre = nombreRecursoDatos(contexto.proyecto.subdominio, tipo);
    const recurso = await this.repositorio.crear({
      proyectoId,
      tipo,
      contenedor: nombre,
      volumen: nombre,
      contrasenaCifrada: this.cifrador.cifrar(this.secretos.contrasena(LARGO_CONTRASENA)),
    });
    await this.cola.encolar({ accion: "crear", recursoId: recurso.id });
    return vistaRecurso(recurso, this.contextoVista(contexto));
  }

  /** Valores reales para copiar: las variables de nombre corto y las `DEPLOYA_*`. */
  async conexion(usuarioId: string, proyectoId: string, recursoId: string): Promise<ConexionRecursoDatos> {
    const contexto = await this.contextoDe(usuarioId, proyectoId);
    const recurso = await this.recursoConectado(recursoId, proyectoId);
    const { base, prefijadas } = this.conexiones.variablesDe(recurso, this.subdominioDe(contexto, recurso.proyectoId));
    return { variables: { ...base, ...prefijadas } };
  }

  /** Solo desde el proyecto dueño y hacia otro proyecto del mismo usuario sin un recurso de ese tipo. */
  async compartir(usuarioId: string, proyectoId: string, recursoId: string, destinoId: string): Promise<VistaRecursoDatos> {
    const contexto = await this.contextoDe(usuarioId, proyectoId);
    const recurso = await this.recursoPropio(recursoId, proyectoId);
    const destino = this.proyectoDelUsuario(contexto, destinoId);
    if (recurso.compartidoCon.includes(destino.id)) return vistaRecurso(recurso, this.contextoVista(contexto));
    if (destino.id === recurso.proyectoId) throw new TipoYaConectado(recurso.tipo);
    verificarTipoLibre((await this.repositorio.conectadosA(destino.id)).map((r) => r.tipo), recurso.tipo);
    await this.repositorio.compartir(recurso.id, destino.id);
    await this.cola.encolar(this.comandoRed("conectar", recurso, contexto.proyecto.subdominio, destino.subdominio));
    const actualizado = { ...recurso, compartidoCon: [...recurso.compartidoCon, destino.id] };
    return vistaRecurso(actualizado, this.contextoVista(contexto));
  }

  /** Desde el dueño o desde el propio proyecto compartido. */
  async dejarDeCompartir(usuarioId: string, proyectoId: string, recursoId: string, destinoId: string): Promise<void> {
    const contexto = await this.contextoDe(usuarioId, proyectoId);
    const recurso = await this.recursoConectado(recursoId, proyectoId);
    const puede = recurso.proyectoId === proyectoId || destinoId === proyectoId;
    if (!puede || !recurso.compartidoCon.includes(destinoId)) throw new RecursoNoEncontrado(recursoId);
    await this.desconectar(recurso, contexto, destinoId);
  }

  /**
   * Desde el dueño borra el recurso con su volumen (y lo desconecta de los compartidos); desde un
   * proyecto con el que solo se comparte, únicamente lo desconecta de ese proyecto.
   */
  async eliminar(usuarioId: string, proyectoId: string, recursoId: string, confirmacion: string): Promise<void> {
    const contexto = await this.contextoDe(usuarioId, proyectoId);
    const recurso = await this.recursoConectado(recursoId, proyectoId);
    if (confirmacion.trim() !== recurso.tipo) throw new ConfirmacionRecursoNoCoincide(recurso.tipo);
    if (recurso.proyectoId !== proyectoId) return this.desconectar(recurso, contexto, proyectoId);
    await this.repositorio.eliminar(recurso.id);
    await this.cola.encolar(this.comandoRecurso("eliminar", recurso, contexto.proyecto.subdominio));
  }

  /** M2 (suscripción Suspendida) y M9 (cuenta suspendida): se detienen; el volumen queda intacto. */
  detenerTodosDe(usuarioId: string): Promise<ResultadoMasivoDatos> {
    return this.pedirATodos(usuarioId, "disponible", "detener");
  }

  /** M2 al renovar y M9 al reactivar: los detenidos vuelven a arrancar. */
  reanudarTodosDe(usuarioId: string): Promise<ResultadoMasivoDatos> {
    return this.pedirATodos(usuarioId, "detenido", "iniciar");
  }

  private async pedirATodos(usuarioId: string, estado: EstadoRecursoDatos, accion: "detener" | "iniciar"): Promise<ResultadoMasivoDatos> {
    const proyectos = await this.proyectos.deUsuario(usuarioId);
    const subdominios = new Map(proyectos.map((p) => [p.id, p.subdominio]));
    const recursos = (await this.repositorio.deDuenos(proyectos.map((p) => p.id))).filter((r) => r.estado === estado);
    for (const recurso of recursos) await this.cola.encolar(this.comandoRecurso(accion, recurso, subdominios.get(recurso.proyectoId) ?? ""));
    return { encolados: recursos.length };
  }

  private async desconectar(recurso: RecursoDatos, contexto: Contexto, destinoId: string): Promise<void> {
    await this.repositorio.dejarDeCompartir(recurso.id, destinoId);
    const comando = this.comandoRed("desconectar", recurso, this.subdominioDe(contexto, recurso.proyectoId), this.subdominioDe(contexto, destinoId));
    await this.cola.encolar(comando);
  }

  private async contextoDe(usuarioId: string, proyectoId: string): Promise<Contexto> {
    const proyecto = await this.proyectos.porId(proyectoId);
    if (!proyecto || proyecto.usuarioId !== usuarioId) throw new ProyectoDatosNoEncontrado(proyectoId);
    const [proyectos, cuota] = await Promise.all([this.proyectos.deUsuario(usuarioId), this.cuota.deUsuario(usuarioId)]);
    return { proyecto, proyectos, cuota };
  }

  /** Cuentan los recursos de la cuenta, no las conexiones: uno compartido ocupa un solo lugar. */
  private async usadosDe(proyectos: readonly ProyectoDesplegable[]): Promise<number> {
    return (await this.repositorio.deDuenos(proyectos.map((p) => p.id))).length;
  }

  private async recursoConectado(recursoId: string, proyectoId: string): Promise<RecursoDatos> {
    const recurso = await this.repositorio.porId(recursoId);
    if (!recurso || !conectadoA(recurso, proyectoId)) throw new RecursoNoEncontrado(recursoId);
    return recurso;
  }

  private async recursoPropio(recursoId: string, proyectoId: string): Promise<RecursoDatos> {
    const recurso = await this.recursoConectado(recursoId, proyectoId);
    if (recurso.proyectoId !== proyectoId) throw new RecursoNoEncontrado(recursoId);
    return recurso;
  }

  private proyectoDelUsuario(contexto: Contexto, proyectoId: string): ProyectoDesplegable {
    const proyecto = contexto.proyectos.find((p) => p.id === proyectoId);
    if (!proyecto) throw new ProyectoDatosNoEncontrado(proyectoId);
    return proyecto;
  }

  private subdominioDe(contexto: Contexto, proyectoId: string): string {
    return contexto.proyectos.find((p) => p.id === proyectoId)?.subdominio ?? "";
  }

  private contextoVista(contexto: Contexto): ContextoVista {
    return {
      proyectoId: contexto.proyecto.id,
      proyectos: new Map(contexto.proyectos.map((p) => [p.id, { id: p.id, nombre: p.nombre, subdominio: p.subdominio }])),
      limiteDiscoMb: contexto.cuota.discoDatosMb,
      dominio: this.conexiones.dominioPublico,
    };
  }

  private comandoRecurso(accion: "eliminar" | "detener" | "iniciar", recurso: RecursoDatos, subdominioDueno: string): ComandoDatos {
    return { accion, recursoId: recurso.id, tipo: recurso.tipo, subdominioDueno };
  }

  private comandoRed(accion: "conectar" | "desconectar", recurso: RecursoDatos, subdominioDueno: string, subdominio: string): ComandoDatos {
    return { accion, recursoId: recurso.id, tipo: recurso.tipo, subdominioDueno, subdominio };
  }
}
