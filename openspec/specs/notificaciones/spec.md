# notificaciones (M10)

Alcance núcleo v4.1 ([docs/alcance.md](../../../docs/alcance.md)): correos transaccionales de verificación de cuenta y recuperación de contraseña. Pantalla 24. Dueño: Eddy.

## Purpose

Entregar por correo los enlaces que M1 necesita, a través de un proveedor externo (no hay servidor de correo propio).

## Requirements

### Requirement: Puerto de correo

El envío SHALL hacerse a través de `CorreoPuerto` (`abstract class`, sin prefijo `I`). Ni M1 ni el servicio de M10 conocen el proveedor concreto: dependen solo del puerto, inyectado por constructor. Mailpit es una herramienta de desarrollo y demo, no el proveedor de producción.

La firma del puerto SHALL ser `enviar(destinatario, plantilla, datos)`: la plantilla compone el mensaje y el adaptador solo lo transporta. M10 SHALL exponer a los demás módulos el puerto, las plantillas y `CorreoNoEnviado` desde `notificaciones/index.ts`; ningún otro módulo importa carpetas internas de M10.

#### Scenario: Envío de verificación

- **WHEN** M1 pide notificar la verificación de correo
- **THEN** M10 entrega el mensaje al adaptador de `CorreoPuerto` y el correo aparece en Mailpit

### Requirement: Proveedor intercambiable por configuración

El binding `CorreoPuerto` → adaptador SHALL decidirse en un solo lugar (el `notificaciones.module.ts`) a partir de variables de entorno (`CORREO_ADAPTADOR`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USUARIO`, `SMTP_CLAVE`, `CORREO_REMITENTE`). SHALL existir dos adaptadores:

- `CorreoSmtpAdaptador`: habla SMTP. Es el mismo en desarrollo (apunta a Mailpit) y en producción (apunta al proveedor externo, p. ej. Resend o Brevo).
- `CorreoConsolaAdaptador`: escribe el mensaje en el log; para pruebas y para correr la API sin Mailpit.

Cambiar de proveedor SMTP SHALL requerir solo cambiar variables de entorno. Un proveedor sin SMTP SHALL entrar como una clase nueva que extienda `CorreoPuerto` y se registre en el mismo binding, sin editar servicios ni plantillas (OCP). Todos los adaptadores SHALL cumplir el mismo contrato y lanzar el mismo error de dominio (`CorreoNoEnviado`) cuando el envío falla (LSP).

El módulo SHALL delegar la decisión en `correoSegun(configuracion, crearTransporte)`, que recibe el transporte SMTP como dependencia para poder probarse sin abrir conexiones; nodemailer SHALL usarse solo en `adaptadores/transporte-nodemailer.ts`. Sin variables definidas, el adaptador SMTP SHALL apuntar a Mailpit en `localhost:1025`.

#### Scenario: Producción con proveedor externo

- **WHEN** la API arranca en el VPS con `CORREO_ADAPTADOR=smtp` y las credenciales SMTP del proveedor
- **THEN** el correo de verificación llega a la bandeja real del cliente sin ningún cambio de código respecto a desarrollo

#### Scenario: Cambio de proveedor

- **WHEN** el equipo sustituye un proveedor SMTP por otro
- **THEN** solo cambian las variables de entorno; ningún archivo de `identidad` ni de `notificaciones` se modifica

#### Scenario: Pruebas sin servidor de correo

- **WHEN** corren las pruebas unitarias o la API con `CORREO_ADAPTADOR=consola`
- **THEN** no se abre ninguna conexión SMTP y el mensaje queda registrado en el log

#### Scenario: Falla del proveedor

- **WHEN** el adaptador no logra entregar el mensaje (credenciales inválidas, proveedor caído)
- **THEN** lanza `CorreoNoEnviado` y M1 lo trata igual sin importar qué adaptador esté activo

### Requirement: Plantillas

El sistema SHALL tener dos plantillas en español con el kit visual: verificación de cuenta (caduca en 24 horas) y recuperación de contraseña (un solo uso, caduca en 30 minutos). Ambas SHALL incluir el enlace en texto plano por si el botón no funciona.

Las plantillas SHALL armarse con un esqueleto común (Template Method, `PlantillaCorreo`): marca, título, párrafo, botón, enlace en texto plano, aviso y pie «deploya · soporte@deploya.app». Cada plantilla aporta solo su asunto, título, párrafo, texto del botón y aviso. Los datos que vienen del usuario (nombre, correo, enlace) SHALL escaparse antes de entrar al HTML.

#### Scenario: Correo de verificación

- **WHEN** M1 pide notificar la verificación a «derek@tiendademo.com»
- **THEN** el mensaje dice «Hola Derek, para activar tu cuenta en deploya confirma que derek@tiendademo.com es tuyo. El enlace caduca en 24 horas.», con el botón «Verificar correo» y el enlace en texto plano

#### Scenario: Correo de recuperación

- **WHEN** M1 pide notificar una recuperación de contraseña
- **THEN** el cliente recibe la plantilla de recuperación con el botón y el enlace en texto plano

## Fuera de alcance · solo si da el tiempo

- Correos de resultado de despliegue (Saludable / Fallido).
- Avisos de plan Por vencer, Vencido y Suspendido (§4.4); en el núcleo esos estados solo se ven en el panel.
- Avisos por proximidad al límite de cuota.
