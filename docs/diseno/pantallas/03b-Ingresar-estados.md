# 03b · Iniciar sesión · estados

| | |
|---|---|
| Ruta | `/ingresar` |
| Dueño | Eddy |
| Historias | M1-03 · suspendida M1-04 |
| Entrega | A1 (suspendida: A2) |
| Diseño | Canvas Deploya v4.1, artboard `03b-Ingresar-estados` (https://claude.ai/artifact/B89rty3MNxRKW9RHJQwSZT) |

## Qué es

Credenciales incorrectas (banner genérico, sin decir cuál falló), cuenta sin verificar (reenviar), suspendida por administración (motivo y caso que registra M9).

## Componentes

- `AppShell` — header de 56px
- `Wordmark`
- `Button`
- `Field`
- `Input`
- `Card`
- `Sunken`
- `Banner`

Todos en `apps/web/src/components` (catálogo vivo en `/sistema`). Reglas: [../README.md](../README.md). Cómo armarla: [../guia-construccion.md](../guia-construccion.md).

## Textos de la pantalla

Copia exacta del diseño, en orden de aparición. Los datos (correos, nombres, hashes, fechas) son de ejemplo: vienen de la API.

```text
Estado · Credenciales incorrectas
Iniciar sesión
Correo o contraseña incorrectos
Revisa los datos e inténtalo de nuevo.
Correo
derek@tiendademo.com
Contraseña
••••••••••••••
Olvidé mi contraseña
Estado · Cuenta sin verificar
Tu cuenta aún no está verificada
Abre el enlace que enviamos a d•••k@t•••••••o.com para activarla.
Reenviar correo
Estado · Suspendida por administración
Cuenta suspendida por administración
No puedes iniciar sesión mientras dure la suspensión. Tus proyectos y datos se conservan.
Motivo registrado
Uso que incumple los términos de servicio (§7.2).
Caso SUP-2291 · 22 sep 2026
Escribir a soporte
soporte@deploya.app
```
