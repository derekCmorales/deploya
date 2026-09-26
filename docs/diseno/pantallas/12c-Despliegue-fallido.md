# 12c · Despliegue · Fallido

| | |
|---|---|
| Ruta | `/projects/[proyecto]/despliegues/[n]` |
| Dueño | Eduardo (datos: Derek) |
| Historias | M7-01 · M4-02 |
| Entrega | A2 (reintentar: A3) |
| Diseño | Canvas Deploya v4.1, artboard `12c-Despliegue-fallido` (https://claude.ai/artifact/B89rty3MNxRKW9RHJQwSZT) |

## Qué es

`Banner bad` con código de salida, línea del error e «Ir al error»; la versión anterior sigue sirviendo tráfico; «Reintentar».

## Componentes

- `AppShell` — header de 56px
- `NavPrincipal`
- `Wordmark`
- `Button`
- `Badge`; para estados `EstadoDespliegue` / `EstadoSuscripcion`
- `Card`
- `Card` como panel
- `Bitacora`
- `Avatar`
- chip de plan (markup local, con `Badge`)

Todos en `apps/web/src/components` (catálogo vivo en `/sistema`). Reglas: [../README.md](../README.md). Cómo armarla: [../guia-construccion.md](../guia-construccion.md).

## Textos de la pantalla

Copia exacta del diseño, en orden de aparición. Los datos (correos, nombres, hashes, fechas) son de ejemplo: vienen de la API.

```text
proyectos
api-tienda
despliegues
#14
· versión #14
Fallido
a1b2c3d
feat: carrito persistente
main
Derek Calderón · 12:04
Falló tras
0:40
Etapa
02 · Construcción
Reintentar
Recepción
Completada
1.4 s
Construcción
Falló
38 s
Ejecución
Pendiente
Enrutamiento
Operación
Bitácora de construcción
15 líneas
Copiar
La construcción terminó con código 127
sh: 1: tsc: not found
· línea 13. Tu versión #13 sigue sirviendo tráfico.
Ir al error
1
12:04:01.112
recepción Clonando github.com/tienda-demo/api-tienda (main)
2
12:04:02.540
recepción Commit a1b2c3d · feat: carrito persistente
3
12:04:02.911
construcción Dockerfile encontrado · docker build -t api-tienda:14 .
4
12:04:03.004
construcción [1/5] FROM node:20-alpine
5
12:04:05.318
construcción [2/5] COPY package.json package-lock.json ./
6
12:04:05.402
construcción [3/5] RUN npm ci
7
12:04:03.090
NODE_ENV=production · npm ci --omit=dev
8
12:04:17.402
added 204 packages in 14s
9
12:04:17.610
construcción [4/5] COPY . .
10
12:04:17.955
construcción [5/5] RUN npm run build
11
12:04:18.401
> api-tienda@1.4.0 build
12
12:04:18.402
> tsc -p tsconfig.json
13
12:04:18.433
14
12:04:18.440
construcción ERROR: el paso [5/5] terminó con código 127
15
12:04:18.441
construcción Imagen no generada · la versión #13 sigue activa
```
