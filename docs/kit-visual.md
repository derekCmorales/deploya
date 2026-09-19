# Kit visual canónico — Deploya

Fuente de verdad para **toda** superficie en `apps/web`. Dueño del kit: Eduardo (`@Portillo17e`). Cada módulo sigue siendo dueño de **su dominio**; este documento fija **cómo se ve y se ensambla** la UI.

Las rutas actuales (`/`, `/projects/…`, `/auth`, `/billing`, `/admin`) son **pantallas de validación** con datos mock. No son el producto terminado de M1–M10. Al implementar una historia, reutilizá este kit; no inventes paleta, tipografía ni otro shell.

## Qué reutilizar (obligatorio)

| Pieza | Dónde | Uso |
|---|---|---|
| Tokens CSS | `apps/web/src/app/globals.css` | `--background`, `--foreground`, `--card`, `--primary`, `--muted`, `--border`, `--destructive` |
| Tipografía | `layout.tsx` (`next/font` Geist) | `font-sans` UI, `font-mono` bitácoras |
| Primitivos | `apps/web/src/components/ui/` | Button, Badge, Card, Input, Tabs, ScrollArea, Separator, Tooltip |
| Shell | `apps/web/src/components/shell/app-shell.tsx` | Rail + header; no montar otra navegación de producto |
| Tema | `ThemeProvider` + `ThemeToggle` | Claro y oscuro; oscuro por defecto; `storageKey=deploya-tema` |
| Iconos | Lucide | Mismos trazos; no mezclar otro set |
| Utilidad | `cn()` en `apps/web/src/lib/utils.ts` | Componer clases Tailwind |
| Copy | Español | Textos de la propuesta; sin inglés de UI |

Acento: cian/teal (PaaS). Radio `--radius`. Composición lista + detalle para colas/inbox de trabajo (proyectos, tickets, etc.), no un clon de mensajería.

## Tema claro / oscuro

- `:root` = modo claro; `.dark` = modo oscuro (mismas variables).
- El control vive en el rail (`aria-label` «Cambiar a modo claro/oscuro»).
- Componentes nuevos: solo clases semánticas (`bg-background`, `text-muted-foreground`, `border-border`, `bg-primary`). **Nada de hex sueltos** ni paletas por módulo.
- El grafo `@xyflow/react` debe seguir `colorMode` del tema.

## Cómo usarlo en tu OpenSpec

En el delta de **tu** módulo (`openspec/changes/feat/m<n>-…/specs/<modulo>/spec.md`), cuando la historia tenga UI, añadí un requisito que **apunte a este kit**. Ejemplo:

```md
### Requirement: Superficie web con el kit canónico

Las pantallas de este módulo en `apps/web` SHALL usar el kit visual canónico
(`docs/kit-visual.md`): tokens, AppShell, primitivos shadcn,
Geist, toggle claro/oscuro y copy en español. SHALL NOT introducir otra paleta
ni otro layout raíz.

#### Scenario: Misma cromática que el panel

- **WHEN** el cliente abre una pantalla de este módulo
- **THEN** comparte shell, tipografía y tokens con `/projects`, incluido el tema activo
```

Un spec por módulo (§6.1). El kit no es un spec de producto aparte.

## Dueños y carpetas

| Dueño | Rutas web | Qué construir encima del kit |
|---|---|---|
| Eddy | `(auth)` | Registro, sesión, recuperación — **sin** auth real en bootstrap |
| Javier | `(billing)`, `(admin)` | Planes y admin — **sin** cobro real; estados §4.4 ≠ despliegue |
| Eduardo | `(projects)` y resto de `apps/web` | Alta, lista, flujo, operación |
| Derek | (sin UI de producto) | Si un tool M8 pinta en el panel, misma guía |

Checklist de PR con UI:

- [ ] Importa primitivos de `@/components/ui`, no botones CSS sueltos
- [ ] Vive dentro de `AppShell` (ya envuelve el layout raíz)
- [ ] Se ve bien en **claro y oscuro** (toggle del rail)
- [ ] Copy en español; estados de despliegue y de suscripción sin mezclar
- [ ] El change OpenSpec enlaza este documento si hay superficie nueva

## Qué no es este kit

- Auth, pagos o motor reales.
- Paleta de marketing / Figma como fuente: el canon de implementación es este repo.
- Sustituir specs de módulo por un spec único de “UI Deploya”.

Detalle de archivos y rutas de validación: [apps/web/README.md](../apps/web/README.md).
