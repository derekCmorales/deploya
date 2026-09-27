# Proposal

Change: `feat/m4-motor-construccion`. Módulo dueño: **motor-construccion (M4)** — Derek. Specs tocadas: `motor-construccion`, `orquestacion`, `enrutamiento`. Historias: ENG-01, M4-01, M5-01 (10 pts, Avance 1). Contrato: [docs/contratos/despliegues.md](../../../docs/contratos/despliegues.md) v1.

## Why

Hoy el motor es solo `health` y stubs. Para el Avance 1 el botón **Desplegar** de Eduardo tiene que producir una app real: clonar un repositorio público, construir su imagen, correrla con los límites del plan y dejarla Saludable, con cada línea de bitácora guardada para las pantallas 10 y 12. La auditoría deja abiertos C1 (cola sin puerto), C2 (firmas de puertos divergentes), C3 (binding global de stubs) y B6 (clonar y construir sin puerto); este change los cierra.

## What Changes

- **ENG-01 · compose:** servicio `worker` (misma imagen que la API, `node dist/trabajador.js`, `docker.sock`, `git`), `traefik:v3` con proveedor de archivo y `mailpit` (1025 / 8025). Ejemplo `ejemplos/hola-deploya` y script para publicarlo como repo público.
- **M4-01 · construcción:** `ColaConstruccionPuerto` + `ColaBullMq`; `PipelineDespliegue` con un paso por etapa; `ClonadorRepositorioPuerto` (git) y `ConstructorImagenPuerto` (dockerode) con stubs; `TransicionesDespliegue`; `RepositorioDespliegues` (Prisma); las tres rutas del contrato v1.
- **M5-01 · ejecución:** `ContenedorPuerto` real con `--cpus` / `--memory` de `cuotaDe`, sin privilegios, red por proyecto; `VerificacionEntornoPuerto` HTTP con tope de 60 s; Saludable o Fallido.
- **Ruta local (adelanto mínimo de M6-01):** `EnrutamientoPuerto` por archivo de Traefik para abrir la app en `<subdominio>.localhost`.
- Firma única de los puertos en código, [clases-unificado.mmd](../../../docs/diagramas/compartido/clases-unificado.mmd) y canvas.

## Non-goals

- Detección de stack (change `feat/m4-deteccion-stack`, A2) y reversión sin reconstruir (`feat/m5-reversion-instantanea`, A3): aquí sin `Dockerfile` el despliegue falla con motivo claro.
- Cancelar, reintentar, redesplegar, reiniciar, detener (M4-02, M5-02).
- Bloqueo por suscripción Vencida o cuota de construcciones (M5-03, A2): la política existe pero no se aplica todavía.
- HTTPS y certificado comodín en el VPS (M6-02).
- UI: las pantallas son de Eduardo; este change solo cumple el contrato.

## Capabilities

### New Capabilities

- (ninguna)

### Modified Capabilities

- `motor-construccion`: recepción y cola, construcción con Dockerfile, bitácora, máquina de estados y vista del despliegue con cinco etapas.
- `orquestacion`: límites del plan y salud con valores concretos (60 s, red por proyecto, sin privilegios).
- `enrutamiento`: publicación local en `<subdominio>.localhost`.

## Impact

- Código: `apps/api/src/modules/{construccion,orquestacion,enrutamiento}`, `apps/api/src/adapters`, `apps/api/src/trabajador.ts`, `apps/api/src/compartido/reloj.ts`.
- Dependencias: `bullmq`, `@nestjs/bullmq`, `dockerode`, `tar-fs`, `@nestjs/event-emitter`.
- Infra: `docker-compose.yml`, `Dockerfile.api` (+ `git`), `infra/traefik/`.
- Datos: depende de DB-01 ([datos-nucleo.md](../../../docs/contratos/datos-nucleo.md)); hasta que entre, el repositorio en memoria cubre las pruebas.
- Docs: ADR 0002, 0005, 0006.
