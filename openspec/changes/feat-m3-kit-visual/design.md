# Design

## Context

`apps/web` era Next.js 15 placeholder (fuentes del sistema, sin Tailwind). Eduardo es dueño de `apps/web` salvo `(auth)`, `(billing)` y `(admin)`. El equipo necesita el kit instalado y documentado. El alcance **no** incluye pantallas de producto. Ver proposal.md.

## Goals / Non-Goals

**Goals:**

- Tokens CSS + primitivos reutilizables + header mínimo con toggle.
- Librerías en el package: Tailwind, shadcn, Lucide, next-themes, `@xyflow/react`, framer-motion.
- Stubs cortos en español que apuntan a `docs/kit-visual.md`.
- Docs y reglas: specs con UI reutilizan el kit; no paleta nueva.

**Non-Goals:**

- Lista/detalle de proyectos, xyflow montado, operación/métricas, mocks.
- Fetch a Nest, auth, pasarela, Docker.
- Design tokens en la API.
- Aceternity y Magic UI a la vez (se elige una; Magic UI queda en el package, no como producto).

## Decisions

### 1. Geist + tokens shadcn (claro y oscuro)

- **Elección:** `next/font` Geist; CSS variables estilo shadcn; acento cian/teal; `next-themes` con toggle en el header. Oscuro por defecto; `:root` = claro, `.dark` = oscuro.
- **Alternativa:** Inter, o solo oscuro. El equipo pidió ambos modos sobre el mismo kit.

### 2. Tailwind v4 + shadcn primitivos

- **Elección:** Tailwind 4 + componentes shadcn (Button, Badge, Card, Input, Tabs, ScrollArea, Separator, Tooltip).
- **Alternativa:** CSS a mano. El stack pedido es shadcn + Tailwind.

### 3. Librerías en el package, no pantallas

- **Elección:** `@xyflow/react` y `framer-motion` instalados para historias futuras. Este PR no monta el grafo ni finge un panel.
- **Alternativa:** pantallas mock de validación. Se recortaron: el PR no debe llevar producto fingido.

### 4. Shell mínimo

- **Elección:** header con «Deploya» + toggle. Stubs en `/`, `/projects`, `/auth`, `/billing`, `/admin`.
- **Alternativa:** rail de producto con flujo/operación. Fuera de alcance.

### 5. El PR documenta el kit

- **Elección:** `docs/kit-visual.md` es la fuente para specs de otros módulos. Cada dueño construye su dominio encima.
- **Alternativa:** dejar solo código. Sin guía, cada dueño inventaría paleta.

## Risks / Trade-offs

- [Imagen Docker más pesada] → deps solo en `apps/web`; `pnpm-lock.yaml` actualizado; smoke sigue buscando "Deploya" en el HTML.
- [CODEOWNERS en auth/billing/admin] → stubs mínimos; no lógica de esos módulos.
- [Tests que exigían mocks o ciclo en home] → aserciones de tokens, Geist, toggle y deps.

## Migration Plan

Sustitución del placeholder. Rollback = revertir el PR. Sin migración de datos.

## Open Questions

Ninguna que bloquee specs o tareas.
