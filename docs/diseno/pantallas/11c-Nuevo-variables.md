# 11c · Nuevo proyecto · 2 Variables

| | |
|---|---|
| Ruta | `/projects/nuevo` |
| Dueño | Eduardo |
| Historias | M3-03 |
| Entrega | A2 (en A1 el paso se muestra deshabilitado) |
| Diseño | Canvas Deploya v4.1, artboard `11c-Nuevo-variables` (https://claude.ai/artifact/B89rty3MNxRKW9RHJQwSZT) |

## Qué es

Tabla clave / valor enmascarado; «Añadir variable»; aviso de que PORT viene del paso anterior.

## Componentes

- `AppShell` — header de 56px
- `NavPrincipal`
- `Wordmark`
- `Button`
- `Input`
- `Sunken`
- `Card` como panel
- `Avatar`
- chip de plan (markup local, con `Badge`)

Todos en `apps/web/src/components` (catálogo vivo en `/sistema`). Reglas: [../README.md](../README.md). Cómo armarla: [../guia-construccion.md](../guia-construccion.md).

## Textos de la pantalla

Copia exacta del diseño, en orden de aparición. Los datos (correos, nombres, hashes, fechas) son de ejemplo: vienen de la API.

```text
Proyectos
Proyectos · Alta
Nuevo proyecto
2 de 3 proyectos en Starter
Repositorio
URL, rama y Dockerfile
02
Variables
Claves cifradas
03
Revisar
Confirmar y desplegar
Recursos del plan
0.5 vCPU · 512 MB
Límites de Docker para cada contenedor en Starter.
Paso 2 · Variables
Variables de entorno
Se guardan cifradas y se pasan al contenedor al arrancar. Este paso es opcional.
Clave
Valor
DATABASE_URL
••••••••••••••••••••
REDIS_URL
JWT_SECRET
NODE_ENV
production
Añadir variable
Cifradas en la base de datos
No declares
PORT
: lo tomamos del paso anterior (
8080
).
Paso 2 de 3
Atrás
Continuar
```

## Alta guiada (`feat-m3-alta-guiada`)

Ahora es el paso 4 de 5 y copia la experiencia de la pestaña Variables (17): misma `TablaVariables`, «Pegar .env», «Mostrar»/«Ocultar», «Quitar» por fila y contador «n / 150». Si el paso Datos eligió recursos, un `Sunken` lista «Llegan solas de tus recursos de datos» con sus claves («Si declaras una con la misma clave, gana la tuya.») y la fila propia que coincide lleva la insignia «gana la tuya». Los valores ya no se piden en campos de contraseña: se ven como en 17 y se ocultan con «Ocultar».
