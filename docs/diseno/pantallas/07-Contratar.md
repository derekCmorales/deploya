# 07 · Contratar plan

| | |
|---|---|
| Ruta | `/planes/contratar?plan=` |
| Dueño | Javier |
| Historias | M2-02 |
| Entrega | A2 |
| Diseño | Canvas Deploya v4.1, artboard `07-Contratar` (https://claude.ai/artifact/B89rty3MNxRKW9RHJQwSZT) |

## Qué es

Resumen de orden a la izquierda, tarjeta de prueba a la derecha. Banner «Pasarela simulada». Tarjetas: 4242… aprueba, …0002 rechaza, …3220 tarda 5 s.

## Componentes

- `AppShell` — header de 56px
- `NavPrincipal`
- `Wordmark`
- `Button`
- `Field`
- `Input`
- `Card`
- `Sunken`
- `Avatar`
- chip de plan (markup local, con `Badge`)

Todos en `apps/web/src/components` (catálogo vivo en `/sistema`). Reglas: [../README.md](../README.md). Cómo armarla: [../guia-construccion.md](../guia-construccion.md).

## Textos de la pantalla

Copia exacta del diseño, en orden de aparición. Los datos (correos, nombres, hashes, fechas) son de ejemplo: vienen de la API.

```text
Planes
Plan
02
Pago
03
Resultado
Cobro · Contratar
Confirma tu plan
Revisa el resumen y confirma el pago con la tarjeta de prueba.
Resumen
DPY · orden 000184
Starter
Ascenso desde Sandbox
Vigencia
30 días
Inicio
24 sep 2026
Fin
24 oct 2026
Cuota
se aplica al aprobar
Total
USD 5.00
Sin renovación automática salvo que la actives en Mi suscripción.
Pasarela simulada
No se realiza ningún cobro real. Solo acepta tarjetas de prueba.
Datos de la tarjeta
Cifrado de extremo a extremo
Titular
Derek Calderón
Número de tarjeta
4242 4242 4242 4242
Vencimiento
12 / 28
CVC
123
Tarjetas de prueba
· aprueba
4000 0000 0000 0002
· rechaza
4000 0000 0000 3220
· tarda 5 s
Al confirmar aceptas los términos del plan.
Cancelar
Confirmar pago · USD 5.00
```
