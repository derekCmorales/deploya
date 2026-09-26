/**
 * Vocabularios cerrados. Estados de despliegue ≠ estados de suscripción (§4.4).
 * Revirtiendo queda fuera del núcleo v4.1 (docs/alcance.md).
 */
export const ESTADOS_DESPLIEGUE = [
  "encolado",
  "construyendo",
  "aprovisionando",
  "publicando",
  "saludable",
  "fallido",
  "cancelado",
  "detenido",
] as const;
export type EstadoDespliegueValor = (typeof ESTADOS_DESPLIEGUE)[number];

export const ESTADOS_SUSCRIPCION = ["activa", "por-vencer", "vencida", "suspendida", "cancelada"] as const;
export type EstadoSuscripcionValor = (typeof ESTADOS_SUSCRIPCION)[number];

export const ESTADOS_CUENTA = ["pendiente", "activa", "suspendida"] as const;
export type EstadoCuentaValor = (typeof ESTADOS_CUENTA)[number];

export const ETAPAS = ["Recepción", "Construcción", "Ejecución", "Enrutamiento", "Operación"] as const;
export type Etapa = (typeof ETAPAS)[number];

/** Estado de una etapa del riel. */
export type EstadoEtapa = "pendiente" | "en-curso" | "completada" | "fallida" | "aviso" | "omitida";
