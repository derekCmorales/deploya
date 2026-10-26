# M10 Notificaciones

Dueño: Eddy. Spec: [`openspec/specs/notificaciones/spec.md`](../../../../../openspec/specs/notificaciones/spec.md). Alcance: [docs/alcance.md](../../../../../docs/alcance.md).

**Núcleo v4.1:** `CorreoPuerto` y dos correos: verificación y recuperación. Adaptadores: `CorreoSmtpAdaptador` (Mailpit en desarrollo, proveedor externo en producción; solo cambian variables) y `CorreoConsolaAdaptador` (pruebas). El binding vive en `notificaciones.module.ts`. Decisión: [ADR 0001](../../../../../docs/adr/0001-correo-por-smtp-configurable.md).

**Pantallas:** 24.

**Fuera de alcance (solo si da el tiempo):** Correos de resultado de despliegue, de vencimiento de plan y de cuota.

Hecho (M10-01, change `feat-m10-correo-verificacion`): `CorreoPuerto`, `CorreoSmtpAdaptador`, `CorreoConsolaAdaptador` y `PlantillaVerificacion`. Otros módulos importan solo de `index.ts`. M10-02 (change `feat-m1-recuperacion`): `PlantillaRecuperacion` sobre el mismo esqueleto (botón «Crear contraseña nueva», enlace en texto plano, 30 minutos y un solo uso).

Sprint fuera de alcance (SP-02, change `feat-m10-avisos-correo`): `AvisosPuerto` (contrato `docs/contratos/avisos.md`) con `AvisosCorreo` y las cuatro plantillas de 24b (despliegue saludable y fallido, plan por vencer, suscripción suspendida). Lo exporta `AvisosModule` (`avisos/avisos.module.ts`), que importa este módulo e identidad; lo usan el trabajador de despliegues (M4) y el ciclo (M2). Un fallo de envío se registra y no llega a quien avisa. Los ganchos: el ciclo §4.4 (SP-04, Javier) y `AvisoDespliegueOyente` del pipeline (SP-08, Derek).

SP-17 (change `feat-m1-asistente-instalacion`): en autoalojado, `CorreoSegunInstalacion` (dentro de `CorreoConRegistro`) lee en cada envío cómo manda correos la instalación: el SMTP guardado (clave descifrada con `CifradorVariables`), «sin correo» (no envía ni falla) o las `SMTP_*` del entorno. En la nube no cambia nada (`CORREO_POR_MODO`). `PruebaCorreoPuerto` manda el correo de prueba del asistente con datos que todavía no se guardaron.
