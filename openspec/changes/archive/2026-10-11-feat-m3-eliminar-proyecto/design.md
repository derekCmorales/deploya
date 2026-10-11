# Diseño

- **Repository** (`RepositorioProyectos.eliminar`): el servicio no conoce Prisma; el borrado en cascada lo garantiza el esquema.
- **Política de propiedad:** igual que `ConstruccionService.proyectoDe`: un proyecto ajeno es «no encontrado» para no revelar su existencia.
- **Confirmación en el servidor:** la web deshabilita el botón, pero la API vuelve a comparar el nombre; la regla vive en el dominio, no en la UI.
- **Sin retiro de runtime todavía:** dejar el retiro de contenedor/imágenes a un trabajo de M5 mantiene la regla «la API no llama a Docker» (ADR 0005). Ver Non-goals.
