# 13 · Proyecto · Resumen

| | |
|---|---|
| Ruta | `/projects/[proyecto]` |
| Dueño | Eduardo |
| Historias | M7-02 · M7-03 |
| Entrega | A3 |
| Diseño | Canvas Deploya v4.1, artboard `13-Proyecto-resumen` (https://claude.ai/artifact/B89rty3MNxRKW9RHJQwSZT) |

## Qué es

Cabecera del proyecto con acciones (Visitar, Reiniciar, Detener, Desplegar); `TabsNav` Resumen · Despliegues · Variables · Configuración; estado actual, versión activa, recursos aplicados, `MapaActividad`, `LineaTiempo` del último despliegue.

## Componentes

- `AppShell` — header de 56px
- `NavPrincipal`
- `Wordmark`
- `Button`
- `Badge`; para estados `EstadoDespliegue` / `EstadoSuscripcion`
- `TabsNav` (rutas) o `Tabs`
- `Card`
- `RielEtapas`
- `CopyField`
- `MapaActividad`
- `LineaTiempo`
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
Reiniciar
Detener
Desplegar
Cambiar rama
Eliminar proyecto
Resumen
Despliegues
Variables
Configuración
Estado actual
Actualizado hace 4 s
URL pública
https://api-tienda.deploya.app
Copiar
Copiado
Recepción
1.4 s
Construcción
1 min 52 s
Ejecución
21 s
Enrutamiento
9 s
Operación
estable · 18 min
Versión activa
#14
feat: carrito persistente
Imagen
sha256:9f2c4e7a…e41a
148 MB · construida en 1 min 52 s
Publicada
hoy, 12:06
por Derek Calderón
Recursos aplicados
Starter
CPU
0.5 vCPU
Memoria
512 MB
Puerto
8080 → 443
Aplicados con
--cpus
y
--memory
de Docker.
Actividad de despliegues
12 semanas · 38 despliegues · 2 con fallo
Menos
Más
Con fallo
Último despliegue · #14
2 min 41 s
Commit recibido
a1b2c3d · feat: carrito persistente
12:04:01
Imagen construida
desde tu Dockerfile · 148 MB
12:05:53
Contenedor iniciado
0.5 vCPU · 512 MB
12:05:54
Tráfico redirigido
#13 detenido · #14 en línea
12:06:23
```
