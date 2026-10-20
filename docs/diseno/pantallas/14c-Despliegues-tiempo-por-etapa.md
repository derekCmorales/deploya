# 14c · Proyecto · Despliegues · Tiempo por etapa

| | |
|---|---|
| Ruta | `/projects/[proyecto]/despliegues` (tarjeta nueva, encima de la tabla) |
| Dueño | Eduardo (SP-14; datos: Derek) |
| Historias | SP-14 |
| Entrega | Sprint fuera de alcance |
| Diseño | Canvas Deploya v4.1, página «Sprint · fuera de alcance», artboard `14c-Despliegues-tiempo-por-etapa` (https://claude.ai/artifact/B89rty3MNxRKW9RHJQwSZT) |
| Datos | [metricas.md](../../contratos/metricas.md) · `GET /proyectos/:id/despliegues/tiempos?ultimos=14` |

## Qué es

Columnas apiladas por etapa del riel para los últimos 14 despliegues: tonos de tinta en el orden del riel, la etapa donde falló en `bad`, la reversión (↺) sin Construcción, mediana punteada. Arriba: mediana, % de Construcción, fallos y última reversión. Tooltip con las cinco etapas.

## Componentes

- `Card`
- `GraficaEtapas` (nueva)

Todos en `apps/web/src/components` (catálogo vivo en `/sistema`); las gráficas nuevas entran ahí con `feat-m7-metricas`. Reglas: [../README.md](../README.md). Cómo armarla: [../guia-construccion.md](../guia-construccion.md).

## Textos de la pantalla

Copia del diseño, en orden de aparición. Los datos (correos, nombres, hashes, fechas, valores de las gráficas) son de ejemplo: vienen de la API.

```text
14 · Despliegues · tarjeta nueva, encima de la tabla
Tiempo por etapa
Últimos 14 despliegues de api-tienda
Mediana
2 min 44 s
Construcción
72 % del tiempo
Fallos
2 de 14
Reversión
38 s · sin construir
Recepción
Construcción
Ejecución
Enrutamiento
Operación
Donde falló
↺
Reversión, sin construir
0 min
1 min
2 min
3 min
#1
#2
#3
#4
falló
#5
#6
#7 ↺
#8
#9
#10
#11
falló
#12
#13
#14
activa
2 min 44 s
mediana
Pasa el cursor por una columna para ver cada etapa. La construcción es lo que más pesa: un
Dockerfile
con caché de dependencias la acorta.
```
