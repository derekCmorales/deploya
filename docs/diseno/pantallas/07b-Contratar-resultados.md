# 07b · Contratar · resultados

| | |
|---|---|
| Ruta | `/planes/contratar` |
| Dueño | Javier |
| Historias | M2-02 |
| Entrega | A2 |
| Diseño | Canvas Deploya v4.1, artboard `07b-Contratar-resultados` (https://claude.ai/artifact/B89rty3MNxRKW9RHJQwSZT) |

## Qué es

Procesando (pasos con spinner), aprobado (suscripción Activa y comprobante), rechazado (motivo, sin cambios).

## Componentes

- `AppShell` — header de 56px
- `NavPrincipal`
- `Wordmark`
- `Button`
- `Badge`; para estados `EstadoDespliegue` / `EstadoSuscripcion`
- `Card`
- `Sunken`
- `Avatar`
- chip de plan (markup local, con `Badge`)

Todos en `apps/web/src/components` (catálogo vivo en `/sistema`). Reglas: [../README.md](../README.md). Cómo armarla: [../guia-construccion.md](../guia-construccion.md).

## Textos de la pantalla

Copia exacta del diseño, en orden de aparición. Los datos (correos, nombres, hashes, fechas) son de ejemplo: vienen de la API.

```text
Procesando
Confirmando el pago
La pasarela simulada está procesando la tarjeta
•••• 4242
. No cierres esta ventana.
Orden creada
Autorizando con la pasarela
Aplicando cuota del plan
Procesando…
Aprobado
Pago aprobado
Tu plan Starter ya está activo. Las nuevas cuotas se aplicaron de inmediato.
Suscripción
Activa
Vigencia
24 sep → 24 oct 2026
Comprobante
DPY-2026-000184
Ir a proyectos
Rechazado
Pago rechazado
No se aplicó ningún cambio a tu plan.
Motivo
Fondos insuficientes (simulado).
card_declined · 4000 0000 0000 0002
Cambiar tarjeta
Intentar de nuevo
```
