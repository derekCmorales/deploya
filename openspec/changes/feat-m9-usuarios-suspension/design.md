# Design

## Context

`AdministracionController` ya existe con `GET /admin/acceso` protegido por `RolGuard`. El contrato de datos asigna a M9 `AccionAdministrativa` y `Usuario.estadoCuenta` al suspender. El login ya rechaza cuentas suspendidas con motivo y fecha (M1-04).

## Goals / Non-Goals

**Goals:** buscar y filtrar cuentas, ver su detalle y suspenderlas con registro.

**Non-Goals:** reactivar, gestionar planes, suspender administradores.

## Decisions

### 1. Lectura por un puerto de consulta

`ConsultaUsuariosPuerto.buscar({ correo, suscripcion, pagina })` y `detalle(usuarioId)` con un adaptador Prisma que hace una sola consulta con `include`. No se llama servicio por servicio a cada módulo: es una vista de solo lectura (CQRS ligero).

### 2. Suspender como caso de uso transaccional

`SuspensionService.suspender(adminId, usuarioId, motivo, detalle)`: valida (`NoSePuedeSuspenderAdministrador`, `CuentaYaSuspendida`, `MotivoInvalido`), en una transacción cambia la cuenta, revoca sesiones y registra la acción; **después** de confirmar pide `ContenedoresClientePuerto.detenerTodos(usuarioId)`. Si M5 falla al encolar, la suspensión queda hecha y se registra el error.

## Diseño: SOLID y patrones

| Clase / puerto | Patrón | Principio | Por qué |
|---|---|---|---|
| `ConsultaUsuariosPuerto` → `ConsultaUsuariosPrisma` | Repository de lectura (CQRS ligero) | S, I | La lista no carga servicios de cuatro módulos |
| `SuspensionService` | Service Layer + Unit of Work | S | Un caso de uso, una transacción |
| `ContenedoresClientePuerto` (M2-05) | Adapter | D | M9 no conoce Docker ni la cola |
| `MOTIVOS_SUSPENSION` | Constante con nombre | — | Sin cadenas mágicas en el controlador |
| `RolGuard` + `@Roles` (M1-04) | Decorator | O | Rutas nuevas solo se anotan |

Cambios de clases: `ConsultaUsuariosPuerto`, `SuspensionService`, `UsuariosAdminController` → `clases-unificado.mmd`.

## Risks / Trade-offs

- **Lista grande:** paginada de 20 con índice por correo; el total se cuenta aparte.

## Decisiones al aplicar (2026-10-17)

- **`AccionAdministrativa.accion = "suspender-cuenta"`** (lo que dice el schema y ya lee M1), no `tipo: "suspender"`. El `motivo` de la acción guarda la clave (`terminos`); `Usuario.motivoSuspension` guarda el texto que ve el usuario en 03b. `Usuario` no tiene `estadoDesde`: la fecha sale de la última acción.
- **`MOTIVOS_SUSPENSION`:** la ficha 25b solo muestra «Uso que incumple los términos (§7.2)»; se agregaron cuatro motivos más (abuso de recursos, contenido malicioso, pago fraudulento, a pedido del titular). La web los lee de `GET /admin/usuarios/motivos-suspension`.
- **Transacción:** `CuentasSuspensionPrisma.suspender` hace `$transaction` con el `update` de la cuenta, el `updateMany` de `Sesion.revocadaEn` (tabla de M1, aviso a Eddy) y el `create` de la acción.
- **HTTP:** `NoSePuedeSuspenderAdministrador` 403, `CuentaYaSuspendida` 409, `MotivoInvalido` 400, `UsuarioNoEncontrado` 404; suspender responde 204.
- **Lista:** `{ total, pagina, porPagina, usuarios }`; cada fila suma `estadoCuenta` al contrato del proposal.
- **Web:** «Administración» aparece en la navegación solo con rol Administrador; el stub `/admin` se borró.
