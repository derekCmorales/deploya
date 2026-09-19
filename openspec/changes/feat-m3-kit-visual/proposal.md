# Proposal

Change: `feat/m3-kit-visual`. Módulo dueño: **proyectos (M3)** — Eduardo. Specs tocadas: `proyectos`, `observabilidad`.

## Why

El bootstrap deja `apps/web` como placeholder neutro y la documentación prohibía paleta y tokens. Hace falta un kit canónico (dependencias, tokens, Geist, toggle) y una guía para Eddy, Javier y Derek. Este change **no** entrega pantallas de producto ni mocks que finjan el panel.

## What Changes

- Tokens, tipografía (Geist) y primitivos en `apps/web` (shadcn/ui + Tailwind, Lucide, Magic UI mínimo en el package, `@xyflow/react` instalado).
- Toggle **claro / oscuro** (oscuro por defecto) en un header mínimo (Deploya + tema).
- Stubs cortos en `/`, `/projects`, `/auth`, `/billing`, `/admin` que apuntan a `docs/kit-visual.md`.
- Guía `docs/kit-visual.md` y lineamientos del repo: specs con UI reutilizan el kit; no paleta nueva.
- Se retiran lista/detalle, xyflow montado, operación/métricas y mocks de proyectos.

## Non-goals

- Pantallas de producto o de validación (lista/detalle, flujo xyflow, operación, mocks).
- Auth, pagos o motor reales (Docker, cola, TLS, Prisma de planes).
- Kit visual en la API Nest, ni un spec único de producto.
- Sistema de diseño Figma ni paleta de marketing.

## Capabilities

### New Capabilities

- (ninguna)

### Modified Capabilities

- `proyectos`: la superficie web SHALL reutilizar el kit canónico; este change no implementa alta/listado/detalle de producto.
- `observabilidad`: cuando haya UI, SHALL reutilizar el mismo kit; este change no implementa métricas ni bitácoras.

## Impact

- Código: `apps/web` (layout, tokens, primitivos, shell mínimo, stubs). Sin `components/panel` ni `lib/mock`.
- Dependencias: Tailwind, shadcn/ui, Lucide, `@xyflow/react`, framer-motion, next-themes (en el package; xyflow no montado).
- Docs: `docs/kit-visual.md`, `AGENTS.md`, arquitectura, kits de rol, `openspec/config.yaml`, plantilla de PR.
- API Nest: sin cambios de contrato.
