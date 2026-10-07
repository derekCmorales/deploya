<<<<<<< HEAD
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
=======
# Tasks

Cada tarea de código tiene su tarea de pruebas. Sin Docker, red, base ni reloj reales. Nombre de cada `it(...)` = nombre del escenario.

## 1. Dominio

- [x] 1.1 `dominio/`: `Proyecto`, `AltaProyecto`, `ValidacionRepositorio`, errores con `codigo` (`ErrorProyectos`), constantes, `puertoDesdeExpose`, `subdominioDesdeNombre`, `repositorioDesdeUrl`, `validarAltaProyecto`, `validarConsultaRepositorio`
- [x] 1.2 Pruebas: «Puerto desde EXPOSE», «Subdominio desde el nombre», «URL que no es de GitHub» y la validación del cuerpo

## 2. Puertos y adaptadores

- [x] 2.1 `ProveedorFuente` + `FuenteGitHubPublica` (repo, `/branches`, `/commits/:rama`, `/contents/Dockerfile`, `download_url`, token, timeout, URL base)
- [x] 2.2 Pruebas con GitHub falso: «Repositorio válido», «Repositorio no accesible», «Rama inexistente», «Falta el Dockerfile», «GitHub no disponible», directorio `Dockerfile`, archivo de más de 1 MB, token
- [x] 2.3 `RepositorioProyectos` + `RepositorioProyectosMemoria` en `AdaptersModule`; `ProyectosLecturaPuerto` con `useExisting`
- [x] 2.4 `CuotaProyectosPuerto` + `CuotaProyectosStub` (Sandbox)
- [x] 2.5 `RepositorioProyectosPrisma` y adaptador de `cuotaDe` real (en `main` con `feat/m1-sesion` y PR #13)

## 3. Servicio y controlador

- [x] 3.1 `ProyectosService.validarRepositorio`, `listar`, `crear`; `ProyectosController` con `health`, `GET /proyectos`, `POST /proyectos/validar-repositorio`, `POST /proyectos`; `ErroresProyectosFilter`
- [x] 3.2 Pruebas: «Desplegar», «Límite de proyectos del plan», «Subdominio duplicado», «Sin proyectos», «Estado del último despliegue», «Solo sus proyectos», el puerto elegido gana al de `EXPOSE`, el filtro por cada `codigo`
- [x] 3.3 Prueba con Nest real (`AdaptersModule` en modo stub + `ProyectosModule`): «El motor encuentra el proyecto» y `health`
- [x] 3.4 CORS con origen explícito y credenciales

## 4. Web

- [x] 4.1 `lib/api.ts`, `lib/proyectos.ts`, `useSondeo`, `useProyectos`, `useDespliegue`, `useAltaProyecto`
- [x] 4.2 `/projects`: 10 (lista + detalle) y 10b (primer proyecto)
- [x] 4.3 `/projects/nuevo`: 11a, 11d y 11e con `Pasos` (Variables deshabilitado)
- [x] 4.4 Pruebas `node --test`: «Sondeo mientras hay algo en curso», contador y bloqueo en Sandbox, subdominio, errores de 11e por `codigo`, sin `fetch`/`any`/colores de Tailwind en las pantallas
- [x] 4.5 Revisado en claro y oscuro con Playwright (10b → 11e × 2 → 11a → 11d → 10 → límite) y el sondeo Encolado → Construyendo → Saludable

## 5. Cierre

- [x] 5.1 `clases-unificado.mmd` y `pnpm diagramas:sync`
- [x] 5.2 `pnpm check` en verde
- [ ] 5.3 Escenario «Suscripción vencida»: queda para M2-05 / M5-03
- [ ] 5.4 `/opsx-archive` después del merge
>>>>>>> origin/main
