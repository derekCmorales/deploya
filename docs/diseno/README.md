# Design system Deploya v4.1 — fuente madre

Todo lo visual de `apps/web` sale de aquí. Si construyes una pantalla, a mano o con un agente, estos son los archivos que manda leer:

| Archivo | Para qué |
|---|---|
| **Este README** | Principios, color, tipografía, componentes y reglas |
| [guia-construccion.md](guia-construccion.md) | Cómo armar una pantalla paso a paso, patrones de layout, rutas y el prompt para un agente |
| [pantallas/](pantallas/) | Una ficha por pantalla: ruta, dueño, entrega, componentes y el texto exacto |
| [tokens.json](tokens.json) | Tokens en JSON (derivado de `globals.css`) |
| `apps/web/src/app/globals.css` | Tokens reales (CSS variables + Tailwind v4) |
| `apps/web/src/components/` | Componentes reales. Catálogo vivo en la ruta `/sistema` |

Los diseños de cada pantalla viven en el canvas **Deploya v4.1** de Claude Design (<https://claude.ai/artifact/B89rty3MNxRKW9RHJQwSZT>). El canvas es para mirar; el código y estas fichas son lo que se implementa. Si algo no coincide, se corrige el componente o la ficha, nunca con estilos sueltos en una pantalla.

Alcance de lo que se construye: [../alcance.md](../alcance.md). Quién hace qué y cuándo: [../plan-avances.md](../plan-avances.md).

## Principios

**Sobrio en la forma, vivo en el estado.** Deploya es infraestructura: la interfaz da calma y claridad. La personalidad no está en adornos sino en cómo el sistema muestra lo que pasa: un solo color para lo que está en curso, el riel de cinco etapas y movimiento que acompaña cada cambio de estado.

1. **Claro por defecto**, oscuro disponible siempre (toggle en el header, `storageKey=deploya-tema`).
2. **Neutros cálidos y una sola tinta.** Papel en claro, grafito en oscuro.
3. **Señal = lo que está en curso.** La etapa actual, *Construyendo*, el cursor de la bitácora, lo no leído y el foco. Nada más usa Señal.
4. **`destructive` es el único rojo de acción** (eliminar, suspender). `bad` es un estado, no un botón.
5. **Bordes antes que sombras.** La sombra (`shadow-elev`) solo en diálogos y popovers.
6. **Geist para hablar, Geist Mono para medir.** Todo lo que se copia y pega va en mono: hashes, dominios, variables, puertos, tiempos.
7. **Informa, no decora.** Sin gradientes, sin emoji, sin ilustraciones fuera de las pantallas de acceso.

## Marca

La palabra `deploya` en minúsculas, Geist 700, tracking −6 %, con la última «a» en Señal. Sin símbolo. Componente: `Wordmark`.

No hacer: mayúscula inicial, otra letra en azul, añadir íconos, cambiar el tracking.

## Color

Tokens semánticos; nunca hex sueltos ni paletas por módulo. Clases de Tailwind: `bg-background`, `bg-sunken`, `bg-card`, `text-muted-foreground`, `text-faint`, `border-border-strong`, `bg-signal-soft`, `text-signal`, `text-ok`, `text-warn`, `text-bad`, `bg-destructive`…

| Token | Claro | Oscuro | Uso |
|---|---|---|---|
| `background` | papel | grafito | Fondo de página |
| `sunken` | un tono abajo | un tono abajo | Inputs, bitácora, bloques secundarios |
| `card` | casi blanco | un tono arriba | Cards, tablas, paneles |
| `popover` | blanco | dos tonos arriba | Diálogos, menús |
| `muted` / `accent` | | | Zonas apagadas / hover |
| `foreground` · `muted-foreground` · `faint` | | | Tinta · apoyo · terciario |
| `border` · `border-strong` · `border-stronger` | | | Tres pesos de borde |
| `primary` | tinta | papel | Botón principal (invierte) |
| `signal` · `signal-soft` · `signal-line` | azul 250 | azul 232 | **Solo en curso** y foco |
| `ok` | verde | verde | Saludable, Activa |
| `warn` | ámbar | ámbar | Por vencer, Vencida, límite cerca |
| `bad` | rojo | rosa | Fallido, Suspendida, errores |
| `destructive` | rojo | rojo | Eliminar |

Valores exactos (OKLCH) en [tokens.json](tokens.json) y `globals.css`.

Contraste: los estados siempre llevan **palabra e icono**, nunca solo color.

## Tipografía

| Estilo | Tamaño / línea | Peso | Ejemplo |
|---|---|---|---|
| display | 40 / 44, −4 % | 600 | Tu primer proyecto |
| h1 | 28 / 34, −3.2 % | 600 | api-tienda · versión #14 |
| h2 | 18 / 24, −2 % | 600 | Consumo del período |
| h3 | 14 / 20 | 600 | Versión activa |
| cuerpo | 14 / 20 | 400 | Tu proyecto se está construyendo. |
| eyebrow | 13 / 18 | 500, `muted-foreground` | Construcción |
| sm | 12 / 16 | 400 | Se reinicia el 03 oct |
| mono | 12–13 / 18 | 400, Geist Mono | `a1b2c3d` |

Números que cambian (tiempos, contadores): clase `tnum`.

## Espaciado, radios y controles

- Escala de 4px de Tailwind. Página: `px-8 py-7`, secciones con `gap-6`.
- Controles: 36px (`default`), 32px (`sm`), 26px (`xs`), 40px (`lg`). Header de 56px.
- Radios: 8px controles, 10px zonas hundidas y segmentado, 14px cards, paneles y diálogos.
- Foco visible siempre: anillo de 2px en `ring` (Señal).

## Movimiento

Utilidades en `globals.css`, todas se apagan con `prefers-reduced-motion`:

| Clase | Qué hace |
|---|---|
| `dy-barrido` | Etapa en curso del riel |
| `dy-vivo` | Punto de Señal que late (`PuntoVivo`) |
| `dy-cursor` | Cursor de la bitácora en vivo |
| `dy-entrada` | Aparición de un bloque |
| `dy-esqueleto` | Brillo de carga (`Skeleton`) |
| `animate-spin` | Solo `loader-circle` en estados en curso |

Un efecto de borde (`BorderBeam`) por pantalla como máximo.

## Iconografía

Un solo set: **Lucide** (`lucide-react`), trazo 2, 24×24, `currentColor`. 16px en controles, 12px en badges, 18–20px en cabeceras. Iconos de apoyo en `muted-foreground`. Sin emoji ni otros sets. Para el proveedor de fuente: `git-branch` / `folder-git-2`.

| Etapa | Iconos |
|---|---|
| Recepción | `rocket`, `folder-git-2`, `git-branch`, `git-commit-horizontal`, `link`, `variable` |
| Construcción | `hammer`, `package`, `layers`, `file-code`, `box` |
| Ejecución | `container`, `server`, `cpu`, `memory-stick`, `play`, `square`, `rotate-cw` |
| Enrutamiento | `globe`, `network`, `route`, `shield-check`, `lock` |
| Operación | `activity`, `chart-line`, `gauge`, `terminal`, `scroll-text` |
| Cuenta | `user`, `log-in`, `log-out`, `key-round`, `mail`, `shield` |
| Cobro | `credit-card`, `receipt` |

## Estados (vocabularios cerrados)

Nunca armes el badge a mano: `EstadoDespliegue`, `EstadoSuscripcion`. Los valores viven en `components/deploya/estados.ts`.

| Despliegue | Icono | Tono |
|---|---|---|
| Encolado | `clock` | muted |
| Construyendo · Aprovisionando · Publicando | `loader-circle` girando | signal |
| Saludable | `circle-check` | ok |
| Fallido | `circle-x` | bad |
| Cancelado | `ban` | muted |
| Detenido | `circle-stop` | muted |

| Suscripción (§4.4) | Icono | Tono |
|---|---|---|
| Activa | `badge-check` | ok |
| Por vencer | `calendar-clock` | warn |
| Vencida | `calendar-x` | warn |
| Suspendida | `circle-pause` | bad |
| Cancelada | `ban` | muted |

Cuenta: Pendiente de verificación · Activa · Suspendida (texto en `Badge muted`, `ok` o `bad`).

## Componentes

Importa desde `@/components/...`. Catálogo vivo: `/sistema`.

### Base (`components/ui`)

| Componente | Uso |
|---|---|
| `Button` | Variantes `default`, `secondary`, `outline`, `ghost`, `destructive`, `destructive-outline`, `link`; tamaños `xs`, `sm`, `default`, `lg`, `icon`, `icon-sm`, `icon-xs`. Una acción principal por vista. Solo-icono con `aria-label`. |
| `Badge` | Variantes `muted`, `outline`, `signal`, `ok`, `warn`, `bad`; `size="lg"`. |
| `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`, `Sunken` | Superficies. Nada de cards dentro de cards. |
| `Field` + `Input` | Etiqueta, control, pista y error (`aria-invalid`, `aria-describedby="<id>-msg"`). Valores técnicos con `className="font-mono"`. |
| `Checkbox`, `Switch` | Controles nativos accesibles. |
| `Segmented` | Opciones cortas excluyentes (30 / 365 días, filtros). |
| `Tabs` / `TabsNav` | Vistas del mismo recurso. `TabsNav` para rutas con `aria-current="page"`. |
| `Banner` | Avisos `muted`, `warn`, `bad`, `signal` con acciones. |
| `Meter` | Consumo frente al límite; cambia a `warn` al 80 % y `bad` al 100 %. |
| `Table` y partes | Tablas en panel; fila activa con `data-activa="true"`. |
| `CopyField` | Valor copiable en mono. |
| `Dialog` | Modal nativo. Confirmación destructiva: escribir el nombre. |
| `Skeleton`, `Kbd`, `Avatar`, `Tooltip`, `Separator`, `ScrollArea` | Apoyo. |

### Deploya (`components/deploya`)

| Componente | Uso |
|---|---|
| `Wordmark` | Marca. |
| `RielEtapas` | Cinco etapas. `size="sm"` en listas (55px), `size="lg"` en cabeceras con duración. |
| `EstadoDespliegue`, `EstadoSuscripcion` | Badges canónicos. |
| `Bitacora` | Líneas numeradas en mono; `nivel="error"` resalta; `enCurso` muestra cursor. Contenido no confiable: solo texto. |
| `Pasos` | Asistente de alta (Repositorio · Variables · Revisar). |
| `RequisitosContrasena` + `REGLAS_CONTRASENA`, `contrasenaValida` | Reglas de contraseña compartidas por 01, 04 y 05b. |
| `LineaTiempo` | Secuencia de eventos con hora. |
| `MapaActividad` | 12 semanas de despliegues. |
| `PuntoVivo` | Algo en curso ahora mismo. |

### Shell (`components/shell`)

`AppShell` (header 56px con `nav`, `acciones`, `usuario`), `NavPrincipal`, `NavPanel`, `ThemeProvider` (claro por defecto), `ThemeToggle`.

## Voz y copy

- Todo en **español**, sin inglés de UI: «Desplegar», «Bitácora», «Variables», nunca "Deploy" o "Logs".
- Segunda persona informal, frases cortas: «Tu proyecto se está construyendo.»
- Botones en infinitivo: «Crear proyecto», «Reintentar», «Eliminar proyecto».
- Mayúscula solo al inicio: «Por vencer».
- Errores que dicen qué pasó y qué hacer: «No pudimos acceder al repositorio (HTTP 404). Revisa que…».
- Datos sensibles enmascarados: `d•••k@t•••••••o.com`, variables `••••`.

## Accesibilidad

- Semántica real: `<button>`, `<a href>`, `<label>` + `<input>`. Nada de `onClick` en `div`.
- Foco visible en todo control. Orden de tabulación natural.
- Contraste 4.5:1 en texto; los estados llevan palabra.
- `aria-live` en la bitácora en curso y en mensajes de copiado; `role="alert"` en errores de formulario.
- Revisa cada pantalla en claro **y** oscuro.

## Qué no hacer

- Hex, `rgb()` o colores de Tailwind (`bg-blue-500`) en pantallas: solo tokens.
- Otra tipografía, otro set de iconos, otro shell.
- Usar Señal para decorar o para marcar algo que no está en curso.
- Mezclar estados de despliegue y de suscripción en el mismo badge o la misma palabra.
- Construir de nuevo un componente que ya existe; si falta una variante, agrégala al componente.
