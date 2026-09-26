# 14 · Proyecto · Despliegues

| | |
|---|---|
| Ruta | `/projects/[proyecto]/despliegues` |
| Dueño | Eduardo |
| Historias | M7-02 · M4-02 |
| Entrega | A3 |
| Diseño | Canvas Deploya v4.1, artboard `14-Proyecto-despliegues` (https://claude.ai/artifact/B89rty3MNxRKW9RHJQwSZT) |

## Qué es

Filtros Todos / Saludables / Fallidos; tabla con versión, commit, fecha, duración, estado y digest; fila activa resaltada; «Redesplegar» reconstruye ese commit.

## Componentes

- `AppShell` — header de 56px
- `NavPrincipal`
- `Wordmark`
- `Button`
- `Badge`; para estados `EstadoDespliegue` / `EstadoSuscripcion`
- `Segmented`
- `TabsNav` (rutas) o `Tabs`
- `Card` como panel
- `RielEtapas`
- `Table`
- `Avatar`
- chip de plan (markup local, con `Badge`)

Todos en `apps/web/src/components` (catálogo vivo en `/sistema`). Reglas: [../README.md](../README.md). Cómo armarla: [../guia-construccion.md](../guia-construccion.md).

## Textos de la pantalla

Copia exacta del diseño, en orden de aparición. Los datos (correos, nombres, hashes, fechas) son de ejemplo: vienen de la API.

```text
proyectos
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
Variables
Configuración
Todos
Saludables
Fallidos
Redesplegar vuelve a construir ese commit desde su Dockerfile
Versión
Commit
Fecha
Duración
Estado
Imagen (digest)
#14
feat: carrito persistente
a1b2c3d · main
hoy, 12:04
2 min 41 s
sha256:9f2c4e7a…e41a
Versión activa
#13
fix: validar stock antes de cobrar
e4f5a6b · main
ayer, 18:31
2 min 12 s
sha256:3b8d01fc…77c2
Redesplegar
#12
chore: actualizar dependencias
7c8d9e0 · main
21 sep, 10:02
3 min 05 s
sha256:c41e9a20…0b9d
#11
feat: cupones por categoría
1a2b3c4 · main
20 sep, 16:47
0 min 38 s
Fallido
—
Reintentar
#10
feat: endpoint de inventario
5d6e7f8 · main
18 sep, 09:15
2 min 20 s
sha256:8e02b7d1…a5f3
#9
refactor: capa de pagos
2f3a4b5 · main
15 sep, 14:09
2 min 33 s
sha256:61af0c3e…d218
Se muestran los últimos 20 despliegues del proyecto.
Cargar más
```
