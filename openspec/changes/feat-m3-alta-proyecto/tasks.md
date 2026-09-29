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
- [ ] 2.5 `RepositorioProyectosPrisma` y adaptador de `cuotaDe` real (**esperan DB-01 y M2 en `main`**)

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
