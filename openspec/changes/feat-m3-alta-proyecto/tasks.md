# Tareas: feat-m3-alta-proyecto

- [ ] **M3.1:** Crear contratos, tipos de dominio (`Proyecto`, `AltaProyecto`, `ValidacionRepositorio`) y excepciones en `dominio/proyecto.ts` y `dominio/errores.ts`.
- [ ] **M3.2:** Implementar la función pura `puertoDesdeExpose` y su archivo de pruebas en `dominio/puerto-expose.spec.ts`.
- [ ] **M3.3:** Implementar la función pura `subdominioDesdeNombre` y su archivo de pruebas en `dominio/subdominio.spec.ts`.
- [ ] **M3.4:** Implementar el adaptador `FuenteGitHubPublica` y su archivo de pruebas con fetch doble en `adaptadores/fuente-github-publica.spec.ts`.
- [ ] **M3.5:** Implementar el repositorio en memoria, el stub de cuotas y el servicio principal `ProyectosService`.
- [ ] **M3.6:** Implementar pruebas unitarias completas en `proyectos.service.spec.ts` utilizando dobles para todos los puertos.
- [ ] **M3.7:** Configurar `ProyectosController`, el filtro de errores `ErroresProyectosFilter` (manteniendo intacto el endpoint de `health`) y sus pruebas en `proyectos.controller.spec.ts`.
- [ ] **M3.8:** Implementar la capa web (`lib/api.ts`, hooks `useProyectos` y vistas `10b`, `10`, `11a`, `11d`, `11e`) usando exclusivamente componentes del sistema y tokens de diseño.
- [ ] **M3.9:** Implementar pruebas web en `apps/web/test/proyectos.test.mjs`.