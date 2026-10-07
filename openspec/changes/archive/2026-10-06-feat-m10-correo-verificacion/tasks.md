# Tasks

Cada tarea de código tiene su prueba. Sin SMTP, red ni reloj reales: `TransporteSmtp` falso y registro en memoria.

## 1. Puerto y plantilla

- [x] 1.1 `CorreoPuerto`, `CorreoNoEnviado`, `PlantillaCorreo` (Template Method) y `PlantillaVerificacion` con el texto de la pantalla 24
- [x] 1.2 Pruebas: «Correo de verificación» (botón, enlace en texto plano, saludo, 24 horas y pie) y escape de HTML

## 2. Adaptadores y binding

- [x] 2.1 `CorreoSmtpAdaptador` sobre `TransporteSmtp`, `transporteNodemailer`, `CorreoConsolaAdaptador`
- [x] 2.2 `configuracionCorreoDesde` y `correoSegun`; binding en `notificaciones.module.ts`; `notificaciones/index.ts`
- [x] 2.3 Pruebas: «Envío de verificación», «Falla del proveedor» (SMTP y consola), «Pruebas sin servidor de correo», «Producción con proveedor externo», «Cambio de proveedor»

## 3. Infra y documentos

- [x] 3.1 `docker-compose.yml`: la API con `CORREO_ADAPTADOR=smtp`, `SMTP_HOST=mailpit`, `SMTP_PORT=1025` y `CORREO_REMITENTE`
- [x] 3.2 README del módulo y enlace desde ADR 0001 (las clases de M10 en `clases-unificado.mmd` entran con `feat/m1-registro-verificacion`, que ya las usa)
- [x] 3.3 `nodemailer` instalado desde el lockfile y `pnpm build` en verde: CI en `65517cb` y la imagen de `docker compose up --build`
- [x] 3.4 En compose (junto con `feat/m1-registro-verificacion`): el registro dejó el correo «Confirma tu correo en deploya» en Mailpit (http://localhost:8025) con el enlace a `/verificar?token=`
- [x] 3.5 Spec delta corregido tras la revisión: cada requisito conserva el texto vivo (incluida la plantilla de recuperación y el párrafo OCP/LSP) y solo agrega lo nuevo
- [x] 3.6 `/opsx-archive` tras el merge

## Notas

- El escenario «Correo de recuperación» sigue en el spec, pero su plantilla y su prueba llegan con M10-02 (A2). Todos los demás escenarios del delta tienen su `it(...)` en `notificaciones.spec.ts`.
