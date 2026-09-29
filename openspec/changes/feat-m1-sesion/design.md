# Design

## Contexto

M1-01 y M1-02 dejaron cuentas activas en memoria. M3 y M4 esperaban `@UsuarioActual()` y usaban `@UsuarioSolicitante()` con `USUARIO_DESARROLLO`. DB-01 (Javier) ya está en `main`.

## Decisiones

1. **Cookie HttpOnly con token opaco, no JWT.** Revocar es borrar una fila; el token nunca es legible desde JavaScript. La base guarda solo `sha256(token)` (misma idea que `TokenCuenta`).
2. **Vigencia por inactividad (7 días).** `ultimaActividad` se refresca como mucho cada 5 minutos para no escribir en cada petición del sondeo de la lista (cada 3 s).
3. **Guard por ruta, no global.** Los `health` y las rutas públicas (registro, verificación, planes) siguen abiertos; `SesionGuard` va en los controladores de M3 y M4.
4. **La web no decide la sesión.** `RequiereSesion` lee `GET /identidad/sesion`; la cookie no se inspecciona en Next porque en el VPS la API vive en otro host.
5. **Persistencia única.** API y trabajador comparten PostgreSQL; los repositorios en memoria quedan como dobles de prueba con la misma semántica.

## Diseño: SOLID y patrones

| Pieza | Patrón | Principio |
|---|---|---|
| `SesionService` separado de `IdentidadService` | Service | S: registro/verificación y sesión cambian por razones distintas |
| `RepositorioSesiones`, `RepositorioUsuarios`, `RepositorioTokensCuenta` (abstract class) | Repository | D: el servicio no conoce Prisma; I: puertos de 3 a 4 métodos |
| `RepositorioSesionesPrisma` / `RepositorioSesionesMemoria` | Adapter | L: ambos cumplen el mismo contrato y las pruebas corren sobre el de memoria |
| `SesionGuard` + `@UsuarioActual()` | Guard / Decorator (Nest) | O: M3 y M4 se protegen agregando el guard, sin tocar su servicio |
| `AsignacionSandboxSuscripciones`, `CuotaProyectosSuscripciones`, `CuotaPlanSuscripciones` | Adapter sobre Facade (`SuscripcionesService`) | D e I: cada consumidor ve solo lo que usa de M2 |
| `sesionVigente`, `debeRefrescarActividad` | Funciones puras de dominio | Reloj inyectado, sin `Date.now()` |

## Cambios de puertos y clases

- Nuevos: `RepositorioSesiones`, `SesionService`, `SesionGuard`, `UsuarioActual`, adaptadores Prisma del motor y de M1, adaptadores sobre `SuscripcionesService`.
- Borrados: `UsuarioSolicitante`, `AsignacionSandboxStub`; `CuotaPlanStub` y `CuotaProyectosStub` quedan solo como dobles de prueba.
- `docs/diagramas/compartido/clases-unificado.mmd` actualizado.

## Riesgos

- Mismo sitio (localhost) entre web y API en desarrollo: SameSite=Lax basta. En el VPS (M6-02) la web y la API deben compartir dominio registrable.
