# Contrato · Avisos por correo (M10 ← M4, M2)

Versión 1 · 2026-10-20 · dueño: Eddy (M10) · consumidores: Derek (M4, pipeline), Javier (M2, ciclo §4.4). Cambiarlo exige avisar antes de mergear. Change: `feat-m10-avisos-correo`. Spec: [notificaciones](../../openspec/specs/notificaciones/spec.md). Pantalla: 24b del canvas.

## Puerto

`NotificacionesModule` exporta `AvisosPuerto`. Quien lo llama no sabe de SMTP ni de plantillas (Observer + Adapter). Implementación: `AvisosCorreo` (busca el correo del titular, arma la plantilla y la manda por `CorreoPuerto`).

```ts
export abstract class AvisosPuerto {
  /** Saludable o Fallido. Cancelado y Detenido no se avisan. */
  abstract despliegueTerminado(aviso: AvisoDespliegue): Promise<void>;
  /** Solo en la transición del ciclo §4.4: a Por vencer o a Suspendida. */
  abstract suscripcionCambio(aviso: AvisoSuscripcion): Promise<void>;
}

export interface AvisoDespliegue {
  usuarioId: string;
  proyecto: { nombre: string; subdominio: string };
  despliegue: { numero: number; commit: string; estado: "saludable" | "fallido"; duracionMs: number };
  url?: string;                                   // solo Saludable
  fallo?: { etapa: string; versionActiva: number | null; ultimasLineas: string[] }; // solo Fallido, máx. 2 líneas
}

export interface AvisoSuscripcion {
  usuarioId: string;
  estado: "por-vencer" | "suspendida";
  plan: string;              // "Starter"
  venceEl?: string;          // ISO, solo Por vencer
  precio?: string;           // "USD 5.00", solo Por vencer
  contenedoresDetenidos?: number; // solo Suspendida
}
```

## Reglas

1. **Nunca rompe a quien avisa.** Un error del SMTP se registra (`Logger.warn`) y la promesa se resuelve; el despliegue y el ciclo siguen igual.
2. **Una vez por hecho.** El pipeline avisa al pasar a Saludable o Fallido; el ciclo, solo cuando cambia el estado. Correr la tarea diaria dos veces no repite el correo.
3. **Cómo se engancha M4:** `AvisoDespliegueOyente` es un `OyenteDespliegue` más dentro de `OYENTES_DESPLIEGUE` (el mismo mecanismo que la retención de artefactos). No hay `if` nuevos en el pipeline.
4. **Autoalojado sin SMTP:** se usa el adaptador de consola de [ADR 0001](../adr/0001-correo-por-smtp-configurable.md); los avisos quedan en la bitácora del API.
5. **Plantillas:** `PlantillaDespliegueSaludable`, `PlantillaDespliegueFallido`, `PlantillaPlanPorVencer` y `PlantillaSuscripcionSuspendida` extienden `PlantillaCorreo` (Template Method). Textos exactos en [24b-Correos-avisos.md](../diseno/pantallas/24b-Correos-avisos.md).

## Historial

| Versión | Fecha | Cambio |
|---|---|---|
| 1 | 2026-10-20 | Sprint fuera de alcance (SP-02, SP-04, SP-08) |
