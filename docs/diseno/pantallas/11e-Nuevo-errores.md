# 11e · Nuevo proyecto · errores

| | |
|---|---|
| Ruta | `/projects/nuevo` |
| Dueño | Eduardo |
| Historias | M3-02 |
| Entrega | A1 |
| Diseño | Canvas Deploya v4.1, artboard `11e-Nuevo-errores` (https://claude.ai/artifact/B89rty3MNxRKW9RHJQwSZT) |

## Qué es

Repositorio no accesible (código HTTP y lista de qué revisar); falta el Dockerfile (ejemplo copiable).

## Componentes

- `AppShell` — header de 56px
- `NavPrincipal`
- `Wordmark`
- `Button`
- `Field`
- `Input`
- `Card`
- `Sunken`
- `Banner`
- `Avatar`
- chip de plan (markup local, con `Badge`)

Todos en `apps/web/src/components` (catálogo vivo en `/sistema`). Reglas: [../README.md](../README.md). Cómo armarla: [../guia-construccion.md](../guia-construccion.md).

## Textos de la pantalla

Copia exacta del diseño, en orden de aparición. Los datos (correos, nombres, hashes, fechas) son de ejemplo: vienen de la API.

```text
Error · Repositorio no accesible
URL del repositorio
https://github.com/tienda-demo/api-privada
No pudimos acceder al repositorio (HTTP 404).
Revisa que:
· la URL sea correcta y termine en el nombre del repositorio;
· el repositorio sea público (los privados llegarán más adelante).
Reintentar
Error · Falta el Dockerfile
https://github.com/tienda-demo/landing
Accesible
No encontramos un Dockerfile en la raíz de
main
deploya solo construye proyectos que traen su propio Dockerfile.
Agrega un archivo
Dockerfile
como este y vuelve a intentar:
FROM node:20-alpine
WORKDIR /app
COPY . .
RUN npm ci && npm run build
EXPOSE 8080
CMD ["npm", "start"]
Volver a revisar
```
