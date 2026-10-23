/** Versiones y rutas fijas de las recetas (ADR 0003: sin detección de versión fina). */
export const RUTA_DOCKERFILE = "Dockerfile";
export const DOCKERFILE_GENERADO = "Dockerfile.deploya";
export const PUERTO_RECETAS = 8080;
export const VERSION_NODE = "22";
export const VERSION_PYTHON = "3.12";
export const VERSION_GO = "1.23";
/** UID sin privilegios de las imágenes que no traen un usuario propio. */
export const UID_SIN_PRIVILEGIOS = 10001;
/** Usuario de `nginxinc/nginx-unprivileged`. */
export const UID_NGINX = 101;
/** Usuario de `gcr.io/distroless/static:nonroot`. */
export const USUARIO_DISTROLESS = "nonroot:nonroot";
export const PISTA_GENERAL = "agrega un Dockerfile en la raíz del repositorio";
