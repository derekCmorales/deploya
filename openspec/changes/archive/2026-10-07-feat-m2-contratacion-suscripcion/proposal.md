# Proposal

Change: `feat/m2-contratacion-suscripcion`. Módulo dueño: **suscripciones (M2)** (Javier). Spec tocada: `suscripciones`. Historias: M2-02 (5 pts), M2-03 (3 pts) y M2-04 (3 pts), Avance 2. Pantallas 07, 07b y 08 del canvas Deploya v4.1.

## Why

El canvas v4.1 tiene las pantallas 07 Contratar, 07b Resultados y 08 Mi suscripción, pero en el código solo existía 06 Planes: «Contratar» estaba deshabilitado, la pestaña «Mi suscripción» apuntaba a nada y la API de M2 solo exponía el catálogo. Sin contratar no hay forma de salir de Sandbox, y las cuotas por plan que ya aplican M3 y M4 nunca cambian.

## What Changes

- **Dominio M2.** `PoliticaCambioPlan` (funciones puras en `dominio/cambio-plan.ts`) decide la operación: contratación, ascenso o renovación, con su monto y su vigencia. El descenso no se cobra y se programa en `planSiguienteId`. También se agregan `Pago`, el comprobante `DPY-AAAA-NNNNNN`, la validación de tarjeta y cuerpo, y los errores con `codigo`.
- **Puertos y adaptadores:**
  - `PasarelaPago` → `PasarelaSimulada`, con las tres tarjetas de prueba. La tarjeta lenta espera por medio del puerto `Espera`.
  - `RepositorioPagos` → Prisma y memoria.
  - `RepositorioSuscripciones` gana `actualizar` y `programarDescenso`.
- **API con sesión** en `CobroModule` (aparte de `SuscripcionesModule` para no crear un import circular con M1):
  - `GET /suscripciones/mia`
  - `GET /suscripciones/cotizacion`
  - `POST /suscripciones/contratar`
  - `POST /suscripciones/descenso`

  `ErroresSuscripcionesFilter` traduce los errores a HTTP.
- **Web:**
  - `/planes/contratar` (07 y 07b) y `/suscripcion` (08).
  - En `/planes`: «Contratar» activo y «Plan actual» con sesión.
  - En la navegación: «Suscripción» en lugar de «Planes».
  - Los enlaces rotos a `/billing` de M3 pasan a `/suscripcion`.

## Non-goals

- Historial de pagos y PDF (M2-06, 09), ciclo §4.4 y la tarea diaria que aplica el descenso (M2-05).
- Conteo de construcciones del mes en 08 (M7-03, Eduardo, A3). Mientras tanto se muestra el límite.
- Chip de plan en el header del shell.
- Renovación automática, prorrateo y cancelación por el cliente (*fuera de alcance · solo si da el tiempo*).

## Capabilities

### New Capabilities

- (ninguna)

### Modified Capabilities

- `suscripciones`: contratación con pago simulado, renovación y cambio de plan, Mi suscripción.

## Impact

- `apps/api/src/modules/suscripciones/**`, `app.module.ts` (registra `CobroModule`).
- `apps/web/src/app/(billing)/**`, `lib/suscripcion.ts`, `hooks/use-suscripcion.ts`, `nav-panel.tsx`, `nav-principal.tsx` (`activoEn`).
- `docs/diagramas/compartido/clases-unificado.mmd`.
- Sin cambios de schema: `Pago` y `Suscripcion.planSiguienteId` ya estaban en el contrato v1.
