# Lanzamiento v1.0.0 · lista de Derek (L0–L10)

Estado al 8 de noviembre. Lo marcado ✅ está hecho y verificado en el repositorio; lo marcado ⬜ se hace **en el servidor** (necesita el VPS, el DNS, el proveedor de correo o una cuenta de GitHub con permisos de *release*) y tiene aquí sus comandos exactos.

| Paso | Qué | Estado |
|---|---|---|
| L0 | Plan y los tres changes de endurecimiento en `main` | ✅ #63 (EST-01a), #64 (EST-01b) y #61 (EST-01c) mergeados con CI verde; changes archivados |
| L1 | VPS al día con `main` y HTTPS comodín | ⬜ §1 |
| L2 | Correo real con SPF, DKIM y DMARC | ⬜ §2 |
| L3 | Datos de la demo | ⬜ §3 |
| L4 | Respaldo diario, *prune* semanal y vigilancia de salud | ✅ soporte en el repo (`DEPLOYA_ARCHIVOS_COMPOSE`, `restart` y rotación de logs) · ⬜ instalar el cron (§4) |
| L5 | URL al equipo | ⬜ por el chat del equipo, nunca en el repo |
| L6 | Triar issues `final` | ⬜ cada noche hasta el congelamiento |
| L7 | Recorrido del motor en el VPS | ✅ `e2e/vps.mjs` escrito · ⬜ correrlo (§5) |
| L8 | Instalación limpia con `instalar.sh` | ⬜ §6 |
| L9 | `v1.0.0`: `CHANGELOG.md`, etiqueta, *release* y despliegue final | ✅ `CHANGELOG.md` · ⬜ etiqueta y *release* (§7) |
| L10 | Plan B: video y compose local | ⬜ grabar en el ensayo; compose local verificado (smoke y recorrido e2e en verde) |

Verificado en esta preparación, con el stack levantado a partir de `main` + los tres PRs: `pnpm check` (1 101 pruebas de la API, 282 de la web y 23 de los scripts; 96.9 % de líneas cubiertas en la API), el smoke, el **recorrido e2e completo** (10 pasos, incluido el 429), la limpieza diaria contra PostgreSQL real y una revisión de accesibilidad con axe en 25 pantallas en claro y oscuro ([accesibilidad.md](accesibilidad.md)).

## 1. VPS al día (L1)

En el servidor, dentro del clon y con `.env.vps` completo ([manual-tecnico.md §3.2](manual-tecnico.md#32-variables-de-envvps)):

```bash
scripts/desplegar-vps.sh
```

Comprobaciones de [manual-tecnico.md §3.4](manual-tecnico.md#34-comprobar). Si los servicios se habían levantado antes sin `restart`, este despliegue los recrea con `restart: unless-stopped`.

## 2. Correo real (L2)

En el proveedor (Resend o Brevo): dominio verificado con SPF, DKIM y DMARC. En `.env.vps`: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USUARIO`, `SMTP_CLAVE` y `CORREO_REMITENTE` con el dominio verificado. Después de `scripts/desplegar-vps.sh`, registrar una cuenta con un buzón real y comprobar que llegan —y no a spam— la verificación, la recuperación y los avisos de 24b (Saludable, Fallido, Por vencer y Suspendida; los dos últimos corriendo el ciclo con `POST /admin/ciclo/ejecutar`).

## 3. Datos de la demo (L3)

El seed ya crea `admin@`, `cliente@`, `demo@`, `vencida@` y `suspendida@` con `ADMIN_CLAVE` y `CLIENTE_CLAVE`. Con `cliente@`: contratar Starter, crear `hola-deploya` desde `https://github.com/derekCmorales/hola-deploya` (rama `main`) y desplegar tres veces para tener #1, #2 y #3.

## 4. Operación (L4)

Copiar el bloque de [manual-tecnico.md §3.5](manual-tecnico.md#35-operación-diaria-cron-del-servidor) a `/etc/cron.d/deploya`, con la ruta del clon y el dominio. Probar el respaldo y una restauración en el momento:

```bash
DEPLOYA_ENV=.env.vps DEPLOYA_ARCHIVOS_COMPOSE="docker-compose.yml docker-compose.vps.yml" scripts/respaldar.sh
```

```bash
ls -la /var/backups/deploya
```

## 5. Recorrido del motor (L7)

```bash
API_URL=https://api.<dominio> CORREO=cliente@deploya.app CLAVE='<CLIENTE_CLAVE>' PROYECTO=hola-deploya node e2e/vps.mjs
```

Termina con `recorrido del VPS ok`.

## 6. Instalación limpia (L8)

En un servidor aparte, con su propio dominio y DNS: [manual-tecnico.md §4](manual-tecnico.md#4-autoalojado-servidor-propio). Grabar la terminal para la parte 7 del guion.

## 7. Versión v1.0.0 (L9)

Con `main` congelado y el CI de `main` en verde:

```bash
git checkout main && git pull --ff-only
```

```bash
git tag -a v1.0.0 -m "Deploya v1.0.0 · entrega final"
```

```bash
git push origin v1.0.0
```

En GitHub, *Releases* → *Draft a new release* con la etiqueta `v1.0.0` y el texto de la sección `[1.0.0]` de [CHANGELOG.md](../../CHANGELOG.md); adjuntar el enlace al video. Después, `scripts/desplegar-vps.sh` y las comprobaciones de §1. `actualizar.sh` de las instalaciones autoalojadas toma esta etiqueta como la última.

## Pendiente después de la entrega (P3)

Ninguno bloquea la demo. Van a issues con la etiqueta `despues-de-entrega`:

- Contraste de las insignias `ok`/`bad`, `text-faint` y el botón destructivo en oscuro; `heading-order` ([accesibilidad.md § Pendiente](accesibilidad.md#pendiente-p3-después-de-la-entrega)).
- 10b dice «Pega la URL de un repositorio público de GitHub que tenga un Dockerfile», pero desde M4-03 también sirve un stack reconocido.
- En el detalle de 25b, un proyecto cuyo único despliegue falló aparece como «Sin despliegue».
- Errores conocidos de [ficha-demo.md](ficha-demo.md): el chip del encabezado sigue en «Fallido» si la #1 falló y la #2 pasó; el encabezado dice «Dockerfile» aunque se construyó con receta.
- `LimiteIntentos` vive en memoria: un reinicio de la API pone los conteos en cero y las claves que no se vuelven a leer ocupan memoria hasta entonces (ADR 0002: un solo proceso de API).
