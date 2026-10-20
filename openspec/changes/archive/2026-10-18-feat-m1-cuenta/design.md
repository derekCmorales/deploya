# Design

## Context

M1-03 dejó `SesionGuard`, `@UsuarioActual()` y `RepositorioSesiones`; M1-05 dejó `revocarTodasDe(usuarioId, marca)` y la política de contraseña compartida con el registro. Este change solo agrega un caso de uso de perfil y dos de seguridad sobre esos puertos.

## Goals / Non-Goals

**Goals:** editar nombre, cambiar contraseña con la actual (cerrando las otras sesiones) y cerrar todas las sesiones.

**Non-Goals:** cambiar correo, 2FA, lista de dispositivos.

## Decisions

### 1. Un servicio, tres casos de uso

`CuentaService` con `perfil(usuarioId)`, `renombrar(usuarioId, nombre)`, `cambiarContrasena(usuarioId, tokenSesion, actual, nueva)` y `cerrarTodas(usuarioId)`. El controlador solo adapta HTTP y la cookie: lee el token de la cookie (como `DELETE /identidad/sesion`) y el servicio busca con su huella cuál es la sesión actual. `SesionGuard` no cambia.

### 2. Nombre como Value Object

`NombreCuenta.de(texto)` recorta y valida 1–64 caracteres; lanza `NombreInvalido`. Es la misma regla que el registro, que pasa a usarlo.

### 3. Revocar «las demás» vs «todas»

`RepositorioSesiones.revocarTodasMenos(usuarioId, sesionId, marca)` (nuevo) para el cambio de contraseña; `revocarTodasDe(usuarioId, marca)` (ya existe, M1-05) para «Cerrar todas». El controlador borra la cookie después de `cerrarTodas`.

### 4. Pantallas en un grupo propio, con pestañas

`/cuenta` y `/cuenta/seguridad` viven en el grupo `(cuenta)`, con `RequiereSesion` en su `layout`: Mi cuenta va con el panel (el grupo `(auth)` lleva el header público). Perfil y Seguridad son pestañas bajo el título, como en la ficha y el canvas v4.1. Al guardar el nombre, la web vuelve a leer la sesión para que el encabezado muestre el nombre nuevo.

### 5. «Último cambio» de 05b no se muestra

El canvas muestra «Último cambio: 22 sep 2026», pero no hay columna con la fecha del último cambio de contraseña y este change no agrega migraciones. `Usuario.actualizado` no sirve: cambia con cualquier edición de la fila (por ejemplo, el nombre). Queda anotado en la ficha 05b.

## Diseño: SOLID y patrones

| Clase / puerto | Patrón | Principio | Por qué |
|---|---|---|---|
| `CuentaService` | Service Layer (casos de uso) | S | Orquesta; las reglas viven en la política y el VO |
| `NombreCuenta` | Value Object | S | Una sola regla de nombre para registro y perfil |
| `PoliticaContrasena` (existente) | Specification | O | La misma política en registro, recuperación y cambio |
| `RepositorioSesiones.revocarTodasMenos` | Repository | I, D | Método nuevo en un puerto estrecho; memoria y Prisma cumplen el mismo contrato (L) |
| `HashContrasena` (existente) | Adapter | D | El servicio no conoce scrypt |

Cambios de clases: `CuentaService`, `CuentaController`, `NombreCuenta`, `RepositorioSesiones.revocarTodasMenos` → `clases-unificado.mmd`. Errores nuevos: `NombreInvalido`, `ContrasenaActualIncorrecta` y `ContrasenaRepetida` (400). `ErroresIdentidadFilter` y `textoDe` viven en sus propios archivos (`errores-identidad.filter.ts`, `cuerpo-solicitud.ts`) y `CONFIGURACION_COOKIE` en `cookie-sesion.ts`, para que ningún controlador dependa de otro.

### 6. Orden del cambio de contraseña y confirmación de «Cerrar todas»

`cambiarContrasena` revoca primero las demás sesiones y después guarda el hash nuevo: si revocar falla, la contraseña no cambia, en vez de quedar la clave nueva con las otras sesiones vivas. Una nueva igual a la actual se rechaza (`ContrasenaRepetida`). En la web, «Cerrar todas» abre un `Dialog` de confirmación con los textos de la ficha 05b; solo su botón llama a la API.

## Risks / Trade-offs

- **Cerrar todas desde la propia sesión:** la web redirige a `/ingresar` tras el 204; la cookie se borra en el servidor para no depender del cliente.
