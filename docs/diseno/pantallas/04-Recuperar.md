# 04 · Recuperar contraseña

| | |
|---|---|
| Ruta | `/recuperar · /restablecer?token=` |
| Dueño | Eddy |
| Historias | M1-05 |
| Entrega | A2 |
| Diseño | Canvas Deploya v4.1, artboard `04-Recuperar` (https://claude.ai/artifact/B89rty3MNxRKW9RHJQwSZT) |

## Qué es

Paso 1 solicitar; confirmación neutra («si la cuenta existe…»); paso 2 nueva contraseña con requisitos; token usado o expirado.

## Componentes

- `AppShell` — header de 56px
- `Wordmark`
- `Button`
- `Field`
- `Input`
- `RequisitosContrasena`
- `Card`

Todos en `apps/web/src/components` (catálogo vivo en `/sistema`). Reglas: [../README.md](../README.md). Cómo armarla: [../guia-construccion.md](../guia-construccion.md).

## Textos de la pantalla

Copia exacta del diseño, en orden de aparición. Los datos (correos, nombres, hashes, fechas) son de ejemplo: vienen de la API.

```text
Paso 1 · /auth/recuperar
Recuperar contraseña
Escribe tu correo y te enviamos un enlace para crear una nueva.
Correo
derek@tiendademo.com
Enviar enlace
Volver a iniciar sesión
Paso 1 · Confirmación neutra
Revisa tu correo
Si la cuenta existe, te enviamos un enlace. Caduca en 30 minutos y sirve una sola vez.
Paso 2 · /auth/restablecer
Nueva contraseña
Para
••••••••••••••
Mínimo 12 caracteres
Mayúsculas y minúsculas
Al menos un número
Al menos un símbolo
Confirmar contraseña
Guardar contraseña
Enlace de un solo uso · cierra tus otras sesiones
Estado · Token usado o expirado
Este enlace ya no sirve
Ya se usó o pasaron más de 30 minutos. Pide uno nuevo para continuar.
Pedir un enlace nuevo
```
