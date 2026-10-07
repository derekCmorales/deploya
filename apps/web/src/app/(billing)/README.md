# Billing (Javier)

Planes y cobro. Dueño: @Javier-r04. Kit: [docs/diseno/README.md](../../../../../docs/diseno/README.md). Pago simulado.

Pantallas del canvas v4.1 que viven aquí: 06 Planes (pública), 07 Contratar, 08 Mi suscripción, 09 Historial de pagos. Alcance: [docs/alcance.md](../../../../../docs/alcance.md). `/planes` (06) lee el catálogo de `GET /suscripciones/planes` con `usePlanes` y marca «Plan actual» con sesión. `/planes/contratar?plan=&vigencia=` (07 y 07b) y `/suscripcion` (08) piden sesión y usan `hooks/use-suscripcion.ts`; la lógica pura está en `lib/suscripcion.ts`. `/pagos` (09) llega con M2-06.
