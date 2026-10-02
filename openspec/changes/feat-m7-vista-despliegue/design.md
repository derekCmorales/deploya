# Design

## Context

Ya existen: `RielEtapas`, `Bitacora`, `EstadoDespliegue`, `PuntoVivo` y `CopyField` en `apps/web/src/components`; `useSondeo` y `useDespliegue` (cada 3 s); `GET /despliegues/:id` y `GET /despliegues/:id/bitacora?desde=` con `siguiente` y `terminado` (M4-01). Fichas: `docs/diseno/pantallas/12-*.md`.

## Goals / Non-Goals

**Goals:** riel y bitácora en vivo sin recargar; mismo componente para los tres estados; cero lógica de negocio en los componentes.

**Non-Goals:** cancelar, historial, WebSocket (ver proposal).

## Decisions

1. **Dos sondeos independientes.** `useDespliegue(id)` para cabecera y riel; `useBitacora(id)` para las líneas, con su cursor `desde`. Ambos paran cuando el despliegue termina (`terminado` o estado final).
2. **Acumular sin duplicar.** `fusionarLineas(previas, nuevas)` (pura) ordena por `n` y descarta repetidas; la vista nunca reescribe líneas ya pintadas.
3. **Línea del error** = `lineaDeError(lineas)`: la última con `nivel = "error"`; si no hay, la última de la etapa fallida. Pura y probada.
4. **Tiempo transcurrido** con un `ahora` que el hook inyecta (se puede fijar en la prueba); `formatoDuracion(ms)` ya existe en `lib/proyectos` o se mueve a `lib/despliegues`.
5. **Ruta por número.** La página resuelve `[n]` con `GET /proyectos/:id/despliegues/:numero` y luego sondea por `id`. Un número inexistente o un proyecto ajeno → 404 de 28.
6. **Auto-scroll** solo si el usuario está al final de la bitácora; si subió a leer, no se le mueve.

## Diseño: SOLID y patrones

| Clase / módulo | Patrón | Principio | Por qué |
|---|---|---|---|
| `VistaDespliegue` (página) / `CabeceraDespliegue`, `RielEtapas`, `Bitacora` | Container / Presentational | S | La página trae datos; los componentes solo pintan |
| `useBitacora`, `useDespliegue` sobre `useSondeo` | Observer (polling) | S, O | La política de sondeo vive en un hook; cambiar a SSE es otro hook |
| `fusionarLineas`, `lineaDeError`, `textoParaCopiar`, `tiempoTranscurrido` | Funciones puras | S | Se prueban con `node --test` sin DOM |
| `RepositorioDespliegues.porNumero` (Derek) | Repository | I | Un método estrecho; el controlador no arma consultas |

Cambios para `clases-unificado.mmd`: método `porNumero` en `RepositorioDespliegues`.

## Risks / Trade-offs

- **Bitácoras largas** (miles de líneas): la API entrega 500 por respuesta; la vista pinta con `content-visibility: auto`. Virtualizar queda fuera.
- **Dos peticiones cada 3 s** por pestaña abierta: aceptable en el núcleo; ADR 0006.

## Open Questions

- ¿Abrir 12 automáticamente después de «Guardar y desplegar» en 17? Propuesta: sí, mismo comportamiento que 11d.
