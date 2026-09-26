# 05b · Mi cuenta · Seguridad

| | |
|---|---|
| Ruta | `/cuenta/seguridad` |
| Dueño | Eddy |
| Historias | M1-07 |
| Entrega | A3 |
| Diseño | Canvas Deploya v4.1, artboard `05b-Cuenta-Seguridad` (https://claude.ai/artifact/B89rty3MNxRKW9RHJQwSZT) |

## Qué es

Cambiar contraseña con la actual; cerrar sesión en todos los dispositivos.

## Componentes

- `AppShell` — header de 56px
- `NavPrincipal`
- `Wordmark`
- `Button`
- `Field`
- `Input`
- `TabsNav` (rutas) o `Tabs`
- `Card`
- `Avatar`
- chip de plan (markup local, con `Badge`)

Todos en `apps/web/src/components` (catálogo vivo en `/sistema`). Reglas: [../README.md](../README.md). Cómo armarla: [../guia-construccion.md](../guia-construccion.md).

## Textos de la pantalla

Copia exacta del diseño, en orden de aparición. Los datos (correos, nombres, hashes, fechas) son de ejemplo: vienen de la API.

```text
Cuenta
Mi cuenta
Derek Calderón · derek@tiendademo.com
Perfil
Seguridad
Contraseña
Al cambiarla cerramos tus sesiones en otros dispositivos.
Contraseña actual
••••••••••••••
Nueva contraseña
Mínimo 12 caracteres
Confirmar
Repite la nueva
Último cambio: 22 sep 2026
Cambiar contraseña
Sesiones
Si perdiste un dispositivo o dejaste tu cuenta abierta en otro lado.
Cerrar sesión en todos los dispositivos
Invalida todas tus sesiones, incluida esta. Tendrás que volver a iniciar sesión.
Cerrar todas
```
