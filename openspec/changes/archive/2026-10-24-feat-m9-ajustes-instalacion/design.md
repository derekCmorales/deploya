# Design

## Context

`ConfiguracionInstalacion` y `LimitesDeInstalacion` vienen de `feat-m2-modo-autoalojado`; `CertificadoPuerto` de M6-02.

## Decisions

### 1. Composite para la salud

Cada comprobación es una clase con `comprobar()`; agregar una no toca las demás.

### 2. La política de registro es un puerto de M9 que usa M1

El registro no sabe del modo ni de invitaciones: pregunta `PoliticaRegistroPuerto.permite(correo, token?)`.

## Diseño: SOLID y patrones

| Clase / puerto | Patrón | Principio | Por qué |
|---|---|---|---|
| `SaludInstalacion` y `Comprobacion*` | Composite | O, S | Comprobaciones independientes |
| `PoliticaRegistroPuerto` | Strategy / puerto | D, I | M1 depende de una pregunta estrecha |
| `InvitacionesService` | Service Layer | S | Crear, revocar y consumir |

Cambios de clases y puertos: `InstalacionService`, `SaludInstalacion`, `PoliticaRegistroPuerto`, `InvitacionesService` → `docs/diagramas/compartido/clases-unificado.mmd` en el mismo PR (`pnpm diagramas:sync`).

## Risks / Trade-offs

- **Estimación de capacidad:** es orientativa (memoria total menos ~1 GB de Deploya, dividida por la memoria por proyecto).
