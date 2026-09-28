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
- [ ] 3.3 Instalar `nodemailer` (`pnpm install`) en una red sin inspección TLS y verificar `pnpm build` (CI lo instala del lockfile)
- [ ] 3.4 En compose: registrar una cuenta y ver el correo en Mailpit (http://localhost:8025)
- [ ] 3.5 `/opsx-archive` tras el merge
