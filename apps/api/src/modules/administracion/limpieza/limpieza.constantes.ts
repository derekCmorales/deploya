/** Cola BullMQ de la limpieza diaria (EST-01b). */
export const COLA_LIMPIEZA = "limpieza";
/** Id del programador repetible: uno solo aunque el trabajador arranque varias veces. */
export const PROGRAMADOR_LIMPIEZA = "limpieza-diaria";
/** Todos los días a las 00:35 UTC, media hora después del ciclo §4.4 (00:05). */
export const PATRON_LIMPIEZA = "35 0 * * *";
export const ZONA_LIMPIEZA = "UTC";
