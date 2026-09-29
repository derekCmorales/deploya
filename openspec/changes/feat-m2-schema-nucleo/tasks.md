# Tasks

Cada tarea de código tiene su tarea de pruebas. Pruebas sin base, red ni reloj reales (repositorios en memoria, `RelojFijo`). Nombre de cada `it(...)` = nombre del escenario.

## 1. DB-01 · Schema y Prisma

- [x] 1.1 `schema.prisma` = contrato v1 (`prisma validate` y `prisma format` sin cambios)
- [ ] 1.2 Migración `nucleo` con `prisma migrate dev` contra el Postgres de compose; subir `prisma/migrations/`
- [x] 1.3 `PrismaService` y `PrismaModule` global en `compartido/prisma`, registrado en `app.module.ts`
- [x] 1.4 Pruebas: `PrismaService` conecta y desconecta con el ciclo de Nest

## 2. DB-01 · Servicio de suscripciones

- [x] 2.1 Dominio (`Plan`, `Cuota`, errores, `catalogoDe`, `cuotaDeSuscripcion`), puertos y adaptadores Prisma y en memoria
- [x] 2.2 `SuscripcionesService.asignarSandbox` y `cuotaDe`; `SuscripcionesModule` lo exporta
- [x] 2.3 Pruebas: «Cuenta nueva», «Asignar Sandbox dos veces», «Cuota por plan» (4 planes), «Cuenta sin suscripción»; traducción `por_vencer` ↔ `por-vencer` y `Decimal` → número en los adaptadores

## 3. DB-01 · Seed

- [x] 3.1 `planesSemilla()`, `usuariosSemilla(entorno)`, `sembrar()` detrás de `DestinoSemilla`; `seed.ts` con Prisma y `hashSemilla` (scrypt, formato de M1); prueba de formato y de que solo coincide con su clave
- [x] 3.2 `.env.example`: `ADMIN_CORREO`, `ADMIN_CLAVE`, `CLIENTE_CLAVE`
- [x] 3.3 Pruebas: `planesSemilla()` con los valores de la tabla, «Dos corridas», «Falta la clave del administrador», administrador y cliente con Sandbox
- [ ] 3.4 Verificar en compose: seed dos veces, mismos registros

## 4. M2-01 · Catálogo

- [x] 4.1 `GET /suscripciones/planes` sin guard; `health` intacto
- [x] 4.2 Pruebas: «Listar planes», «Solo planes activos, ordenados», «Responde sin sesión»
- [x] 4.3 Pantalla 06 en `/planes`: `usePlanes`, `Segmented` 30 / 365, tabla de recursos, carga y error; borrar stub `/billing`; `nav-panel` → `/planes`
- [x] 4.4 Pruebas web: formato de precios y recursos, `obtenerPlanes` contra un `fetch` doble, textos de la ficha

## 5. Cierre

- [x] 5.1 `clases-unificado.mmd` con los repositorios de M2; `pnpm diagramas:sync`
- [ ] 5.2 `pnpm check` en verde y demo: `/planes` leyendo de la base y un usuario nuevo en Sandbox
- [ ] 5.3 PR con la plantilla; revisor Derek (CODEOWNERS de `prisma/`)
