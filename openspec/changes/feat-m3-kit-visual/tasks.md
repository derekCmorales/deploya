# Tasks

## 1. Dependencias y tokens

- [x] 1.1 Añadir Tailwind v4, shadcn/ui (utilidades + primitivos), Lucide, `@xyflow/react`, `framer-motion` en `apps/web` y actualizar `pnpm-lock.yaml`; verificar `pnpm --filter @deploya/web` resuelve las deps
- [x] 1.2 Definir tokens CSS canónicos (oscuro, acento cian/teal, Geist via `next/font`) en `globals.css` y `layout.tsx`; verificar que el HTML raíz usa `lang="es"` y las variables `--background` / `--primary`

## 2. Kit y shell

- [x] 2.1 Crear primitivos shadcn necesarios (Button, Badge, Card, Input, Tabs, ScrollArea, Separator, Tooltip) bajo `apps/web/src/components/ui`; verificar que exportan clases `cn` basadas en tokens
- [x] 2.2 Añadir un efecto Magic UI mínimo (p. ej. BorderBeam) y `AppShell` (rail + lista/detalle + nav del ciclo); verificar que auth/billing/admin se renderizan dentro del shell sin lógica de esos dominios
- [x] 2.3 Documentar el kit en `apps/web/README.md` (tokens, componentes, rutas de validación)

## 3. Datos mock y pantallas

- [x] 3.1 Crear `src/lib/mock/` con proyectos (`ProveedorFuente` repo/zip), despliegues (estados §3.2, no suscripción), métricas y bitácoras; verificar que al menos un entorno dispara aviso de cuota
- [x] 3.2 Implementar lista + detalle en `(projects)` (búsqueda, filtro por etapa/estado, selección); verificar navegación lista → detalle actualiza identidad, fuente y estado
- [x] 3.3 Implementar vista Flujo con `@xyflow/react` (cinco nodos del ciclo); verificar que el grafo es navegable y vuelve a lista/detalle
- [x] 3.4 Implementar vista Operación (métricas, bitácoras mock, aviso de cuota); verificar copy en español y distinción construcción vs runtime

## 4. Docs, tests y build

- [x] 4.1 Actualizar docs/reglas que niegan el kit canónico (`AGENTS.md`, `docs/arquitectura.md`, `docs/arquitectura-maestro.md`, `docs/roles/eduardo-proyectos-ux/README.md`, `METODOLOGIA.md`, `.cursor/rules/*`, plantilla PR, READMEs de rutas); verificar que ya no exigen placeholder neutro
- [x] 4.2 Reescribir `apps/web/test/home.test.mjs` para el kit (ciclo, Geist/tokens, sin paleta prohibida de bootstrap) y verificar `pnpm --filter @deploya/web test`
- [x] 4.3 Verificar `pnpm --filter @deploya/web build` (standalone) y que el smoke sigue encontrando "Deploya" en el HTML

## 5. Tema y guía para el equipo

- [x] 5.1 Añadir toggle claro/oscuro (`next-themes`, tokens `:root` + `.dark`) en el shell; verificar que el control cambia el tema y el lienzo xyflow sigue el modo
- [x] 5.2 Publicar `docs/kit-visual.md` y apuntar AGENTS, OpenSpec config, kits de rol y plantilla de PR; verificar que un compañero encuentra cómo reutilizar shell, tokens y primitivos sin inventar paleta
