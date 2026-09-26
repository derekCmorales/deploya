# 12 · Despliegue en curso

| | |
|---|---|
| Ruta | `/projects/[proyecto]/despliegues/[n]` |
| Dueño | Eduardo (datos: Derek) |
| Historias | M7-01 · M4-01 |
| Entrega | A2 (A1: el estado se ve en la lista) |
| Diseño | Canvas Deploya v4.1, artboard `12-Despliegue-construyendo` (https://claude.ai/artifact/B89rty3MNxRKW9RHJQwSZT) |

## Qué es

Cabecera con versión, commit, autor, tiempo transcurrido y «Cancelar despliegue»; riel grande con duración por etapa; bitácora numerada con polling cada 3 s y «Copiar».

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
Construyendo
a1b2c3d
feat: carrito persistente
main
Derek Calderón · 12:04
Transcurrido
Etapa
02 · Construcción
Cancelar despliegue
Recepción
Completada
1.4 s
Construcción
En curso
01:10
Ejecución
Pendiente
Enrutamiento
Operación
Bitácora de construcción
Se actualiza cada 3 s
Copiar
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
12:04:19.877
added 312 packages, and audited 313 packages in 14s
8
12:04:19.880
found 0 vulnerabilities
9
12:04:20.112
construcción [4/5] COPY . .
10
12:04:20.460
construcción [5/5] RUN npm run build
11
12:04:21.003
> api-tienda@1.4.0 build
12
12:04:21.004
> tsc -p tsconfig.json
13
12:04:24.771
src/carrito/repositorio.ts → dist/carrito/repositorio.js
14
12:04:25.308
src/carrito/servicio.ts → dist/carrito/servicio.js
```
