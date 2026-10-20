# 13c · Proyecto · Resumen · Últimas 24 h

| | |
|---|---|
| Ruta | `/projects/[proyecto]` (tarjeta nueva) |
| Dueño | Eduardo (SP-11) |
| Historias | SP-11 |
| Entrega | Sprint fuera de alcance |
| Diseño | Canvas Deploya v4.1, página «Sprint · fuera de alcance», artboard `13c-Resumen-ultimas-24h` (https://claude.ai/artifact/B89rty3MNxRKW9RHJQwSZT) |
| Datos | [metricas.md](../../contratos/metricas.md) · `GET /proyectos/:id/metricas?rango=24h` |

## Qué es

Tarjeta del Resumen, debajo de Actividad de despliegues y Último despliegue. CPU y memoria de 24 h con `GraficaUso compacta`, el estado en palabra («Holgada», «Cerca del límite») y «Ver métricas».

## Componentes

- `Card`
- `GraficaUso` `compacta`
- `PuntoVivo`
- `Badge`
- `Button` (`ghost`, `xs`)

Todos en `apps/web/src/components` (catálogo vivo en `/sistema`); las gráficas nuevas entran ahí con `feat-m7-metricas`. Reglas: [../README.md](../README.md). Cómo armarla: [../guia-construccion.md](../guia-construccion.md).

## Textos de la pantalla

Copia del diseño, en orden de aparición. Los datos (correos, nombres, hashes, fechas, valores de las gráficas) son de ejemplo: vienen de la API.

```text
13 · Resumen · tarjeta nueva, debajo de Actividad y Último despliegue
Últimas 24 h
En vivo
Ver métricas
CPU
24 %
0.12 de 0.5 vCPU
Holgada
Memoria
84 %
430 de 512 MB
Cerca del límite
▲ 89 MB desde #14
```
