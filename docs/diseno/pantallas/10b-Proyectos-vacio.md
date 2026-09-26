# 10b · Proyectos · primer proyecto

| | |
|---|---|
| Ruta | `/projects` |
| Dueño | Eduardo |
| Historias | M3-01 |
| Entrega | A1 |
| Diseño | Canvas Deploya v4.1, artboard `10b-Proyectos-vacio` (https://claude.ai/artifact/B89rty3MNxRKW9RHJQwSZT) |

## Qué es

Estado vacío didáctico: qué necesitas (repo público, Dockerfile en la raíz, un puerto HTTP) y «Crear primer proyecto».

## Componentes

- `AppShell` — header de 56px
- `NavPrincipal`
- `Wordmark`
- `Button`
- `Card`
- `RielEtapas`
- `Avatar`
- chip de plan (markup local, con `Badge`)

Todos en `apps/web/src/components` (catálogo vivo en `/sistema`). Reglas: [../README.md](../README.md). Cómo armarla: [../guia-construccion.md](../guia-construccion.md).

## Textos de la pantalla

Copia exacta del diseño, en orden de aparición. Los datos (correos, nombres, hashes, fechas) son de ejemplo: vienen de la API.

```text
Proyectos
Plan Sandbox · 0 de 1 proyecto
0 / 5 · Nada desplegado todavía
Tu primer proyecto,
en cinco etapas.
Pega la URL de un repositorio público de GitHub que tenga un
Dockerfile
. Construimos la imagen, levantamos el contenedor y te damos una URL con HTTPS.
Lo único que necesitas
Repositorio público
github.com/usuario/proyecto
Dockerfile en la raíz
tú decides lenguaje y versión
Un puerto HTTP
el que indica EXPOSE, p. ej. 8080
Crear primer proyecto
```
