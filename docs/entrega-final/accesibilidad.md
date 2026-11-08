# Revisión de accesibilidad (DOC-02)

Revisión de las pantallas de la v1.0.0 contra WCAG 2.1 AA, en claro y en oscuro. La hizo Derek el 8 de noviembre; las correcciones pequeñas entraron con EST-01c (`feat-web-lanzamiento`, Eduardo) y con `fix(m9)` en la tabla de 25.

## Cómo se midió

- **Automático:** [axe-core](https://github.com/dequelabs/axe-core) 4.10 inyectado con Playwright en cada pantalla, con las reglas `wcag2a`, `wcag2aa`, `wcag21aa` y `best-practice`. Sesiones reales de Cliente (con Starter y un proyecto) y de Administrador sobre el stack de compose con el seed. axe no entra como dependencia del repo: se corre desde fuera.
- **Además de axe:** el título de cada pestaña (`<title>` de la respuesta), las cabeceras de seguridad y una revisión visual de capturas en claro y oscuro (10c, 28, 03, 25b). **Queda por hacer a mano en el VPS** (ensayo): recorrido solo con teclado, zoom al 200 % y lector de pantalla; la columna 2.1.1 y 2.4.7 refleja lo que mide axe (elementos enfocables, regiones desplazables), no ese recorrido.
- Criterios de la tabla: **1.1.1** texto alternativo, **1.3.1** estructura (landmarks, encabezados, etiquetas), **1.4.3** contraste, **2.1.1** teclado, **2.4.2** título de página, **2.4.7** foco visible, **4.1.2** nombre y rol.

✓ cumple · ✗ falla (con su estado) · — no aplica.

## Resultado por pantalla

| Pantalla | 1.1.1 | 1.3.1 | 1.4.3 | 2.1.1 | 2.4.2 | 2.4.7 | 4.1.2 | Estado |
|---|---|---|---|---|---|---|---|---|
| 01 Registro | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | Corregido (faltaba `<main>`) |
| 02 Verificar | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | Corregido (faltaba `<main>`) |
| 03 Ingresar | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | Corregido (faltaba `<main>`) |
| 04 Recuperar y restablecer | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | Corregido (faltaba `<main>`) |
| 05 Mi cuenta | ✓ | ✓ | ✗ claro | ✓ | ✓ | ✓ | ✓ | Pendiente P3: insignia `ok` |
| 05b Seguridad | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | Cumple |
| 06 Planes | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | Cumple |
| 07 Contratar | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | Cumple |
| 08 Mi suscripción | ✓ | ✓ | ✗ claro | ✓ | ✓ | ✓ | ✓ | `Meter` corregido; pendiente P3 insignia `ok` (4.48:1) |
| 09 Historial de pagos | ✓ | ✓ | ✗ claro | ✓ | ✓ | ✓ | ✓ | Pendiente P3: insignia `ok` |
| 10 Proyectos | ✓ | ✓ | ✗ claro | ✓ | ✓ | ✓ | ✓ | `Meter` corregido; pendiente P3 insignia `bad` (4.06:1) |
| 10c Suscripción vencida | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | Cumple |
| 11a Nuevo proyecto | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | Corregido (faltaba `<main>`) |
| 12 Despliegue (12b, 12c) | ✓ | ✓ | ✗ | ✓ | ✓ | ✓ | ✓ | Bitácora con teclado corregida; pendiente P3 número de línea `text-faint` |
| 13 Resumen | ✓ | ✗ | ✓ | ✓ | ✓ | ✓ | ✓ | Banner duplicado corregido; pendiente P3 `heading-order` |
| 14 Despliegues | ✓ | ✗ | ✓ | ✓ | ✓ | ✓ | ✓ | Banner duplicado corregido; pendiente P3 `heading-order` |
| 15 Bitácoras | ✓ | ✗ | ✓ | ✓ | ✓ | ✓ | ✓ | Banner duplicado corregido; pendiente P3 `heading-order` |
| 16 Métricas | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | Corregido (banner duplicado) |
| 17 Variables | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | Corregido (banner duplicado) |
| 19 Configuración | ✓ | ✓ | ✗ oscuro | ✓ | ✓ | ✓ | ✓ | Pendiente P3: botón destructivo en oscuro (3.43:1) |
| 25 Admin · Usuarios | ✓ | ✓ | ✗ | ✓ | ✓ | ✓ | ✓ | Tabla que pisaba el panel corregida; pendiente P3 insignia `ok` y `text-faint` |
| 27 Admin · Infraestructura | ✓ | ✗ | ✓ | ✓ | ✓ | ✓ | ✓ | Pendiente P3: `heading-order` |
| 28 Estados (404, conexión) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | Corregido (faltaba `<main>` en 404) |
| Portada | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | Cumple |

No se midieron con sesión 31 (asistente) ni 32 (Admin · Instalación): solo existen en autoalojado. Comparten componentes con 03 y 27.

## Qué se corrigió

| Hallazgo (regla de axe) | Dónde | Corrección |
|---|---|---|
| `landmark-one-main` | 01–04, 11a, 404 | La raíz de cada pantalla es `<main>` |
| `landmark-no-duplicate-banner`, `landmark-unique` | 13–19 | El layout del proyecto es `<main>`: su `header` deja de ser un segundo *banner* |
| `aria-meter-name` (serio) | 08, 10 | `Meter` toma su nombre de la etiqueta (`aria-labelledby` con `useId`) |
| `scrollable-region-focusable` (serio) | 12 | La bitácora tiene `tabIndex={0}` y anillo de foco; el número de línea es decorativo (`aria-hidden`) |
| Solapamiento visual (no es regla de axe) | 25 con detalle abierto | La tabla se desplaza dentro de su columna |

Prueba que los fija: «Accesibilidad: un main por pantalla, medidores con nombre y bitácora con teclado (DOC-02)» en `apps/web/test/lanzamiento.test.mjs`, y «25b · con el detalle abierto…» en `admin-usuarios.test.mjs`.

## Pendiente (P3, después de la entrega)

Todo lo pendiente pide cambiar **tokens** o **componentes base** del design system, y la regla del sprint es no rediseñar ([plan-avances.md § Entrega final](../plan-avances.md#entrega-final--100--entrega-y-exposición-viernes-6-de-noviembre)). Ninguno bloquea una tarea: son textos de 12–13 px con contraste un poco por debajo de 4.5:1.

| Hallazgo | Medido | Propuesta |
|---|---|---|
| Insignia `ok` (`bg-ok/14 text-ok`) en claro | 3.79–4.48:1 | Oscurecer `--ok` en claro o bajar el fondo a `/10` |
| Insignia `bad` en claro | 4.06:1 | Igual con `--bad` |
| `text-faint` (número de línea, ayudas) | 2.72:1 claro · 4.01–4.32:1 oscuro | Usarlo solo en texto ≥ 18 px o subir el token |
| Botón destructivo en oscuro | 3.43:1 | Texto `destructive-foreground` oscuro en tema oscuro |
| `heading-order` (buena práctica, no AA) | 13, 14, 15, 27 | `CardTitle` con nivel configurable (`h2` debajo del `h1` de la página) |

Cada uno va a un issue con la etiqueta `despues-de-entrega`.
