# 25b · Admin · Suspender cuenta

| | |
|---|---|
| Ruta | `/admin/usuarios` |
| Dueño | Javier |
| Historias | M9-02 |
| Entrega | A3 |
| Diseño | Canvas Deploya v4.1, artboard `25b-Admin-suspender` (https://claude.ai/artifact/B89rty3MNxRKW9RHJQwSZT) |

## Qué es

`Dialog` con motivo (lista) y detalle para el registro; se muestra al usuario al intentar entrar (03b).

## Componentes

- `AppShell` — header de 56px
- `NavPrincipal`
- `Wordmark`
- `Button`
- `Badge`; para estados `EstadoDespliegue` / `EstadoSuscripcion`
- `Field`
- `Input`
- `RielEtapas`
- `Dialog`
- `Avatar`
- patrón lista + detalle (ver guía)

Todos en `apps/web/src/components` (catálogo vivo en `/sistema`). Reglas: [../README.md](../README.md). Cómo armarla: [../guia-construccion.md](../guia-construccion.md).

## Textos de la pantalla

Copia exacta del diseño, en orden de aparición. Los datos (correos, nombres, hashes, fechas) son de ejemplo: vienen de la API.

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
Pro
Suspendida
14 jun 2026
ana.gomez@tiendademo.com
Sandbox
21 sep 2026
luis.mendez@agenciaquetzal.gt
Business
02 feb 2026
pedro.castillo@fincaelsol.com
Vencida
11 may 2026
sofia.lopez@estudiolatte.com
Por vencer
28 mar 2026
carlos.ruiz@mercadito.gt
Cancelada
07 ene 2026
admin@deploya.app
Administrador
—
01 ene 2026
MR
María Ríos
Alta 14 jun 2026 · último acceso hace 6 d
Suspender cuenta
desde 21 sep · 3 contenedores detenidos
Proyectos · estado de despliegue
3
menu-aurora
Detenido
pedidos-api
landing
Pagos
14 ago 2026
Plan Pro · 30 días
USD 15.00
Rechazado
14 jul 2026
Aprobado
no podrá iniciar sesión. Sus contenedores se detienen; el código, las variables y el historial se conservan.
Motivo
Uso que incumple los términos (§7.2)
Detalle para el registro
Tráfico de minería detectado en 2 contenedores.
Se muestra al usuario cuando intenta iniciar sesión.
Cancelar
```
