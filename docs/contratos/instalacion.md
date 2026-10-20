# Contrato · Modo de instalación y autoalojado (M2, M9 → M1, scripts)

Versión 1.1 · 2026-10-20 · dueños: Javier (modo, límites, registro, Admin · Instalación), Derek (scripts) · consumidores: Eddy (asistente 31, registro 01), Derek (instalador), Eduardo (límites en métricas). Cambiarlo exige avisar antes de mergear. Changes: `feat-m2-modo-autoalojado`, `feat-m9-ajustes-instalacion`, `feat-m1-asistente-instalacion`, `feat-instalador-autoalojado`. Decisión: [ADR 0008](../adr/0008-autoalojado-y-codigo-abierto.md). Datos: [datos-nucleo.md § versión 2](datos-nucleo.md#sprint-fuera-de-alcance--versión-2).

## Variables de entorno

| Variable | Valores | Quién la escribe |
|---|---|---|
| `MODO_INSTALACION` | `nube` (por defecto) · `autoalojado` | `instalar.sh` |
| `DOMINIO_BASE`, `ESQUEMA_PUBLICO`, `CERT_RESOLVER` | Las de M6-02 | `instalar.sh` |
| `CLAVE_CIFRADO_VARIABLES`, `SECRETO_SESION` | Generados (32 bytes cada uno) | `instalar.sh`; `.env` con permisos 600 |
| SMTP (`SMTP_*`) | Opcionales en autoalojado | `instalar.sh` o el asistente (31) |

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

## Admin · Instalación (32)

```http
GET   /admin/instalacion           → { salud: [{ id, estado: "ok"|"aviso"|"error", detalle }], version: { instalada, disponible? },
                                       registro, limites, respaldo: { ultimo?, tamanoMb?, ruta } }
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

`ultimo.json`: `{ "ultimo": "AAAA-MM-DD", "tamanoMb": number, "ruta": "…tar.gz" }` — los mismos campos que `respaldo` en `GET /admin/instalacion`. `version.json`: `{ "instalada", "disponible", "respaldoPrevio", "versionAnterior" }`. `disponible` es `null` si no hay otra versión. `--volver` usa `versionAnterior` y `respaldoPrevio`.

## Historial

| Versión | Fecha | Cambio |
|---|---|---|
| 1 | 2026-10-20 | Sprint fuera de alcance (SP-06, SP-16, SP-17, SP-18, SP-19) |
| 1.1 | 2026-10-20 | SP-16/SP-19: `SECRETO_SESION` y la forma de `ultimo.json` y `version.json` |
