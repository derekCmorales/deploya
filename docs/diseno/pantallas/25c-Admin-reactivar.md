# 25c · Admin · Reactivar cuenta

| | |
|---|---|
| Ruta | `/admin/usuarios` |
| Dueño | Javier (SP-05) |
| Historias | SP-05 |
| Entrega | Sprint fuera de alcance |
| Diseño | Canvas Deploya v4.1, página «Sprint · fuera de alcance», artboard `25c-Admin-reactivar` (https://claude.ai/artifact/B89rty3MNxRKW9RHJQwSZT) |
| Datos | `POST /admin/usuarios/:id/reactivacion { detalle }` |

## Qué es

Detalle de una cuenta Suspendida (motivo, quién y cuándo) con «Reactivar cuenta». El diálogo explica qué pasa y avisa si la suscripción sigue Suspendida (los contenedores esperan a la renovación). Deja `AccionAdministrativa` `reactivar-cuenta`.

## Componentes

- `AppShell` admin
- `Table` / lista
- `Dialog`
- `Banner` (`warn`)
- `Field` + `Input`
- `Badge`
- `Button`

Todos en `apps/web/src/components` (catálogo vivo en `/sistema`); las gráficas nuevas entran ahí con `feat-m7-metricas`. Reglas: [../README.md](../README.md). Cómo armarla: [../guia-construccion.md](../guia-construccion.md).

## Textos de la pantalla

Copia del diseño, en orden de aparición. Los datos (correos, nombres, hashes, fechas, valores de las gráficas) son de ejemplo: vienen de la API.

```text
Administración
Usuarios
Clientes y administradores de deploya
Buscar por correo
Suscripción: Todas
1 282
Correo
Rol
Plan
Suscripción
Alta
derek@tiendademo.com
Cliente
Starter
Activa
03 sep 2026
maria.rios@cafeteriaaurora.com
Cliente
Pro
Suspendida
14 jun 2026
ana.gomez@tiendademo.com
Cliente
Sandbox
Activa
21 sep 2026
luis.mendez@agenciaquetzal.gt
Cliente
Business
Activa
02 feb 2026
pedro.castillo@fincaelsol.com
Cliente
Starter
Vencida
11 may 2026
sofia.lopez@estudiolatte.com
Cliente
Pro
Por vencer
28 mar 2026
carlos.ruiz@mercadito.gt
Cliente
Starter
Cancelada
07 ene 2026
admin@deploya.app
Administrador
—
01 ene 2026
MR
María Ríos
maria.rios@cafeteriaaurora.com
Cliente
Alta 14 jun 2026 · último acceso hace 6 d
Reactivar cuenta
Cuenta
Suspendida
21 sep por admin@deploya.app
Uso que incumple los términos (§7.2) ·
Tráfico de minería detectado en 2 contenedores.
Suscripción
Pro
Suspendida
desde 21 sep · 3 contenedores detenidos
Proyectos · estado de despliegue
3
menu-aurora
Detenido
pedidos-api
Detenido
landing
Detenido
Pagos
14 ago 2026
Plan Pro · 30 días
USD 15.00
Rechazado
14 jul 2026
Plan Pro · 30 días
USD 15.00
Aprobado
Reactivar cuenta
maria.rios@cafeteriaaurora.com
podrá iniciar sesión otra vez. Quitamos el motivo de la suspensión y queda registro de la acción.
Su suscripción Pro sigue Suspendida
Sus 3 contenedores siguen detenidos hasta que renueve. Si la suscripción estuviera vigente, arrancarían ahora.
Detalle para el registro
Aclarado con la clienta: el tráfico era de pruebas de carga.
Cancelar
Reactivar cuenta
```
