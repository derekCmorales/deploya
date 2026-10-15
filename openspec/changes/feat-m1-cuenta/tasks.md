# Tasks

Requiere `feat-m1-sesion` y `feat-m1-recuperacion` en `main` (ya están). Pruebas sin base, red ni reloj reales.

## 1. Perfil (M1-06)

- [x] 1.1 `NombreCuenta` (VO, 1–64, recorta) y `NombreInvalido`; el registro pasa a usarlo
- [x] 1.2 Pruebas: «Editar nombre», «Nombre vacío o de más de 64 caracteres»
- [x] 1.3 `CuentaService.perfil` y `renombrar`; `GET` y `PATCH /identidad/cuenta`
- [x] 1.4 Pruebas: «Ver mi cuenta» (correo y rol de solo lectura), sin sesión → 401

## 2. Seguridad (M1-07)

- [x] 2.1 `RepositorioSesiones.revocarTodasMenos` (Prisma y memoria); `CuentaService.cambiarContrasena` y `cerrarTodas`
- [x] 2.2 `POST /identidad/cuenta/contrasena` y `DELETE /identidad/sesiones` (borra la cookie)
- [x] 2.3 Pruebas: «Cambiar contraseña» (las otras sesiones quedan revocadas y la actual no), «Contraseña actual incorrecta», «Nueva contraseña débil», «Cerrar sesión en todos los dispositivos»

## 3. Web

- [x] 3.1 `/cuenta` (05) y `/cuenta/seguridad` (05b) con la ficha de cada pantalla; enlace «Cuenta» del menú de usuario
- [x] 3.2 Pruebas `node --test`: validación del nombre en el cliente, «Confirmar» distinto de «Nueva» bloquea el envío
- [x] 3.3 Revisión contra los artboards 05 y 05b en claro y oscuro (sin «Último cambio», decisión 5)

## 4. Cierre

- [x] 4.1 `clases-unificado.mmd` y `pnpm diagramas:sync`; pruebas en verde (identidad 133, web 144); cobertura de `identidad/` 91 %, 100 % en `CuentaService`, `CuentaController` y `NombreCuenta`
- [x] 4.2 Demo en compose con dos navegadores: cambiar la contraseña en uno cierra la sesión del otro y la actual sigue; «Cerrar todas» lleva a 03
- [ ] 4.3 `/opsx-archive` después del merge
