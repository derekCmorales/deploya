# feat/m3-eliminar-proyecto · Eliminar proyecto (M3-04, parte de borrado)

Módulo: **M3 Proyectos**. Pantalla 19b.

## Por qué

Un proyecto cuyo despliegue falló sigue contando contra el límite del plan (`usados` = todos los proyectos del usuario) y no existía forma de borrarlo: el cupo solo se recuperaba reiniciando Docker (que recrea la base). El cliente quedaba bloqueado sin poder crear otro proyecto.

## Qué cambia

- **API:** `DELETE /proyectos/:id` con `{ confirmacion }`. Exige sesión, trata un proyecto ajeno como inexistente (404) y rechaza (400) si `confirmacion` no es el nombre exacto. Borra el proyecto; despliegues, artefactos y variables caen por `onDelete: Cascade`. Libera el cupo sin importar el estado del despliegue.
- **Puerto:** `RepositorioProyectos.eliminar(id)` (Prisma y memoria).
- **Errores de dominio:** `ProyectoNoEncontrado` (404) y `ConfirmacionNoCoincide` (400).
- **Cupo:** un proyecto cuyo último despliegue está `fallido` no cuenta contra el límite del plan (ni en `usados` ni al crear), por ahora.
- **Web:** «Eliminar proyecto» en el detalle de `/projects` con el diálogo 19b (escribir el nombre); al terminar recarga la lista y el contador.

## Non-goals

- Retirar contenedor, imágenes y ruta de Traefik (M5): la API no llama a Docker, así que requiere un trabajo nuevo en la cola del trabajador. **Pendiente**: hasta entonces un contenedor en marcha de un proyecto borrado no se detiene solo. Los despliegues fallidos no dejan contenedor (`aprovisionar` lo elimina si la salud no se alcanza).
- Pantalla de configuración completa (19): nombre, repositorio, rama, puerto.
