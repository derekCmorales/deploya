# Tasks

Cada tarea de código tiene su tarea de pruebas. Sin SMTP, base ni reloj reales.

## 1. Reenviar verificación

- [ ] 1.1 `PoliticaReenvio` y `ESPERA_REENVIO_MS`; `RepositorioTokensCuenta.ultimoDe` e `invalidarVigentes` (si `feat/m1-recuperacion` no lo trajo ya); `POST /identidad/verificacion/reenvio`
- [ ] 1.2 Pruebas: «Reenviar verificación», «Reenvío antes de la cuenta atrás», «Reenvío a una cuenta ya activa» (neutro, sin correo)

## 2. Estados del login

- [x] 2.1 `CuentaSuspendida(motivo, desde)` y su cuerpo en el filtro (`desde` en ISO 8601); el adaptador Prisma de usuarios lee la fecha de la `AccionAdministrativa` `suspender-cuenta` más reciente (sin cambios de schema); `GET /identidad/sesion` ya trae `rol`
- [x] 2.2 Pruebas: «Cuenta suspendida» devuelve motivo y fecha (servicio y filtro 403); sin acción registrada no inventa fecha; «Cuenta sin verificar» devuelve el correo enmascarado; adaptador Prisma con doble (acción más reciente, `null` si no hay)

## 3. Roles

- [x] 3.1 `RolGuard`, `@Roles()`, exportados por `IdentidadModule`; `AdministracionController` con `@UseGuards(SesionGuard, RolGuard)` y `@Roles("administrador")` en `GET /administracion/acceso` (la ruta que la web consulta antes de mostrar `/admin`)
- [x] 3.2 Pruebas: «Cliente en ruta de administración» (403 `SoloAdministracion`), «Administrador en ruta de administración» (200), ruta sin `@Roles` deja pasar, `@Roles` en el controlador, sin usuario de sesión → 401; el `health` de administración sigue público (`rol.guard.spec.ts`, `administracion.controller.spec.ts`)

## 4. Web (02, 03b, 28)

- [ ] 4.1 02: «Reenviar correo» con cuenta atrás desde el 429; 03b: reenviar y suspendida con motivo; 28: 403 y sesión expirada; `/admin` muestra 403 a un Cliente. Hecho: `/admin` → 403 (`components/estados/sin-permisos.tsx`, guard en `app/(admin)/layout.tsx`), 03b suspendida con motivo y fecha, «Sesión expirada» (`pedirApi` avisa el 401 y `SesionProvider` distingue sesión vencida de «nunca hubo»). Falta: reenvío en 02 y 03b
- [ ] 4.2 Pruebas `node --test`: formato de la cuenta atrás, decisión «expirada» frente a «sin sesión», textos de las fichas
- [ ] 4.3 Revisión contra los artboards 02, 03b y 28 en claro y oscuro

## 5. Cierre

- [ ] 5.1 `clases-unificado.mmd` y `pnpm diagramas:sync` (hecho para `RolGuard` y `Roles`; faltan `PoliticaReenvio` y `ultimoDe`)
- [ ] 5.2 `pnpm check` en verde; cobertura ≥ 80 % en `identidad/`
- [ ] 5.3 Avisar a Javier (M9 usa `RolGuard`) y a Eduardo (28 comparte componentes)
- [ ] 5.4 `/opsx-archive` después del merge
