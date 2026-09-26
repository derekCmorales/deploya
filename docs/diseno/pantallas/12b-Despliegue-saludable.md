# 12b · Despliegue · Saludable

| | |
|---|---|
| Ruta | `/projects/[proyecto]/despliegues/[n]` |
| Dueño | Eduardo (datos: Derek) |
| Historias | M7-01 · M5-02 · M6-01 |
| Entrega | A2 |
| Diseño | Canvas Deploya v4.1, artboard `12b-Despliegue-saludable` (https://claude.ai/artifact/B89rty3MNxRKW9RHJQwSZT) |

## Qué es

Todas las etapas completas; URL con TLS y vencimiento del certificado; bitácora de 8 líneas con el reemplazo #13 → #14.

## Componentes

- `AppShell` — header de 56px
- `NavPrincipal`
- `Wordmark`
- `Button`
- `Badge`; para estados `EstadoDespliegue` / `EstadoSuscripcion`
- `Card`
- `Card` como panel
- `Bitacora`
- `Avatar`
- chip de plan (markup local, con `Badge`)
- toast (fuera del núcleo)

Todos en `apps/web/src/components` (catálogo vivo en `/sistema`). Reglas: [../README.md](../README.md). Cómo armarla: [../guia-construccion.md](../guia-construccion.md).

## Textos de la pantalla

Copia exacta del diseño, en orden de aparición. Los datos (correos, nombres, hashes, fechas) son de ejemplo: vienen de la API.

```text
proyectos
api-tienda
despliegues
#14
· versión #14
Saludable
a1b2c3d
feat: carrito persistente
main
Derek Calderón · 12:04
Duración
2:41
Publicado
hace 18 min
Ver despliegues
Abrir
Recepción
Completada
1.4 s
Construcción
1 min 52 s
Ejecución
21 s
Enrutamiento
9 s
Operación
estable
https://api-tienda.deploya.app
TLS activo
Certificado vigente hasta 23 dic 2026
Bitácora de construcción
8 líneas
Copiar
1
12:04:01.112
recepción Clonando github.com/tienda-demo/api-tienda (main)
2
12:04:02.911
construcción Dockerfile encontrado · docker build -t api-tienda:14 .
3
12:05:53.204
construcción Imagen lista · sha256:9f2c4e7a…e41a (148 MB)
4
12:05:54.010
ejecución Contenedor iniciado · 0.5 vCPU · 512 MB
5
12:06:14.588
ejecución Escuchando en :8080
6
12:06:15.102
enrutamiento api-tienda.deploya.app → v14 · TLS vigente hasta 23 dic 2026
7
12:06:23.771
operación Verificación de salud OK · GET /health 200 en 38 ms
8
12:06:23.772
operación Contenedor #13 detenido · #14 atiende el tráfico
api-tienda está en línea
Versión #14 · reemplazó a la #13
```
