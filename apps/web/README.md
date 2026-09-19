# Web Next.js — kit visual canónico

SaaS oscuro. Tipografía **Geist**. Acento cian/teal. Copy en español. Dueño de la UI: Eduardo (`@Portillo17e`), salvo `(auth)` (Eddy), `(billing)` y `(admin)` (Javier).

## Tokens

Definidos en `src/app/globals.css` (CSS variables shadcn + Tailwind v4):

| Token | Uso |
|---|---|
| `--background` / `--foreground` | Lienzo y texto |
| `--card` / `--border` | Paneles |
| `--primary` | Acento (cian) |
| `--font-geist-sans` / `--font-geist-mono` | UI y bitácoras |

Modo oscuro por defecto (`<html class="dark">`).

## Componentes

- Primitivos shadcn en `src/components/ui/` (Button, Badge, Card, Input, Tabs, ScrollArea, Separator, Tooltip).
- Efecto Magic UI: `src/components/magic/border-beam.tsx`.
- Shell: `src/components/shell/app-shell.tsx` (rail del ciclo).
- Grafo: `@xyflow/react` en `src/components/panel/cycle-flow.tsx`.
- Iconos: Lucide.

## Rutas de validación (datos mock)

| Ruta | Qué muestra |
|---|---|
| `/` | Inicio con el kit y el ciclo |
| `/projects` | Redirige al primer proyecto |
| `/projects/[id]` | Lista + detalle (composición tipo inbox, dominio Deploya) |
| `/projects/[id]/flujo` | Lienzo de las cinco etapas |
| `/projects/[id]/operacion` | Métricas y bitácoras mock |
| `/auth` `/billing` `/admin` | Placeholders de dominio, mismo shell |

No hay autenticación, pagos ni motor reales. Estados visibles = **despliegue** (§3.2), no suscripción (§4.4).
