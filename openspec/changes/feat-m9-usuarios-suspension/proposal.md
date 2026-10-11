# Proposal

Change: `feat/m9-usuarios-suspension`. Módulo dueño: **administracion (M9)** — Javier. Spec tocada: `administracion`. Historias: **M9-01** Admin · Usuarios (3 pts) y **M9-02** Admin · Suspender cuenta (2 pts), Avance 3. Pantallas 25 y 25b.

## Why

Es el punto 7 del recorrido que se evalúa. `RolGuard` y `@Roles("administrador")` ya están (M1-04), la cuenta suspendida ya muestra su motivo en 03b y `AccionAdministrativa` ya está en el schema; falta la lista, el detalle y la acción.

## What Changes

- `GET /admin/usuarios?correo=&suscripcion=&pagina=` → `{ total, usuarios: [{ id, correo, nombre, rol, plan, suscripcion, creado }] }` (20 por página).
- `GET /admin/usuarios/:id` → detalle: suscripción (plan, estado, vence), proyectos con el estado del despliegue activo, últimos pagos, último acceso y, si está suspendida, desde cuándo y cuántos contenedores se detuvieron.
- `POST /admin/usuarios/:id/suspension` `{ motivo, detalle }`: `estadoCuenta = suspendida`, `motivoSuspension`, revoca todas sus sesiones, registra `AccionAdministrativa { tipo: "suspender", motivo, detalle, adminId }` y pide a M5 detener sus contenedores (`ContenedoresClientePuerto` de M2-05).
- Motivos fijos (lista de 25b) en una constante; el detalle es texto libre ≤ 500.
- Web: `/admin/usuarios` (25) con búsqueda, filtro y panel de detalle; `Dialog` de 25b. Borra el stub `/admin`.

## Non-goals

- Reactivar una cuenta suspendida desde el panel (fuera de alcance, punto 1: se hace por seed/SQL en la demo).
- Gestión de planes y estado de la infraestructura (puntos 14 y 15).
- Suspender a otro administrador.

## Capabilities

### New Capabilities

- (ninguna)

### Modified Capabilities

- `administracion`: «Usuarios» y «Suspender cuenta» con sus escenarios completos.

## Impact

- Código: `administracion/usuarios.controller.ts`, `AdministracionService`, `RepositorioAdministracion` (lectura agregada), `RepositorioAcciones`.
- Lee de M1 (cuenta, sesiones), M2 (suscripción, pagos), M3 (proyectos) y M4 (estado del despliegue activo) por puertos de lectura; no escribe en sus tablas salvo `Usuario.estadoCuenta`, `motivoSuspension` y `estadoDesde` (dueño M9 según datos-nucleo).
- Usa `ContenedoresClientePuerto` (M2-05) para detener contenedores.
