# Contrato · Modo de instalación y autoalojado (M2, M9 → M1, scripts)

Versión 1.2 · 2026-10-21 · dueños: Javier (modo, límites, registro, Admin · Instalación), Derek (scripts) · consumidores: Eddy (asistente 31, registro 01), Derek (instalador), Eduardo (límites en métricas). Cambiarlo exige avisar antes de mergear. Changes: `feat-m2-modo-autoalojado`, `feat-m9-ajustes-instalacion`, `feat-m1-asistente-instalacion`, `feat-instalador-autoalojado`. Decisión: [ADR 0008](../adr/0008-autoalojado-y-codigo-abierto.md). Datos: [datos-nucleo.md § versión 2](datos-nucleo.md#sprint-fuera-de-alcance--versión-2).

## Variables de entorno

| Variable | Valores | Quién la escribe |
|---|---|---|
| `MODO_INSTALACION` | `nube` (por defecto) · `autoalojado` | `instalar.sh` |
| `DOMINIO_BASE`, `ESQUEMA_PUBLICO`, `CERT_RESOLVER` | Las de M6-02 | `instalar.sh` |
| `CLAVE_CIFRADO_VARIABLES`, `SECRETO_SESION` | Generados (32 bytes cada uno) | `instalar.sh`; `.env` con permisos 600 |
| SMTP (`SMTP_*`) | Opcionales en autoalojado | `instalar.sh` o el asistente (31) |
| `HASH_CODIGO_CONFIGURACION` | sha256 hex del código (nunca el código) | `instalar.sh` |
| `CODIGO_VENCE` | ISO-8601, ahora + 30 min | `instalar.sh` |
| `ADMIN_CLAVE`, `CLIENTE_CLAVE` | Presentes para que el compose de la nube interpole. En autoalojado el seed no crea cuentas con ellas | `instalar.sh` |

## Strategy por modo (sin `if` sueltos)

Cada módulo registra la implementación según `MODO_INSTALACION` en su `*.module.ts`:

| Puerto | Nube | Autoalojado | Módulo |
|---|---|---|---|
| `CatalogoPlanes` | `CatalogoNube` (4 planes) | `CatalogoAutoalojado` (plan «Autoalojado») | M2 |
| `PoliticaCuotas` (alimenta `CuotaPlanPuerto` y `CuotaProyectosPuerto`) | `CuotasDelPlan` | `LimitesDeInstalacion` | M2 |
| `AltaPrimerUsuario` | `ComoCliente` | `ConCodigoDeConfiguracion` | M1 ← M2 |
| `PoliticaRegistroPuerto` | `RegistroAbierto` | `RegistroDeInstalacion` (abierto · invitación · cerrado) | M1 ← M9 |
| Tarea del ciclo §4.4 | Programada | No se programa | M2 |

`GET /instalacion/modo` (público) → `{ modo, configurada }`: la web oculta Suscripción y Planes en autoalojado y redirige a `/configurar` mientras `configurada` sea `false`.

## Primera configuración (asistente 31)

```http
POST /instalacion/codigo         { codigo }              → 204 | 401 CodigoInvalido | 410 CodigoVencido
POST /instalacion/administrador  { correo, contrasena }   → 201 (cuenta Administrador verificada; borra hashCodigo)
POST /instalacion/correo/prueba  { smtp }                 → { entregado: true, ms } | 502 { error }   // del servidor SMTP
PATCH /instalacion/correo        { smtp } | { sinCorreo: true }
```

`/configurar` y estos endpoints dan **404** cuando ya hay administrador o el modo es `nube`. El código es de un solo uso y vence a los 30 min; `instalar.sh --codigo-nuevo` emite otro.

### Paso del código (script → `ConfiguracionInstalacion`)

El instalador genera el código, lo imprime una vez (no entra en `instalacion.log`) y no lo guarda. Calcula `sha256` hex del texto exacto, guion incluido, y `codigoVence` = ahora + 30 min. Los escribe en `.env` (permisos 600) como `HASH_CODIGO_CONFIGURACION` y `CODIGO_VENCE`.

`docker-compose.autoalojado.yml` se los pasa al servicio `migracion` junto con `MODO_INSTALACION=autoalojado`. El seed, solo en ese modo y solo si no hay un usuario con rol administrador, hace upsert de la fila `id = instalacion` (`hashCodigo`, `codigoVence`). Eddy valida `POST /instalacion/codigo` contra esa fila: mismo sha256 y `codigoVence` posterior a ahora. Al crear el administrador, borra el hash (el contrato de arriba).

`instalar.sh --codigo-nuevo` genera otro código, sustituye el hash y el vencimiento y vuelve a correr el seed: el código anterior deja de validar en el acto, aunque no hayan pasado 30 min. Si ya hay administrador, termina con error y no toca la fila.

En autoalojado el seed no crea administrador ni cuentas de demo (`cliente@`, `vencida@`, `suspendida@`, `demo@`). Si las creara, `/configurar` respondería 404 y la instalación no tendría salida. Acuerdo con Javier (SP-06): los cuatro planes de la nube siguen sembrándose hasta que ese change los reemplace por el plan «Autoalojado».

## Admin · Instalación (32)

```http
GET   /admin/instalacion           → { salud: [{ id, estado: "ok"|"aviso"|"error", detalle }], version: { instalada, disponible? },
                                       registro, limites, respaldo: { ultimo?, tamanoMb?, ruta, programa: "diario", hora: "03:00", conserva: 7 } }
PATCH /admin/instalacion/registro  { politica: "abierto" | "invitacion" | "cerrado" }
POST  /admin/invitaciones          { correo } → { enlace, vence }          // 7 días, un solo uso
DELETE /admin/invitaciones/:id
PATCH /admin/instalacion/limites   { cpu, memoriaMb, proyectosPorUsuario: number | null }   // aplica en el próximo despliegue
```

`SaludInstalacion` (Composite) junta comprobaciones independientes: Docker, DNS comodín, certificado (`CertificadoPuerto` de M6), disco y último envío de correo. Cada una es una clase.

## Scripts (Derek)

| Script | Qué hace | Estado que deja |
|---|---|---|
| `scripts/instalar.sh [--continuar] [--sin-comodin] [--codigo-nuevo]` | 5 etapas: Requisitos → Dominio → Certificado → Servicios → Administrador. Comprueba antes de escribir; si falla, explica y `--continuar` retoma | `~/.deploya/estado`, `~/.deploya/instalacion.log` |
| `scripts/respaldar.sh [--restaurar <fecha>]` | `pg_dump` + `.env` **sin** `CLAVE_CIFRADO_VARIABLES` + manifiesto; guarda 7 | `/var/backups/deploya/ultimo.json` |
| `scripts/actualizar.sh [--volver]` | Respaldo previo → nueva versión → `prisma migrate deploy` → reinicia api, web y trabajador sin tocar los contenedores de los proyectos | `/var/backups/deploya/version.json` |

Todos pasan `shellcheck` en CI.

`ultimo.json`: `{ "ultimo": "AAAA-MM-DDTHH:MM:SSZ", "tamanoMb": number, "ruta": "…tar.gz", "programa": "diario", "hora": "03:00", "conserva": 7 }` — los mismos campos que `respaldo` en `GET /admin/instalacion`. El archivo es `AAAA-MM-DDTHHMMSSZ.tar.gz`: el de las 03:00 y el de `actualizar.sh` el mismo día no se pisan. `--restaurar AAAA-MM-DD` usa el último de ese día; también acepta la marca completa.

`version.json`: `{ "instalada", "disponible", "respaldoPrevio", "versionAnterior" }`. `disponible` es la etiqueta más nueva tras `git fetch --tags` si es mayor que `instalada`; si no, `null`. `--volver` usa `versionAnterior` y `respaldoPrevio`.

El instalador deja un cron diario a las 03:00 (`/etc/cron.d/deploya-respaldo`, o el archivo `DEPLOYA_CRON` en pruebas) que corre `respaldar.sh`. `programa.json` en el mismo directorio repite `{ programa, hora, conserva }` para la pantalla 32 antes del primer respaldo.

La etapa 2 comprueba la raíz `DOMINIO_BASE` (ahí vive la web; el comodín no la cubre) y un nombre que solo resuelve el comodín. De `dig` solo se aceptan IPv4: si la primera línea es un CNAME, se sigue hasta la A. La etapa 3 valida el token con la API del proveedor (Cloudflare: token activo y una zona que cubre el dominio) y no afirma que el certificado ya exista. La etapa 4 reintenta `https://<dominio>/` —no `/configurar`, que todavía no está en la web— hasta leer el certificado de Let's Encrypt. La salida de cada etapa es una línea `[n/5] Nombre ✓ detalle`.

## Historial

| Versión | Fecha | Cambio |
|---|---|---|
| 1 | 2026-10-20 | Sprint fuera de alcance (SP-06, SP-16, SP-17, SP-18, SP-19) |
| 1.1 | 2026-10-20 | SP-16/SP-19: `SECRETO_SESION` y la forma de `ultimo.json` y `version.json` |
| 1.2 | 2026-10-21 | El instalador escribe el hash en `ConfiguracionInstalacion`; el seed de autoalojado no crea cuentas; DNS, certificado, cron y la hora del respaldo |
