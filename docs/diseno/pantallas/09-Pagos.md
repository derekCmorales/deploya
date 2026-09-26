# 09 · Historial de pagos

| | |
|---|---|
| Ruta | `/pagos` |
| Dueño | Javier |
| Historias | M2-06 |
| Entrega | A3 |
| Diseño | Canvas Deploya v4.1, artboard `09-Pagos` (https://claude.ai/artifact/B89rty3MNxRKW9RHJQwSZT) |

## Qué es

Tabla de pagos con estado; comprobante en panel lateral con «Descargar PDF». Aviso: cobros simulados, sin valor fiscal.

## Componentes

- `AppShell` — header de 56px
- `NavPrincipal`
- `Wordmark`
- `Button`
- `Badge`; para estados `EstadoDespliegue` / `EstadoSuscripcion`
- `TabsNav` (rutas) o `Tabs`
- `Card` como panel
- `Table`
- `Avatar`
- lista de definición `<dl>` (markup local)
- chip de plan (markup local, con `Badge`)

Todos en `apps/web/src/components` (catálogo vivo en `/sistema`). Reglas: [../README.md](../README.md). Cómo armarla: [../guia-construccion.md](../guia-construccion.md).

## Textos de la pantalla

Copia exacta del diseño, en orden de aparición. Los datos (correos, nombres, hashes, fechas) son de ejemplo: vienen de la API.

```text
Cobro · Pagos
Historial de pagos
Todos los cobros son simulados; los comprobantes no tienen valor fiscal.
Mi suscripción
Planes
Fecha
Concepto
Monto
Estado
03 sep 2026
Plan Starter · 30 días
DPY-2026-000142
USD 5.00
Aprobado
Ver comprobante
DPY-2026-000141
Rechazado
Comprobante
deploy
a
Total pagado
03 sep 2026, 16:10
Plan Starter
Vigencia
03 sep → 03 oct 2026
Método
Prueba •••• 4242
Titular
Derek Calderón
Subtotal
Total
Pago simulado · sin cobro real ni valor fiscal.
Descargar PDF
```
