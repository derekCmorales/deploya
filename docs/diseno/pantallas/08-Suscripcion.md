# 08 · Mi suscripción

| | |
|---|---|
| Ruta | `/suscripcion` |
| Dueño | Javier (consumo: Eduardo) |
| Historias | M2-03 · M2-04 · M7-03 |
| Entrega | A2 (consumo y actividad: A3) |
| Diseño | Canvas Deploya v4.1, artboard `08-Suscripcion` (https://claude.ai/artifact/B89rty3MNxRKW9RHJQwSZT) |

## Qué es

Plan actual con `EstadoSuscripcion`, vigencia con barra y días restantes, `Meter` de proyectos y construcciones, cambiar plan (ascenso inmediato, descenso al vencer).

## Componentes

- `AppShell` — header de 56px
- `NavPrincipal`
- `Wordmark`
- `Button`
- `Badge`; para estados `EstadoDespliegue` / `EstadoSuscripcion`
- `TabsNav` (rutas) o `Tabs`
- `Card`
- `Card` como panel
- `Meter`
- `Avatar`
- chip de plan (markup local, con `Badge`)

Todos en `apps/web/src/components` (catálogo vivo en `/sistema`). Reglas: [../README.md](../README.md). Cómo armarla: [../guia-construccion.md](../guia-construccion.md).

## Textos de la pantalla

Copia exacta del diseño, en orden de aparición. Los datos (correos, nombres, hashes, fechas) son de ejemplo: vienen de la API.

```text
Cobro · Suscripción
Mi suscripción
Titular Derek Calderón
Planes
Historial de pagos
Plan actual
Starter
Activa
USD 5.00 / 30 días · sin renovación automática
Vigencia
9 días
restantes
03 sep
hoy · 24 sep
03 oct 2026
Renovar ahora
Cambiar plan
Consumo del período
Se reinicia el 03 oct
Proyectos
Al límite
3
/ 3
Límite del plan
Construcciones
64 %
96
/ 150
Si llegas al límite, no podrás crear más proyectos ni lanzar más construcciones este mes.
El nuevo plan empieza hoy
Pro
USD 15.00
Ascenso
Pagas USD 15.00 y arrancan 30 días nuevos.
Cambiar a Pro
Business
USD 40.00
Pagas USD 40.00 y arrancan 30 días nuevos.
Cambiar a Business
Sandbox
Sin costo
Descenso
Aplica cuando termine tu vigencia actual.
Cambiar a Sandbox
```
