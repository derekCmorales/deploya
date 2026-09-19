# Design

## Context

`apps/web` es Next.js 15 placeholder (fuentes del sistema, sin Tailwind). Eduardo es dueño de `apps/web` salvo `(auth)`, `(billing)` y `(admin)`. El plan pide shadcn/ui + Tailwind, Magic UI o Aceternity, `@xyflow/react`, Lucide, Dark SaaS, Inter o Geist, mock, sin auth/pagos/motor. Referencias inbox omnicanal: composición lista + detalle, no el producto de mensajería. Ver proposal.md.

## Goals / Non-Goals

**Goals:**

- Tokens CSS + componentes primitivos reutilizables + shell.
- Rutas de validación navegables del ciclo, con mock en cliente.
- Dockerfile.web / `output: standalone` siguen construyendo.
- Tests y docs alineados al nuevo canon.

**Non-Goals:**

- Fetch a Nest, auth, pasarela, Docker.
- Design tokens en la API.
- Aceternity y Magic UI a la vez (se elige una).

## Decisions

### 1. Geist + tokens shadcn (oscuro por defecto)

- **Elección:** `next/font` Geist; CSS variables estilo shadcn; acento cian/teal (PaaS, no paleta de inbox).
- **Alternativa:** Inter. Geist ya encaja en Next 15 y el pedido permite ambas.

### 2. Tailwind v4 + shadcn primitivos

- **Elección:** Tailwind 4 + componentes shadcn (Button, Badge, Card, Input, Tabs, ScrollArea, Separator, Tooltip).
- **Alternativa:** CSS a mano. El stack pedido es shadcn + Tailwind.

### 3. Magic UI mínimo, no Aceternity

- **Elección:** 1–2 piezas copiadas (p. ej. BorderBeam / fondo particles) vía `framer-motion`, sin el catálogo entero.
- **Alternativa:** Aceternity. Magic UI es más nativo a shadcn.

### 4. Shell en layout raíz; dueños de ruta intactos

- **Elección:** `AppShell` en el layout; `(projects)` concentra lista/detalle/flujo/operación. Auth/billing/admin se envuelven y siguen siendo placeholders de dominio.
- **Alternativa:** solo `(projects)`. El kit canónico es de `apps/web` entero.

### 5. Mock en módulo cliente, no API

- **Elección:** `src/lib/mock/` con proyectos, despliegues (estados §3.2), métricas y bitácoras. Query `?id=` o segmento `[id]` para el seleccionado.
- **Alternativa:** stubs Nest. Fuera de alcance (no motor ni persistencia de UI).

### 6. `@xyflow/react` solo en Construcción→Enrutamiento (vista Flujo)

- **Elección:** nodos = etapas del ciclo; aristas dirigidas; clic alinea lista/detalle.
- **Alternativa:** stepper lineal. El stack pide xyflow y valida el look del pipeline.

### 7. Composición inbox, dominio Deploya

- Columna lista: proyectos/despliegues, búsqueda, filtro por etapa/estado.
- Columna detalle: identidad, fuente (`ProveedorFuente`), timeline del ciclo, URL mock, acciones visuales inertes.
- Sin hilos, canales ni agentes de inbox.

## Risks / Trade-offs

- [Imagen Docker más pesada] → deps solo en `apps/web`; `pnpm-lock.yaml` actualizado; smoke sigue buscando "Deploya" en el HTML.
- [CODEOWNERS en auth/billing/admin] → cambios mínimos (shell compartido); no lógica de esos módulos.
- [Tests que exigen placeholder neutro] → reescribir a aserciones del kit (Geist/tokens/ciclo).
- [Referencias visuales no montadas en este entorno] → look & feel SaaS oscuro lista+detalle; no clonar inbox.

## Migration Plan

Sustitución del placeholder. Rollback = revertir el PR. Sin migración de datos.

## Open Questions

Ninguna que bloquee specs o tareas: Magic UI vs Aceternity queda resuelto (Magic UI mínimo).
