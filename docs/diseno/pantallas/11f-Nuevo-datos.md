# 11f · Nuevo proyecto · 3 Datos

| | |
|---|---|
| Ruta | `/projects/nuevo` |
| Dueño | Eduardo (+ Derek) |
| Historias | M3-02 · recursos de datos · alta guiada |
| Entrega | Sprint fuera de alcance · change `feat-m3-alta-guiada` |
| Diseño | Las tarjetas de la pestaña Datos (18) en modo selección; patrón E del asistente |

## Qué es

Paso 3 de 5. Tres tarjetas (PostgreSQL 17 + pgvector, Redis 7, Almacenamiento S3) con `Checkbox`, su descripción y las primeras variables que inyectan. Bajo las tarjetas, el uso del plan. Con el plan lleno, las no elegidas se deshabilitan y aparece el banner «Llegaste al límite de tu plan» con «Cambiar plan». Los recursos se crean antes del despliegue #1.

## Componentes

`Card`, `Checkbox`, `Badge` (variante `outline`, mono), `Banner`, `Button`. Iconos de `iconos-datos.ts`.

## Textos de la pantalla

```text
Paso 3 · Datos
¿Tu app necesita bases de datos?
Se crean con el proyecto, con volumen persistente, y sus variables llegan solas al despliegue #1. Este paso es opcional.
Usas 1 de 3 bases de datos del plan · este proyecto agrega 1
Sin límite de bases de datos
Llegaste al límite de tu plan
Quita uno de los elegidos o cambia de plan para agregar más.
```

## Errores

`409 datos-no-permitidos` al confirmar devuelve al cliente a este paso con el mensaje del plan en un banner `bad`.
