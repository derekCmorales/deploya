# 05 · Mi cuenta · Perfil

| | |
|---|---|
| Ruta | `/cuenta` |
| Dueño | Eddy |
| Historias | M1-06 |
| Entrega | A3 |
| Diseño | Canvas Deploya v4.1, artboard `05-Cuenta-Perfil` (https://claude.ai/artifact/B89rty3MNxRKW9RHJQwSZT) |

## Qué es

Navegación lateral Perfil / Seguridad. Nombre editable (≤ 64); correo y rol de solo lectura.

## Componentes

- `AppShell` — header de 56px
- `NavPrincipal`
- `Wordmark`
- `Button`
- `Badge`; para estados `EstadoDespliegue` / `EstadoSuscripcion`
- `Field`
- `Input`
- `TabsNav` (rutas) o `Tabs`
- `Card`
- `Sunken`
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
El nombre con el que aparece tu cuenta.
DC
Derek Calderón
Iniciales generadas a partir del nombre
Nombre
Máximo 64 caracteres.
Guardar
Correo
Solo lectura.
derek@tiendademo.com
Verificado
Es tu usuario para iniciar sesión. Por ahora no se puede cambiar.
Rol
Cliente o Administrador. Lo asigna administración.
Cliente
Alta: 03 sep 2026
```
