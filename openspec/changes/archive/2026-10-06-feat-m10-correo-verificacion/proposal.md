# Proposal

Change: `feat/m10-correo-verificacion`. Módulo dueño: **notificaciones (M10)** — Eddy. Historia: M10-01 (2 pts, Avance 1). Decisión: [ADR 0001](../../../docs/adr/0001-correo-por-smtp-configurable.md). Pantalla 24.

## Why

M1 necesita mandar el enlace de verificación al registrarse (M1-01). Hoy M10 es solo `health`. Sin un puerto de correo, el registro tendría que hablar SMTP directamente, y cambiar Mailpit por el proveedor del VPS obligaría a tocar código.

## What Changes

- `CorreoPuerto` (`abstract class`) con `enviar(destinatario, plantilla, datos)`, exportado por `NotificacionesModule` y por `notificaciones/index.ts` (API pública del módulo).
- `CorreoSmtpAdaptador` (nodemailer detrás de `TransporteSmtp`) y `CorreoConsolaAdaptador`. Los dos lanzan `CorreoNoEnviado`.
- Binding en `notificaciones.module.ts` según `CORREO_ADAPTADOR`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USUARIO`, `SMTP_CLAVE` y `CORREO_REMITENTE`.
- `PlantillaCorreo` (Template Method) y `PlantillaVerificacion` con el texto de la pantalla 24: botón, enlace en texto plano y pie.
- Compose: la API apunta a Mailpit (`SMTP_HOST=mailpit`).

## Non-goals

- Plantilla de recuperación de contraseña (M10-02, A2).
- Correos de despliegue, de vencimiento de plan o de cuota (fuera de alcance).
- Seguimiento de rebotes o aperturas; SPF y DKIM del dominio (M6-02).

## Capabilities

### New Capabilities

- (ninguna)

### Modified Capabilities

- `notificaciones`: el puerto, los dos adaptadores y la plantilla de verificación quedan concretos (firma, error de dominio y variables).

## Impact

- Código: `apps/api/src/modules/notificaciones`.
- Dependencias: `nodemailer` y `@types/nodemailer`, usados solo en `adaptadores/transporte-nodemailer.ts`.
- Infra: `docker-compose.yml` (variables de correo de la API).
- Consumidor: M1 (`feat/m1-registro-verificacion`).
