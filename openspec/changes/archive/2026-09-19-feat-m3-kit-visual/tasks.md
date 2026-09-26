# Tasks

## 1. Dependencias y tokens

- [x] 1.1 Añadir Tailwind v4, shadcn/ui (utilidades + primitivos), Lucide, `@xyflow/react`, `framer-motion`, `next-themes` en `apps/web` y actualizar `pnpm-lock.yaml`; verificar `pnpm --filter @deploya/web` resuelve las deps
- [x] 1.2 Definir tokens CSS canónicos (claro/oscuro, acento cian/teal, Geist via `next/font`) en `globals.css` y `layout.tsx`; verificar que el HTML raíz usa `lang="es"` y las variables `--background` / `--primary`

## 2. Kit y shell mínimo

- [x] 2.1 Crear primitivos shadcn necesarios (Button, Badge, Card, Input, Tabs, ScrollArea, Separator, Tooltip) bajo `apps/web/src/components/ui`; verificar que exportan clases `cn` basadas en tokens
- [x] 2.2 Añadir `AppShell` mínimo (header Deploya + toggle) y stubs cortos en `/`, `/projects`, `/auth`, `/billing`, `/admin` que apuntan a `docs/kit-visual.md`; verificar que no hay `components/panel` ni `lib/mock`
- [x] 2.3 Documentar el kit en `apps/web/README.md` (tokens, componentes, stubs; xyflow en el package sin montar)

## 3. Sin pantallas de producto

- [x] 3.1 Eliminar lista/detalle, rutas `/projects/[id]`, flujo, operación y mocks de proyectos; verificar que no queda UI que finja producto

## 4. Docs, tests y build

- [x] 4.1 Actualizar docs/reglas (`AGENTS.md`, arquitectura, kits de rol, `METODOLOGIA.md`, `.cursor/rules/*`, plantilla PR, `openspec/config.yaml`); verificar que el kit es canon y que no se prometen pantallas mock
- [x] 4.2 Reescribir `apps/web/test/home.test.mjs` para tokens/Geist/toggle/deps (no pantallas mock) y verificar `pnpm --filter @deploya/web test`
- [x] 4.3 Verificar `pnpm --filter @deploya/web build` (standalone) y que el smoke sigue encontrando "Deploya" en el HTML

## 5. Tema y guía para el equipo

- [x] 5.1 Añadir toggle claro/oscuro (`next-themes`, tokens `:root` + `.dark`) en el header; verificar aria-labels de claro/oscuro
- [x] 5.2 Publicar `docs/kit-visual.md` y apuntar AGENTS, OpenSpec config, kits de rol y plantilla de PR; verificar que un compañero encuentra cómo reutilizar shell, tokens y primitivos sin inventar paleta
