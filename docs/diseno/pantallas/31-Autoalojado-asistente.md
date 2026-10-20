# 31 · Autoalojado · Configura tu instalación

| | |
|---|---|
| Ruta | `/configurar` (solo autoalojado y sin administrador) |
| Dueño | Eddy (SP-17) |
| Historias | SP-17 |
| Entrega | Sprint fuera de alcance |
| Diseño | Canvas Deploya v4.1, página «Sprint · fuera de alcance», artboard `31-Autoalojado-asistente` (https://claude.ai/artifact/B89rty3MNxRKW9RHJQwSZT) |
| Datos | [instalacion.md](../../contratos/instalacion.md) · `/instalacion/*` |

## Qué es

Asistente de cinco pasos con `Pasos` en vertical: código de configuración → cuenta de administrador → dominio y HTTPS (solo lectura) → correo → registro y límites. El paso de correo: «Con mi SMTP» (campos y «Enviar correo de prueba») o «Sin correo por ahora» (explica qué cambia).

## Componentes

- Shell de acceso (marca y tema)
- `Pasos` (vertical)
- `Segmented`
- `Field` + `Input` (mono)
- `Banner` (`muted`)
- `Button`

Todos en `apps/web/src/components` (catálogo vivo en `/sistema`); las gráficas nuevas entran ahí con `feat-m7-metricas`. Reglas: [../README.md](../README.md). Cómo armarla: [../guia-construccion.md](../guia-construccion.md).

## Textos de la pantalla

Copia del diseño, en orden de aparición. Los datos (correos, nombres, hashes, fechas, valores de las gráficas) son de ejemplo: vienen de la API.

```text
Configura tu instalación
Paso 4 de 5 · lo puedes cambiar después
Código de configuración
Verificado
Cuenta de administrador
ops@miempresa.com
Dominio y HTTPS
apps.miempresa.com · comodín
4
Correo
SMTP o sin correo
5
Registro y límites
Quién entra y cuánto usa
Versión
v1.0.0
Certificado
vence 18 ene 2027
Servidor
2 vCPU · 4 GB
¿Cómo manda correos esta instalación?
Deploya manda la verificación de cuenta, la recuperación de contraseña y los avisos de despliegue.
Con mi SMTP
Sin correo por ahora
Servidor
smtp.miempresa.com
Puerto
587
STARTTLS
Usuario
deploya@miempresa.com
Contraseña
••••••••••••
Remitente
deploya <no-responder@miempresa.com>
Enviar correo de prueba
Llegó a
ops@miempresa.com
en 1.2 s
Mandamos uno a ops@miempresa.com
Sin correo, deploya sigue funcionando
Las cuentas nuevas se verifican desde Admin · Usuarios, los enlaces de recuperación los genera el administrador y los avisos de despliegue solo se ven en la app. Puedes configurarlo después en Instalación.
Atrás
Continuar
```
