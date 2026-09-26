# 01 · Registro

| | |
|---|---|
| Ruta | `/registro` |
| Dueño | Eddy |
| Historias | M1-01 |
| Entrega | A1 |
| Diseño | Canvas Deploya v4.1, artboard `01-Registro` (https://claude.ai/artifact/B89rty3MNxRKW9RHJQwSZT) |

## Qué es

Layout partido: formulario de 400px a la izquierda (640px de columna) e ilustración en `sunken` con retícula a la derecha. Header público: Planes · tema · Iniciar sesión.

## Componentes

- `AppShell` — header de 56px
- `Wordmark`
- `Button`
- `Field`
- `Input`
- `RequisitosContrasena`
- ilustración de acceso: SVG propio de la pantalla

Todos en `apps/web/src/components` (catálogo vivo en `/sistema`). Reglas: [../README.md](../README.md). Cómo armarla: [../guia-construccion.md](../guia-construccion.md).

## Textos de la pantalla

Copia exacta del diseño, en orden de aparición. Los datos (correos, nombres, hashes, fechas) son de ejemplo: vienen de la API.

```text
Crear cuenta
Empieza a desplegar
Arrancas en Sandbox: sin costo y sin tarjeta.
Correo
derek@tiendademo.com
Contraseña
••••••••••••••
Mínimo 12 caracteres
Mayúsculas y minúsculas
Al menos un número
Al menos un símbolo
Confirmar contraseña
•••••••••••
Al crearla, la cuenta queda
pendiente de verificación
hasta que confirmes tu correo.
¿Ya tienes cuenta?
Ya tengo cuenta
```
