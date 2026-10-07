# Tasks

Cada tarea de código tiene su tarea de pruebas. Sin SMTP, base ni reloj reales.

## 1. Reenviar verificación

- [x] 1.1 `PoliticaReenvio` y `ESPERA_REENVIO_MS`; `RepositorioTokensCuenta.ultimoDe` (memoria y Prisma; `invalidarVigentes` llegó con `feat-m1-recuperacion`); `POST /identidad/verificacion/reenvio` con `{ correo }` o con el `{ token }` vencido de 02 (c); 202 trae `segundos` para que la web arranque la cuenta atrás
- [x] 1.2 Pruebas: «Reenviar verificación», «Reenvío antes de la cuenta atrás» (40 s a los 20 s), «Reenvío a una cuenta ya activa» (neutro, sin correo, también correo inexistente); por token; fallo del correo; controlador 202 y 429; `PoliticaReenvio`; `ultimoDe`

## 2. Estados del login

- [x] 2.1 `CuentaSuspendida(motivo, desde)` y su cuerpo en el filtro (`desde` en ISO 8601); el adaptador Prisma de usuarios lee la fecha de la `AccionAdministrativa` `suspender-cuenta` más reciente (sin cambios de schema); `GET /identidad/sesion` ya trae `rol`
- [x] 2.2 Pruebas: «Cuenta suspendida» devuelve motivo y fecha (servicio y filtro 403); sin acción registrada no inventa fecha; «Cuenta sin verificar» devuelve el correo enmascarado; adaptador Prisma con doble (acción más reciente, `null` si no hay)

## 3. Roles

- [x] 3.1 `RolGuard`, `@Roles()`, exportados por `IdentidadModule`; `AdministracionController` con `@UseGuards(SesionGuard, RolGuard)` y `@Roles("administrador")` en `GET /administracion/acceso` (la ruta que la web consulta antes de mostrar `/admin`)
- [x] 3.2 Pruebas: «Cliente en ruta de administración» (403 `SoloAdministracion`), «Administrador en ruta de administración» (200), ruta sin `@Roles` deja pasar, `@Roles` en el controlador, sin usuario de sesión → 401; el `health` de administración sigue público (`rol.guard.spec.ts`, `administracion.controller.spec.ts`)

## 4. Web (02, 03b, 28)

- [x] 4.1 02: «Reenviar correo» con cuenta atrás desde el número de la API (estado a con el correo que guarda 01b en la pestaña; estado c con el token vencido); 03b: reenviar y suspendida con motivo y fecha; 28: 403 (`components/estados/sin-permisos.tsx`, guard en `app/(admin)/layout.tsx`) y «Sesión expirada» (`pedirApi` avisa el 401 y `SesionProvider` distingue sesión vencida)
- [x] 4.2 Pruebas `node --test`: formato de la cuenta atrás, decisión «expirada» frente a «sin sesión», acceso a administración, fecha de la suspensión, textos de las fichas
- [x] 4.3 Revisión en la app (compose) en claro y oscuro contra las fichas 02, 03b y 28: 403 en `/admin`, 03b suspendida con motivo y fecha, aviso «Tu sesión expiró» y la cuenta atrás de «Reenviar correo» en 02 (a), 02 (c) y 03b

## 5. Cierre

- [x] 5.1 `clases-unificado.mmd` y `pnpm diagramas:sync` (`RolGuard`, `Roles`, `PoliticaReenvio`, `ultimoDe`, `reenviarVerificacion`)
- [x] 5.2 Pruebas en verde (API 480; web 84); cobertura de `identidad/` 90 % (dominio 100 %). En Windows solo falla `lector-fuente-local.spec.ts` (M4, ruta `/clon` → `D:\clon`); en CI pasa
- [ ] 5.3 Avisar a Javier (M9 usa `RolGuard`) y a Eduardo (28 comparte componentes)
- [ ] 5.4 `/opsx-archive` después del merge
