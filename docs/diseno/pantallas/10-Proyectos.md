# 10 · Proyectos

| | |
|---|---|
| Ruta | `/projects` |
| Dueño | Eduardo |
| Historias | M3-01 |
| Entrega | A1 |
| Diseño | Canvas Deploya v4.1, artboard `10-Proyectos` (https://claude.ai/artifact/B89rty3MNxRKW9RHJQwSZT) |

## Qué es

Lista + detalle: tabla de proyectos con `EstadoDespliegue` y riel de 55px; panel derecho con el seleccionado (riel grande, versión activa, recursos, últimos despliegues). Contador «3 de 3 proyectos en Starter».

## Componentes

- `AppShell` — header de 56px
- `NavPrincipal`
- `Wordmark`
- `Button`
- `Badge`; para estados `EstadoDespliegue` / `EstadoSuscripcion`
- `Input`
- `RielEtapas`
- `Meter`
- `Avatar`
- patrón lista + detalle (ver guía)
- chip de plan (markup local, con `Badge`)

Todos en `apps/web/src/components` (catálogo vivo en `/sistema`). Reglas: [../README.md](../README.md). Cómo armarla: [../guia-construccion.md](../guia-construccion.md).

## Textos de la pantalla

Copia exacta del diseño, en orden de aparición. Los datos (correos, nombres, hashes, fechas) son de ejemplo: vienen de la API.

```text
Proyectos
Plan Starter · un contenedor por proyecto
Buscar proyecto
3 de 3 proyectos en Starter
3 de 3 proyectos en Starter ·
Cambiar plan
Nuevo proyecto
Proyecto
Ciclo
Último
api-tienda
Construyendo
main
a1b2c3d
Dockerfile
hace 2 min
panel-admin
Saludable
9f8e7d6
hace 3 h
worker-correos
Fallido
develop
4c5d6e7
hace 1 d
Proyectos del plan
3 / 3
Seleccionado
Visitar
Abrir proyecto
api-tienda.deploya.app
tienda-demo/api-tienda
Despliegue #14
a1b2c3d · feat: carrito persistente
Recepción
1.4 s
Construcción
01:10
Ejecución
—
Enrutamiento
Operación
Versión activa
#13 · e4f5a6b
Recursos
0.5 vCPU · 512 MB
Plan Starter
Origen
Dockerfile · puerto 8080
Subdominio automático con HTTPS
Últimos despliegues
#14
feat: carrito persistente
#13
e4f5a6b
fix: validar stock antes de cobrar
ayer
#12
7c8d9e0
chore: actualizar dependencias
hace 3 d
```
