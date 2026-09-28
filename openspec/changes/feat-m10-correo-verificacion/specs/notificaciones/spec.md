# Spec Delta

## MODIFIED Requirements

### Requirement: Puerto de correo

El envío SHALL hacerse a través de `CorreoPuerto` (`abstract class`, sin prefijo `I`) con la firma `enviar(destinatario, plantilla, datos)`. Ni M1 ni M10 conocen el proveedor concreto: dependen solo del puerto, inyectado por constructor. M10 SHALL exportar el puerto, las plantillas y `CorreoNoEnviado` desde `notificaciones/index.ts`. Mailpit es una herramienta de desarrollo y demo, no el proveedor de producción.

#### Scenario: Envío de verificación

- **WHEN** M1 pide notificar la verificación de correo
- **THEN** M10 entrega el mensaje al adaptador de `CorreoPuerto` y el correo aparece en Mailpit

### Requirement: Proveedor intercambiable por configuración

El binding `CorreoPuerto` → adaptador SHALL decidirse en un solo lugar (`notificaciones.module.ts`, vía `correoSegun`) a partir de `CORREO_ADAPTADOR`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USUARIO`, `SMTP_CLAVE` y `CORREO_REMITENTE`. Sin variables, el adaptador SMTP SHALL apuntar a `localhost:1025` (Mailpit). SHALL existir `CorreoSmtpAdaptador` y `CorreoConsolaAdaptador`, y los dos SHALL lanzar `CorreoNoEnviado` cuando el envío falla.

#### Scenario: Producción con proveedor externo

- **WHEN** la API arranca con `CORREO_ADAPTADOR=smtp` y las credenciales SMTP del proveedor
- **THEN** el adaptador SMTP usa ese host, puerto y credenciales sin ningún cambio de código

#### Scenario: Cambio de proveedor

- **WHEN** el equipo sustituye un proveedor SMTP por otro
- **THEN** solo cambian las variables de entorno; ningún archivo de `identidad` ni de `notificaciones` se modifica

#### Scenario: Pruebas sin servidor de correo

- **WHEN** corren las pruebas o la API con `CORREO_ADAPTADOR=consola`
- **THEN** no se abre ninguna conexión SMTP y el mensaje queda registrado en el log

#### Scenario: Falla del proveedor

- **WHEN** el adaptador no logra entregar el mensaje (credenciales inválidas, proveedor caído)
- **THEN** lanza `CorreoNoEnviado` y M1 lo trata igual sin importar qué adaptador esté activo

### Requirement: Plantillas

Las plantillas SHALL armarse con un esqueleto común (Template Method): marca, título, párrafo, botón, enlace en texto plano, aviso y pie «deploya · soporte@deploya.app». Los datos SHALL escaparse antes de entrar al HTML. La plantilla de verificación SHALL decir que el enlace caduca en 24 horas.

#### Scenario: Correo de verificación

- **WHEN** M1 pide notificar la verificación a «derek@tiendademo.com»
- **THEN** el mensaje dice «Hola Derek, para activar tu cuenta en deploya confirma que derek@tiendademo.com es tuyo. El enlace caduca en 24 horas.», con el botón «Verificar correo» y el enlace en texto plano
