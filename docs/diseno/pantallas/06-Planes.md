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
Precios en USD. Pagas por vigencia; nada se renueva sin tu permiso.
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
USD 5.00
/ 30 días
Para un servicio pequeño en producción.
Pro
USD 15.00
Para varios servicios pequeños.
Contratar
Business
USD 40.00
Para servicios con más carga.
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
Todos los proyectos corren en un único servidor (VPS) y se publican en un subdominio
*.deploya.app
con HTTPS.
```
