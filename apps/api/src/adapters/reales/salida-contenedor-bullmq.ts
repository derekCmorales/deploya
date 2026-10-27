import { Queue, QueueEvents, Worker } from "bullmq";
import { COLA_BITACORAS } from "../../modules/construccion/dominio/motor.constantes";
import type { ConsultaSalida, LineaSalida } from "../../modules/orquestacion/puertos/contenedor.puerto";
import { SalidaContenedorPuerto } from "../../modules/observabilidad/puertos/salida-contenedor.puerto";
import { conexionRedis } from "./cola-bullmq";

/** Menos que el sondeo de 3 s de la pantalla 15: una lectura colgada no se apila con la siguiente. */
export const ESPERA_MAXIMA_BITACORA_MS = 2500;
/** Lecturas a la vez en el trabajador: son de milisegundos y no compiten con un build. */
export const LECTURAS_EN_PARALELO = 4;

/** Lo que viaja por Redis: fechas como texto ISO. */
export interface PeticionBitacora {
  contenedorId: string;
  desde: string | null;
  max: number;
}

export interface LineaSerializada {
  marca: string;
  texto: string;
}

export function aPeticion(contenedorId: string, { desde, max }: ConsultaSalida): PeticionBitacora {
  return { contenedorId, desde: desde?.toISOString() ?? null, max };
}

export function desdePeticion({ desde, max }: PeticionBitacora): ConsultaSalida {
  return { desde: desde ? new Date(desde) : null, max };
}

export const serializar = (lineas: LineaSalida[]): LineaSerializada[] => lineas.map((l) => ({ marca: l.marca.toISOString(), texto: l.texto }));
export const deserializar = (lineas: LineaSerializada[]): LineaSalida[] => lineas.map((l) => ({ marca: new Date(l.marca), texto: l.texto }));

/**
 * Petición y respuesta sobre BullMQ (SP-12): la API encola la lectura y espera el resultado del
 * trabajador, el único con docker.sock (ADR 0002). Nada queda en Redis al terminar.
 */
export class SalidaContenedorBullMq extends SalidaContenedorPuerto {
  private readonly cola: Queue<PeticionBitacora, LineaSerializada[]>;
  private readonly eventos: QueueEvents;

  constructor(redisUrl: string) {
    super();
    this.cola = new Queue<PeticionBitacora, LineaSerializada[]>(COLA_BITACORAS, { connection: conexionRedis(redisUrl) });
    this.eventos = new QueueEvents(COLA_BITACORAS, { connection: conexionRedis(redisUrl) });
  }

  async leer(contenedorId: string, consulta: ConsultaSalida): Promise<LineaSalida[]> {
    const trabajo = await this.cola.add("leer", aPeticion(contenedorId, consulta), {
      attempts: 1,
      removeOnComplete: true,
      removeOnFail: true,
    });
    try {
      return deserializar(await trabajo.waitUntilFinished(this.eventos, ESPERA_MAXIMA_BITACORA_MS));
    } catch (error) {
      // Con el trabajador caído la petición se quedaría esperando en Redis: se quita antes de fallar.
      await trabajo.remove().catch(() => undefined);
      throw error;
    }
  }

  async cerrar(): Promise<void> {
    await Promise.all([this.cola.close(), this.eventos.close()]);
  }
}

/** Consumidor en el trabajador: responde cada petición con `ContenedorPuerto.bitacora`. */
export function consumirBitacoras(
  redisUrl: string,
  leer: (contenedorId: string, consulta: ConsultaSalida) => Promise<LineaSalida[]>,
): Worker<PeticionBitacora, LineaSerializada[]> {
  return new Worker<PeticionBitacora, LineaSerializada[]>(
    COLA_BITACORAS,
    async (trabajo) => serializar(await leer(trabajo.data.contenedorId, desdePeticion(trabajo.data))),
    { connection: conexionRedis(redisUrl), concurrency: LECTURAS_EN_PARALELO },
  );
}
