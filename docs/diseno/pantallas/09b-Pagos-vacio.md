# 09b · Historial de pagos · vacío

| | |
|---|---|
| Ruta | `/pagos` |
| Dueño | Javier |
| Historias | M2-06 |
| Entrega | A3 |
| Diseño | Canvas Deploya v4.1, artboard `09b-Pagos-vacio` (https://claude.ai/artifact/B89rty3MNxRKW9RHJQwSZT) |

## Qué es

Estado vacío con «Ver planes».

## Componentes

- `AppShell` — header de 56px
- `NavPrincipal`
- `Wordmark`
- `Button`
- `TabsNav` (rutas) o `Tabs`
- `Avatar`
- chip de plan (markup local, con `Badge`)

Todos en `apps/web/src/components` (catálogo vivo en `/sistema`). Reglas: [../README.md](../README.md). Cómo armarla: [../guia-construccion.md](../guia-construccion.md).

## Textos de la pantalla

Copia exacta del diseño, en orden de aparición. Los datos (correos, nombres, hashes, fechas) son de ejemplo: vienen de la API.

```text
Cobro · Pagos
Historial de pagos
Cuenta nueva · plan Sandbox
Mi suscripción
Planes
Aún no hay pagos
Cuando contrates un plan, aquí verás cada cobro con su comprobante.
Ver planes
```
