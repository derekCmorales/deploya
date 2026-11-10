# Correo en producción con Resend (L2)

Guía para dejar el correo real del VPS antes del lanzamiento. El código no cambia: el `CorreoSmtpAdaptador` es el mismo que en desarrollo usa Mailpit, y en el VPS apunta a Resend solo con las variables `SMTP_*` ([ADR 0001](adr/0001-correo-por-smtp-configurable.md)). Mailpit no corre en el VPS (perfil `solo-desarrollo` en [docker-compose.vps.yml](../docker-compose.vps.yml)) y no entrega correos.

Se verifica a mano en el servidor: las pruebas unitarias no tocan DNS ni correo ([ingenieria.md §5.5](ingenieria.md)).

## Por qué Resend

| Opción | Plan gratis | SMTP | Veredicto |
|---|---|---|---|
| **Resend** (elegido) | 3 000 correos al mes, 100 al día, 1 dominio | Sí | Sobra para verificación, recuperación y avisos de la demo. Configura el DNS de Cloudflare solo |
| Brevo | 300 correos al día | Sí (`smtp-relay.brevo.com:587`) | Alternativa sin código: solo cambian las variables |
| Cloudflare Email Routing | Gratis | No | Solo **reenvía correo entrante**; no envía |
| Cloudflare `send_email` (Workers) | — | No | Exige un Worker y un adaptador HTTP nuevo; en el plan gratis solo envía a direcciones verificadas, así que no sirve para registrar usuarios |

Los límites son los publicados por cada proveedor al escribir esta guía; revísalos en su web antes de lanzar. Si pasamos de 100 correos al día, se cambia a Brevo o al plan de pago de Resend tocando solo `.env.vps`.

## 1. Cuenta y dominio (una sola vez)

1. Crear la cuenta en <https://resend.com> con el correo del equipo.
2. *Domains → Add domain*: escribir `DOMINIO_BASE` (el mismo de `.env.vps`). Región: la más cercana al VPS.
3. Resend muestra los registros DNS. Como la zona ya está en Cloudflare (la usamos para el certificado comodín, [ADR 0007](adr/0007-certificado-comodin-por-dns-01.md)), hay dos caminos:
   - **Automático:** botón *Sign in to Cloudflare* / *Auto configure*: Resend crea los registros en la zona. DMARC (última fila de la tabla) se añade a mano si no existe.
   - **A mano:** en Cloudflare → *DNS → Records*, copiar exactamente los que da Resend (los tres primeros) y añadir DMARC:

| Tipo | Nombre | Valor | Para qué |
|---|---|---|---|
| TXT | `resend._domainkey` | `p=MIGf…` (la clave que da Resend) | DKIM: firma los correos |
| MX | `send` | `feedback-smtp.<región>.amazonses.com`, prioridad 10 | Rebotes del remitente de sobre |
| TXT | `send` | `v=spf1 include:amazonses.com ~all` | SPF del remitente de sobre |
| TXT | `_dmarc` | `v=DMARC1; p=none;` | DMARC: lo piden Gmail y Outlook |

   Los registros van con **DNS only** (nube gris). No tocan los registros A de `<dominio>` y `*.<dominio>`, ni el MX de la raíz si el dominio ya recibe correo.
4. Pulsar *Verify DNS records* y esperar a que el dominio quede **Verified** (normalmente minutos; hasta unas horas si el DNS tarda).

Si ya existe un TXT SPF en la raíz del dominio, no se duplica: Resend usa el subdominio `send`, así que no hace falta tocarlo.

## 2. Clave de API

*API Keys → Create API key*:

- Nombre: `deploya-vps`.
- Permiso: **Sending access** (no *Full access*).
- Dominio: solo `DOMINIO_BASE`.

Se muestra una sola vez (`re_…`). Va directo a `.env.vps` del servidor y a ningún otro sitio: ni al repo, ni al chat, ni a un issue.

## 3. Variables en el VPS

En el servidor, en `.env.vps` (plantilla en [.env.vps.example](../.env.vps.example)):

```
SMTP_HOST=smtp.resend.com
SMTP_PORT=465
SMTP_USUARIO=resend
SMTP_CLAVE=re_xxxxxxxxxxxxxxxx
CORREO_REMITENTE="Deploya <no-responder@<DOMINIO_BASE>>"
```

- `465` es SMTPS: `transporte-nodemailer.ts` activa TLS directo con ese puerto. Si el proveedor del VPS bloquea el 465, usar `587` (STARTTLS).
- `SMTP_USUARIO` es literalmente `resend`; la contraseña es la clave de API.
- El remitente **tiene que ser del dominio verificado**; si no, Resend rechaza el envío.

Aplicar con el despliegue de siempre:

```bash
scripts/desplegar-vps.sh
```

## 4. Comprobar

1. Registrar una cuenta con un buzón real (Gmail y Outlook, si se puede) y confirmar que llega la **verificación** y no cae en spam.
2. «Olvidé mi contraseña» → llega la **recuperación**.
3. Avisos de 24b: desplegar `hola-deploya` (Saludable), uno que falle (Fallido) y correr el ciclo con `POST /admin/ciclo/ejecutar` para Por vencer y Suspendida.
4. En Gmail, *Mostrar original*: `SPF: PASS`, `DKIM: PASS` y `DMARC: PASS`.
5. En Resend → *Emails* se ve cada envío con su estado (*Delivered*, *Bounced*).

Con eso se marca **L2** en [lanzamiento.md](entrega-final/lanzamiento.md#2-correo-real-l2).

## 5. Si algo falla

| Síntoma | Qué mirar |
|---|---|
| `docker compose` se niega a levantar: `Define SMTP_HOST en .env.vps` | Falta `SMTP_HOST`, `SMTP_PORT` o `CORREO_REMITENTE` en `.env.vps` |
| `CorreoNoEnviado` con `Invalid API key` / `535` | `SMTP_CLAVE` mal copiada, o `SMTP_USUARIO` distinto de `resend` |
| `CorreoNoEnviado` con `domain is not verified` / `403` | El dominio sigue *Pending* en Resend, o `CORREO_REMITENTE` usa otro dominio |
| Tiempo agotado al conectar | El VPS bloquea el puerto saliente: probar `587`; los límites de espera están en `LIMITES_SMTP_MS` |
| Llega a spam | Falta DMARC, o SPF/DKIM no pasan en *Mostrar original*; revisar los registros en Cloudflare |
| `429` o correos que dejan de salir | Límite diario del plan gratis (100): esperar al día siguiente o cambiar de plan o de proveedor |

Cada envío fallido queda en el registro de envíos de la API (Estado de la pantalla 32) con el motivo del proveedor.

## Cambiar de proveedor

Solo variables, sin código ni despliegue de imagen nueva. Brevo, por ejemplo: `SMTP_HOST=smtp-relay.brevo.com`, `SMTP_PORT=587`, `SMTP_USUARIO` = el login SMTP de Brevo, `SMTP_CLAVE` = la clave SMTP, y el dominio verificado en Brevo con sus propios DKIM y SPF.
