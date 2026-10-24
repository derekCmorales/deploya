import { contenedoresDetenidos } from "./formato-aviso";
import { PlantillaCorreo, type DetalleCorreo } from "./plantilla-correo";

/** Pie común de los avisos de 24b: el correo explica por qué llega. */
const AVISO_CUENTA = "Recibes este correo porque tienes una cuenta en deploya.";
/** Período de gracia de §4.4 que cita el texto de 24b. */
const DIAS_GRACIA = 5;
/** Lo que se conserva tras la suspensión (§4.4), según 24b. */
const DIAS_CONSERVACION = 30;
const MAXIMO_LINEAS_BITACORA = 2;

export interface DatosDespliegueSaludable {
  enlace: string;
  proyecto: string;
  numero: number;
  commit: string;
  duracion: string;
  host: string;
}

/** 24b · Despliegue saludable. */
export class PlantillaDespliegueSaludable extends PlantillaCorreo<DatosDespliegueSaludable> {
  protected asunto(datos: DatosDespliegueSaludable): string {
    return this.titulo(datos);
  }
  protected etiqueta(): string {
    return "Despliegue";
  }
  protected titulo(datos: DatosDespliegueSaludable): string {
    return `${datos.proyecto} está en línea`;
  }
  protected parrafo(datos: DatosDespliegueSaludable): string {
    return `La versión #${datos.numero} pasó la verificación de salud y ya recibe tráfico.`;
  }
  protected estado(): string {
    return "5 / 5 · Saludable";
  }
  protected detalles(datos: DatosDespliegueSaludable): readonly DetalleCorreo[] {
    return [
      { nombre: "Versión", valor: `#${datos.numero} · ${datos.commit}` },
      { nombre: "Duración", valor: datos.duracion },
      { nombre: "URL", valor: datos.host },
    ];
  }
  protected textoBoton(datos: DatosDespliegueSaludable): string {
    return `Abrir ${datos.proyecto}`;
  }
  protected aviso(): string {
    return AVISO_CUENTA;
  }
}

export interface DatosDespliegueFallido {
  enlace: string;
  proyecto: string;
  numero: number;
  etapa: string;
  versionActiva: number | null;
  ultimasLineas: readonly string[];
}

/** 24b · Despliegue fallido. Si no había versión activa, no promete que el servicio siguió. */
export class PlantillaDespliegueFallido extends PlantillaCorreo<DatosDespliegueFallido> {
  protected asunto(datos: DatosDespliegueFallido): string {
    return this.titulo(datos);
  }
  protected etiqueta(): string {
    return "Despliegue";
  }
  protected titulo(datos: DatosDespliegueFallido): string {
    return `Falló el despliegue #${datos.numero} de ${datos.proyecto}`;
  }
  protected parrafo(datos: DatosDespliegueFallido): string {
    const detenido = `Se detuvo en ${datos.etapa}.`;
    if (datos.versionActiva === null) return detenido;
    return `${detenido} La versión #${datos.versionActiva} sigue activa; tu servicio no se interrumpió.`;
  }
  protected lineas(datos: DatosDespliegueFallido): readonly string[] {
    return datos.ultimasLineas.slice(-MAXIMO_LINEAS_BITACORA);
  }
  protected textoBoton(): string {
    return "Ver bitácora";
  }
  protected aviso(): string {
    return AVISO_CUENTA;
  }
}

export interface DatosPlanPorVencer {
  enlace: string;
  plan: string;
  dias: number;
  venceEl: string;
  vigencia: string | null;
  precio: string | null;
}

/** 24b · Plan por vencer. */
export class PlantillaPlanPorVencer extends PlantillaCorreo<DatosPlanPorVencer> {
  protected asunto(datos: DatosPlanPorVencer): string {
    return this.titulo(datos);
  }
  protected etiqueta(): string {
    return "Suscripción";
  }
  protected titulo(datos: DatosPlanPorVencer): string {
    return `Tu plan ${datos.plan} vence en ${datos.dias} ${datos.dias === 1 ? "día" : "días"}`;
  }
  protected parrafo(datos: DatosPlanPorVencer): string {
    return `La vigencia termina el ${datos.venceEl}. Si no renuevas, al vencer se bloquean los despliegues y tus servicios siguen en línea ${DIAS_GRACIA} días de gracia.`;
  }
  protected detalles(datos: DatosPlanPorVencer): readonly DetalleCorreo[] {
    return [
      { nombre: "Plan", valor: datos.vigencia ? `${datos.plan} · ${datos.vigencia}` : datos.plan },
      { nombre: "Vence", valor: datos.venceEl },
      ...(datos.precio ? [{ nombre: "Renovación", valor: datos.precio }] : []),
    ];
  }
  protected textoBoton(): string {
    return "Renovar plan";
  }
  protected aviso(): string {
    return AVISO_CUENTA;
  }
}

export interface DatosSuscripcionSuspendida {
  enlace: string;
  contenedoresDetenidos: number;
}

/** 24b · Suscripción suspendida. Sin contenedores detenidos no los menciona. */
export class PlantillaSuscripcionSuspendida extends PlantillaCorreo<DatosSuscripcionSuspendida> {
  protected asunto(): string {
    return this.titulo();
  }
  protected etiqueta(): string {
    return "Suscripción";
  }
  protected titulo(): string {
    return "Tu suscripción está suspendida";
  }
  protected parrafo(datos: DatosSuscripcionSuspendida): string {
    if (datos.contenedoresDetenidos === 0) return "Terminó el período de gracia.";
    return `Terminó el período de gracia y detuvimos ${contenedoresDetenidos(datos.contenedoresDetenidos)} de tu cuenta.`;
  }
  protected notas(): readonly string[] {
    return [`Conservamos tu código, tus variables y tus versiones durante ${DIAS_CONSERVACION} días. Al renovar, vuelven a arrancar.`];
  }
  protected textoBoton(): string {
    return "Renovar y reactivar";
  }
  protected aviso(): string {
    return AVISO_CUENTA;
  }
}

export const PLANTILLA_DESPLIEGUE_SALUDABLE = new PlantillaDespliegueSaludable();
export const PLANTILLA_DESPLIEGUE_FALLIDO = new PlantillaDespliegueFallido();
export const PLANTILLA_PLAN_POR_VENCER = new PlantillaPlanPorVencer();
export const PLANTILLA_SUSCRIPCION_SUSPENDIDA = new PlantillaSuscripcionSuspendida();
