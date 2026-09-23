# Web Next.js — kit visual canónico

Guía para el equipo: **[docs/kit-visual.md](../../docs/kit-visual.md)**. Este README es el mapa de archivos.

Tipografía **Geist**. Tokens claro y oscuro (toggle sol/luna en el header; oscuro por defecto). Cromática monocromática; el contraste lo marca el tema activo, no un acento de color. Copy en español. Dueño del kit: Eduardo (`@Portillo17e`), salvo `(auth)` (Eddy), `(billing)` y `(admin)` (Javier).

Este PR deja el **package listo** y stubs cortos. **No** hay pantallas de producto (lista/detalle, xyflow montado, operación, mocks).

## Tokens

`src/app/globals.css` (CSS variables shadcn + Tailwind v4):

| Token | Uso |
|---|---|
| `--background` / `--foreground` | Lienzo y texto |
| `--card` / `--border` | Paneles |
| `--primary` | Énfasis monocromático (invierte con el tema) |
| `--font-geist-sans` / `--font-geist-mono` | UI y bitácoras |

`:root` = claro. `.dark` = oscuro. Persistencia: `localStorage` clave `deploya-tema`.

## Componentes

- Primitivos: `src/components/ui/` (Button, Badge, Card, Input, Tabs, ScrollArea, Separator, Tooltip)
- Tema: `src/components/shell/theme-provider.tsx`, `theme-toggle.tsx`
- Shell mínimo: `src/components/shell/app-shell.tsx` (header: Deploya + toggle)
- Magic UI (disponible, no montado como producto): `src/components/magic/border-beam.tsx`
- Grafo: `@xyflow/react` en el package; **no** hay vista de flujo en este PR
- Iconos: Lucide
- `cn()`: `src/lib/utils.ts`

## Rutas (stubs)

| Ruta | Qué muestra |
|---|---|
| `/` | Stub de Deploya; apunta a `docs/kit-visual.md` |
| `/projects` | Stub de proyectos (Eduardo) |
| `/auth` | Stub de cuenta (Eddy) |
| `/billing` `/admin` | Stubs de planes y admin (Javier) |

Al implementar una historia, reutiliza este kit. No inventes paleta ni otro shell.
