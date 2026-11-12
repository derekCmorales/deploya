# Manual técnico · Deploya v1.0.0 (DOC-03)

Tecnologías, instalación, configuración, despliegue y operación. Tres formas de correr Deploya:

| Modo | Para qué | Archivos de compose | Entorno |
|---|---|---|---|
| **Local** | Desarrollo y demo sin dominio | `docker-compose.yml` | `.env` |
| **VPS de la nube** | La instancia pública del proyecto (`https://<dominio>`) | `docker-compose.yml` + `docker-compose.vps.yml` | `.env.vps` |
| **Autoalojado** | Un servidor propio de quien instala | los dos anteriores + `docker-compose.autoalojado.yml` (y `docker-compose.http01.yml` sin comodín) | `.env` que escribe el instalador |

## 1. Tecnologías

| Capa | Tecnología | Versión |
|---|---|---|
| Lenguaje | TypeScript sobre Node.js | Node 22 |
| Web | Next.js (App Router), React, Tailwind CSS | 15, 19, 4 |
| API y trabajador | NestJS, Prisma | 10, 6 |
| Base de datos | PostgreSQL | 16 |
| Colas | Redis, BullMQ | 7, 6 |
| Contenedores | Docker Engine y Compose | 24+ y 2.24+ |
| Enrutador de borde | Traefik (proveedor de archivo) | 3.3 |
| Certificados | Let's Encrypt (DNS-01 comodín o HTTP-01) | — |
| Correo | SMTP (Mailpit en desarrollo) | — |
| Monorepo y pruebas | pnpm workspaces, Jest, `node --test`, shellcheck, gitleaks | pnpm 9.15 |
| Especificación | OpenSpec | — |

Arquitectura y decisiones: [diseno-final.md](diseno-final.md).

## 2. Local (desarrollo y demo)

Requisitos: Docker con Compose 2.24 o más. Node 22 y pnpm 9 solo para correr pruebas fuera de Docker.

```bash
cp .env.example .env
```

Pon `ADMIN_CLAVE` (obligatoria; contraseña del administrador del seed) y, si vas a crear proyectos seguido, `GITHUB_TOKEN` (un token sin permisos: sin él GitHub permite 60 peticiones por hora por IP).

```bash
docker compose up -d --build
```

| Servicio | Dirección |
|---|---|
| Web | <http://localhost:3000> |
| API | <http://localhost:3001/health> |
| Correos (Mailpit) | <http://localhost:8025> |
| Apps desplegadas | `http://<proyecto>.localhost` |

El servicio `migracion` aplica las migraciones y el seed antes de que arranquen la API y el trabajador: 4 planes, `admin@deploya.app` y las cuentas de demo `cliente@`, `demo@`, `vencida@` y `suspendida@` (con `CLIENTE_CLAVE`).

Pruebas:

```bash
pnpm install --frozen-lockfile
```

```bash
pnpm --filter @deploya/api exec prisma generate
```

```bash
pnpm check
```

`pnpm check` corre las pruebas de la API, de la web y de los scripts, el build y la validación de diagramas. Con el compose arriba, `pnpm test:smoke` y `pnpm test:recorrido` corren el smoke y el recorrido e2e de QA-01 (`MAILPIT_URL` y `ADMIN_CLAVE` en el entorno para todos los pasos).

## 3. VPS de la nube (producción)

### 3.1 Una sola vez

El servidor de producción es una **EC2 `m7i-flex.large` en AWS** (2 vCPU, 8 GB; us-east-2, Ubuntu 24.04) creada con Terraform: [infra/terraform/](../../infra/terraform/README.md), decisión y costos en el [ADR 0009](../adr/0009-piloto-en-aws-ec2-con-terraform.md). `docker-compose.vps.yml` es el compose de producción; «vps» es solo el nombre del archivo. `terraform apply` deja Docker, el usuario `deploya`, el clon en `/srv/deploya`, `/var/backups/deploya` y el cron de §3.5; `terraform output siguientes_pasos` imprime lo que falta. Ningún secreto pasa por Terraform.

| Qué | Cómo |
|---|---|
| Servidor | `cd infra/terraform && terraform apply` (EC2 con 80 y 443 abiertos, administración por SSM sin puerto 22). En otro proveedor, a mano: Ubuntu 24.04, 2 vCPU y 4 GB o más, Docker Engine y Compose 2.24 o más, usuario sin root en el grupo `docker`, firewall con 80 y 443 |
| DNS | Registros A de `<dominio>` y de `*.<dominio>` hacia la IP del servidor |
| Token DNS | Cloudflare: *API Token* con `Zone · DNS · Edit` solo sobre la zona. Con otro proveedor, cambia `provider` en [traefik.vps.yml](../../infra/traefik/traefik.vps.yml) y la variable del token en [docker-compose.vps.yml](../../docker-compose.vps.yml) |
| Correo | Resend con el dominio verificado: SPF, DKIM y DMARC. Pasos en [correo-produccion.md](../correo-produccion.md) |
| Código | Lo clona cloud-init en `/srv/deploya`. A mano: `git clone https://github.com/derekCmorales/deploya.git` en el servidor |
| Entorno | `cp .env.vps.example .env.vps`, rellenarlo y `chmod 600 .env.vps`; a la EC2 se copia por SSM ([infra/terraform/README.md](../../infra/terraform/README.md#flujo)). **Nunca se sube** |

### 3.2 Variables de `.env.vps`

| Variable | Obligatoria | Qué es |
|---|---|---|
| `DOMINIO_BASE` | Sí | Dominio base (`deploya.larasolutions.dev`): la API en `api.<dominio>`, cada proyecto en `<proyecto>.<dominio>` |
| `HOST_WEB` | No | Host de la web. En la nube `app.<dominio>`, porque la raíz es la landing en CloudFront ([ADR 0011](../adr/0011-landing-en-s3-y-cloudfront.md)); sin valor, la raíz |
| `URL_LANDING` | No | URL de la landing (`https://<dominio>`): a dónde lleva la web a quien entra a `/` sin sesión; sin valor, a `/ingresar` |
| `ACME_CORREO` | Sí | Correo de la cuenta de Let's Encrypt |
| `CF_DNS_API_TOKEN` | Sí | Token del proveedor DNS, solo sobre la zona |
| `POSTGRES_USER`, `POSTGRES_DB` | Sí | Usuario y base (`deploya`) |
| `POSTGRES_PASSWORD` | Sí | Contraseña de PostgreSQL |
| `CLAVE_CIFRADO_VARIABLES` | Sí | **32 bytes exactos.** Cifra las variables de los proyectos. Si se pierde, esos valores quedan ilegibles: guárdala fuera del servidor |
| `ADMIN_CORREO`, `ADMIN_CLAVE` | Sí | Administrador del seed |
| `CLIENTE_CLAVE` | Sí | Contraseña de las cuentas de demo; distinta de `ADMIN_CLAVE` |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USUARIO`, `SMTP_CLAVE` | Sí (usuario y clave según el proveedor) | Servidor de correo |
| `CORREO_REMITENTE` | Sí | `"Deploya <no-responder@<dominio verificado>>"` |
| `GITHUB_TOKEN` | Recomendada | Token sin permisos para la API de GitHub |

Las fija el propio compose (no van en `.env.vps`): `PROXIES_DE_CONFIANZA=1` (la IP real del cliente para el límite de intentos), `ESQUEMA_PUBLICO=https`, `CERT_RESOLVER=letsencrypt` y la URL de la API horneada en la web.

### 3.3 Publicar

```bash
scripts/desplegar-vps.sh
```

Es idempotente: `git pull --ff-only` de `main` (o de `RAMA=…`), genera `infra/traefik/plataforma.generada.yml` con el dominio, construye y levanta con `docker compose --env-file .env.vps -f docker-compose.yml -f docker-compose.vps.yml up -d --build`, repite migraciones y seed y espera a la API.

En producción todos los servicios llevan `restart: unless-stopped` (vuelven solos tras un reinicio del servidor) y sus logs rotan en 3 archivos de 10 MB. Los contenedores de los proyectos también llevan `unless-stopped`.

### 3.4 Comprobar

```bash
curl -I https://api.<dominio>/health
```

```bash
curl -I https://algo.<dominio>
```

```bash
curl -I http://hola-deploya.<dominio>
```

```bash
echo | openssl s_client -connect <dominio>:443 -servername x.<dominio> 2>/dev/null | openssl x509 -noout -subject -enddate
```

Esperado: 200 con el certificado `*.<dominio>`; 404 de Traefik pero con el mismo certificado; 301 hacia `https`; y el sujeto del comodín con su vencimiento. Después, el recorrido del motor (L7):

```bash
API_URL=https://api.<dominio> CORREO=cliente@deploya.app CLAVE='<CLIENTE_CLAVE>' PROYECTO=hola-deploya node e2e/vps.mjs
```

Despliega y espera Saludable con HTTPS, revierte a la primera imagen y vuelve sin reconstruir, y cancela un despliegue en Construyendo.

### 3.5 Operación diaria (cron del servidor)

`/etc/cron.d/deploya` (en la EC2 lo instala Terraform con el dominio ya puesto; a mano, cambia `/srv/deploya` por la ruta del clon y `deploya` por el usuario):

```text
# Respaldo diario a las 03:00 (guarda 7) con los compose del VPS
0 3 * * * deploya cd /srv/deploya && DEPLOYA_ENV=/srv/deploya/.env.vps DEPLOYA_ARCHIVOS_COMPOSE="docker-compose.yml docker-compose.vps.yml" scripts/respaldar.sh >> /var/log/deploya-respaldo.log 2>&1
# Imágenes sin uso, cada domingo (las de las versiones guardadas siguen en uso por sus artefactos)
30 4 * * 0 deploya docker image prune -f >> /var/log/deploya-prune.log 2>&1
# Caché de BuildKit de más de 7 días, cada domingo: no toca imágenes, solo capas de construcción
45 4 * * 0 deploya docker builder prune -f --filter until=168h >> /var/log/deploya-prune.log 2>&1
# Salud de la API cada 5 min: deja una línea en el log del sistema si falla
*/5 * * * * deploya curl -fsS --max-time 10 https://api.<dominio>/health > /dev/null || logger -t deploya "api.<dominio>/health no responde"
```

Los respaldos quedan en `/var/backups/deploya` (`DEPLOYA_RESPALDOS` para otra ruta): volcado de PostgreSQL, entorno **sin** la clave de cifrado y manifiesto. Restaurar uno:

```bash
DEPLOYA_ENV=.env.vps DEPLOYA_ARCHIVOS_COMPOSE="docker-compose.yml docker-compose.vps.yml" scripts/respaldar.sh --restaurar AAAA-MM-DD
```

Las tareas diarias de la aplicación corren solas en el trabajador: ciclo de la suscripción a las 00:05 UTC y limpieza de tokens, sesiones e invitaciones vencidas a las 00:35 UTC.

## 4. Autoalojado (servidor propio)

Requisitos que comprueba la primera etapa: Docker 24+, Docker Compose v2, `curl`, `dig` y `openssl`; DNS de `<dominio>` y `*.<dominio>` hacia el servidor.

```bash
git clone https://github.com/derekCmorales/deploya.git && cd deploya
```

```bash
./scripts/instalar.sh
```

Etapas: requisitos → dominio → certificado → servicios → administrador. Pregunta el dominio, el correo de Let's Encrypt y el token DNS; genera `.env` (modo 600) con claves aleatorias; levanta todo y muestra un **código de configuración** para el asistente `https://<dominio>/configurar` (pantalla 31), donde se crea el administrador y se configura el correo.

| Opción | Para qué |
|---|---|
| `--sin-comodin` | Sin token DNS: certificado por HTTP-01 para cada subdominio |
| `--continuar` | Retomar desde la etapa que falló |
| `--codigo-nuevo` | Otro código de configuración si venció (30 min) |

Actualizar y respaldar (el instalador deja el respaldo diario en cron):

```bash
./scripts/actualizar.sh
```

```bash
./scripts/actualizar.sh --volver
```

```bash
./scripts/respaldar.sh --restaurar AAAA-MM-DD
```

`actualizar.sh` respalda antes de actualizar a la última etiqueta; `--volver` restaura ese respaldo si la migración falló. Contrato completo: [contratos/instalacion.md](../contratos/instalacion.md).

## 5. Problemas comunes

| Síntoma | Causa y solución |
|---|---|
| Traefik sirve su certificado por defecto | `docker compose … logs traefik`: errores de ACME. Token sin permiso sobre la zona, registros A sin propagar o límite de Let's Encrypt |
| `certificado: null` en 12b con HTTPS activo | `acme.json` todavía vacío, o la API sin el volumen `traefik_acme` en solo lectura |
| 502 al abrir un proyecto | El contenedor no está en la red del proyecto: log del trabajador |
| El correo no llega | `SMTP_*` y el dominio verificado en el proveedor; la API registra el fallo de envío. En local, mira Mailpit |
| La web llama a `localhost:3001` | La imagen de la web se construyó sin los `build.args` del VPS: `up -d --build web` con `.env.vps` |
| «No pudimos acceder al repositorio» al validar | Límite de la API de GitHub agotado: define `GITHUB_TOKEN` |
| 429 «Demasiados intentos» para todos | La API no ve la IP real: `PROXIES_DE_CONFIANZA` debe ser `1` detrás de Traefik (lo pone `docker-compose.vps.yml`) |
| Los servicios no volvieron tras reiniciar el servidor | Se levantaron sin `docker-compose.vps.yml` (sin `restart`): vuelve a correr `scripts/desplegar-vps.sh` |
| Variables de un proyecto ilegibles tras restaurar | Se restauró con otra `CLAVE_CIFRADO_VARIABLES`: el respaldo no la guarda a propósito |
| Disco lleno | `docker system df`; `docker image prune -f`; revisa `/var/backups/deploya` |

Guía corta de operación del VPS: [infra-vps.md](../infra-vps.md). Lanzamiento y versión: [lanzamiento.md](lanzamiento.md).
