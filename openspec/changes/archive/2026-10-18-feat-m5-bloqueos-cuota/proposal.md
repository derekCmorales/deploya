# Proposal

Change: `feat/m5-bloqueos-cuota`. Módulo dueño: **orquestacion (M5)** — Derek; seed de demo en **suscripciones (M2)** — Javier; mensaje en **proyectos (M3)** — Eduardo. Specs tocadas: `orquestacion`, `suscripciones`, `proyectos`. Historia: **M5-03** bloqueos por suscripción y cuota de construcciones (2 pts), Avance 2. Pantallas 10c y 11d. Contratos: [despliegues.md](../../../docs/contratos/despliegues.md) (409 ya firmado en v2) y [datos-nucleo.md](../../../docs/contratos/datos-nucleo.md) (invariante I7: construcciones del mes calendario UTC, sin cambios).

## Why

La propuesta pide para el Avance 2 la **aplicación efectiva de las cuotas del plan**. Hoy se limita la cantidad de proyectos (M3-01), pero cualquier cuenta puede construir sin límite y una suscripción Vencida o Suspendida sigue desplegando. Cada plan ya trae `construccionesMes` (30, 150, 500, 2000) y `cuotaDe` ya devuelve `estado`; falta contar y decidir.

## What Changes

- **Período:** el mes calendario en UTC, como ya firma la invariante I7 de `datos-nucleo.md`. Función pura `inicioDelMes(ahora)`; el reloj llega por `Reloj`.
- **M2 (Javier):** seed de demo con `vencida@deploya.app` (suscripción Vencida) y `suspendida@deploya.app`, para probar los bloqueos antes de que exista el ciclo §4.4.
- **M5 (Derek):** `PoliticaDespliegue.verificar({ estado, construccionesUsadas, construccionesMes })` (pura) lanza `SuscripcionNoPermite` (Vencida o Suspendida) o `CuotaConstruccionesAgotada`. `BloqueosService.verificar(usuarioId)`, exportado por M5, la aplica con `CuotaPlanPuerto` y `RepositorioDespliegues.contarConstruccionesDesde(usuarioId, desde)`.
- **M4 (Derek):** `ConstruccionService.crearDespliegue` llama a `BloqueosService.verificar` **antes** de crear el despliegue, para todos los disparadores que construyen. La reversión (A3) no construye y no cuenta.
- **API:** `POST /proyectos/:id/despliegues` y `PUT …/variables` con `desplegar` responden **409** `{ codigo: "suscripcion-no-permite" | "cuota-construcciones-agotada", mensaje }`.
- **M3 (Eduardo):** `POST /proyectos` verifica antes de persistir (no deja proyectos huérfanos sin despliegue); 11d y 17 muestran el banner con «Renovar» o «Cambiar de plan» (enlace a `/suscripcion`).

## Non-goals

- Pasar suscripciones a Vencida o Suspendida automáticamente (M2-05, Avance 3).
- Detener contenedores al suspender (M5 · Suspensión, Avance 3).
- Mostrar construcciones usadas en Mi suscripción (M7-03, Avance 3; este change ya deja el conteo listo).

## Capabilities

### New Capabilities

- (ninguna)

### Modified Capabilities

- `orquestacion`: nueva «Bloqueos por suscripción y cuota».
- `suscripciones`: «Cuotas aplicadas» con el límite de construcciones del mes.
- `proyectos`: «Límite y estado de la suscripción» con el escenario de cuota agotada.

## Impact

- Código: `orquestacion/dominio/politica-despliegue.ts`, `bloqueos.service.ts`, errores; `CuotaPlanPuerto` con `permisoDe`; `RepositorioDespliegues.contarConstruccionesDesde` (Prisma y memoria); `ConstruccionService`; seed de M2; `proyectos.service.ts`; banner en 11d y 17.
- `clases-unificado.mmd`: `PoliticaDespliegue`, `BloqueosService`, `CuotaPlanPuerto.permisoDe`.
