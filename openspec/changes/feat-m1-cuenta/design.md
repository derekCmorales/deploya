# Design

## Context

M1-03 dejó `SesionGuard`, `@UsuarioActual()` y `RepositorioSesiones`; M1-05 dejó `revocarTodas(usuarioId)` y la política de contraseña compartida con el registro. Este change solo agrega un caso de uso de perfil y dos de seguridad sobre esos puertos.

## Goals / Non-Goals

**Goals:** editar nombre, cambiar contraseña con la actual (cerrando las otras sesiones) y cerrar todas las sesiones.

**Non-Goals:** cambiar correo, 2FA, lista de dispositivos.

## Decisions

### 1. Un servicio, tres casos de uso

`CuentaService` con `perfil(usuarioId)`, `renombrar(usuarioId, nombre)`, `cambiarContrasena(usuarioId, sesionActualId, actual, nueva)` y `cerrarTodas(usuarioId)`. El controlador solo adapta HTTP y la cookie.

### 2. Nombre como Value Object

`NombreCuenta.de(texto)` recorta y valida 1–64 caracteres; lanza `NombreInvalido`. Es la misma regla que el registro, que pasa a usarlo.

### 3. Revocar «las demás» vs «todas»

`RepositorioSesiones.revocarTodasMenos(usuarioId, sesionId)` (nuevo) para el cambio de contraseña; `revocarTodas(usuarioId)` (ya existe) para «Cerrar todas». El controlador borra la cookie después de `cerrarTodas`.

## Diseño: SOLID y patrones

| Clase / puerto | Patrón | Principio | Por qué |
|---|---|---|---|
| `CuentaService` | Service Layer (casos de uso) | S | Orquesta; las reglas viven en la política y el VO |
| `NombreCuenta` | Value Object | S | Una sola regla de nombre para registro y perfil |
| `PoliticaContrasena` (existente) | Specification | O | La misma política en registro, recuperación y cambio |
| `RepositorioSesiones.revocarTodasMenos` | Repository | I, D | Método nuevo en un puerto estrecho; memoria y Prisma cumplen el mismo contrato (L) |
| `HashContrasena` (existente) | Adapter | D | El servicio no conoce scrypt |

Cambios de clases: `CuentaService`, `CuentaController`, `NombreCuenta`, `RepositorioSesiones.revocarTodasMenos` → `clases-unificado.mmd`.

## Risks / Trade-offs

- **Cerrar todas desde la propia sesión:** la web redirige a `/ingresar` tras el 204; la cookie se borra en el servidor para no depender del cliente.
