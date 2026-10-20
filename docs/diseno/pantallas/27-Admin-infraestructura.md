# 27 · Admin · Infraestructura

| | |
|---|---|
| Ruta | `/admin/infraestructura` |
| Dueño | Eduardo (SP-13) |
| Historias | SP-13 |
| Entrega | Sprint fuera de alcance · **si da tiempo** |
| Diseño | Canvas Deploya v4.1, página «Sprint · fuera de alcance», artboard `27-Admin-infraestructura` (https://claude.ai/artifact/B89rty3MNxRKW9RHJQwSZT) |
| Datos | [metricas.md](../../contratos/metricas.md) · `MetricasNodoPuerto` · `GET /admin/infraestructura` |

## Qué es

Solo lectura y solo Administrador. CPU, memoria y disco del VPS con `GraficaUso compacta`; cola de construcción (en espera, en curso, fallidas 24 h); tabla de entornos con la última muestra de CPU y memoria.

## Componentes

- `AppShell` admin
- `Card`
- `GraficaUso` `compacta`
- `Table`
- `EstadoDespliegue`
- `Badge`

Todos en `apps/web/src/components` (catálogo vivo en `/sistema`); las gráficas nuevas entran ahí con `feat-m7-metricas`. Reglas: [../README.md](../README.md). Cómo armarla: [../guia-construccion.md](../guia-construccion.md).

## Textos de la pantalla

Copia del diseño, en orden de aparición. Los datos (correos, nombres, hashes, fechas, valores de las gráficas) son de ejemplo: vienen de la API.

```text
Administración
Infraestructura
Solo lectura
VPS · 2 vCPU · 4 GB · actualizado hace 5 s
CPU del nodo
62 %
1.24 vCPU
de 2 vCPU
Memoria
65 %
2.6 GB
de 4 GB
Disco
39 %
31 GB
de 80 GB · imágenes y artefactos
Cola de construcción
BullMQ
En espera
2
En curso
1
Fallidas · 24 h
3
api-tienda
#15
Construyendo
01:12
bot-reservas
#1
Encolado
espera 0:40
landing-finca
#9
Encolado
espera 1:05
Entornos
6 de 41
Proyecto · titular
Despliegue
CPU
Memoria
api-tienda
derek@tiendademo.com
Saludable
0.12
430 MB
panel-admin
derek@tiendademo.com
Saludable
0.08
212 MB
pedidos-api
luis.mendez@agenciaquetzal.gt
Saludable
1.41
1.6 GB
inventario
sofia.lopez@estudiolatte.com
Revirtiendo
0.31
604 MB
menu-aurora
maria.rios@cafeteriaaurora.com
Detenido
—
landing-finca
pedro.castillo@fincaelsol.com
Saludable
0.02
96 MB
CPU y memoria: última muestra de cada contenedor (cada minuto).
```
