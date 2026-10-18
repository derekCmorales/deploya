# Design

## Context

Depende de `feat/m4-motor-construccion` (pipeline, `PasoRecepcion`, `ConstructorImagenPuerto`); se archiva **después** de ese change porque su delta reemplaza el requisito «Construcción con Dockerfile» ya modificado allí. Decisión de fondo en [ADR 0003](../../../docs/adr/0003-construccion-dockerfile-o-receta.md). Diagrama: [m4-actividad-deteccion-stack.mmd](../../../docs/diagramas/m1-m10/m4-actividad-deteccion-stack.mmd).

## Goals / Non-Goals

**Goals:** cuatro stacks sin `Dockerfile`, el mismo resultado en 11a y en el trabajador, recetas probables sin Docker.

**Non-Goals:** buildpacks, versiones finas, monorepos (ver proposal).

## Decisions

### 1. Recetas puras sobre un mapa de archivos

`DeteccionStackService` pide a `LectorFuente` solo los archivos que las recetas declaran en `archivosQueLee` (unión: `Dockerfile` en `rutaDockerfile`, `package.json`, `requirements.txt`, `pyproject.toml`, `main.py`, `app.py`, `go.mod`, `index.html`), arma un `MapaArchivos` (`ruta → contenido | null`) y prueba las recetas en orden. Las recetas no hacen E/S: se prueban con objetos literales.

```ts
export abstract class RecetaStack {
  abstract readonly receta: RecetaConstruccion;
  abstract readonly archivosQueLee: readonly string[];
  abstract reconoce(archivos: MapaArchivos): boolean;
  abstract describir(archivos: MapaArchivos): { descripcion: string; evidencia: string[] };
  abstract dockerfile(archivos: MapaArchivos): string | null;   // null: usar el del repo
  abstract puertoSugerido(archivos: MapaArchivos): number;
}
```

El orden vive en un solo lugar: el provider `RECETAS_STACK = [RecetaDockerfile, RecetaNode, RecetaPython, RecetaGo, RecetaEstatica]`.

### 2. Plantillas de Dockerfile

| Receta | Imagen base | Construcción | Arranque |
|---|---|---|---|
| `node` | `node:22-alpine` | `npm ci` (o `npm install` sin lockfile); `npm run build` si existe el script | `npm start`, `ENV PORT=8080` |
| `python` | `python:3.12-slim` | `pip install --no-cache-dir -r requirements.txt` (o `pip install .`) | `gunicorn -b 0.0.0.0:8080 main:app` si `gunicorn` está en requisitos; si no, `python main.py` (o `app.py`) |
| `go` | `golang:1.23-alpine` → `gcr.io/distroless/static` | `CGO_ENABLED=0 go build -o /app` | `/app`, `ENV PORT=8080` |
| `estatica` | `nginxinc/nginx-unprivileged:alpine` | copia la raíz a `/usr/share/nginx/html` | escucha en 8080 sin root |

Todas corren como usuario sin privilegios (`USER node`, `USER 10001`, distroless `nonroot`, imagen unprivileged), lo que encaja con `CapDrop: ALL` de M5. Las plantillas son constantes de texto en `deteccion/plantillas.ts`, no archivos sueltos.

### 3. Dónde corre

- **Alta (11a):** M3 construye un `LectorFuenteGitHub` (API pública `contents`) y llama a `detectar`. Si lanza `StackNoReconocido`, 11e.
- **Trabajador:** `PasoRecepcion` usa `LectorFuenteLocal` sobre el clon; escribe `Dockerfile.deploya` cuando la receta no es `dockerfile`, guarda `Proyecto.receta` y pasa `rutaDockerfile` a `PasoConstruccion`.

Se detecta otra vez en cada despliegue: si el cliente agrega un `Dockerfile` después, manda desde el siguiente.

## Diseño: SOLID y patrones

| Clase / puerto | Patrón | Principio | Por qué |
|---|---|---|---|
| `RecetaStack` y sus 5 recetas | Strategy | O, L | Un stack nuevo es una clase; `RecetaDockerfile` es una receta más, sin `if` especial |
| `DeteccionStackService` | Chain of Responsibility (primera que reconoce) | S | Solo orquesta lectura y orden |
| `LectorFuente` → `LectorFuenteLocal`, `LectorFuenteGitHub` | Adapter | D, I | Dos métodos (`existe`, `leer`); la misma detección en dos lugares |
| `StackNoReconocido` | Error de dominio | — | M3 lo traduce a 11e; el trabajador, a Fallido |

Cambios de clases: `RecetaStack`, recetas, `LectorFuente` y `DeteccionStackService`, ya en `clases-unificado.mmd`. Enum `RecetaConstruccion` en el ERD.

## Risks / Trade-offs

- **Límite de la API de GitHub (60 peticiones por hora sin token).** El alta lee hasta 8 archivos; con `GITHUB_TOKEN` opcional sube a 5 000. Se cachea por `url@rama` durante 60 s.
- **Recetas que no arrancan** (por ejemplo, `npm start` que escucha en otro puerto): la salud de 60 s lo convierte en Fallido con motivo; la bitácora sugiere leer `PORT`.
- **Toca la spec de Eduardo** (`proyectos`): este delta se acuerda con él antes de mergear.

## Open Questions

- ¿`GITHUB_TOKEN` en el VPS? Propuesta: sí, solo lectura de repos públicos.
