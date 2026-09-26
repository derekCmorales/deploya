# 11a · Nuevo proyecto · 1 Repositorio

| | |
|---|---|
| Ruta | `/projects/nuevo` |
| Dueño | Eduardo |
| Historias | M3-02 |
| Entrega | A1 |
| Diseño | Canvas Deploya v4.1, artboard `11a-Nuevo-fuente` (https://claude.ai/artifact/B89rty3MNxRKW9RHJQwSZT) |

## Qué es

`Pasos` a la izquierda con recursos del plan; formulario: URL (valida contra GitHub), rama, nombre (define el subdominio), puerto desde `EXPOSE`; tarjeta de Dockerfile encontrado y último commit.

## Componentes

- `AppShell` — header de 56px
- `NavPrincipal`
- `Wordmark`
- `Button`
- `Badge`; para estados `EstadoDespliegue` / `EstadoSuscripcion`
- `Field`
- `Input`
- `Card`
- `Sunken`
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
01
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
Paso 1 · Repositorio
¿Qué repositorio desplegamos?
Repositorio público con un
Dockerfile
en la raíz. El lenguaje y las dependencias los defines tú ahí.
URL del repositorio
https://github.com/tienda-demo/api-tienda
Accesible
Repositorio público · 4 ramas
Rama
main
Nombre del proyecto
api-tienda
URL:
api-tienda.deploya.app
Puerto interno
8080
Tomado de
EXPOSE
. Puedes cambiarlo.
Dockerfile encontrado
/Dockerfile · FROM node:20-alpine · EXPOSE 8080
Listo para construir
a1b2c3d · feat: carrito persistente
Último commit en main · hace 4 min · Derek Calderón
Paso 1 de 3
Cancelar
Continuar
```
