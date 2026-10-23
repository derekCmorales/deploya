import { DOCKERFILE_GENERADO, PUERTO_RECETAS, VERSION_GO, VERSION_NODE, VERSION_PYTHON } from "./deteccion.constantes";

/**
 * Bases del `Dockerfile.deploya` (ADR 0003): solo lo propio de cada stack. El puerto 8080 y el
 * `USER` final sin privilegios los agregan las capas de `capas/` (Decorator), no las plantillas.
 */
const lineas = (...partes: (string | null)[]): string[] => partes.filter((parte): parte is string => parte !== null);

export interface OpcionesNode {
  conLockfile: boolean;
  conBuild: boolean;
}

/** Node fija `USER node` antes de instalar, para que `node_modules` sea del usuario sin privilegios. */
export function plantillaNode({ conLockfile, conBuild }: OpcionesNode): string[] {
  return lineas(
    `FROM node:${VERSION_NODE}-alpine`,
    "WORKDIR /app",
    "RUN chown node:node /app",
    "USER node",
    "COPY --chown=node:node . .",
    conLockfile ? "RUN npm ci" : "RUN npm install",
    conBuild ? "RUN npm run build" : null,
    "ENV NODE_ENV=production",
    'CMD ["npm", "start"]',
  );
}

export interface OpcionesPython {
  instalacion: "requirements" | "pyproject";
  modulo: "main" | "app";
  conGunicorn: boolean;
}

export function plantillaPython({ instalacion, modulo, conGunicorn }: OpcionesPython): string[] {
  const arranque = conGunicorn ? `CMD ["gunicorn", "-b", "0.0.0.0:${PUERTO_RECETAS}", "${modulo}:app"]` : `CMD ["python", "${modulo}.py"]`;
  return lineas(
    `FROM python:${VERSION_PYTHON}-slim`,
    "ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1",
    "WORKDIR /app",
    "COPY . .",
    instalacion === "requirements" ? "RUN pip install --no-cache-dir -r requirements.txt" : "RUN pip install --no-cache-dir .",
    arranque,
  );
}

export function plantillaGo(): string[] {
  return lineas(
    `FROM golang:${VERSION_GO}-alpine AS construccion`,
    "WORKDIR /src",
    "COPY . .",
    "RUN CGO_ENABLED=0 go build -o /app .",
    "FROM gcr.io/distroless/static:nonroot",
    "COPY --from=construccion /app /app",
    'ENTRYPOINT ["/app"]',
  );
}

/**
 * `nginx-unprivileged` ya escucha en 8080; se quitan `.git` y la receta del sitio publicado.
 * Termina en `USER root`: la capa de usuario es la que la deja sin privilegios.
 */
export function plantillaEstatica(): string[] {
  const raiz = "/usr/share/nginx/html";
  return lineas(
    "FROM nginxinc/nginx-unprivileged:alpine",
    `COPY . ${raiz}`,
    "USER root",
    `RUN rm -rf ${raiz}/.git ${raiz}/${DOCKERFILE_GENERADO}`,
  );
}
