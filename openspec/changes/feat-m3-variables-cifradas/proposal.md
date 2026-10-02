# Proposal

Change: `feat/m3-variables-cifradas`. Módulo dueño: **proyectos (M3)** — Eduardo; entrega al contenedor en **orquestacion (M5)** — Derek. Specs tocadas: `proyectos`, `orquestacion`. Historia: **M3-03** variables de entorno cifradas (3 pts), Avance 2. Pantallas 11c y 17. Contratos: [datos-nucleo.md](../../../docs/contratos/datos-nucleo.md) (formato del cifrado) y [despliegues.md](../../../docs/contratos/despliegues.md) v2.1 (variables M3 → M5).

## Why

El recorrido del Avance 2 incluye «cambiar variables y redesplegar sin corte». Hoy el paso 2 del alta (11c) está deshabilitado, la pestaña Variables (17) no existe y el trabajador arranca cada contenedor con `variables: {}`: una app que necesita `DATABASE_URL` no puede correr en Deploya. La tabla `VariableEntorno` (con `valorCifrado`) ya está en el schema desde DB-01.

## What Changes

- **Dominio M3:** `ClaveVariable` (`^[A-Z_][A-Z0-9_]*$`, máximo 128; `PORT` reservada porque la fija el puerto interno), valor de hasta 4 KiB, máximo 50 variables por proyecto.
- **Cifrado:** puerto `CifradorVariables` con `CifradorAesGcm` (AES-256-GCM, `v1:<iv>:<tag>:<cifrado>` en base64, clave de 32 bytes en `CLAVE_CIFRADO_VARIABLES`) y un doble para pruebas. Sin la clave, la API no arranca en producción.
- **API (sesión y dueño; si no, 404):**
  - `GET /proyectos/:id/variables` → `[{ clave, actualizado }]` (nunca el valor).
  - `GET /proyectos/:id/variables/:clave` → `{ clave, valor }` para «Mostrar».
  - `PUT /proyectos/:id/variables` `{ variables: [{ clave, valor? }], desplegar?: boolean }`: reemplaza el conjunto; una entrada sin `valor` conserva el guardado. Con `desplegar: true` llama a `crearDespliegue(id, "variables")` y devuelve el despliegue.
  - `POST /proyectos` acepta `variables: [{ clave, valor }]` del paso 11c.
- **M3 → M5:** M3 exporta `VariablesProyectoService.descifradasDe(proyectoId)`; M5 lo usa por su puerto `VariablesEntornoPuerto` en `PasoEjecucion` en lugar de `{}`. La bitácora dice «3 variables aplicadas», nunca claves ni valores.
- **Web:** 11c activo en el asistente; pestaña 17 con «N cambios sin aplicar», Descartar, Guardar, Guardar y desplegar, Mostrar / Ocultar.

## Non-goals

- Variables por entorno (preview / producción), importar `.env`, secretos compartidos entre proyectos.
- Rotar la clave de cifrado (el prefijo `v1:` deja la puerta abierta).

## Capabilities

### New Capabilities

- (ninguna)

### Modified Capabilities

- `proyectos`: «Variables cifradas» con escenarios de validación, mostrar y guardar y desplegar.
- `orquestacion`: nueva «Variables de entorno en el contenedor».

## Impact

- Código M3: `proyectos/dominio/variable.ts`, `variables.service.ts`, `puertos/cifrador-variables.puerto.ts`, `adaptadores/cifrador-aes-gcm.ts`, `RepositorioVariables` (Prisma y memoria), controlador.
- Código M5 (Derek): `orquestacion/puertos/variables-entorno.puerto.ts`, adaptador sobre M3, `PasoEjecucion`.
- Web: `projects/nuevo` (11c), `projects/[proyecto]/variables` (17). Compose y `.env.example`: `CLAVE_CIFRADO_VARIABLES`.
- `clases-unificado.mmd`: `CifradorVariables`, `VariablesProyectoService`, `VariablesEntornoPuerto`.
