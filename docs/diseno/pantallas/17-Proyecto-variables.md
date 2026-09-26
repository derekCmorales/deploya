# 17 · Proyecto · Variables de entorno

| | |
|---|---|
| Ruta | `/projects/[proyecto]/variables` |
| Dueño | Eduardo |
| Historias | M3-03 |
| Entrega | A2 |
| Diseño | Canvas Deploya v4.1, artboard `17-Proyecto-variables` (https://claude.ai/artifact/B89rty3MNxRKW9RHJQwSZT) |

## Qué es

Banner de cambios sin aplicar con Descartar / Guardar / Guardar y desplegar; mostrar u ocultar cada valor; variable nueva marcada.

## Componentes

- `AppShell` — header de 56px
- `NavPrincipal`
- `Wordmark`
- `Button`
- `Badge`; para estados `EstadoDespliegue` / `EstadoSuscripcion`
- `Input`
- `TabsNav` (rutas) o `Tabs`
- `Card` como panel
- `Banner`
- `RielEtapas`
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
2 cambios sin aplicar
Se aplican en el próximo despliegue. El contenedor actual sigue con las anteriores.
Descartar
Guardar
Guardar y desplegar
Clave
Valor
Actualizada
DATABASE_URL
••••••••••••
Mostrar
hace 6 d
REDIS_URL
redis://cache.tiendademo.com:6379
Ocultar
JWT_SECRET
PAGOS_API_KEY
hace 2 min
PAGOS_TIMEOUT_MS
Nueva
NODE_ENV
production
CLAVE
valor
Añadir variable
```
