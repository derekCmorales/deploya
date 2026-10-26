# Contrato · Modo de instalación y autoalojado (M2, M9 → M1, scripts)

Versión 1.9 · 2026-10-26 · dueños: Javier (modo, límites, registro, Admin · Instalación), Derek (scripts) · consumidores: Eddy (asistente 31, registro 01), Derek (instalador), Eduardo (límites en métricas). Cambiarlo exige avisar antes de mergear. Changes: `feat-m2-modo-autoalojado`, `feat-m9-ajustes-instalacion`, `feat-m1-asistente-instalacion`, `feat-instalador-autoalojado`. Decisión: [ADR 0008](../adr/0008-autoalojado-y-codigo-abierto.md). Datos: [datos-nucleo.md § versión 2](datos-nucleo.md#sprint-fuera-de-alcance--versión-2).

## Variables de entorno

| Variable | Valores | Quién la escribe |
|---|---|---|
| `MODO_INSTALACION` | `nube` (por defecto) · `autoalojado` | `instalar.sh` |
| `DOMINIO_BASE`, `ESQUEMA_PUBLICO`, `CERT_RESOLVER` | Las de M6-02 | `instalar.sh` |
| `CLAVE_CIFRADO_VARIABLES`, `SECRETO_SESION` | Generados (32 bytes cada uno) | `instalar.sh`; `.env` con permisos 600 |
| SMTP (`SMTP_*`) | Opcionales en autoalojado; valor de respaldo | `instalar.sh` (opcional). El asistente (31) **no** escribe el `.env`: guarda en `ConfiguracionInstalacion` y eso manda ([§ Correo](#correo-de-la-instalación-sp-17)) |
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

**Sin límite (SP-06).** En autoalojado `cuotaDe` devuelve `construccionesMes` sin límite y, si `proyectosPorUsuario` es nulo, `maxProyectos` sin límite (`Infinity` en la API). En JSON llegan como `null`: `GET /proyectos` (`maximo`) y `GET /observabilidad/consumo` (`limite`) dicen «sin límite» con `null`; la web debe ocultar el medidor en ese caso (pendiente en 10, de Eduardo).

**Primer administrador (SP-06 → SP-17).** `SuscripcionesModule` exporta `AltaPrimerUsuario`: `validarCodigo(codigo)` (404 `PrimeraConfiguracionNoDisponible` · 401 `CodigoInvalido` · 410 `CodigoVencido`), `consumirCodigo(codigo)` (valida y borra el hash en una sola escritura; devuelve lo borrado) y `devolverCodigo(consumido)` (compensación si crear la cuenta falla). El asistente de M1 los usa en `POST /instalacion/codigo` y `/administrador`: los dos llaman a `validarCodigo` (v1.8).

## Primera configuración (asistente 31)

```http
POST /instalacion/codigo         { codigo }              → 204 | 401 CodigoInvalido | 410 CodigoVencido
POST /instalacion/administrador  { codigo, correo, contrasena } → 201 + Set-Cookie (cuenta Administrador verificada, sesión iniciada; borra hashCodigo) | 401 CodigoInvalido | 410 CodigoVencido
POST /instalacion/correo/prueba  { smtp }                 → { entregado: true, ms } | 502 { error }   // del servidor SMTP · sesión de administrador
PATCH /instalacion/correo        { smtp } | { sinCorreo: true }                                         // sesión de administrador
```

**El código viaja en los dos pasos (v1.8).** Mientras no hay administrador, `/administrador` está abierto: sin el código, cualquiera podría llamarlo directo y saltarse el paso 1. Por eso vuelve a llamar a `validarCodigo(codigo)`, revisa correo y contraseña y llama a `consumirCodigo(codigo)` justo antes de crear la cuenta. `POST /instalacion/codigo` se queda para que el paso 1 avise pronto de un código malo o vencido. Los dos cuentan para el límite de 5 intentos por IP en 15 min. La web guarda el código solo en el estado del asistente (memoria), nunca en `localStorage` ni en la URL.

**Un solo administrador aunque lleguen dos altas a la vez (v1.9).** `consumirCodigo` borra el hash con `UPDATE … WHERE hashCodigo = <el validado>` (`borrarCodigoSiEs`): de dos peticiones simultáneas solo una cuenta la fila y la otra recibe 404 `PrimeraConfiguracionNoDisponible`. Si crear la cuenta falla después de gastarlo, `devolverCodigo` lo restaura (solo si el instalador no dejó otro), así la instalación no queda sin forma de crear el administrador. La IP del límite es la del cliente: la API confía en un salto de proxy (`PROXIES_DE_CONFIANZA: 1` en `docker-compose.vps.yml`, Traefik); sin la variable no confía en `X-Forwarded-For`.

`smtp` = `{ host, puerto, usuario, contrasena, remitente }`. La contraseña viaja en claro solo en esta petición (HTTPS) y se guarda cifrada.

**Quién puede llamar a qué (v1.6).** Con modo `nube`, todo da **404**.

| Endpoint | Sin administrador | Con administrador |
|---|---|---|
| `POST /instalacion/codigo`, `/administrador` | Abiertos (con el código) | **404** |
| `POST /instalacion/correo/prueba`, `PATCH /instalacion/correo` | 401 (aún no hay sesión posible) | `SesionGuard` + `RolGuard("administrador")`, como `/admin/*` |

**Sesión al crear el administrador.** `POST /instalacion/administrador` deja la sesión iniciada con la misma cookie que `POST /identidad/sesion` (`SesionService`, `cookieSesion`). El código ya se consumió: desde ese momento lo único que prueba que es quien instaló es la sesión. Los pasos 3 a 5 la usan; el paso 5 (registro y límites) llama a `PATCH /admin/instalacion/registro` y `/limites` tal cual.

**`/configurar` en la web.** Sin administrador: paso 1. Con administrador y sesión de administrador: sigue en los pasos 3 a 5 hasta «Terminar». Con administrador y sin sesión: 404. `GET /instalacion/modo` → `configurada` sigue siendo «hay administrador»: la raíz deja de redirigir a `/configurar` en cuanto se crea, y el asistente no depende de esa redirección para seguir.

El código es de un solo uso y vence a los 30 min; `instalar.sh --codigo-nuevo` emite otro.

### Correo de la instalación (SP-17)

La API no puede escribir el `.env` (vive en el host, permisos 600, no se monta) y lee `SMTP_*` una sola vez al arrancar. Por eso el asistente guarda el correo en `ConfiguracionInstalacion` ([datos-nucleo.md](datos-nucleo.md) v2.3):

| Columnas | Significado |
|---|---|
| `smtpHost`, `smtpPuerto`, `smtpUsuario`, `smtpRemitente` | El SMTP elegido en 31 (o después en 32) |
| `smtpClaveCifrada` | AES-GCM con `CLAVE_CIFRADO_VARIABLES`; nunca en claro, nunca en la respuesta |
| `sinCorreo` | «Sin correo por ahora»: no se envía nada |

`RepositorioConfiguracionInstalacion` (exportado por `SuscripcionesModule`) da `correo()` → `{ tipo: "entorno" } | { tipo: "smtp", smtp } | { tipo: "sin-correo" }` y `guardarCorreo(...)`. Guardar un SMTP apaga `sinCorreo` y al revés. `entorno` = nadie lo configuró en la web: valen las `SMTP_*` del `.env` (la nube sigue igual).

**En M10 (Eddy).** Un adaptador de `CorreoPuerto` que lee `correo()` en **cada** envío (cambiar el SMTP no exige reiniciar): `smtp` → descifra y manda por ese servidor; `sin-correo` → no manda (como `CorreoConsolaAdaptador`); `entorno` → el adaptador actual de `SMTP_*`. Va **dentro** de `CorreoConRegistro` (SP-18) para que la salud siga viendo el último envío. Cifrar y descifrar va por el puerto `CifradorVariables` (AES-GCM con la misma `CLAVE_CIFRADO_VARIABLES`), que `VariablesModule` exporta desde v1.7: M1 cifra al guardar (`PATCH /instalacion/correo`) y M10 descifra al enviar. Nunca `new` de `crypto` en el servicio.

### Paso del código (script → `ConfiguracionInstalacion`)

El instalador genera el código, lo imprime una vez (no entra en `instalacion.log`) y no lo guarda. Calcula `sha256` hex del texto exacto, guion incluido, y `codigoVence` = ahora + 30 min. Los escribe en `.env` (permisos 600) como `HASH_CODIGO_CONFIGURACION` y `CODIGO_VENCE`.

`docker-compose.autoalojado.yml` se los pasa al servicio `migracion` junto con `MODO_INSTALACION=autoalojado`. El seed, solo en ese modo y solo si no hay un usuario con rol administrador, hace upsert de la fila `id = instalacion` (`hashCodigo`, `codigoVence`). Eddy valida `POST /instalacion/codigo` contra esa fila: mismo sha256 y `codigoVence` posterior a ahora. Al crear el administrador, borra el hash (el contrato de arriba).

`instalar.sh --codigo-nuevo` genera otro código, sustituye el hash y el vencimiento y vuelve a correr el seed: el código anterior deja de validar en el acto, aunque no hayan pasado 30 min. Si ya hay administrador, termina con error y no toca la fila.

En autoalojado el seed no crea administrador ni cuentas de demo (`cliente@`, `vencida@`, `suspendida@`, `demo@`). Si las creara, `/configurar` respondería 404 y la instalación no tendría salida. Desde SP-06 el seed de autoalojado crea solo el plan «Autoalojado» (precio 0, sin vencimiento).

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

**Correo y disco (v1.8).** `ComprobacionCorreo` lee primero `correo()`: con `sin-correo` responde `aviso` «Sin correo: no se envían avisos ni enlaces de recuperación» sin mirar el último envío (`CorreoSegunInstalacion` no manda nada, pero `CorreoConRegistro` lo anota como entregado). El trabajador crea el directorio de trabajo (`DIRECTORIO_TRABAJO`, por defecto `/tmp/deploya`) antes de medir el disco: en una instalación sin despliegues no existe y el reporte entero fallaba, Docker incluido.

**Cómo se arma (SP-18).** La API no llama a Docker: el trabajador mide Docker, disco y memoria al arrancar y cada 10 min (`TareaReporteServidor` → `ReporteServidorPuerto`, Redis `instalacion:servidor:reporte`) y la API lee el último. Un reporte de más de 30 min se muestra como error. El último envío de correo lo anota `CorreoConRegistro` (Decorator de `CorreoPuerto`, M10) en `RegistroEnviosCorreo` (Redis `instalacion:correo:ultimo`). La respuesta suma `dominio` y `comprobado`; `limites` trae `capacidad` y `memoriaLibreMb` para «caben unos 3 proyectos». `respaldo` y `version` salen de los JSON de los scripts: `docker-compose.autoalojado.yml` monta `DEPLOYA_RESPALDOS` de solo lectura en `/respaldos` de la API (`DIR_RESPALDOS`).

**Invitaciones.** El token viaja solo en el enlace (`URL_WEB/registro?invitacion=<token>`); la base guarda su sha256. Por eso «Copiar enlace» solo existe al crearla. Cada invitación es del correo al que se mandó.

**Registro (M1 ← M9).** `RegistroInstalacionModule` exporta `PoliticaRegistroPuerto` (`RegistroAbierto` en la nube, `RegistroDeInstalacion` en autoalojado): `exigirPermitido(correo, invitacion?)` antes de crear la cuenta y `consumir(correo, invitacion?)` después. Errores: 403 `RegistroCerrado` · 403 `InvitacionRequerida` · 410 `InvitacionNoValida`. Módulo aparte para que `IdentidadModule` lo importe sin ciclo.

Desde v1.6 está conectado: `POST /identidad/registro { correo, contrasena, confirmacion, invitacion? }`. `IdentidadService` pregunta a la política **antes** de mirar si el correo existe (con el registro cerrado no revela quién tiene cuenta). La web (01) manda el `?invitacion=` del enlace y muestra el `mensaje` de esos tres errores.

## Scripts (Derek)

| Script | Qué hace | Estado que deja |
|---|---|---|
| `scripts/instalar.sh [--continuar] [--sin-comodin] [--codigo-nuevo]` | 5 etapas: Requisitos → Dominio → Certificado → Servicios → Administrador. Comprueba antes de escribir; si falla, explica y `--continuar` retoma | `~/.deploya/estado`, `~/.deploya/instalacion.log` |
| `scripts/respaldar.sh [--restaurar <fecha>]` | `pg_dump --clean --if-exists` dentro del contenedor de postgres + `.env` **sin** `CLAVE_CIFRADO_VARIABLES` + manifiesto; guarda 7. Restaurar detiene solo api, web y trabajador y carga con `ON_ERROR_STOP` en una transacción | `/var/backups/deploya/ultimo.json` |
| `scripts/actualizar.sh [--volver]` | Sondeo de las apps por su URL pública → respaldo previo → checkout de la etiqueta `disponible` → `compose build` → `run --rm migracion` → `up -d --no-deps api web worker`, sin tocar los contenedores de los proyectos. `--volver`: checkout de `versionAnterior` → build → restaura `respaldoPrevio` → arriba | `/var/backups/deploya/version.json` |

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
| 1.3 | 2026-10-21 | SP-19: actualizar reconstruye antes de migrar y va a la etiqueta `disponible`; sondeo por URL pública; respaldo y restauración siempre dentro del contenedor, con `--clean` y `ON_ERROR_STOP` |
| 1.4 | 2026-10-24 | SP-06: seed de autoalojado solo con el plan «Autoalojado»; `null` = sin límite en `maximo` y `limite`; `AltaPrimerUsuario` exportado para el asistente (SP-17) |
| 1.5 | 2026-10-24 | SP-18: reporte del servidor desde el trabajador, último envío de correo, `dominio`/`comprobado`/`capacidad` en `GET /admin/instalacion`, montaje de respaldos en la API y `PoliticaRegistroPuerto` en `RegistroInstalacionModule` |
| 1.6 | 2026-10-25 | SP-17: el correo del asistente se guarda en `ConfiguracionInstalacion` (no en el `.env`); `POST /instalacion/administrador` deja la sesión iniciada y los endpoints de correo piden sesión de administrador en lugar de 404 por haber administrador. SP-18: `PoliticaRegistroPuerto` conectado al registro de M1 |
| 1.7 | 2026-10-25 | `VariablesModule` exporta `CifradorVariables` para la clave del SMTP (SP-17) |
| 1.8 | 2026-10-25 | SP-17: `POST /instalacion/administrador` pide también el `codigo` y lo valida otra vez. SP-18: con «sin correo» la salud no dice que el último envío llegó; el trabajador crea su directorio antes de medir el disco |
| 1.9 | 2026-10-26 | SP-17: `consumirCodigo(codigo)` atómico (`borrarCodigoSiEs`) y `devolverCodigo` si crear la cuenta falla; límite de intentos por la IP real detrás de Traefik (`PROXIES_DE_CONFIANZA`) |
