# Contrato · Avisos por correo (M10 ← M4, M2)

Versión 1.2 · 2026-10-25 · dueño: Eddy (M10) · consumidores: Derek (M4, pipeline), Javier (M2, ciclo §4.4). Cambiarlo exige avisar antes de mergear. Change: `feat-m10-avisos-correo`. Spec: [notificaciones](../../openspec/specs/notificaciones/spec.md). Pantalla: 24b del canvas.

## Puerto

`AvisosModule` (`apps/api/src/modules/notificaciones/avisos/avisos.module.ts`) exporta `AvisosPuerto`; el puerto y sus tipos se importan de `modules/notificaciones` (`index.ts`). Quien lo llama no sabe de SMTP ni de plantillas (Observer + Adapter). Implementación: `AvisosCorreo` (busca al titular por `DirectorioCuentas`, que exporta `IdentidadModule`, arma la plantilla y la manda por `CorreoPuerto`).

Va en un módulo aparte de `NotificacionesModule` porque necesita a identidad, que ya importa `NotificacionesModule` para el correo de verificación: así no hay ciclo de módulos. Lo importan el trabajador de despliegues (M4) y el módulo del ciclo (M2).

```ts
export abstract class AvisosPuerto {
  /** Saludable o Fallido. Cancelado y Detenido no se avisan. */
  abstract despliegueTerminado(aviso: AvisoDespliegue): Promise<void>;
  /** Solo en la transición del ciclo §4.4: a Por vencer o a Suspendida. */
  abstract suscripcionCambio(aviso: AvisoSuscripcion): Promise<void>;
}

export interface AvisoDespliegue {
  usuarioId: string;
  proyecto: { id: string; nombre: string; subdominio: string }; // id: enlace «Ver bitácora» (/projects/:id/despliegues/:n)
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
  vigenciaDias?: number;     // 30 o 365, solo Por vencer: «Starter · 30 días»
  contenedoresDetenidos?: number; // solo Suspendida
}
```

## Reglas

1. **Nunca rompe a quien avisa.** Un error del SMTP se registra (`Logger.warn`) y la promesa se resuelve; el despliegue y el ciclo siguen igual.
2. **Una vez por hecho.** El pipeline avisa al pasar a Saludable o Fallido; el ciclo, solo cuando cambia el estado. Correr la tarea diaria dos veces no repite el correo.
3. **Cómo se engancha M4:** `AvisoDespliegueOyente` es un `OyenteDespliegue` más dentro de `OYENTES_DESPLIEGUE` (el mismo mecanismo que la retención de artefactos). No hay `if` nuevos en el pipeline. Lee el despliegue (`RepositorioDespliegues`) y el proyecto (`ProyectosLecturaPuerto`, que suma `nombre`); en un Fallido, la versión activa (`activoDe`) y las dos últimas líneas (`ultimasLineas`, como `«n texto»`). El pipeline guarda la bitácora antes de anunciar un Fallido para que esas líneas incluyan el motivo.
4. **Autoalojado sin SMTP:** se usa el adaptador de consola de [ADR 0001](../adr/0001-correo-por-smtp-configurable.md); los avisos quedan en la bitácora del API.
5. **Plantillas:** `PlantillaDespliegueSaludable`, `PlantillaDespliegueFallido`, `PlantillaPlanPorVencer` y `PlantillaSuscripcionSuspendida` extienden `PlantillaCorreo` (Template Method). Textos exactos en [24b-Correos-avisos.md](../diseno/pantallas/24b-Correos-avisos.md).

## Historial

| Versión | Fecha | Cambio |
|---|---|---|
| 1 | 2026-10-20 | Sprint fuera de alcance (SP-02, SP-04, SP-08) |
| 1.1 | 2026-10-22 | `AvisosModule` exporta el puerto (sin ciclo con identidad); `proyecto.id` en `AvisoDespliegue` para el enlace a la bitácora; `vigenciaDias` opcional en `AvisoSuscripcion` |
| 1.2 | 2026-10-25 | SP-08: `AvisoDespliegueOyente` en `OYENTES_DESPLIEGUE`; qué lee y de dónde salen la etapa, la versión activa y las últimas líneas |
