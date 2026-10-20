# Proposal

Change: `feat/m2-modo-autoalojado`. Módulo dueño: **suscripciones (M2)** — Javier. Specs tocadas: `suscripciones`. Historias: **SP-06 (2 pts)** (sprint fuera de alcance, [plan-avances.md § Sprint fuera de alcance](../../../docs/plan-avances.md#sprint-fuera-de-alcance)). Pantallas: 30 Deploya autoalojado (qué cambia frente a la nube).

## Why

Para instalar Deploya en un servidor propio no tiene sentido cobrar ni vencer planes. La decisión está en el ADR 0008: un modo de instalación que cambia implementaciones de puertos, sin ramas por tipo.

## What Changes

- `MODO_INSTALACION=nube|autoalojado` (por defecto `nube`).
- Strategy por puerto: `CatalogoPlanes` (`CatalogoNube` | `CatalogoAutoalojado`), `PoliticaCuotas` (`CuotasDelPlan` | `LimitesDeInstalacion`), `AltaPrimerUsuario` (`ComoCliente` | `ConCodigoDeConfiguracion`).
- Tabla `ConfiguracionInstalacion` (código de configuración y límites) y seed del plan «Autoalojado».
- En autoalojado no se programa la tarea del ciclo; `GET /instalacion/modo` para que la web oculte Suscripción y Planes.

## Non-goals

- Cambiar de modo en caliente.
- Cobro de cualquier tipo en autoalojado.
- Admin · Instalación (es `feat-m9-ajustes-instalacion`).

## Capabilities

### New Capabilities

- (ninguna)

### Modified Capabilities

- `suscripciones`: «Modo de instalación».

## Impact

- API: `suscripciones/modo/` (estrategias), `suscripciones.module.ts` y `ciclo.module.ts` (registro según el modo), `GET /instalacion/modo`.
- Prisma: `ConfiguracionInstalacion`, `PoliticaRegistro`; seed del plan `autoalojado`.
- Web: navegación según el modo (`nav-principal.tsx`).
- Contrato: `docs/contratos/instalacion.md`; ADR 0008.
