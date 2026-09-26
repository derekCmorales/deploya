# 19b · Eliminar proyecto · confirmación

| | |
|---|---|
| Ruta | `/projects/[proyecto]/configuracion` |
| Dueño | Eduardo |
| Historias | M3-04 |
| Entrega | A3 |
| Diseño | Canvas Deploya v4.1, artboard `19b-Eliminar-dialogo` (https://claude.ai/artifact/B89rty3MNxRKW9RHJQwSZT) |

## Qué es

`Dialog` que lista lo que se borra y exige escribir el nombre del proyecto.

## Componentes

- `AppShell` — header de 56px
- `NavPrincipal`
- `Wordmark`
- `Button`
- `Badge`; para estados `EstadoDespliegue` / `EstadoSuscripcion`
- `Field`
- `Input`
- `TabsNav` (rutas) o `Tabs`
- `RielEtapas`
- `Dialog`
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
General
Cambiar el nombre no cambia el subdominio.
Nombre del proyecto
Fuente
De dónde traemos el código en cada despliegue.
Repositorio
https://github.com/tienda-demo/api-tienda
Rama
Contenedor
Se construye con el Dockerfile de tu repositorio.
Ruta del Dockerfile
/Dockerfile
Puerto interno
8080
Los cambios aplican en el próximo despliegue.
Descartar
Guardar cambios
Zona de peligro
Eliminar proyecto
Detiene y borra el contenedor, sus imágenes, variables e historial. No se puede deshacer.
Eliminar api-tienda
Esto detiene el servicio en
y borra de forma permanente:
El contenedor y sus imágenes
6 variables de entorno cifradas
El historial de 14 despliegues
Escribe
para confirmar
Cancelar
```
