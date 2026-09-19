# Proposal

Change: `feat/m3-kit-visual`. Módulo dueño: **proyectos (M3)** — Eduardo. Specs tocadas: `proyectos`, `observabilidad`.

## Why

El bootstrap deja `apps/web` como placeholder neutro y la documentación prohíbe paleta, tipografía y tokens. Hace falta un kit canónico para validar el look & feel del panel (lista + detalle, estilo SaaS oscuro) adaptado al ciclo Recepción → Construcción → Ejecución → Enrutamiento → Operación, sin clonar un producto inbox ni implementar motor, auth o pagos reales.

## What Changes

- Tokens, tipografía (Geist) y componentes canónicos en `apps/web` (shadcn/ui + Tailwind, Lucide, un efecto tipo Magic UI, grafo `@xyflow/react`).
- Shell del panel (navegación por etapas del ciclo) y pantallas de validación con **datos mock** en español.
- Lista de proyectos/despliegues + detalle (composición tipo inbox, dominio Deploya).
- Lienzo del flujo de despliegue y superficie de operación (bitácoras y métricas mock).
- Documentación y reglas del repo: el kit **es** canon; se retira la prohibición de paleta.

## Non-goals

- Auth, pagos o motor reales (Docker, cola, TLS, Prisma de planes).
- Clonar el producto de referencia (inbox omnicanal); solo look & feel.
- Kit visual en la API Nest, ni un spec único de producto.
- Sistema de diseño Figma ni paleta de marca “final de marketing”; este PR fija el canon de implementación.

## Capabilities

### New Capabilities

- (ninguna)

### Modified Capabilities

- `proyectos`: el panel SHALL aplicar el kit canónico y mostrar alta/listado/detalle de proyectos y despliegues mock, con estados de **despliegue** (no de suscripción).
- `observabilidad`: el panel SHALL mostrar bitácoras y métricas mock en la etapa Operación, con el mismo kit.

## Impact

- Código: `apps/web` (layout, tokens, componentes, rutas de validación). Placeholders `(auth|billing|admin)` solo se envuelven en el shell; no se implementa su dominio.
- Dependencias: Tailwind, shadcn/ui, Lucide, `@xyflow/react`, framer-motion (Magic UI).
- Docs: `AGENTS.md`, `docs/arquitectura.md`, kits de Eduardo, plantilla de PR, tests que exigían placeholder neutro.
- API Nest: sin cambios de contrato.
