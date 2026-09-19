# Kit visual canónico — Deploya

Fuente de verdad para **toda** superficie en `apps/web`. Dueño del kit: Eduardo (`@Portillo17e`). Cada módulo sigue siendo dueño de **su dominio**; este documento fija **cómo se ve y se ensambla** la UI.

Este change deja el **package y los tokens listos**. Las rutas `/`, `/projects`, `/auth`, `/billing` y `/admin` son **stubs cortos** que apuntan aquí. **No** hay pantallas de producto (lista/detalle, xyflow montado, operación, mocks). Al implementar una historia, reutiliza este kit; no inventes paleta, tipografía ni otro shell.

## Qué reutilizar (obligatorio)

| Pieza | Dónde | Uso |
|---|---|---|
| Tokens CSS | `apps/web/src/app/globals.css` | `--background`, `--foreground`, `--card`, `--primary`, `--muted`, `--border`, `--destructive` |
| Tipografía | `layout.tsx` (`next/font` Geist) | `font-sans` UI, `font-mono` bitácoras |
| Primitivos | `apps/web/src/components/ui/` | Button, Badge, Card, Input, Tabs, ScrollArea, Separator, Tooltip |
| Shell | `apps/web/src/components/shell/app-shell.tsx` | Header mínimo (Deploya + toggle); no montar otra navegación de producto |
| Tema | `ThemeProvider` + `ThemeToggle` | Claro y oscuro; oscuro por defecto; `storageKey=deploya-tema` |
| Iconos | Lucide | Mismos trazos; no mezclar otro set |
| Grafo | `@xyflow/react` (en el package) | Cuando tu historia lo necesite; no está montado en este PR |
| Movimiento | `framer-motion` + `components/magic/` | Efectos puntuales; no catálogo entero |
| Utilidad | `cn()` en `apps/web/src/lib/utils.ts` | Componer clases Tailwind |
| Copy | Español | Textos de la propuesta; sin inglés de UI |

Acento: cian/teal (PaaS). Radio `--radius`. Cuando construyas colas o inbox de trabajo (proyectos, tickets), usa composición lista + detalle — no un clon de mensajería. Eso es trabajo de **tu** historia, no de este kit.

## Tema claro / oscuro

- `:root` = modo claro; `.dark` = modo oscuro (mismas variables).
- El control vive en el **header** (icono sol/luna, `aria-label` «Cambiar a modo claro/oscuro»).
- Componentes nuevos: solo clases semánticas (`bg-background`, `text-muted-foreground`, `border-border`, `bg-primary`). **Nada de hex sueltos** ni paletas por módulo.
- Si montas `@xyflow/react`, el grafo debe seguir `colorMode` del tema.

## Cómo usarlo en tu OpenSpec

En el delta de **tu** módulo (`openspec/changes/feat/m<n>-…/specs/<modulo>/spec.md`), cuando la historia tenga UI, añade un requisito que **apunte a este kit**. Ejemplo:

```md
### Requirement: Superficie web con el kit canónico

Las pantallas de este módulo en `apps/web` SHALL usar el kit visual canónico
(`docs/kit-visual.md`): tokens, AppShell, primitivos shadcn,
Geist, toggle claro/oscuro y copy en español. SHALL NOT introducir otra paleta
ni otro layout raíz.

#### Scenario: Misma cromática que el panel

- **WHEN** el cliente abre una pantalla de este módulo
- **THEN** comparte shell, tipografía y tokens con el resto de `apps/web`, incluido el tema activo
```

Un spec por módulo (§6.1). El kit no es un spec de producto aparte. No inventes paleta nueva.

## Dueños y carpetas

| Dueño | Rutas web | Qué construir encima del kit |
|---|---|---|
| Eddy | `(auth)` | Registro, sesión, recuperación — **sin** auth real en bootstrap |
| Javier | `(billing)`, `(admin)` | Planes y admin — **sin** cobro real; estados §4.4 ≠ despliegue |
| Eduardo | `(projects)` y resto de `apps/web` | Alta, lista, flujo, operación — en **sus** historias, no en este PR |
| Derek | (sin UI de producto) | Si un tool M8 pinta en el panel, misma guía |

Checklist de PR con UI:

- [ ] Importa primitivos de `@/components/ui`, no botones CSS sueltos
- [ ] Vive dentro de `AppShell` (ya envuelve el layout raíz)
- [ ] Se ve bien en **claro y oscuro** (toggle del header)
- [ ] Copy en español; estados de despliegue y de suscripción sin mezclar
- [ ] El change OpenSpec enlaza este documento si hay superficie nueva

## Qué no es este kit

- Auth, pagos o motor reales.
- Pantallas de producto o validación fingida (mocks de proyectos, xyflow montado, métricas).
- Paleta de marketing / Figma como fuente: el canon de implementación es este repo.
- Sustituir specs de módulo por un spec único de “UI Deploya”.

Mapa de archivos: [apps/web/README.md](../apps/web/README.md).
