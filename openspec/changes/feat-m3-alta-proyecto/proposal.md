<<<<<<< HEAD
# Propuesta: Alta de Proyectos y Gestión de Interfaz (M3-01 y M3-02)

## Resumen
Implementación del módulo M3 de Proyectos en el backend (NestJS) y la interfaz web en el frontend (Next.js con design system v4.1). Permite registrar repositorios públicos de GitHub, validar su contenido y la existencia de Dockerfiles y puertos expuestos, verificar cuotas de usuario, persistir proyectos en memoria y encolar el despliegue inicial conectando con el motor de construcción (M4 - ConstruccionService).

## Historias de Usuario
- **M3-01 (3 pts):** Lista de proyectos y primer proyecto (pantallas 10 y 10b), búsqueda, contador de cuota contra `cuotaDe`, y estado actualizado por sondeo (*polling*) cada 3 segundos.
- **M3-02 (5 pts):** Alta de proyectos (pantallas 11a, 11d y 11e): ingreso de URL, rama, nombre y puerto obtenido del EXPOSE; manejo de errores de repositorio no accesible o sin Dockerfile; revisión y envío de la solicitud de alta que encola el despliegue en el motor.
=======
# feat/m3-alta-proyecto · Lista y alta de proyectos (M3-01, M3-02)

Módulo: **M3 Proyectos** (`apps/api/src/modules/proyectos`) y sus pantallas en `apps/web/src/app/(projects)`. Historias del Avance 1: M3-01 (3 pts) y M3-02 (5 pts), [docs/plan-avances.md](../../../docs/plan-avances.md).

## Por qué

El recorrido del Avance 1 necesita que un usuario vea sus proyectos, cree uno desde un repositorio público de GitHub con `Dockerfile` y lo mande a desplegar. Sin M3 el motor (M4) no tiene qué construir.

## Qué cambia

- **API:** `GET /proyectos` (lista con `ultimoDespliegue`, `usados`, `maximo` y recursos del plan), `POST /proyectos/validar-repositorio` (accesible, ramas, último commit, Dockerfile y puerto de `EXPOSE`) y `POST /proyectos` (guarda y llama a `ConstruccionService.crearDespliegue(id, "alta")`). `GET /proyectos/health` se mantiene.
- **Puertos:** `ProveedorFuente` (adaptador `FuenteGitHubPublica` sobre la API REST pública), `RepositorioProyectos` (memoria hasta DB-01; el mismo almacén responde al `ProyectosLecturaPuerto` del motor) y `CuotaProyectosPuerto` (stub Sandbox hasta que M2 exporte `cuotaDe`).
- **Errores de dominio** con `codigo` para 11a/11e, traducidos a HTTP por `ErroresProyectosFilter`.
- **Web:** `/projects` (10 y 10b) y `/projects/nuevo` (11a → 11d con 11e) con el design system v4.1, `lib/api.ts` y los hooks `useProyectos`, `useDespliegue`, `useAltaProyecto`. El paso *Variables* va deshabilitado («Llega en la próxima entrega»).
- **Sesión:** el usuario sale de `@UsuarioSolicitante()` del motor hasta que M1 publique `@UsuarioActual()`; nunca del cuerpo. CORS con origen explícito y credenciales.

## Non-goals

- Variables de entorno (M3-03, Avance 2), configuración y eliminación (M3-04), vista de despliegue con bitácora (M7-01).
- Bloqueo por suscripción Vencida o Suspendida (llega con M2-05 y M5-03).
- Detección de stack sin `Dockerfile` (M4-03, Avance 2), repositorios privados, carga por zip.
- Persistencia en Prisma: espera DB-01; hasta entonces el almacén es en memoria y el recorrido en compose con trabajador separado no es posible.

## Impacto

- `AdaptersModule` registra `RepositorioProyectos` y enlaza `ProyectosLecturaPuerto` con `useExisting`.
- `Pasos` no marca como hecho un paso deshabilitado; `Meter` acepta `tonoAlLimite="warn"`.
- `docs/diagramas/compartido/clases-unificado.mmd` actualizado.
>>>>>>> origin/main
