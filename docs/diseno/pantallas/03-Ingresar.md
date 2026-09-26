# 03 · Iniciar sesión

| | |
|---|---|
| Ruta | `/ingresar` |
| Dueño | Eddy |
| Historias | M1-03 |
| Entrega | A1 |
| Diseño | Canvas Deploya v4.1, artboard `03-Ingresar` (https://claude.ai/artifact/B89rty3MNxRKW9RHJQwSZT) |

## Qué es

Mismo layout partido que 01. «Olvidé mi contraseña» como acción de la etiqueta Contraseña.

## Componentes

- `AppShell` — header de 56px
- `Wordmark`
- `Button`
- `Field`
- `Input`
- ilustración de acceso: SVG propio de la pantalla

Todos en `apps/web/src/components` (catálogo vivo en `/sistema`). Reglas: [../README.md](../README.md). Cómo armarla: [../guia-construccion.md](../guia-construccion.md).

## Textos de la pantalla

Copia exacta del diseño, en orden de aparición. Los datos (correos, nombres, hashes, fechas) son de ejemplo: vienen de la API.

```text
Iniciar sesión
Bienvenido de vuelta
Tus proyectos siguen donde los dejaste.
Correo
derek@tiendademo.com
Contraseña
Olvidé mi contraseña
••••••••••••••
tienda-Demo#2026
¿Nuevo en deploya?
Crear cuenta
```
