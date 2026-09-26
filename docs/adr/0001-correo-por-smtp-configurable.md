# 0001 — Correo por un adaptador SMTP configurable; Mailpit solo en desarrollo

- **Estado:** Propuesto
- **Fecha:** 2026-09-26
- **Autor:** @derekCmorales · **Módulos:** M10 (consumidor: M1)
- **Change de OpenSpec:** el de M10-01 (por crear), que enlaza este ADR

## Contexto

M1 necesita enviar dos correos: verificación de cuenta y recuperación de contraseña. La propuesta descarta un servidor de correo propio: el envío va por un proveedor externo. En desarrollo y en la demo nadie debe recibir correos reales y el equipo tiene que ver el mensaje al instante, por eso el plan usa **Mailpit**, un servidor SMTP falso que atrapa los mensajes y los muestra en una web local.

Mailpit **no entrega correo**, así que no sirve en el VPS. El plan decía «adaptador Mailpit» y el spec solo exigía el adaptador de desarrollo, así que el adaptador quedaba nombrado por una herramienta de pruebas y no había un camino escrito para pasar a un proveedor real ni para cambiarlo después. Eso contradice DIP y OCP ([ingenieria.md §2](../ingenieria.md#2-solid-aplicado-a-deploya)).

## Decisión

Usamos un único `CorreoSmtpAdaptador` (nodemailer) detrás de `CorreoPuerto`. Apunta a Mailpit en desarrollo y al proveedor externo en el VPS. Además usamos un `CorreoConsolaAdaptador` para pruebas. `notificaciones.module.ts` elige el adaptador con `CORREO_ADAPTADOR`, y el adaptador SMTP lee `SMTP_HOST`, `SMTP_PORT`, `SMTP_USUARIO`, `SMTP_CLAVE` y `CORREO_REMITENTE`.

```ts
export abstract class CorreoPuerto {
  abstract enviar(destinatario: string, plantilla: PlantillaCorreo, datos: DatosPlantilla): Promise<void>;
}

// notificaciones.module.ts: único lugar que conoce los adaptadores
{
  provide: CorreoPuerto,
  useFactory: (config: ConfigService) =>
    config.get('CORREO_ADAPTADOR') === 'consola'
      ? new CorreoConsolaAdaptador()
      : new CorreoSmtpAdaptador(config),
  inject: [ConfigService],
}
```

Para producción proponemos **Resend o Brevo por SMTP**. Los dos tienen un plan gratuito suficiente para dos correos transaccionales. El dominio del VPS necesita SPF y DKIM para que los correos no acaben en spam; eso entra en M6-02.

## Alternativas consideradas

| Opción | A favor | En contra |
|---|---|---|
| **Adaptador SMTP configurable** (elegida) | Mailpit y casi todos los proveedores (Resend, Brevo, Postmark, SES) hablan SMTP: cambiar de proveedor = cambiar variables. Un solo adaptador que probar | No aprovecha extras de las API HTTP (webhooks de rebote, métricas) |
| Un adaptador por API HTTP de cada proveedor (SDK de Resend…) | Webhooks y métricas de entrega | Una clase y una dependencia por proveedor; el cambio de proveedor exige código y despliegue |
| Mailpit también en producción | Cero configuración | No entrega correos: el registro real no funcionaría |
| Servidor SMTP propio (Postfix) | Sin dependencia externa | Fuera de alcance según la propuesta; reputación de IP y mantenimiento |

## Consecuencias

- **DIP:** M1 y `ServicioNotificaciones` dependen solo de `CorreoPuerto`. Nadie hace `nodemailer.createTransport()` fuera del adaptador.
- **OCP:** si algún día hace falta la API HTTP de un proveedor, se añade un `CorreoResendAdaptador extends CorreoPuerto` y una rama en el binding. Servicios y plantillas no se tocan.
- **LSP:** los dos adaptadores (y el doble de prueba) cumplen el mismo contrato y lanzan el mismo error de dominio `CorreoNoEnviado`.
- **SRP:** las plantillas (Template Method) arman el HTML; el adaptador solo transporta.
- Mailpit se queda en el compose de desarrollo (ENG-01) y no forma parte del despliegue del VPS.
- Deuda aceptada: sin seguimiento de rebotes ni aperturas en el núcleo.
