# Manual técnico

## Introducción

Este manual explica **cómo se instala, se configura, se despliega y se opera Deploya**. Está escrito para tres lectores:

- **Quien evalúa o prueba el proyecto** y quiere levantarlo en su computadora con un comando (capítulo 3).
- **Quien opera el servidor** de la nube de Deploya: publicar una versión, respaldar, vigilar (capítulos 5 y 7).
- **Quien instala Deploya en su propio servidor** con el modo autoalojado (capítulo 6).

> [!NOTE]
> Todos los comandos se corren desde la raíz del repositorio (`github.com/derekCmorales/deploya`) salvo que se diga otra cosa. Los nombres de archivos y variables son los reales del repositorio.

## Tecnologías utilizadas

### Stack

| Capa | Tecnología | Versión | Para qué |
|---|---|---|---|
| Lenguaje | TypeScript | 5.7 | Todo el sistema: API, trabajador y web |
| Entorno | Node.js | 22 | Ejecución de la API, el trabajador y la web |
| Gestor de paquetes | pnpm (workspaces) | 9.15 | Monorepo `apps/api`, `apps/web`, `e2e` |
| Backend | NestJS | 10.4 | Módulos, inyección de dependencias, guards, filtros |
| ORM y migraciones | Prisma | 6.5 | Esquema, cliente tipado, migraciones versionadas |
| Base de datos | PostgreSQL | 16 | Almacén único de la plataforma |
| Cola | Redis + BullMQ | 7 · 6.3 | Cola de despliegues, de operación y de muestreo |
| Contenedores | Docker Engine + `dockerode` | 24+ · 5.0 | Construir imágenes y correr las apps de los clientes |
| Enrutador de borde | Traefik | 3.3 | Rutas por archivo, HTTPS comodín, redirección |
| Certificados | Let's Encrypt (DNS-01) | — | Certificado `*.dominio` renovado solo |
| Correo | nodemailer + proveedor SMTP | 6.10 | Resend o Brevo en el VPS, Mailpit en desarrollo |
| PDF | PDFKit | 0.17 | Comprobantes de pago |
| Frontend | Next.js + React | 15 · 19 | Panel del cliente y del administrador |
| Estilos | Tailwind CSS + tokens OKLCH | 4.3 | Design system v4.1 |
| Componentes | Radix UI, Lucide, Framer Motion | — | Accesibilidad, iconos y movimiento |
| Pruebas | Jest, `@nestjs/testing`, `node --test` | 29 · — | Unitarias de API y de lógica web |
| CI | GitHub Actions, gitleaks, shellcheck | — | Pruebas, secretos y scripts en cada PR |
| Especificación | OpenSpec | — | Un change por historia: propuesta, diseño, spec y tareas |

### Estructura del repositorio

| Carpeta | Contenido |
|---|---|
| `apps/api/` | API NestJS y trabajador (`src/main.ts` y `src/trabajador.ts`), `prisma/` con esquema, migraciones y *seed* |
| `apps/api/src/modules/` | Los diez módulos: `identidad`, `suscripciones`, `proyectos`, `construccion`, `orquestacion`, `enrutamiento`, `observabilidad`, `herramientas`, `administracion`, `notificaciones` |
| `apps/api/src/adapters/` | Adaptadores reales (`reales/`), en memoria (`memoria/`), Prisma (`prisma/`) y *stubs* |
| `apps/web/` | Next.js: rutas por grupo (`(auth)`, `(billing)`, `(projects)`, `(admin)`, `(cuenta)`), componentes y tokens |
| `e2e/` | *Smoke* y recorrido de punta a punta |
| `infra/traefik/` | Configuración estática de Traefik para local y VPS |
| `scripts/` | `instalar.sh`, `actualizar.sh`, `respaldar.sh`, `desplegar-vps.sh` y sus etapas en `lib/` |
| `openspec/` | Specs por módulo y changes archivados |
| `docs/` | Alcance, ADR, contratos, diagramas, design system y esta documentación |

## Instalación local

### Requisitos

| Para | Necesitas |
|---|---|
| Levantar todo con Docker (recomendado) | Docker con Compose v2 y 4 GB de RAM libres |
| Desarrollar fuera de Docker | Además, Node.js 22 y pnpm 9 (`corepack enable`) |
| Generar esta documentación en PDF | Node.js 22 y Chromium (lo instala Playwright) |

### Levantar la plataforma con un comando

```bash
git clone https://github.com/derekCmorales/deploya.git
cd deploya
cp .env.example .env
# Edita .env y define ADMIN_CLAVE (obligatoria)
docker compose up --build
```

Compose arranca en orden: `postgres` y `redis` (con *healthcheck*), luego `migracion` (aplica las migraciones y el *seed*, y termina), luego `api`, `worker`, `traefik`, `mailpit` y `web`.

| Servicio | Dirección |
|---|---|
| Panel web | `http://localhost:3000` |
| API (salud) | `http://localhost:3001/health` |
| Bandeja de Mailpit (correos de verificación y recuperación) | `http://localhost:8025` |
| Apps desplegadas | `http://<proyecto>.localhost` |
| Catálogo del design system | `http://localhost:3000/sistema` |

### Cuentas de demostración

El *seed* es idempotente: se puede correr las veces que haga falta sin duplicar nada ni reescribir contraseñas.

| Cuenta | Rol | Estado para la demo | Contraseña |
|---|---|---|---|
| `admin@deploya.app` (o `ADMIN_CORREO`) | Administrador | Activa | `ADMIN_CLAVE` |
| `cliente@deploya.app` | Cliente | Activa, plan Sandbox | `CLIENTE_CLAVE` (o `ADMIN_CLAVE` si está vacía) |
| `vencida@deploya.app` | Cliente | Starter con la suscripción **Vencida** | Igual que `cliente@` |
| `suspendida@deploya.app` | Cliente | Starter con la suscripción **Suspendida** | Igual que `cliente@` |

> [!TIP]
> Tarjetas de prueba de la pasarela simulada: `4242 4242 4242 4242` aprueba, `4000 0000 0000 0002` rechaza por fondos insuficientes y `4000 0000 0000 3220` tarda 5 segundos. Cualquier fecha futura y cualquier CVC de 3 dígitos.

### Desarrollo fuera de Docker

```bash
pnpm install
docker compose up postgres redis mailpit     # solo la base, la cola y el correo
set -a; . ./.env; set +a
pnpm --filter @deploya/api exec prisma migrate deploy
pnpm --filter @deploya/api prisma:seed
pnpm dev:api                                 # http://localhost:3001 con recarga
pnpm dev:web                                 # http://localhost:3000 con recarga
```

Con `MOTOR_ADAPTADORES=stub` (valor de `.env.example`) el motor corre **en memoria**: los despliegues avanzan por sus etapas sin Docker, útil para trabajar en la interfaz. Con `MOTOR_ADAPTADORES=docker` se usan BullMQ, git, Docker y Traefik reales, y hace falta el `worker`.

## Configuración

Toda la configuración entra por **variables de entorno**. El código no tiene dominios, credenciales ni proveedores escritos: el mismo build corre en local, en el VPS y en autoalojado.

### Variables principales

| Variable | Ejemplo / valores | Para qué |
|---|---|---|
| `DATABASE_URL` | `postgresql://deploya:deploya@localhost:5432/deploya` | Conexión de Prisma |
| `REDIS_URL` | `redis://localhost:6379` | Colas BullMQ |
| `PORT` · `URL_WEB` · `NEXT_PUBLIC_API_URL` | `3001` · `http://localhost:3000` · `http://localhost:3001` | Puertos y enlaces entre web y API (CORS, enlaces de correo) |
| `ADMIN_CORREO` · `ADMIN_CLAVE` · `CLIENTE_CLAVE` | — | Cuentas del *seed*; `ADMIN_CLAVE` es obligatoria |
| `CORREO_ADAPTADOR` | `smtp` · `consola` | Elige el adaptador de correo ([ADR 0001](../adr/0001-correo-por-smtp-configurable.md)) |
| `SMTP_HOST` · `SMTP_PORT` · `SMTP_USUARIO` · `SMTP_CLAVE` · `CORREO_REMITENTE` | `localhost` · `1025` | Servidor SMTP (Mailpit en desarrollo, Resend o Brevo en el VPS) |
| `MOTOR_ADAPTADORES` | `docker` · `stub` | Motor real o en memoria |
| `DOMINIO_BASE` · `ESQUEMA_PUBLICO` · `CERT_RESOLVER` | `localhost` · `http` · vacío | Dónde y cómo se publican las apps; resolvedor vacío = sin TLS |
| `TRABAJADOR_CONCURRENCIA` | `1` | Construcciones simultáneas en el nodo |
| `CLAVE_CIFRADO_VARIABLES` | 32 bytes exactos | Cifrado AES-256-GCM de las variables de los clientes |
| `GITHUB_TOKEN` · `GITHUB_API_URL` | opcional | Sube el límite de 60 peticiones por hora de la API pública |
| `MODO_INSTALACION` | `nube` · `autoalojado` | Elige las estrategias de catálogo, cuotas, registro y primer usuario |
| `NEXT_PUBLIC_DOMINIO_APPS` · `NEXT_PUBLIC_ESQUEMA_APPS` | `localhost` · `http` | La web arma la URL de cada proyecto |

> [!CAUTION]
> Si se pierde `CLAVE_CIFRADO_VARIABLES`, las variables de entorno guardadas de **todos** los proyectos quedan ilegibles y sus despliegues fallan. En el VPS va en el gestor de secretos y fuera de los respaldos.

### Archivos de configuración

| Archivo | Uso |
|---|---|
| `.env.example` → `.env` | Desarrollo local y compose |
| `.env.vps.example` → `.env.vps` | Servidor de la nube: dominio, token DNS, SMTP, secretos. **Nunca se sube al repositorio** |
| `docker-compose.yml` | Servicios base para todos los entornos |
| `docker-compose.vps.yml` | Capa del VPS: HTTPS, certificado comodín, redirección y volúmenes de ACME |
| `docker-compose.http01.yml` | Variante con HTTP-01 para un servidor sin token DNS |
| `docker-compose.autoalojado.yml` | Capa del modo autoalojado |
| `infra/traefik/` | Configuración estática de Traefik; `plataforma.generada.yml` la escribe el script |

## Despliegue en el servidor

### Infraestructura

| Recurso | Requisito |
|---|---|
| Servidor | Ubuntu 24.04 con 2 vCPU y 4 GB, Docker Engine y Compose 2.24 o más, usuario sin root en el grupo `docker` |
| Firewall | Puertos 22, 80 y 443 |
| DNS | Registro A de `<dominio>` y de `*.<dominio>` hacia la IP del servidor |
| Token DNS | Cloudflare: *API Token* con permiso `Zone · DNS · Edit` solo sobre la zona |
| Correo | Resend o Brevo con el dominio verificado (SPF, DKIM y DMARC) |

<!-- diagrama: docs/diagramas/compartido/despliegue-infraestructura.mmd -->
```mermaid
---
title: Despliegue — servicios de docker compose, redes y volúmenes (desarrollo y VPS)
---
flowchart LR
    subgraph HOST["Nodo único · Docker Engine"]
        subgraph RED_INTERNA["red deploya_interna"]
            PG[("postgres:16<br/>:5432 · volumen deploya_pg")]
            RD[("redis:7<br/>:6379")]
            API["api<br/>Dockerfile.api · node dist/main.js<br/>:3001 → 3000"]
            WK["worker<br/>Dockerfile.api · node dist/trabajador.js<br/>git + docker.sock"]
            WEB["web<br/>Dockerfile.web<br/>:3000"]
            MP["mailpit<br/>:1025 SMTP · :8025 UI"]
            TR["traefik:v3<br/>:80 (:443 y redirección 80→443 en el VPS)"]
        end

        subgraph RED_P1["red deploya-p-hola-deploya"]
            C1["deploya-hola-deploya-3<br/>imagen deploya/hola-deploya:3<br/>NanoCpus 0.25e9 · Memory 256 MiB<br/>sin privilegios · CapDrop ALL"]
        end

        subgraph RED_P2["red deploya-p-api-tienda"]
            C2["deploya-api-tienda-14"]
        end

        SOCK["/var/run/docker.sock"]
        VOL["volumen traefik_dinamico<br/>/traefik/dinamico/*.yml"]
        ACME[("volumen traefik_acme<br/>/acme/acme.json · solo VPS")]
    end

    subgraph EXTERNOS["Solo en el VPS (docker-compose.vps.yml)"]
        LE["Let's Encrypt<br/>certificado comodín *.deploya.app"]
        DNS["Proveedor DNS<br/>registros A · desafío DNS-01<br/>token solo de la zona"]
        SMTP["Proveedor SMTP<br/>Resend o Brevo · SPF y DKIM"]
    end

    NAV["Navegador"]

    NAV -->|"localhost:3000"| WEB
    NAV -->|"localhost:3001"| API
    NAV -->|"hola-deploya.localhost"| TR
    NAV -->|"localhost:8025 (sin Mailpit en el VPS)"| MP
    NAV -->|"https://deploya.app · https://api.deploya.app · https://hola-deploya.deploya.app"| TR
    TR -->|"emite y renueva por DNS-01"| LE
    LE -->|"verifica el TXT"| DNS
    TR -->|"escribe"| ACME
    API -->|"lee solo el vencimiento"| ACME
    API -->|"SMTP del proveedor"| SMTP
    API --> PG
    API --> RD
    API -->|SMTP| MP
    WK --> RD
    WK --> PG
    WK --> SOCK
    WK -->|escribe| VOL
    TR -->|"vigila"| VOL
    TR -->|"conectado por el worker"| RED_P1
    TR --> RED_P2
    WK -.->|"salud HTTP · conectado por el worker"| RED_P1

    classDef data fill:#fefce8,stroke:#facc15,stroke-width:2px,color:#713f12
    classDef app fill:#f5f3ff,stroke:#a78bfa,stroke-width:2px,color:#312e81
    classDef cliente fill:#f0fdf4,stroke:#4ade80,stroke-width:2px,color:#166534
    classDef ext fill:#f0f9ff,stroke:#38bdf8,stroke-width:2px,color:#0c4a6e
    class PG,RD,VOL,ACME data
    class API,WK,WEB,MP,TR app
    class C1,C2 cliente
    class SOCK,NAV,LE,DNS,SMTP ext
```

### Primera puesta en marcha

```bash
git clone https://github.com/derekCmorales/deploya.git && cd deploya
cp .env.vps.example .env.vps
# Rellena DOMINIO_BASE, ACME_CORREO, CF_DNS_API_TOKEN, POSTGRES_PASSWORD,
# CLAVE_CIFRADO_VARIABLES (32 bytes), ADMIN_CLAVE, CLIENTE_CLAVE y SMTP_*
scripts/desplegar-vps.sh
```

`desplegar-vps.sh` es **idempotente**: hace `git pull --ff-only` de la rama, genera la ruta de la plataforma para Traefik con el dominio, corre `docker compose --env-file .env.vps -f docker-compose.yml -f docker-compose.vps.yml up -d --build`, repite migraciones y *seed* y espera a que la API responda. Para publicar una rama distinta de `main`: `RAMA=<rama> scripts/desplegar-vps.sh`.

En el VPS la web queda en la raíz del dominio, la API en `api.<dominio>` y cada proyecto en `<proyecto>.<dominio>`.

### Comprobar que quedó

```bash
curl -I https://api.<dominio>/health          # 200 con el certificado *.<dominio>
curl -I https://algo.<dominio>                # 404 de Traefik, pero con el certificado comodín
curl -I http://hola-deploya.<dominio>         # 301 hacia https
echo | openssl s_client -connect <dominio>:443 -servername x.<dominio> 2>/dev/null \
  | openssl x509 -noout -subject -enddate
```

### Integración continua y publicación

<!-- diagrama: docs/diagramas/diseno/integracion-continua.mmd -->
```mermaid
---
title: Integración continua y publicación — de la rama al VPS
---
flowchart LR
    RAMA["Rama<br/>feat/m‹n›-‹slug›"] --> PR["Pull request<br/>plantilla + CODEOWNERS"]
    PR --> CI

    subgraph CI["GitHub Actions · ci.yml"]
        direction TB
        J1["Build y pruebas<br/>pnpm test · pnpm build<br/>validate:mermaid"]
        J2["Secretos<br/>gitleaks sobre todo el historial"]
        J3["Scripts<br/>shellcheck del instalador"]
        J4["Smoke compose<br/>docker compose up · e2e/smoke.mjs"]
    end

    CI --> REV{"¿Verde y<br/>aprobado?"}
    REV -- "No" --> RAMA
    REV -- "Sí" --> MAIN["main"]
    MAIN --> ARCH["/opsx-archive<br/>el spec delta pasa al spec del módulo"]
    MAIN --> VPS["scripts/desplegar-vps.sh<br/>git pull · compose up --build<br/>migraciones · seed · espera health"]
    VPS --> OK["https://‹dominio›<br/>en línea"]

    classDef success fill:#e3efe9,stroke:#00784f,stroke-width:1.5px,color:#1a1510
    classDef decision fill:#f4ebdf,stroke:#945a00,stroke-width:1.5px,color:#1a1510
    class OK success
    class REV decision
```

| Job de CI | Qué comprueba |
|---|---|
| **Build y pruebas** | `pnpm install --frozen-lockfile`, `prisma generate`, `pnpm test`, `pnpm build`, `pnpm validate:mermaid` |
| **Secretos (gitleaks)** | Ningún secreto en todo el historial del repositorio público |
| **Scripts (shellcheck)** | `instalar.sh`, `respaldar.sh`, `actualizar.sh` y sus etapas |
| **Smoke compose** | `docker compose up --build`, espera la salud y corre `e2e/smoke.mjs` |

## Modo autoalojado

Deploya es de código abierto (AGPL-3.0) y se instala en un servidor propio. En autoalojado no hay cobro: un único plan «Autoalojado» sin vencimiento, límites por proyecto que fija el administrador y registro abierto, con invitación o cerrado ([ADR 0008](../adr/0008-autoalojado-y-codigo-abierto.md)).

<!-- diagrama: docs/diagramas/diseno/instalador-etapas.mmd -->
```mermaid
---
title: Instalador autoalojado — cinco etapas que comprueban antes de escribir
---
flowchart LR
    INICIO(["./scripts/instalar.sh"]) --> E1
    E1["1 · Requisitos<br/>Docker 24+, Compose v2<br/>curl, dig, openssl"] --> E2
    E2["2 · Dominio<br/>la raíz y el comodín<br/>apuntan a esta IP"] --> E3
    E3["3 · Certificado<br/>comodín por DNS-01<br/>o HTTP-01 (--sin-comodin)"] --> E4
    E4["4 · Servicios<br/>.env con secretos generados<br/>compose up · migraciones"] --> E5
    E5["5 · Administrador<br/>imprime el código de<br/>configuración (30 min)"] --> FIN(["/configurar"])
    E3 -. "si una etapa falla" .-> ALTO["Se detiene con instrucciones<br/>corriges y corres --continuar<br/>retoma en la etapa que falló"]

    classDef startEnd fill:#1a1510,stroke:#1a1510,color:#f8f6f2
    classDef error fill:#f7e3e5,stroke:#bd1f3d,stroke-width:1.5px,color:#1a1510
    class INICIO,FIN startEnd
    class ALTO error
```

```bash
./scripts/instalar.sh                  # instala por etapas
./scripts/instalar.sh --continuar      # retoma después de corregir lo que falló
./scripts/instalar.sh --sin-comodin    # certificado por HTTP-01 si no hay token DNS
./scripts/instalar.sh --codigo-nuevo   # genera otro código de configuración
```

| Etapa | Comprueba | Aplica |
|---|---|---|
| 1 · Requisitos | Docker 24+, Compose v2, `curl`, `dig`, `openssl` | — |
| 2 · Dominio | Que la raíz y un nombre del comodín resuelvan (registro A, no CNAME) a esta máquina | — |
| 3 · Certificado | Token del proveedor DNS o, con `--sin-comodin`, el puerto 80 | Estrategia DNS-01 o HTTP-01 |
| 4 · Servicios | — | `.env` con permisos 600 y secretos generados (32 bytes), `compose up`, migraciones |
| 5 · Administrador | — | Imprime una sola vez el **código de configuración** (vence en 30 min); solo su hash sha256 va al `.env` |

Con el código, se abre `https://<dominio>/configurar`: el asistente pide el código, crea la cuenta de administrador, prueba el SMTP (o sigue sin correo) y elige la política de registro. Lo guardado vive en la tabla `ConfiguracionInstalacion`, no en archivos, y se cambia después en **Admin · Instalación**.

## Operación

### Actualizar y respaldar

```bash
./scripts/respaldar.sh                         # base + configuración, sin la clave de cifrado
./scripts/respaldar.sh --restaurar AAAA-MM-DD  # vuelve a un respaldo
./scripts/actualizar.sh                        # respalda, migra y reinicia api, web y worker
./scripts/actualizar.sh --volver               # restaura el respaldo previo a la actualización
```

- `respaldar.sh` guarda la base y la configuración, conserva los **7 más recientes** y no pisa dos respaldos del mismo día. La clave de cifrado **no** entra al respaldo: se guarda aparte.
- `actualizar.sh` **no detiene** los contenedores de las apps de los clientes: solo reinicia la plataforma.

### Tareas programadas recomendadas

| Tarea | Frecuencia | Comando |
|---|---|---|
| Respaldo | Diaria (`cron`) | `./scripts/respaldar.sh` |
| Limpiar imágenes huérfanas | Semanal | `docker image prune -f` |
| Vigilar la salud | Cada 5 min | `curl -fsS https://api.<dominio>/health` |
| Ciclo de suscripciones | Diaria, 00:00 UTC | Lo programa la API (BullMQ); no requiere `cron` |
| Muestreo de métricas | Cada minuto | Lo programa el trabajador; purga lo de más de 24 h |

### Bitácoras y diagnóstico

```bash
docker compose logs -f api         # peticiones, errores de dominio, fallos de SMTP
docker compose logs -f worker      # pipeline de despliegue, docker build, salud
docker compose logs -f traefik     # rutas y emisión del certificado (ACME)
docker compose ps                  # estado y salud de cada servicio
```

El panel también muestra el estado: **Admin · Infraestructura** (CPU, memoria y disco del nodo, cola y última muestra de cada entorno) y **Admin · Instalación** (salud de Docker, DNS, certificado, disco y correo).

## Pruebas

| Comando | Qué corre |
|---|---|
| `pnpm test` | Pruebas de la API (Jest), de la web (`node --test`) y del repositorio |
| `pnpm test:cov` | Cobertura de la API (hoy 96.8 % de líneas) |
| `pnpm check` | Lo mismo que CI: pruebas, build y diagramas |
| `pnpm test:smoke` | *Smoke* contra una plataforma levantada |
| `pnpm diagramas:sync` | Copia cada `.mmd` a los documentos que lo embeben |

Las pruebas unitarias no usan Docker, red, base ni reloj reales: los servicios reciben dobles de sus puertos y un `Reloj` falso. Cada escenario de OpenSpec tiene su prueba con el mismo nombre.

## Solución de problemas

| Síntoma | Causa probable | Qué hacer |
|---|---|---|
| `docker compose up` termina sin API | Falta `ADMIN_CLAVE` en `.env` | Defínela y vuelve a levantar |
| La web llama a `localhost:3001` en el VPS | La imagen de la web se construyó sin los `build.args` | `docker compose … up -d --build web` con `.env.vps` |
| Traefik sirve su certificado por defecto | Error de ACME: token sin permiso, DNS sin propagar o límite de Let's Encrypt | `docker compose logs traefik`; revisa el token y los registros A |
| `certificado: null` en la vista de despliegue | `acme.json` vacío (aún no se emite) o la API sin el volumen `traefik_acme` | Espera la emisión; revisa el montaje de solo lectura |
| 502 al abrir un proyecto | El contenedor no está en la red del proyecto | Revisa la bitácora del `worker` |
| El correo no llega | `SMTP_*` incorrectas o dominio sin verificar | La API registra el fallo; revisa SPF y DKIM en el proveedor |
| «GitHub no disponible» al crear un proyecto | Límite de 60 peticiones por hora agotado | Define `GITHUB_TOKEN` (un token sin permisos basta) |
| Un despliegue falla en Construcción | Error del `Dockerfile` o de la receta, o más de 10 min | La vista de despliegue marca la línea del error en la bitácora |
| Un despliegue falla en Ejecución | El contenedor no respondió HTTP en 60 s | La app debe escuchar en el puerto interno (`PORT`, 8080 por defecto) |
| Variables ilegibles | Cambió `CLAVE_CIFRADO_VARIABLES` | Restaura la clave original; la versión activa sigue sirviendo |
| Disco lleno en el nodo | Imágenes acumuladas | `docker image prune -f`; la retención conserva 5 artefactos por proyecto |

## Generar esta documentación

Los cuatro documentos de la entrega se escriben en Markdown en `docs/entrega-final/` y se generan en PDF y HTML con el design system v4.1 en modo claro. Los diagramas salen de los `.mmd` de `docs/diagramas/` y el diccionario de datos, del esquema de Prisma, así que nunca se desfasan del código.

```bash
npm ci --prefix docs/entrega-final/generador
pnpm diagramas:sync
node docs/entrega-final/generador/construir.mjs          # los cuatro
node docs/entrega-final/generador/construir.mjs diseno   # solo uno
```

Los PDF quedan en `docs/entrega-final/pdf/` y las versiones HTML en `docs/entrega-final/html/`. Si `pdftotext` está instalado, el índice lleva números de página.
