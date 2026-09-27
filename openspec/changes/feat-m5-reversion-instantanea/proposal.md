# Proposal

Change: `feat/m5-reversion-instantanea`. Módulo dueño: **orquestacion (M5)** — Derek. Specs tocadas: `orquestacion`, `motor-construccion`. Historia: **M5-04** (3 pts, Avance 3). ADR: [0004](../../../docs/adr/0004-versionado-y-reversion-sin-reconstruir.md).

## Why

El curso pidió concentrar esfuerzo en el **versionamiento y la reversión**. Hoy volver atrás es redesplegar un commit: reconstruye, tarda minutos, consume cuota y puede fallar. Cada construcción ya deja un artefacto inmutable (M4-01); este change los conserva y permite volver a uno en segundos, sin reconstruir. Sale de *Fuera de alcance* (punto 6) con este change propio.

## What Changes

- **Retención:** se conservan los 5 artefactos más recientes por proyecto más el activo; al resto se le borra la imagen y queda `disponible = false` (`PoliticaRetencion` + `RetencionArtefactos`, Observer de `DespliegueTerminado`).
- **Reversión:** `POST /proyectos/:id/reversiones { artefactoId }` crea un despliegue con `disparador = reversion` en estado **Revirtiendo**, con Recepción y Construcción `omitida`; sigue Ejecución → Enrutamiento → Operación con conmutación sin corte. No consume construcciones del mes.
- `GET /proyectos/:id/artefactos` para la pantalla 14.
- `TransicionesDespliegue` gana `Revirtiendo` (ya en el diagrama de estados).
- Contrato v2 (ya publicado) y aviso a Eduardo: insignia `revirtiendo`, acción en 14.

## Non-goals

- Registro de imágenes externo o retención configurable por plan.
- Mantener vivo el contenedor anterior para una reversión sin arranque.
- Revertir variables de entorno o límites: se usan los vigentes.

## Capabilities

### New Capabilities

- (ninguna)

### Modified Capabilities

- `orquestacion`: nuevas **Versionado y retención** y **Reversión sin reconstruir**.
- `motor-construccion`: «Acciones sobre despliegues» distingue redesplegar (reconstruye) de revertir (no reconstruye).

## Impact

- Código: `orquestacion/reversion/`, `orquestacion/retencion/`, `PipelineDespliegue` (plan `reversion`), `ContenedorPuerto.eliminarImagen`, `RepositorioArtefactos`.
- Web (Eduardo, A3): pantalla 14 y `estados.ts`.
- Depende de `feat/m4-motor-construccion`; puede ir antes o después de la detección de stack.
