# 0006 — Polling cada 3 s en vez de WebSocket o SSE

- **Estado:** Propuesto
- **Fecha:** 2026-09-27
- **Autor:** @derekCmorales · **Módulos:** M4, M7 (consumidor: web)
- **Change de OpenSpec:** `feat/m4-motor-construccion`

## Contexto

Las pantallas 10, 12 y 14 muestran el avance de un despliegue y su bitácora. El canvas v4.1 dice «Se actualiza cada 3 s». La transmisión en vivo está en *Fuera de alcance* (punto 11).

## Decisión

La web pregunta cada 3 s `GET /despliegues/:id` y `GET /despliegues/:id/bitacora?desde=<n>` mientras `terminado = false`. La bitácora se pagina por `n` (máx. 500 líneas por respuesta), así que cada consulta trae solo lo nuevo.

## Alternativas consideradas

| Opción | A favor | En contra |
|---|---|---|
| **Polling con `desde=`** (elegida) | Stateless; funciona detrás de cualquier proxy; fácil de probar | Hasta 3 s de retraso |
| SSE | Tiempo real | Conexiones largas por pestaña; más casos de error |
| WebSocket | Bidireccional | No lo necesitamos; más infraestructura |

## Consecuencias

- La bitácora se escribe en lotes (cada 500 ms o 50 líneas) para no hacer una escritura por línea de `docker build`.
- Cambiar a SSE más adelante no cambia el modelo de datos: `n` ya ordena las líneas.
