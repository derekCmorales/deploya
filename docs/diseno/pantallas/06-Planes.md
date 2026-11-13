# 06 · Planes

| | |
|---|---|
| Ruta | `/planes` |
| Dueño | Javier |
| Historias | M2-01 |
| Entrega | A1 |
| Diseño | Canvas Deploya v4.1, artboard `06-Planes` (https://claude.ai/artifact/B89rty3MNxRKW9RHJQwSZT) |

## Qué es

Pública. `Segmented` 30 / 365 días; cuatro planes; tabla de recursos v4.1; con sesión marca «Plan actual».

Las filas «Recursos de datos» (`maxRecursosDatos`) y «Disco por base» (`discoDatosMb`, en GB) aparecen solo si el catálogo las trae ([recursos-datos.md](../../contratos/recursos-datos.md)); un plan sin el campo muestra «—».

## Componentes

- `AppShell` — header de 56px
- `NavPrincipal`
- `Wordmark`
- `Button`
- `Badge`; para estados `EstadoDespliegue` / `EstadoSuscripcion`
- `Segmented`
- `TabsNav` (rutas) o `Tabs`
- `Avatar`
- chip de plan (markup local, con `Badge`)

Todos en `apps/web/src/components` (catálogo vivo en `/sistema`). Reglas: [../README.md](../README.md). Cómo armarla: [../guia-construccion.md](../guia-construccion.md).

## Textos de la pantalla

Copia exacta del diseño, en orden de aparición. Los datos (correos, nombres, hashes, fechas) son de ejemplo: vienen de la API.

```text
Cobro · Planes
Planes
Tarifa de lanzamiento en USD. Por 365 días pagas 10 meses: dos gratis. Nada se renueva sin tu permiso.
Vigencia
30 días
365 días
Mi suscripción
Historial de pagos
§4.2 · Recursos
Lo que el contenedor de cada proyecto recibe. Se aplica con los límites de Docker.
Sandbox
Sin costo
Para probar deploya con un proyecto.
Cambiar a Sandbox
Starter
Plan actual
USD 6.00
/ 30 días
USD 60.00 por 365 días
Para un servicio pequeño en producción.
Pro
USD 19.00
Para varios servicios con sus datos.
Contratar
Business
USD 49.00
Para sistemas completos con más carga.
Proyectos
1
3
10
25
CPU por proyecto
0.25 vCPU
0.5 vCPU
1 vCPU
2 vCPU
Memoria por proyecto
256 MB
512 MB
1 GB
2 GB
Construcciones / mes
30
150
500
2 000
Recursos de datos
0
3
10
25
Disco por base
—
2 GB
5 GB
20 GB
Bases incluidas
Ninguna: trae tu propia URL
Aparte, desde USD 2
PostgreSQL + Redis
PostgreSQL + Redis + S3
HTTPS con subdominio propio
Reversión a las últimas 5 versiones sin reconstruir
Bitácoras y métricas de 24 h
Datos aparte
Complementos por 30 días, sobre tu plan.
PostgreSQL + pgvector · 2 GB
USD 5.00
Redis
USD 2.00
S3 · 10 GB
USD 4.00
+10 GB de disco
USD 2.00
Todos los proyectos corren en un único servidor (VPS) y se publican en un subdominio
*.deploya.larasolutions.dev
con HTTPS. Sin costos por transferencia ni por peticiones durante el piloto; aún no hay alta disponibilidad.
```
