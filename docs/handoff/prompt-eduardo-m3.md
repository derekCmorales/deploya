# Prompt · M3-01 + M3-02 para Eduardo (lista, alta y Desplegar contra el motor)

> **Para Eduardo:** pega este archivo completo como primer mensaje a tu agente (Claude Code, Cursor, Copilot) dentro del repo `derekCmorales/deploya`, con `main` actualizado (después de mergear los PR #7 y #8 de Derek). Trae el contrato del motor, qué llamar y cómo, qué hacer mientras no hay sesión y las pruebas mínimas. Si algo del contrato no te cuadra, **no lo cambies en silencio**: escríbele a Derek (cambiar un contrato exige avisar antes de mergear).
>
> Fuentes en el repo: [docs/contratos/despliegues.md](../contratos/despliegues.md) (v1) y [docs/contratos/datos-nucleo.md](../contratos/datos-nucleo.md). Si difieren de este archivo, manda el repo.

---

## Rol y objetivo

Eres el agente de Eduardo (@Portillo17e), dueño de **M3 Proyectos**, **M7 Observabilidad** y de `apps/web` (design system v4.1). Entregas dos historias del **Avance 1 (30 %)**:

| Id | Historia | Pantallas | Terminado cuando |
|---|---|---|---|
| **M3-01** (3 pts) | Lista de proyectos y primer proyecto; búsqueda; contador contra `cuotaDe`; estado por polling cada 3 s | 10, 10b | Con 0 proyectos se ve 10b; en Sandbox «Nuevo proyecto» se bloquea al llegar a 1 |
| **M3-02** (5 pts) | Alta: URL, rama, nombre, puerto desde `EXPOSE`; errores de 11e; Revisar y **Desplegar** llama al motor | 11a, 11d, 11e | Repo privado y repo sin `Dockerfile` muestran 11e; uno válido queda **Encolado** y la lista lo ve avanzar |

**Plazo:** martes 29 a las 20:00 todo en `main`. El ensayo es a las 21:00.

**Qué presentas el miércoles:** 10b vacío → alta con `https://github.com/derekCmorales/hola-deploya` → los dos errores de 11e → Desplegar → la lista pasando a Saludable por polling.

## Antes de escribir código (en este orden)

1. `AGENTS.md` y `CLAUDE.md` (nunca a `main`, Conventional Commits, OpenSpec primero, puertos `abstract class` sin `I`).
2. `docs/alcance.md` (M3 y M7) y `docs/plan-avances.md` (sección Eduardo).
3. `openspec/specs/proyectos/spec.md` y `openspec/specs/observabilidad/spec.md`.
4. `docs/ingenieria.md` (SOLID, clean code, patrones; §5.3 tus pruebas mínimas).
5. **Diseño (obligatorio antes de cualquier pantalla):** `docs/diseno/README.md`, `docs/diseno/guia-construccion.md` y las fichas `docs/diseno/pantallas/10-Proyectos.md`, `10b-Proyectos-vacio.md`, `11a-Nuevo-fuente.md`, `11d-Nuevo-revisar.md`, `11e-Nuevo-errores.md`. Nada de hex, otra paleta, otro shell ni otros iconos; solo componentes de `apps/web/src/components` (catálogo en `/sistema`).
6. `docs/contratos/despliegues.md` (lo que sigue es su resumen).

## Rama, change y commits

- Rama `feat/m3-alta-proyecto` desde `main`. Si prefieres dos PR: `feat/m3-lista-proyectos` (M3-01) y `feat/m3-alta-proyecto` (M3-02).
- `/opsx-propose feat/m3-alta-proyecto`. En el `design.md`, la sección **«Diseño: SOLID y patrones»**: `ProveedorFuente` como Adapter a GitHub, parser de `EXPOSE` como función pura, `ProyectosService` que llama al motor por su contrato, hooks `useProyectos` y `useDespliegue` (Container / Presentational). En `tasks.md`, una tarea de pruebas por cada tarea de código.
- Commits: `feat(m3): …`. PR con la plantilla; Derek revisa lo que toca el motor.

---

## El contrato del motor (lo que ya existe en `main` tras el PR #8)

### Servicio interno (M3 → M4) — lo llamas desde tu backend

`ConstruccionModule` exporta `ConstruccionService`. Importa `ConstruccionModule` en `ProyectosModule` e inyecta el servicio en tu `ProyectosService`:

```ts
import { ConstruccionModule } from "../construccion/construccion.module";
import { ConstruccionService } from "../construccion/construccion.service";

// 1) Después de persistir el proyecto en POST /proyectos:
const despliegue = await this.construccion.crearDespliegue(proyecto.id, "alta");
//    → { id, numero: 1, estado: "encolado" }

// 2) Para GET /proyectos (lista, pantalla 10): el último despliegue de cada proyecto
const ultimos = await this.construccion.ultimosDespliegues(proyectos.map((p) => p.id));
//    → { [proyectoId]: { id, numero, estado, etapas: [{ nombre, estado, duracionMs }], creado } }
//    Los proyectos que nunca se desplegaron no vienen: ultimoDespliegue = null.
```

`crearDespliegue` lanza `ProyectoNoEncontrado` si el motor no encuentra el proyecto. **No importes nada interno del motor más allá de `ConstruccionModule` y `ConstruccionService`**; el resto es suyo.

### HTTP que consume la web

```text
GET  /despliegues/:id
  → 200 { id, numero, proyectoId, estado, disparador,
          commit: { sha, mensaje, rama, autor } | null,
          url: string | null,
          imagen: { numero, digest, tamanoBytes, receta } | null,
          recursos: { cpus, memoriaMb } | null,
          codigoSalida: number | null, motivoFallo: string | null,
          creado, terminado,
          etapas: [{ nombre: "recepcion" | "construccion" | "ejecucion" | "enrutamiento" | "operacion",
                     estado: "pendiente" | "en-curso" | "completada" | "fallida" | "omitida",
                     duracionMs: number | null }] }   // siempre las cinco, en orden

GET  /despliegues/:id/bitacora?desde=<n>
  → 200 { lineas: [{ n, marca, etapa, texto, nivel: "info" | "aviso" | "error" }],
          siguiente: number, terminado: boolean }

POST /proyectos/:id/despliegues   → 201 { id, numero, estado }   // «Redesplegar», no lo necesitas en A1
```

- `estado` usa los mismos valores que `apps/web/src/components/deploya/estados.ts` (`ESTADOS_DESPLIEGUE`).
- `etapas[].estado` entra directo en `RielEtapas` (`etapas={vista.etapas.map((e) => e.estado)}`).
- `marca` llega en ISO 8601 con milisegundos; `Bitacora` espera `HH:mm:ss.SSS`: formatéala con una función pura probada.
- Polling: `desde` es el último `n` recibido (0 al empezar); pregunta cada 3 s mientras `terminado` sea `false`.
- Errores: 404 si el despliegue no existe o no es del usuario; 400 si `desde` no es un entero ≥ 0; 401 sin sesión.

### Sesión, mientras Eddy no publica el guard (martes 12:00)

- **Tu backend** (`POST /proyectos`, `GET /proyectos`) llama al servicio directo: no pasa por el guard del motor. Usa el usuario del seed (`cliente@deploya.app`) como dueño mientras tanto, como dice tu hoja del canvas.
- **Las rutas HTTP del motor** leen `request.usuario.id`. En desarrollo (`pnpm dev:api`, sin `NODE_ENV=production`) define `USUARIO_DESARROLLO=<id de cliente@deploya.app>` en `.env` y responden como ese usuario. En compose (`NODE_ENV=production`) responden 401 hasta que llegue el guard de Eddy.
- Cuando Eddy suba `SesionGuard` y `@UsuarioActual()`, cambia tu backend para usarlos y borra `USUARIO_DESARROLLO` de tu `.env`.
- Cookies: la sesión de Eddy es la cookie `deploya_sesion`. Los `fetch` de la web van con `credentials: "include"`; si CORS bloquea la cookie (web en :3000, API en :3001), avísale a Eddy o a Derek: se ajusta `enableCors` en `main.ts`.

### Datos del proyecto que el motor necesita (schema de Javier, DB-01)

El motor lee del proyecto `id`, `usuarioId`, `subdominio`, `urlRepositorio`, `rama`, `rutaDockerfile` y `puertoInterno` (ver `Proyecto` en `docs/contratos/datos-nucleo.md`). Tu alta debe guardar:

- `subdominio`: derivado del nombre al crear (minúsculas, `[a-z0-9-]`, sin guion al inicio ni al final, máx. 63), **único** e **inmutable** (renombrar no lo cambia). Si choca, 409 con un mensaje para 11a. Traefik rechaza cualquier subdominio que no sea una etiqueta DNS válida.
- `urlRepositorio`: `https://github.com/<dueño>/<repo>` (el motor solo clona https públicos).
- `rama` (por defecto `main`), `rutaDockerfile` (por defecto `Dockerfile`), `puertoInterno` (del `EXPOSE`, por defecto 8080).

---

## Qué construir

### Backend M3 (`apps/api/src/modules/proyectos`)

Rutas de tu hoja E1-03:

```text
GET  /proyectos                              → [{ id, nombre, subdominio, rama, urlRepositorio, creado, ultimoDespliegue | null }]
                                               + { usados, maximo } para el contador (maximo = cuotaDe(usuarioId).maxProyectos)
POST /proyectos/validar-repositorio { url, rama? } → { accesible, ramas, commit: { sha, mensaje, autor }, dockerfile, puerto }
POST /proyectos { url, rama, nombre, puerto }      → { proyecto, despliegue }
```

- `ProveedorFuente` (`abstract class`, sin `I`) con adaptador `FuenteGitHubPublica` sobre la API pública de GitHub: `repos/:owner/:repo`, `/branches`, `/commits/:rama` y `/contents/Dockerfile?ref=`. El controlador no sabe que existe GitHub. Un 404 o un repo privado → error de dominio `RepositorioNoAccesible` (11e); sin `Dockerfile` → `RepositorioSinDockerfile` (11e, con el ejemplo de la ficha).
- `puertoDesdeExpose(dockerfile): number | null` como función pura (primer `EXPOSE`; varios; ausente → 8080).
- Límite: `cuotaDe(usuarioId).maxProyectos` de Javier (`SuscripcionesService`). En Sandbox con 1 proyecto, `POST /proyectos` responde 409 `limite-proyectos` y la web bloquea «Nuevo proyecto». Si `cuotaDe` no ha llegado a `main`, usa un doble en las pruebas y no constantes en el servicio.
- Mantén `GET /proyectos/health` y su prueba.

### Web (`apps/web/src/app/(projects)`)

- Borra el stub de `/projects` y crea `/projects` (10 / 10b) y `/projects/nuevo` (11a → 11d, con 11e) según las fichas. En 11 el paso *Variables* va deshabilitado con «Llega en la próxima entrega».
- Actualiza `components/shell/nav-panel.tsx` si cambia el `href`.
- **Sin `fetch` en componentes.** Un cliente `lib/api.ts` (base `NEXT_PUBLIC_API_URL`, `credentials: "include"`) y los hooks:
  - `useProyectos()`: `GET /proyectos`, repite cada 3 s mientras algún `ultimoDespliegue` no esté terminado (`saludable`, `fallido`, `cancelado`, `detenido`).
  - `useDespliegue(id)`: `GET /despliegues/:id` + `GET /despliegues/:id/bitacora?desde=n` cada 3 s hasta `terminado: true`, acumulando líneas.
- Lista: `EstadoDespliegue` + `RielEtapas size="sm"` por fila; detalle con `RielEtapas size="lg"`. **Desplegar** (11d) → `POST /proyectos` → vuelve a `/projects` con el nuevo proyecto seleccionado.
- La pantalla 12 completa (riel grande + `Bitacora`) es M7-01 (Avance 2); si te sobra tiempo, `useDespliegue` ya la deja lista.

## Pruebas unitarias mínimas

API (Jest, un `it(...)` por escenario, sin red ni base; `ProveedorFuente`, `ConstruccionService` y `cuotaDe` como dobles):

- `puertoDesdeExpose`: un puerto, varios, ausente.
- Repositorio no accesible y sin `Dockerfile` → los errores de 11e.
- Sandbox con 1 proyecto bloquea el alta.
- `POST /proyectos` persiste y llama a `crearDespliegue(id, "alta")`; responde `{ proyecto, despliegue }` con `estado: "encolado"`.
- `GET /proyectos` arma `ultimoDespliegue` con `ultimosDespliegues` (y `null` para los que no tienen).
- `subdominio` derivado del nombre y rechazo del duplicado.

Web (`node --test` en `apps/web/test/`, lógica pura): formato de `marca` a `HH:mm:ss.SSS`, «¿sigue en curso?» según estado y `terminado`, derivación del subdominio si la muestras en 11a.

`pnpm test` y `pnpm check` en verde antes de pedir revisión.

## Cómo probarlo de punta a punta

1. `docker compose up --build` (API, worker, Traefik, Mailpit, web).
2. Alta con `https://github.com/derekCmorales/hola-deploya`, rama `main` → Desplegar → la lista pasa por Construyendo → Saludable → abre `http://hola-deploya.localhost`.
3. Rama `roto` → termina Fallido con código 127.
4. Un repo que no existe → 11e «no accesible». Rama `sin-dockerfile` → 11e «falta Dockerfile».

El recorrido completo desde la web necesita el schema de Javier (DB-01) y la persistencia Prisma del motor (Derek la conecta el mismo lunes). Antes de eso, prueba con los dobles.

## Coordinación

| Con | Qué |
|---|---|
| Javier | Campos de `Proyecto` y `VariableEntorno` en el schema (ya firmados en `datos-nucleo.md`); `cuotaDe` para el contador |
| Eddy | Guard, `@UsuarioActual()` y la cookie; CORS con credenciales |
| Derek | Si necesitas algo más del motor, pídelo; no edites `construccion`, `orquestacion`, `enrutamiento` ni `adapters` |

## No hagas

- No llames a Docker, git ni Traefik desde M3 ni desde la web: todo pasa por `crearDespliegue`.
- No leas ni escribas las tablas `Despliegue`, `EtapaDespliegue`, `LineaBitacora` ni `Artefacto`: son del motor.
- No inventes estados: usa `ESTADOS_DESPLIEGUE` de `estados.ts`.
- No hagas `fetch` dentro de componentes ni uses colores fuera de los tokens.
- No hagas commits a `main` ni force-push.
