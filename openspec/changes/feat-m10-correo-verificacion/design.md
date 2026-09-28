# Design

## Contexto

ADR 0001 fija un único adaptador SMTP para Mailpit y para el proveedor real, más uno de consola. Este change lo lleva a código sin que M1 conozca el proveedor.

## Diseño: SOLID y patrones

| Pieza | Patrón | Principio |
|---|---|---|
| `CorreoPuerto` (`abstract class`, token de Nest) | Puerto de salida (hexagonal) | **D**: M1 depende de la abstracción. **I**: un solo método |
| `CorreoSmtpAdaptador`, `CorreoConsolaAdaptador` | Adapter | **L**: mismo contrato y mismo error (`CorreoNoEnviado`). **O**: un proveedor sin SMTP es una clase nueva y una rama en `correoSegun` |
| `TransporteSmtp` + `transporteNodemailer` | Adapter sobre nodemailer | **D**: el adaptador recibe el transporte, así se prueba sin abrir conexiones |
| `correoSegun(configuracion, crearTransporte)` | Factory | **S**: el único lugar que decide el adaptador |
| `PlantillaCorreo` → `PlantillaVerificacion` | Template Method | **S**: la plantilla arma el mensaje; el adaptador solo lo transporta |

`enviar` recibe la plantilla y los datos (firma de `clases-unificado.mmd`); el adaptador llama a `plantilla.componer(datos)` y transporta el resultado.

## Decisiones

- **El HTML escapa los datos** (`escaparHtml`): el correo lleva el correo del usuario y el enlace.
- **Colores en línea en el HTML del correo**: los clientes de correo no leen los tokens de `globals.css`. Es la única excepción a «sin hex» y se limita a la plantilla.
- **`notificaciones/index.ts`** es la API pública: M1 importa de ahí, no de carpetas internas.
- **Puerto 465 ⇒ TLS implícito**; en otro puerto nodemailer usa STARTTLS si el servidor lo ofrece.

## Riesgos

- Sin `nodemailer` instalado, `nest build` falla. Las pruebas no lo importan: usan un `TransporteSmtp` falso.

## Diagramas

`docs/diagramas/compartido/clases-unificado.mmd`: se agregan `PlantillaCorreo`, `PlantillaVerificacion` y `CorreoNoEnviado`.
