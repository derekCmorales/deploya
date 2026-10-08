# Design

## Context

`SesionGuard` y `@UsuarioActual()` existen desde M1-03. `TokenCuenta`, `GeneradorToken`, `CorreoPuerto` y `PlantillaVerificacion` existen desde M1-01/M1-02/M10-01. `Usuario` tiene `rol`, `estadoCuenta` y `motivoSuspension`; la fecha de la suspensión no está en `Usuario`: es el `creado` de la `AccionAdministrativa` `suspender-cuenta` más reciente (M9). El adaptador Prisma de usuarios la lee; el servicio no sabe de dónde sale (D).

**Orden de archivo:** el delta parte del texto de `feat/m1-registro-verificacion` y `feat/m1-sesion`; se archiva después de ambos.

## Goals / Non-Goals

**Goals:** reenviar sin abrir un canal para enumerar cuentas; mostrar el motivo de suspensión; bloquear por rol en el servidor, no solo en la web.

**Non-Goals:** pantallas de M9, roles extra (ver proposal).

## Decisions

1. **Cuenta atrás en el servidor.** `PoliticaReenvio.segundosRestantes(ultimoToken.creado, ahora)` (función pura, `ESPERA_REENVIO_MS = 60_000`). La web muestra la cuenta atrás con el número que devuelve el 202 o el 429. Única excepción: al llegar a 02 (a) desde 01b, la pestaña guardó la hora del registro y el botón arranca deshabilitado con lo que falta de los 60 s (artboard 02 a); si el cliente se adelanta, la API responde 429 igual.
2. **Reenvío neutro:** correo inexistente o cuenta ya activa → 202 sin enviar nada, igual que la recuperación.
3. **`RolGuard` se compone con `SesionGuard`:** `@UseGuards(SesionGuard, RolGuard)` y `@Roles("administrador")`. `RolGuard` lee `request.usuario` (lo deja `SesionGuard`) y los metadatos con `Reflector`. Sin `@Roles` deja pasar.
3b. **Ruta de acceso de administración:** mientras M9 no tenga rutas (Avance 3), `AdministracionController` expone `GET /administracion/acceso`, protegida con los dos guards, que devuelve el usuario. La web la consulta antes de mostrar `/admin`: 200 muestra la sección y 403 `SoloAdministracion` muestra la pantalla 28. El `health` sigue público.
4. **Sesión expirada en la web:** `RequiereSesion` distingue «nunca hubo sesión» (va a `/ingresar`) de «la sesión venció» (respuesta 401 tras haber tenido usuario). En ese caso el panel queda atenuado bajo el diálogo «Tu sesión expiró» de 28 (como en el artboard), y «Iniciar sesión» o cerrar el diálogo llevan a `/ingresar?expirada=1&siguiente=<ruta>`, que repite el aviso en un banner y vuelve a la misma página.

## Diseño: SOLID y patrones

| Clase / puerto | Patrón | Principio | Por qué |
|---|---|---|---|
| `RolGuard` + `@Roles()` | Decorator / Chain of Responsibility (guards de Nest) | S, O | Autorización fuera de los controladores; una ruta nueva solo se anota |
| `PoliticaReenvio` | Objeto de dominio puro | S | La regla de 60 s se prueba sin reloj real |
| `CuentaSuspendida` con `motivo` | Error de dominio con datos | — | El filtro lo traduce sin conocer M9 |
| `RepositorioTokensCuenta.ultimoDe(usuarioId, tipo)` | Repository | I | Un método estrecho para la cuenta atrás |

Cambios para `clases-unificado.mmd`: `RolGuard`, `Roles`, `PoliticaReenvio`, método `ultimoDe`.

## Risks / Trade-offs

- **429 revela que la cuenta existe y está pendiente.** Aceptado: solo tras un primer reenvío exitoso y sin datos de la cuenta; la alternativa (cuenta atrás solo en la web) se salta con `curl`.
- **Toca `administracion` de Javier:** solo agrega los decoradores al controlador; se avisa en el PR.

## Open Questions

- ¿El administrador entra a `/projects`? Propuesta: sí, como cualquier usuario; el rol solo agrega permisos.
