# Diseño · feat/m3-alta-proyecto

## Contexto

M3 recibe la fuente, guarda el proyecto y pide a M4 el despliegue #1 por el contrato interno ([docs/contratos/despliegues.md](../../../docs/contratos/despliegues.md) v1). M3 no construye ni corre nada. Pantallas: 10, 10b, 11a, 11d y 11e del canvas v4.1 ([docs/diseno/pantallas](../../../docs/diseno/pantallas/)).

## Flujo

```text
Web 11a ─ POST /proyectos/validar-repositorio ─▶ ProyectosController ─▶ ProyectosService.validarRepositorio ─▶ ProveedorFuente (GitHub)
Web 11d ─ POST /proyectos ─▶ ProyectosController ─ validarAltaProyecto ─▶ ProyectosService.crear
            1. CuotaProyectosPuerto.cuotaDe + RepositorioProyectos.deUsuario  → LimiteProyectosAlcanzado
            2. ProveedorFuente.validar                                        → errores de 11e
            3. subdominioDesdeNombre + existeSubdominio                       → SubdominioEnUso
            4. RepositorioProyectos.guardar
            5. ConstruccionService.crearDespliegue(id, "alta")                → { id, numero: 1, estado: "encolado" }
Web 10  ─ GET /proyectos (cada 3 s mientras algo está en curso) ─▶ listar ─▶ ultimosDespliegues
```

## Diseño: SOLID y patrones

| Pieza | Patrón | Principio | Por qué |
|---|---|---|---|
| `ProveedorFuente` ← `FuenteGitHubPublica` | **Adapter** | D, O | El servicio no sabe que existe GitHub; otra fuente es otra implementación, no un `if`. `fetch`, token y URL base se inyectan por fábrica en el módulo, así el adaptador se prueba con un GitHub falso. |
| `RepositorioProyectos` ← `RepositorioProyectosMemoria` | **Repository** | D, L | Persistencia detrás de un puerto; el adaptador Prisma lo reemplaza en `AdaptersModule` sin tocar el servicio. |
| `ProyectosLecturaPuerto` → `RepositorioProyectos` (`useExisting`) | **Adapter** por DI | I, D | El motor sigue viendo su puerto estrecho (`porId`), pero lee del mismo almacén donde M3 guarda; así `crearDespliegue` encuentra el proyecto. |
| `CuotaProyectosPuerto` ← `CuotaProyectosStub` | **Adapter** / Facade de M2 | I, D | M3 solo necesita `maxProyectos` y recursos; el límite de Sandbox vive en el stub, no en el servicio. |
| `ConstruccionService` | **Facade** consumida | D | Única puerta a M4 (`crearDespliegue`, `ultimosDespliegues`). |
| `puertoDesdeExpose`, `subdominioDesdeNombre`, `repositorioDesdeUrl`, `validarAltaProyecto` | **Funciones puras** | S | Reglas de dominio sin I/O, probadas por tabla. `validarAltaProyecto` reemplaza al DTO (el repo no usa class-validator). |
| `ErrorProyectos` y sus subclases + `ErroresProyectosFilter` | Errores de dominio con nombre | S, O | El servicio lanza errores de dominio; el borde los traduce a HTTP con una tabla por `codigo`. Un error nuevo es una clase y una fila. |
| `ProyectosController` | Adaptador de entrada | S | Solo valida, obtiene el usuario de la sesión (`@UsuarioSolicitante()`) y delega. |
| Web: `PanelProyectos`, `AsistenteAlta` (containers) · `ListaProyectos`, `DetalleProyecto`, `PrimerProyecto`, `PasoRepositorio`, `PasoRevisar`, `LateralAlta` (presentational) | **Container / Presentational** | S | Los componentes no hacen `fetch`; `lib/api.ts` es el único cliente HTTP. |
| `useSondeo` → `useProyectos`, `useDespliegue` | **CQRS ligero** (lectura por polling) | S | Pide cada 3 s solo mientras `despliegueEnCurso` sea verdadero. |
| `lib/proyectos.ts` | Funciones puras | S | Mapeos de estado, textos del contador, errores de 11e; probadas con `node --test`. |

Antipatrones evitados: `Date.now()` en el servicio (el id y `creado` los pone el adaptador con `Reloj`), `usuarioId` desde el cliente, `fetch` en componentes, colores fuera de los tokens.

## Cambios a puertos, clases y componentes

- Nuevos: `ProveedorFuente.validar`, `RepositorioProyectos`, `CuotaProyectosPuerto`, `FuenteGitHubPublica`, `RepositorioProyectosMemoria`, `CuotaProyectosStub`, `ErrorProyectos`.
- `ProyectosLecturaPuerto` ahora apunta a `RepositorioProyectos` (antes `ProyectosLecturaMemoria`, que queda solo para las pruebas del motor).
- `Pasos`: un paso `deshabilitado` no se marca como hecho. `Meter`: `tonoAlLimite="warn"` (en `/sistema` y `docs/diseno/README.md`).
- `docs/diagramas/compartido/clases-unificado.mmd` actualizado.

## Riesgos

- **Límite de GitHub:** sin token son 60 peticiones por hora por IP y cada validación usa 4. Para el ensayo y la demo, definir `GITHUB_TOKEN` (un token sin permisos basta).
- **Compose:** la API y el trabajador son procesos distintos y el almacén es en memoria; el trabajador no ve el proyecto hasta el adaptador Prisma (tras DB-01). En `pnpm dev:api` el alta, la lista y los errores funcionan; el paso a *Saludable* necesita esa persistencia.
