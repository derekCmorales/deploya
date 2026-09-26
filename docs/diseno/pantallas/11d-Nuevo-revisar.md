# 11d · Nuevo proyecto · 3 Revisar

| | |
|---|---|
| Ruta | `/projects/nuevo` |
| Dueño | Eduardo |
| Historias | M3-02 |
| Entrega | A1 |
| Diseño | Canvas Deploya v4.1, artboard `11d-Nuevo-revisar` (https://claude.ai/artifact/B89rty3MNxRKW9RHJQwSZT) |

## Qué es

Resumen con «Editar» por bloque; «Qué pasará» con las cinco etapas; botón **Desplegar**.

## Componentes

- `AppShell` — header de 56px
- `NavPrincipal`
- `Wordmark`
- `Button`
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
Variables
Claves cifradas
03
Revisar
Confirmar y desplegar
Recursos del plan
0.5 vCPU · 512 MB
Límites de Docker para cada contenedor en Starter.
Todo listo para desplegar
Al confirmar, empieza el despliegue #1 y verás en qué etapa va.
Fuente
tienda-demo/api-tienda · main · a1b2c3d
Editar
Construcción
docker build · /Dockerfile
Puerto
8080 → https
4 variables cifradas
Recursos
0.5 vCPU · 512 MB (Starter)
según tu plan
URL
https://api-tienda.deploya.app
automática
Qué pasará
Recepción
Ejecución
Enrutamiento
Operación
Paso 3 de 3
Atrás
Desplegar
```
