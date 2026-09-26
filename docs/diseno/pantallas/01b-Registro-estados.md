# 01b · Registro · estados

| | |
|---|---|
| Ruta | `/registro` |
| Dueño | Eddy |
| Historias | M1-01 |
| Entrega | A1 |
| Diseño | Canvas Deploya v4.1, artboard `01b-Registro-estados` (https://claude.ai/artifact/B89rty3MNxRKW9RHJQwSZT) |

## Qué es

Tres estados del mismo formulario: correo ya registrado (error en el campo + enlaces), enviando (campos deshabilitados, botón con spinner) y resultado pendiente de verificación (correo enmascarado).

## Componentes

- `AppShell` — header de 56px
- `Wordmark`
- `Button`
- `Badge`; para estados `EstadoDespliegue` / `EstadoSuscripcion`
- `Field`
- `Input`
- `Card`
- `Sunken`

Todos en `apps/web/src/components` (catálogo vivo en `/sistema`). Reglas: [../README.md](../README.md). Cómo armarla: [../guia-construccion.md](../guia-construccion.md).

## Textos de la pantalla

Copia exacta del diseño, en orden de aparición. Los datos (correos, nombres, hashes, fechas) son de ejemplo: vienen de la API.

```text
Estado · Correo ya registrado
Crear cuenta
Correo
derek@tiendademo.com
Este correo ya tiene una cuenta.
Iniciar sesión
o
recuperar contraseña
Contraseña
••••••••••••••
Confirmar contraseña
Estado · Enviando
ana.gomez@tiendademo.com
Creando cuenta…
Resultado · Pendiente de verificación
Cuenta creada
Te enviamos un enlace a
a•••z@t•••••••o.com
. La cuenta se activa al abrirlo.
Estado de la cuenta
Pendiente de verificación
Ir a verificar correo
```
