# 24 · Correos del sistema

| | |
|---|---|
| Ruta | `— (plantillas M10)` |
| Dueño | Eddy |
| Historias | M10-01 · M10-02 |
| Entrega | A1 (recuperación: A2) |
| Diseño | Canvas Deploya v4.1, artboard `24-Correos` (https://claude.ai/artifact/B89rty3MNxRKW9RHJQwSZT) |

## Qué es

Dos plantillas: verificación (24 h) y recuperación (30 min). Botón + enlace en texto plano + pie con soporte.

## Componentes

- `Wordmark`
- `Button`

Todos en `apps/web/src/components` (catálogo vivo en `/sistema`). Reglas: [../README.md](../README.md). Cómo armarla: [../guia-construccion.md](../guia-construccion.md).

## Textos de la pantalla

Copia exacta del diseño, en orden de aparición. Los datos (correos, nombres, hashes, fechas) son de ejemplo: vienen de la API.

```text
Verificación de cuenta
deploy
a
Cuenta
Confirma tu correo
Hola Derek, para activar tu cuenta en deploya confirma que
derek@tiendademo.com
es tuyo. El enlace caduca en 24 horas.
Verificar correo
¿El botón no funciona? Copia este enlace:
https://deploya.app/…
Si no creaste esta cuenta, ignora este correo.
deploya · soporte@deploya.app
Recuperación de contraseña
Seguridad
Restablece tu contraseña
Pediste crear una contraseña nueva. El enlace sirve una sola vez y caduca en 30 minutos.
Crear contraseña nueva
Si no lo pediste, no hagas nada: tu contraseña sigue igual.
```
