# Web Next.js — design system Deploya v4.1

Fuente madre: **[docs/diseno/](../../docs/diseno/README.md)** (principios, guía de construcción y una ficha por pantalla). Este README es el mapa de archivos. Dueño del sistema: Eduardo (`@Portillo17e`); `(auth)` es de Eddy, `(billing)` y `(admin)` de Javier.

Claro por defecto (toggle sol/luna en el header, `storageKey=deploya-tema`). Neutros cálidos y un solo acento, **Señal**, para lo que está en curso. Geist y Geist Mono. Lucide.

## Archivos

| Qué | Dónde |
|---|---|
| Tokens (CSS variables + Tailwind v4) y movimiento | `src/app/globals.css` |
| Primitivos | `src/components/ui/` — Button, Badge, Card (+ Sunken), Input, Field, Checkbox, Switch, Segmented, Tabs (+ TabsNav), Banner, Meter, Table, CopyField, Dialog, Skeleton, Kbd, Avatar, Tooltip, Separator, ScrollArea |
| Componentes Deploya | `src/components/deploya/` — Wordmark, RielEtapas, EstadoDespliegue, EstadoSuscripcion, Bitacora, Pasos, RequisitosContrasena, LineaTiempo, MapaActividad, PuntoVivo, `estados.ts` |
| Shell | `src/components/shell/` — AppShell (56px), NavPrincipal, NavPanel, ThemeProvider, ThemeToggle |
| Efecto puntual | `src/components/magic/border-beam.tsx` (uno por pantalla) |
| `cn()` | `src/lib/utils.ts` |
| Catálogo vivo | ruta `/sistema` |

## Rutas

| Ruta | Estado |
|---|---|
| `/` | Portada mínima con enlace al sistema |
| `/sistema` | Catálogo de componentes en claro y oscuro |
| `/projects`, `/auth`, `/billing`, `/admin` | Stubs; cada dueño los reemplaza por sus rutas reales (tabla en `docs/diseno/guia-construccion.md`) |

## Comandos

```bash
pnpm --filter @deploya/web dev    # http://localhost:3000/sistema
pnpm --filter @deploya/web test
pnpm --filter @deploya/web build
```
