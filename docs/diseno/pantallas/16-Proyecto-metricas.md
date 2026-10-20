# 16 · Proyecto · Métricas

| | |
|---|---|
| Ruta | `/projects/[proyecto]/metricas` |
| Dueño | Eduardo (SP-10; datos: Derek, SP-07) |
| Historias | SP-10 |
| Entrega | Sprint fuera de alcance |
| Diseño | Canvas Deploya v4.1, página «Sprint · fuera de alcance», artboard `16-Proyecto-metricas` (https://claude.ai/artifact/B89rty3MNxRKW9RHJQwSZT) |
| Datos | [metricas.md](../../contratos/metricas.md) · `GET /proyectos/:id/metricas?rango=1h\|24h` |

## Qué es

Pestaña nueva del proyecto. Banner `warn` desde el 80 % de memoria con «Comparar #13 y #14»; `Segmented` 1 h / 24 h; leyenda; dos `GraficaUso` (memoria y CPU, una escala cada una) con zona de aviso, chips de despliegue, punto en vivo y tooltip; promedios por versión en la cabecera de cada gráfica; «Ver tabla». Sin datos: «El contenedor no está corriendo».

## Componentes

- `AppShell`, `TabsNav`
- `Banner` (`warn`)
- `Segmented`
- `Card`
- `GraficaUso` (nueva)
- `Badge`
- `PuntoVivo`
- `Button`

Todos en `apps/web/src/components` (catálogo vivo en `/sistema`); las gráficas nuevas entran ahí con `feat-m7-metricas`. Reglas: [../README.md](../README.md). Cómo armarla: [../guia-construccion.md](../guia-construccion.md).

## Textos de la pantalla

Copia del diseño, en orden de aparición. Los datos (correos, nombres, hashes, fechas, valores de las gráficas) son de ejemplo: vienen de la API.

```text
proyectos
/
api-tienda
Saludable
api-tienda.deploya.app
main
a1b2c3d
Dockerfile
Visitar
Desplegar
Resumen
Despliegues
Métricas
Bitácoras
Variables
Configuración
La memoria está al 84 % del límite de Starter
Subió unos 90 MB desde la versión #14. Si llega a 512 MB, Docker reinicia el contenedor.
Comparar #13 y #14
Cambiar plan
1 h
24 h
En vivo · una muestra por minuto
Uso
Límite del plan
Zona de aviso
#14
Despliegue
Ahora
Ver tabla
Memoria
84 %
430 MB
de 512 MB
▲ 89 MB desde #14
Promedio con #13: 328 MB · con #14: 417 MB. Pico: 452 MB, hoy 14:00.
0
128
256
384
512
512 MB
límite
aviso 80 %
#13
#14
ayer 18:00
00:00
06:00
12:00
ahora
CPU
24 %
0.12 vCPU
de 0.5 vCPU
pico 0.27 · hoy 03:30
Holgada: nunca pasó del 54 % del límite en 24 h.
0
0.25
0.5
0.5 vCPU
límite
aviso 80 %
#13
#14
ayer 18:00
00:00
06:00
12:00
ahora
```
