/**
 * Contrato docs/contratos/avisos.md (M10 ← M4, M2). Quien avisa no sabe de SMTP ni de
 * plantillas. Nunca rompe a quien avisa: un error de envío se registra y la promesa se resuelve.
 */
export abstract class AvisosPuerto {
  /** Saludable o Fallido. Cancelado y Detenido no se avisan (lo filtra quien llama). */
  abstract despliegueTerminado(aviso: AvisoDespliegue): Promise<void>;
  /** Solo en la transición del ciclo §4.4: a Por vencer o a Suspendida. */
  abstract suscripcionCambio(aviso: AvisoSuscripcion): Promise<void>;
}

export interface AvisoDespliegue {
  usuarioId: string;
  proyecto: { id: string; nombre: string; subdominio: string };
  despliegue: { numero: number; commit: string; estado: "saludable" | "fallido"; duracionMs: number };
  /** Solo Saludable: la URL pública del proyecto. */
  url?: string;
  /** Solo Fallido: etapa, versión que sigue activa y hasta dos líneas de la bitácora. */
  fallo?: { etapa: string; versionActiva: number | null; ultimasLineas: string[] };
}

export interface AvisoSuscripcion {
  usuarioId: string;
  estado: "por-vencer" | "suspendida";
  /** Nombre del plan: «Starter». */
  plan: string;
  /** Solo Por vencer: fin de la vigencia en ISO 8601. */
  venceEl?: string;
  /** Solo Por vencer: «USD 5.00». */
  precio?: string;
  /** Solo Por vencer: 30 o 365, para «Starter · 30 días». */
  vigenciaDias?: number;
  /** Solo Suspendida. */
  contenedoresDetenidos?: number;
}
