# Design

## Context

M6-02 dejó `docker-compose.vps.yml`, Traefik con DNS-01 y `desplegar-vps.sh`. `ConfiguracionInstalacion` guarda el hash del código (`feat-m2-modo-autoalojado`).

## Decisions

### 1. El riel también en el instalador

Cinco etapas con el mismo vocabulario que un despliegue; cada una comprueba, aplica y registra en `~/.deploya/estado`.

### 2. Sin comodín como salida

Si el proveedor DNS no está soportado, `--sin-comodin` usa certificados por proyecto (HTTP-01).

### 3. El instalador escribe el hash, no el código

El código en claro se imprime una vez y no se guarda. `sha256` hex y `codigoVence` (ahora + 30 min) van a `.env` como `HASH_CODIGO_CONFIGURACION` y `CODIGO_VENCE`. El servicio `migracion` los recibe y el seed de autoalojado los copia a `ConfiguracionInstalacion` (`guardarCodigo`) solo si no hay administrador. `--codigo-nuevo` sustituye el hash: el anterior deja de validar en el acto. Si ya hay administrador, no cambia nada.

### 4. El seed de autoalojado no crea cuentas

`/configurar` responde 404 cuando ya hay administrador. En autoalojado `usuariosSemilla` devuelve vacío (no exige `ADMIN_CLAVE`). `ADMIN_CLAVE` sigue en `.env` porque el compose de la nube la exige al interpolar; no se usa para crear la cuenta. Los cuatro planes de la nube siguen sembrándose hasta el plan «Autoalojado» de SP-06.

### 5. Comprobar de verdad

La etapa 2 mira la raíz y un nombre cubierto por el comodín, y de `dig` solo acepta IPv4 (un CNAME no es una IP). La etapa 3 valida el token con la API del proveedor; no dice que Let's Encrypt ya emitió. La etapa 4 reintenta HTTPS (sin `/configurar`, que es de Eddy) hasta leer el certificado. `version.json.disponible` sale de `git fetch --tags`. El respaldo se llama con la hora (`AAAA-MM-DDTHHMMSSZ`) y un cron diario a las 03:00 conserva 7.

### 6. Actualizar es reconstruir, no reiniciar

Las migraciones viajan dentro de la imagen de la API. `actualizar.sh` hace checkout de la etiqueta `disponible` (HEAD separado: la instalación sigue versiones, no una rama), `compose build` de api, web, trabajador y migración, `run --rm migracion` y `up -d --no-deps api web worker`. Un `restart` dejaría las imágenes viejas. Los contenedores de proyecto los crea el trabajador por la API de Docker, así que compose no los conoce y no los toca.

### 7. Sondear como lo ve el usuario

Desde el host, el nombre de un contenedor no resuelve. El sondeo lee la etiqueta `app.deploya.proyecto` (`deploya-p-<subdominio>`) y pide `https://<subdominio>.<DOMINIO_BASE>/`: cualquier respuesta HTTP cuenta; un timeout o un rechazo, no.

### 8. Restaurar sin dejar la base a medias

`pg_dump --clean --if-exists` y `psql -v ON_ERROR_STOP=1 --single-transaction`, siempre con `compose exec postgres` (en el servidor postgres no publica puertos). Restaurar detiene solo api, web y trabajador y los vuelve a subir; `--volver` reconstruye la versión anterior antes de cargar la base.

## Diseño: SOLID y patrones

| Clase / puerto | Patrón | Principio | Por qué |
|---|---|---|---|
| Etapas del instalador | Pipeline | S, O | Cada etapa es una función con comprobar/aplicar |
| `respaldar.sh`, `actualizar.sh` | Command | S | Una operación con su deshacer (`--volver`, `--restaurar`) |
| Proveedor DNS (`proveedores/*.sh`) | Strategy | O | Validar el token es otro archivo, no un `case` nuevo |
| `DestinoSemilla.guardarCodigo` | Repository | S, D | El seed escribe el hash detrás del puerto; la memoria y Prisma cumplen el mismo contrato |

Cambios de clases y puertos: `DestinoSemilla` gana `guardarCodigo` → `docs/diagramas/compartido/clases-unificado.mmd` en el mismo PR (`pnpm diagramas:sync`). La tabla `ConfiguracionInstalacion` es la de `datos-nucleo.md` v2; este change solo escribe `hashCodigo` y `codigoVence`.

## Risks / Trade-offs

- **Entornos distintos:** se prueba en Ubuntu 24.04 y Debian 12; otros quedan documentados como no probados.
