# Proposal

Change: `feat/m5-acciones-contenedor`. Módulos dueños: **orquestacion (M5)** y **enrutamiento (M6)** — Derek. Specs tocadas: `orquestacion`, `enrutamiento`. Historias: **M5-02** conmutación sin corte, reiniciar y detener (3 pts) y el cierre de **M6-01** subdominio (2 pts), Avance 2. Pantallas 12b y 13. Contrato: [despliegues.md](../../../docs/contratos/despliegues.md) v2.1.

## Why

Desde el Avance 1 el pipeline ya publica `<subdominio>.localhost` (M6-01) y `PasoOperacion` conmuta: activa el nuevo y solo después detiene el anterior. Falta lo que el cliente hace sobre un proyecto que ya corre: **reiniciar** y **detener**. Y falta un camino para que la API pida algo al contenedor sin tocar Docker: hoy lo único que viaja por la cola es «desplegar». El mismo camino cierra la tarea 7 de `feat/m3-eliminar-proyecto`: al borrar un proyecto, su contenedor, imágenes y ruta se quedan vivos.

## What Changes

- **Cola de operación:** `ColaOperacionPuerto.encolar(AccionContenedor)` con `{ tipo: "reiniciar" | "detener" | "eliminar", proyectoId, contenedorId?, subdominio? }` (Command). Adaptador BullMQ (cola `operacion`) y en memoria. El trabajador la procesa con `AccionesContenedorService`.
- **API (sesión y dueño; si no, 404):** `POST /proyectos/:id/reiniciar` → **202** `{}` y `POST /proyectos/:id/detener` → **202** `{}`; sin despliegue activo → **409** `{ codigo: "sin-despliegue-activo" }`. La web sigue el resultado con `GET /despliegues/:id` (contrato v2.1: `detener` pasa de 200 a 202 porque la API no espera a Docker).
- **Detener:** detiene el contenedor, retira la ruta (`EnrutamientoPuerto.retirar`) y el despliegue activo queda **Detenido**.
- **Reiniciar:** activo Saludable o Detenido → `aprovisionando` (arranca el mismo contenedor con `ContenedorPuerto.iniciar`) → salud → `publicando` (vuelve a publicar la ruta) → **Saludable**. Si no pasa la salud, **Fallido** con motivo.
- **Eliminar (M3-04):** `ProyectosService.eliminar` encola `eliminar` antes de borrar las filas: detiene y borra contenedor, imágenes del proyecto y ruta.
- **Conmutación y subdominio:** pruebas de los escenarios de `enrutamiento` que ya corren, y recorrido verificado desde la API (tarea 8.2 de `feat/m4-motor-construccion`).
- **Web (con Eduardo):** «Reiniciar» y «Detener» en 12b; el estado se actualiza por el polling que ya existe.

## Non-goals

- Cancelar, reintentar y redesplegar (M4-02, Avance 3).
- Detener todo por suscripción suspendida (M5 · Suspensión, Avance 3 con M2-05).
- Escalar a varias réplicas.

## Capabilities

### New Capabilities

- (ninguna)

### Modified Capabilities

- `orquestacion`: «Acciones del cliente» con reiniciar, detener y eliminar por la cola.
- `enrutamiento`: «Conmutación sin interrupción» agrega el escenario de salud fallida.

## Impact

- Código: `orquestacion/acciones-contenedor.service.ts`, `puertos/cola-operacion.puerto.ts`, adaptadores BullMQ y memoria, `ContenedorPuerto.iniciar` y `eliminarImagenesDe` (real y stub), controlador de acciones, `trabajador.ts`.
- M3 (Eduardo, una línea): `ProyectosService.eliminar` usa `ColaOperacionPuerto` vía lo que exporte M5.
- `clases-unificado.mmd` y `m4-m5-m6-estados-despliegue.mmd` (Detenido → Aprovisionando por reinicio).
