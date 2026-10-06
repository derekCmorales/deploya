# 0002 — Cola BullMQ y un trabajador aparte con la misma imagen

- **Estado:** Propuesto
- **Fecha:** 2026-09-27
- **Autor:** @derekCmorales · **Módulos:** M4, M5, M6
- **Change de OpenSpec:** `feat/m4-motor-construccion`

## Contexto

Construir una imagen tarda de segundos a minutos (el tope es de 10 min) y necesita el socket de Docker. Si eso corriera dentro de una petición HTTP, la API se bloquearía y además tendría acceso a Docker, lo que rompe la regla de [AGENTS.md](../../AGENTS.md): la API no llama a Docker. Redis ya está en compose.

## Decisión

Usamos **BullMQ** sobre Redis con una cola `despliegues`. La API solo produce: crea el `Despliegue` y encola un `TrabajoDespliegue { despliegueId, plan: "construccion" | "reversion" }` (patrón Command, `jobId = despliegueId` para que sea idempotente, sin reintentos automáticos: reintentar es una acción del cliente). Un proceso **worker** con la misma imagen que la API (`node dist/trabajador.js`, `TrabajadorModule`) consume con concurrencia 1, monta `/var/run/docker.sock` y es el único que habla con Docker, git y Traefik. La cola queda detrás de `ColaConstruccionPuerto` (cierra C1 de la auditoría). Desde el Avance 2 hay una segunda cola, `operacion` (M5-02), para reiniciar, detener y eliminar: acciones de segundos que no esperan detrás de un build; esas sí reintentan 3 veces con espera exponencial porque no cuestan construcciones.

## Alternativas consideradas

| Opción | A favor | En contra |
|---|---|---|
| **BullMQ + worker aparte** (elegida) | Redis ya existe; reintentos, retención y eventos de trabajo listos; la API no toca Docker | Un proceso más en compose |
| Construir en la API con `setImmediate` | Cero piezas nuevas | Se pierde el trabajo si la API se reinicia; la API tendría el socket de Docker |
| Tabla `Despliegue` como cola (polling a Postgres) | Sin Redis | Bloqueos y sondeo a mano; reinventa BullMQ |
| RabbitMQ | Colas robustas | Otro servicio que operar para un solo nodo |

## Consecuencias

- **DIP:** servicios dependen de `ColaConstruccionPuerto`; en pruebas se usa `ColaMemoria`.
- **SRP:** API = aceptar y consultar; worker = ejecutar el pipeline.
- Concurrencia 1 en el nodo único: evita que dos `docker build` compitan por CPU con los contenedores de clientes. Se sube con `TRABAJADOR_CONCURRENCIA`.
- Riesgo aceptado: montar `docker.sock` da al worker poder de root en el nodo; solo el worker lo monta, nunca la API ni la web.
