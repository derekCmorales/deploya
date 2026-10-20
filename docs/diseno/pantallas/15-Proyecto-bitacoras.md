# 15 · Proyecto · Bitácoras de ejecución

| | |
|---|---|
| Ruta | `/projects/[proyecto]/bitacoras` |
| Dueño | Eduardo (SP-12) |
| Historias | SP-12 |
| Entrega | Sprint fuera de alcance · **si da tiempo** |
| Diseño | Canvas Deploya v4.1, página «Sprint · fuera de alcance», artboard `15-Proyecto-bitacoras` (https://claude.ai/artifact/B89rty3MNxRKW9RHJQwSZT) |
| Datos | `ContenedorPuerto.bitacora(id, { desde, max: 500 })` · `GET /proyectos/:id/bitacora?desde=` |

## Qué es

Salida del contenedor activo (`docker logs`), consultada cada 3 s (sin WebSocket, ADR 0006). Filtro por nivel, búsqueda, pausa sin perder líneas y descarga. Deploya no guarda estas líneas. La pestaña Bitácoras aparece solo si la historia entra.

## Componentes

- `AppShell`, `TabsNav`
- `Segmented`
- `Input`
- `Bitacora` (`enCurso`)
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
Todos
Info
Aviso
Error
Buscar en la bitácora… (ej. /api/pagos)
Últimas 500 líneas del contenedor
Ejecución
versión #14 · a1b2c3d
Actualizado hace 2 s · cada 3 s
En pausa · 6 líneas nuevas
Pausar
Reanudar
Descargar
1
10:41:52.118
INFO GET /health 200 · 2 ms
2
10:41:53.402
INFO GET /api/productos?categoria=bebidas 200 · 41 ms
3
10:41:53.977
INFO POST /api/carrito/items 201 · 63 ms
4
10:41:55.210
INFO GET /api/carrito 200 · 18 ms
5
10:41:57.644
WARN pool de conexiones al 85 % (17/20)
6
10:41:58.031
INFO POST /api/pedidos 201 · 212 ms
7
10:41:58.903
INFO GET /api/productos/sku-2291 200 · 12 ms
8
10:42:01.515
ERROR POST /api/pagos 502 · pasarela sin respuesta tras 5000 ms
9
10:42:01.516
ERROR at ClientePagos.cobrar (dist/pagos/cliente.js:48:13)
10
10:42:03.087
INFO POST /api/pagos 200 · 380 ms (reintento 1)
11
10:42:05.332
INFO GET /health 200 · 1 ms
12
10:42:07.790
INFO GET /api/productos?pagina=2 200 · 37 ms
13
10:42:10.004
INFO DELETE /api/carrito/items/88 204 · 15 ms
14
10:42:12.448
INFO GET /api/carrito 200 · 16 ms
15
10:42:15.120
INFO GET /health 200 · 2 ms
16
10:42:17.901
INFO POST /api/sesiones 200 · 94 ms
17
10:42:18.233
INFO GET /api/usuarios/yo 200 · 11 ms
17 líneas · 1 error · 1 aviso
Se leen de la salida del contenedor; deploya no las guarda
```
