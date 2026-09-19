# Web Next.js — kit visual canónico

Guía para el equipo: **[docs/kit-visual.md](../../docs/kit-visual.md)**. Este README es el mapa de archivos.

Tipografía **Geist**. Tokens claro y oscuro (toggle en el rail; oscuro por defecto). Acento cian/teal. Copy en español. Dueño del kit: Eduardo (`@Portillo17e`), salvo `(auth)` (Eddy), `(billing)` y `(admin)` (Javier).

Las rutas de abajo **validan** el kit con mock. No son historias de dominio terminadas.

## Tokens

`src/app/globals.css` (CSS variables shadcn + Tailwind v4):

| Token | Uso |
|---|---|
| `--background` / `--foreground` | Lienzo y texto |
| `--card` / `--border` | Paneles |
| `--primary` | Acento (cian) |
| `--font-geist-sans` / `--font-geist-mono` | UI y bitácoras |

`:root` = claro. `.dark` = oscuro. Persistencia: `localStorage` clave `deploya-tema`.

## Componentes

- Primitivos: `src/components/ui/`
- Tema: `src/components/shell/theme-provider.tsx`, `theme-toggle.tsx`
- Shell: `src/components/shell/app-shell.tsx`
- Magic UI: `src/components/magic/border-beam.tsx`
- Grafo: `@xyflow/react` en `src/components/panel/cycle-flow.tsx`
- Iconos: Lucide
- `cn()`: `src/lib/utils.ts`

## Rutas de validación (mock)

| Ruta | Qué muestra |
|---|---|
| `/` | Inicio con el kit y el ciclo |
| `/projects` | Redirige al primer proyecto |
| `/projects/[id]` | Lista + detalle |
| `/projects/[id]/flujo` | Lienzo de las cinco etapas |
| `/projects/[id]/operacion` | Métricas y bitácoras mock |
| `/auth` `/billing` `/admin` | Placeholders de dominio, mismo shell |

Estados visibles = **despliegue** (§3.2), no suscripción (§4.4).
