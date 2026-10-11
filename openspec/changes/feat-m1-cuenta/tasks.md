# Tasks

Requiere `feat-m1-sesion` y `feat-m1-recuperacion` en `main` (ya están). Pruebas sin base, red ni reloj reales.

## 1. Perfil (M1-06)

- [ ] 1.1 `NombreCuenta` (VO, 1–64, recorta) y `NombreInvalido`; el registro pasa a usarlo
- [ ] 1.2 Pruebas: «Editar nombre», «Nombre vacío o de más de 64 caracteres»
- [ ] 1.3 `CuentaService.perfil` y `renombrar`; `GET` y `PATCH /identidad/cuenta`
- [ ] 1.4 Pruebas: «Ver mi cuenta» (correo y rol de solo lectura), sin sesión → 401

## 2. Seguridad (M1-07)

- [ ] 2.1 `RepositorioSesiones.revocarTodasMenos` (Prisma y memoria); `CuentaService.cambiarContrasena` y `cerrarTodas`
- [ ] 2.2 `POST /identidad/cuenta/contrasena` y `DELETE /identidad/sesiones` (borra la cookie)
- [ ] 2.3 Pruebas: «Cambiar contraseña» (las otras sesiones quedan revocadas y la actual no), «Contraseña actual incorrecta», «Nueva contraseña débil», «Cerrar sesión en todos los dispositivos»

## 3. Web

- [ ] 3.1 `/cuenta` (05) y `/cuenta/seguridad` (05b) con la ficha de cada pantalla; enlace «Cuenta» del menú de usuario
- [ ] 3.2 Pruebas `node --test`: validación del nombre en el cliente, «Confirmar» distinto de «Nueva» bloquea el envío
- [ ] 3.3 Revisión contra los artboards 05 y 05b en claro y oscuro

## 4. Cierre

- [ ] 4.1 `clases-unificado.mmd` y `pnpm diagramas:sync`; `pnpm check` en verde; cobertura ≥ 80 % en `identidad/`
- [ ] 4.2 Demo en compose: cambiar la contraseña en un navegador cierra la sesión del otro; «Cerrar todas» lleva a 03
- [ ] 4.3 `/opsx-archive` después del merge
