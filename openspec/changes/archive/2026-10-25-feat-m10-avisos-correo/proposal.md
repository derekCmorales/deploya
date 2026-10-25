# Proposal

Change: `feat/m10-avisos-correo`. Módulo dueño: **notificaciones (M10)** — Eddy (plantillas y puerto); Derek (gancho del pipeline, SP-08); Javier (gancho del ciclo, SP-04). Specs tocadas: `notificaciones`, `suscripciones`. Historias: **SP-02 (3 pts), SP-04 (1 pt), SP-08 (1 pt)** (sprint fuera de alcance, [plan-avances.md § Sprint fuera de alcance](../../../docs/plan-avances.md#sprint-fuera-de-alcance)). Pantallas: 24b Correos de avisos.

## Why

Hoy Deploya solo manda verificación y recuperación. El cliente no se entera de que su despliegue terminó o falló si no tiene la pantalla abierta, ni de que su plan está por vencer. Es el punto 4 de fuera de alcance; el correo (`CorreoPuerto`, plantillas, SMTP en el VPS) ya está.

## What Changes

- `AvisosPuerto` con `despliegueTerminado` y `suscripcionCambio` (contrato `docs/contratos/avisos.md` v1.1), exportado por `AvisosModule`, que importa notificaciones e identidad.
- Plantillas `PlantillaDespliegueSaludable`, `PlantillaDespliegueFallido`, `PlantillaPlanPorVencer`, `PlantillaSuscripcionSuspendida` (24b).
- M4: `AvisoDespliegueOyente` registrado en `OYENTES_DESPLIEGUE`.
- M2: el ciclo llama a `suscripcionCambio` en la transición a Por vencer y a Suspendida.

## Non-goals

- Preferencias de correo por usuario.
- Avisos de Cancelado, Detenido, Vencida o Cancelada.
- Notificaciones dentro de la app.

## Capabilities

### New Capabilities

- (ninguna)

### Modified Capabilities

- `notificaciones`: «Avisos por correo».
- `suscripciones`: «Avisos del ciclo».

## Impact

- API: `notificaciones/puertos/avisos.puerto.ts` y `destinatarios.puerto.ts`, `notificaciones/avisos/` (`AvisosCorreo`, `AvisosModule`), `notificaciones/dominio/plantillas-avisos.ts` y `formato-aviso.ts`; `identidad/directorio-cuentas.service.ts` (exportado); `construccion/avisos/aviso-despliegue.oyente.ts`; `suscripciones/ciclo/ciclo-suscripcion.service.ts`.
- Contrato nuevo: `docs/contratos/avisos.md`. Sin tablas.
