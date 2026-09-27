# Design

## Context

M4-01 ya deja cada construcción como `Artefacto` y el pipeline por pasos permite otro plan sin tocar los pasos. La conmutación sin corte (M5-02) reescribe la ruta de Traefik solo después de la salud. Decisión de fondo en [ADR 0004](../../../docs/adr/0004-versionado-y-reversion-sin-reconstruir.md). Diagramas: [estados](../../../docs/diagramas/m1-m10/m4-m5-m6-estados-despliegue.mmd), [secuencia de reversión](../../../docs/diagramas/m1-m10/m4-m5-m6-secuencia-reversion.mmd), [actividad](../../../docs/diagramas/m1-m10/m4-m5-m6-actividad-motor.mmd).

## Goals / Non-Goals

**Goals:** revertir en segundos a cualquiera de los últimos 5 artefactos, con la misma seguridad que un despliegue normal (salud antes de publicar; si falla, nada cambia).

**Non-Goals:** registro externo, retención por plan, revertir variables (ver proposal).

## Decisions

### 1. La reversión es un despliegue más

`ReversionService.revertir(proyectoId, artefactoId, usuarioId)` valida (dueño, artefacto del proyecto, `disponible`, no activo, nada en curso), crea el despliegue `#n+1` con `estado = revirtiendo`, `artefactoId`, `commitSha` del artefacto y etapas `recepcion` y `construccion` en `omitida`, y encola `TrabajoDespliegue { plan: "reversion" }`. El historial (pantalla 14) lo muestra como cualquier otro, con su disparador.

### 2. Plan de pipeline, no `if`

`PlanPipeline.reversion = [PasoEjecucion, PasoEnrutamiento, PasoOperacion]`. `PasoEjecucion` ya recibe la imagen desde el contexto; en una reversión la toma del artefacto en vez de la construcción. `TransicionesDespliegue` suma `[*] → revirtiendo → aprovisionando | fallido | cancelado`.

### 3. Retención como Observer

`PasoOperacion` publica `DespliegueTerminado { proyectoId, despliegueId, estado }`. `RetencionArtefactos` lo escucha y, si es `saludable`, pide a `PoliticaRetencion.aRetirar(artefactosDisponibles, activoId, ARTEFACTOS_RETENIDOS = 5)` la lista, llama a `ContenedorPuerto.eliminarImagen(imagen)` y marca `disponible = false`. Un fallo al borrar una imagen se registra y no afecta al despliegue.

### 4. Cuota

`construccionesDesde` cuenta despliegues con `disparador ≠ reversion` (invariante I7 de [datos-nucleo.md](../../../docs/contratos/datos-nucleo.md)).

## Diseño: SOLID y patrones

| Clase / puerto | Patrón | Principio | Por qué |
|---|---|---|---|
| `ReversionService` | Caso de uso | S | Valida y crea; no ejecuta nada |
| `PlanPipeline` | Strategy sobre la cadena de pasos | O | La reversión es otra lista de pasos; los pasos no cambian |
| `RetencionArtefactos` | Observer | S | La operación no sabe de retención |
| `PoliticaRetencion` | Función pura | S | Se prueba con listas literales |
| `ContenedorPuerto.eliminarImagen`, `RepositorioArtefactos` | Adapter, Repository | D, I | Métodos nuevos en puertos estrechos; stubs con la misma firma |

Cambios: estado `Revirtiendo`, `ReversionService`, `RetencionArtefactos`, `PoliticaRetencion`, `ContenedorPuerto.eliminarImagen`, ya en `clases-unificado.mmd` y en el diagrama de estados.

## Risks / Trade-offs

- **Disco del nodo:** 5 imágenes por proyecto pueden pesar. Mitigación: las capas base se comparten; el manual técnico documenta `docker system df`.
- **Variables vigentes vs. las de entonces:** revertir a #13 con variables nuevas puede fallar; la salud lo detecta y nada cambia. Se explica en la pantalla 14.

## Open Questions

- ¿Mostrar en 14 los artefactos no disponibles? Propuesta: sí, con la acción deshabilitada y «imagen retirada».
