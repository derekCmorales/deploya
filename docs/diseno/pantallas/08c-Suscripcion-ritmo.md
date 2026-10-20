# 08c · Mi suscripción · Ritmo de construcciones

| | |
|---|---|
| Ruta | `/suscripcion` (dentro de `ConsumoPeriodo`) |
| Dueño | Eduardo (SP-15) |
| Historias | SP-15 |
| Entrega | Sprint fuera de alcance |
| Diseño | Canvas Deploya v4.1, página «Sprint · fuera de alcance», artboard `08c-Suscripcion-ritmo` (https://claude.ai/artifact/B89rty3MNxRKW9RHJQwSZT) |
| Datos | [metricas.md](../../contratos/metricas.md) · `GET /observabilidad/consumo/diario` |

## Qué es

Tarjeta dentro de Consumo del período, debajo de los dos medidores. Construcciones acumuladas del **mes calendario UTC** (igual que el bloqueo) contra la cuota del plan, columnas por día, proyección punteada al cierre al ritmo actual, zona de aviso del 80 % y punto en vivo en hoy. Hover por día.

## Componentes

- `Card`
- `GraficaRitmo` (nueva, [README § Gráficas](../README.md#gráficas))
- `Badge` (`warn` con `triangle-alert`)
- `Button` (`ghost`, `xs`)

Todos en `apps/web/src/components` (catálogo vivo en `/sistema`); las gráficas nuevas entran ahí con `feat-m7-metricas`. Reglas: [../README.md](../README.md). Cómo armarla: [../guia-construccion.md](../guia-construccion.md).

## Textos de la pantalla

Copia del diseño, en orden de aparición. Los datos (correos, nombres, hashes, fechas, valores de las gráficas) son de ejemplo: vienen de la API.

```text
08 · Mi suscripción · dentro de Consumo del período, debajo de los dos medidores
Ritmo de construcciones
Octubre · Starter, 150 por mes · se reinicia el 1 nov
Usadas
84 de 150
Promedio
4.2 por día
Al cierre, a este ritmo
~130
En zona de aviso
Acumuladas
Proyección
Por día
Zona de aviso
0
50
100
150
150 · cuota
aviso 80 %
~130
hoy · 20 oct
01 oct
08 oct
15 oct
22 oct
31 oct
No te quedas sin construcciones antes del 1 nov, pero cierras en la zona de aviso. Revertir no gasta construcciones.
Ver planes
```
