import type { ComandoPreparacion } from "../dominio/tipo-recurso-datos";

/** Lo que el adaptador necesita para correr un recurso: lo arma el trabajador desde la estrategia del tipo. */
export interface EspecRecursoDatos {
  /** Nombre del contenedor y host en las redes. */
  nombre: string;
  imagen: string;
  volumen: string;
  rutaDatos: string;
  /** Red del proyecto dueño (`deploya-p-<subdominio>`). */
  red: string;
  /** Redes de los proyectos con los que se comparte. */
  redesCompartidas: string[];
  memoriaMb: number;
  entorno: Record<string, string>;
  comando: string[] | null;
  /** Subdominio del dueño: etiqueta para limpiar todo lo suyo al eliminar el proyecto. */
  subdominioDueno: string;
}

/**
 * Puerto DIP del ciclo de vida de un contenedor de datos con su volumen (Docker en compose, stub en
 * pruebas). Todas las operaciones son idempotentes: un recurso que ya no existe no es un error.
 */
export abstract class RecursosDatosPuerto {
  /** Crea el volumen y el contenedor (sin puertos publicados), lo conecta a sus redes y lo arranca. */
  abstract crear(espec: EspecRecursoDatos): Promise<void>;
  /** Corre cada comando dentro del contenedor hasta que salga con 0 o se acabe el tiempo; lanza si no. */
  abstract preparar(contenedor: string, comandos: readonly ComandoPreparacion[]): Promise<void>;
  /** Conecta el contenedor a la red (la crea si hace falta, como el primer despliegue). */
  abstract conectar(contenedor: string, red: string): Promise<void>;
  abstract desconectar(contenedor: string, red: string): Promise<void>;
  abstract iniciar(contenedor: string): Promise<void>;
  abstract detener(contenedor: string): Promise<void>;
  /** Borra contenedor y volumen. */
  abstract eliminar(contenedor: string, volumen: string): Promise<void>;
  /** Al eliminar un proyecto: borra sus recursos (contenedor y volumen) y desconecta de su red los ajenos. */
  abstract liberarProyecto(subdominio: string, red: string): Promise<void>;
  /** MB ocupados en `ruta` dentro del contenedor (`du -sm`); `null` si no se pudo medir. */
  abstract medirUsoMb(contenedor: string, ruta: string): Promise<number | null>;
}
