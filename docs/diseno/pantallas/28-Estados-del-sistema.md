# 28 · Estados del sistema

| | |
|---|---|
| Ruta | `not-found · 403 · sesión expirada · suspendida · error de API · carga` |
| Dueño | Eduardo (403 y sesión: Eddy; suspendida: Javier) |
| Historias | WEB-02 · M1-04 · M2-05 |
| Entrega | A2–A3 |
| Diseño | Canvas Deploya v4.1, artboard `28-Estados-del-sistema` (https://claude.ai/artifact/B89rty3MNxRKW9RHJQwSZT) |

## Qué es

Seis estados globales: 404, 403 solo administración, sesión expirada (7 días sin actividad), suscripción suspendida (panel bloqueado), error de conexión con la API (reintento), esqueleto de carga.

## Componentes

- `AppShell` — header de 56px
- `NavPrincipal`
- `Wordmark`
- `Button`
- `Badge`; para estados `EstadoDespliegue` / `EstadoSuscripcion`
- `Card`
- `Sunken`
- `RielEtapas`
- `Dialog`
- `Skeleton`
- `Avatar`

Todos en `apps/web/src/components` (catálogo vivo en `/sistema`). Reglas: [../README.md](../README.md). Cómo armarla: [../guia-construccion.md](../guia-construccion.md).

## Textos de la pantalla

Copia exacta del diseño, en orden de aparición. Los datos (correos, nombres, hashes, fechas) son de ejemplo: vienen de la API.

```text
404 · Página inexistente
404
ruta sin etapa
No encontramos esta página
La dirección
/projects/api-tiendaa
no existe o se movió.
Ir a proyectos
Volver
403 · Sin permisos
deploy
a
Proyectos
Suscripción
Cuenta
DC
Esta sección es solo para administración
Tu cuenta es de tipo
Cliente
. Si crees que es un error, escribe a
soporte@deploya.app
Sesión expirada
Tu sesión expiró
Por seguridad cerramos las sesiones tras 7 días sin actividad. Inicia sesión de nuevo y volverás a esta página.
Iniciar sesión
Suscripción suspendida · panel bloqueado
Suspendida
desde 29 sep 2026
Tu panel está en pausa
Qué pasó
Tu plan Starter venció el 24 sep y terminó el período de gracia. Detuvimos los 3 contenedores.
Qué se conserva · 30 días
Código y configuración de cada proyecto
Variables cifradas
Historial de despliegues
Renovar
Ver planes
Al renovar, volvemos a arrancar el último despliegue saludable de cada proyecto.
Error de conexión con la API
No pudimos conectar con deploya
Tus servicios siguen en línea; lo que falla es la conexión del panel. Reintentamos solos.
GET api.deploya.app/v1/projects · ECONNREFUSED · reintento en 8 s
Reintentar ahora
Carga · esqueleto de la lista de proyectos
```
