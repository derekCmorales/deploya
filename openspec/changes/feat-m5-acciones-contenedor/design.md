# Design

## Context

Existen: `TransicionesDespliegue` (ya permite `saludable → detenido` y `detenido → aprovisionando`), `ContenedorPuerto` (`crear`, `detener`, `eliminar`), `EnrutamientoPuerto` (`publicar`, `retirar`), `RepositorioDespliegues.activoDe` y `marcarActivo`, la cola BullMQ `construccion` y el trabajador aparte ([ADR 0002](../../../docs/adr/0002-cola-bullmq-y-trabajador-aparte.md)). La API no llama a Docker ni a Traefik.

## Goals / Non-Goals

**Goals:** acciones del cliente sin que la API toque Docker; reiniciar sin reconstruir; borrar de verdad lo que deja un proyecto eliminado.

**Non-Goals:** M4-02, suspensión, réplicas (ver proposal).

## Decisions

1. **Una cola aparte (`operacion`).** Una acción de segundos no espera detrás de una construcción de minutos. Concurrencia 1 por proyecto (`jobId = proyectoId:tipo`) para no reiniciar y detener a la vez.
2. **Reiniciar reutiliza el contenedor del despliegue activo** (`iniciar` tras `detener`); no crea despliegue nuevo ni consume construcciones. Las transiciones son las que ya existen; no se agregan estados.
3. **Detener retira la ruta.** Así el subdominio responde 404 de Traefik en vez de un 502; reiniciar la vuelve a publicar.
4. **Eliminar es idempotente:** si el contenedor o la imagen ya no existen, se registra y sigue. `eliminarImagenesDe(subdominio)` borra las etiquetas `deploya/<subdominio>:*`.
5. **Errores con nombre:** `SinDespliegueActivo` (409), `AccionNoPermitida` (409, p. ej. detener un despliegue en curso).

## Diseño: SOLID y patrones

| Clase / puerto | Patrón | Principio | Por qué |
|---|---|---|---|
| `AccionContenedor` | Command | S | La API describe qué hacer; el trabajador lo ejecuta |
| `ColaOperacionPuerto` → `ColaOperacionBullmq`, `ColaOperacionMemoria` | Adapter | D, L | Igual que la cola de construcción; las pruebas usan la de memoria |
| `AccionesContenedorService` con un manejador por tipo (`ReiniciarHandler`, `DetenerHandler`, `EliminarHandler`) | Strategy | O | Una acción nueva (p. ej. suspender en A3) es un manejador nuevo, sin `switch` |
| `TransicionesDespliegue` | State | S | Sin cambios: valida cada paso |
| `ContenedorPuerto.iniciar`, `eliminarImagenesDe` | Port | I | Dos métodos estrechos; el adaptador dockerode los implementa |

Cambios para `clases-unificado.mmd`: las piezas anteriores. Estados: anotar en `m4-m5-m6-estados-despliegue.mmd` que Detenido → Aprovisionando es «reiniciar».

## Risks / Trade-offs

- **Reiniciar un Saludable corta el servicio unos segundos** (detener → iniciar). Aceptado: el cliente lo pide explícitamente; sin corte es redesplegar (M4-02).
- **Acción perdida si Redis cae:** BullMQ persiste en Redis; el reintento automático es 3 veces con espera exponencial.

## Open Questions

- ¿Mostrar «Detener» también en 13 (Resumen)? Sí, en el Avance 3 con M7-02; en el Avance 2 basta 12b.
