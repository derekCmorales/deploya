# Fichas de pantalla — canvas Deploya v4.1

Una ficha por artboard del canvas (https://claude.ai/artifact/B89rty3MNxRKW9RHJQwSZT): ruta, dueño, historia, entrega, componentes y el texto exacto. Es lo que necesita una persona o un agente para construir la pantalla sin abrir el diseño. Para verla, el canvas web.

Se generan desde las fuentes del canvas; si cambias una pantalla en el diseño, actualiza su ficha.

| # | Pantalla | Ruta | Dueño | Entrega |
|---|---|---|---|---|
| 01 | [Registro](01-Registro.md) | `/registro` | Eddy | A1 |
| 01b | [Registro · estados](01b-Registro-estados.md) | `/registro` | Eddy | A1 |
| 02 | [Verifica tu correo](02-Verificar.md) | `/verificar?token=` | Eddy | A1 (reenvío con cuenta atrás: A2) |
| 03 | [Iniciar sesión](03-Ingresar.md) | `/ingresar` | Eddy | A1 |
| 03b | [Iniciar sesión · estados](03b-Ingresar-estados.md) | `/ingresar` | Eddy | A1 (suspendida: A2) |
| 04 | [Recuperar contraseña](04-Recuperar.md) | `/recuperar · /restablecer?token=` | Eddy | A2 |
| 05 | [Mi cuenta · Perfil](05-Cuenta-Perfil.md) | `/cuenta` | Eddy | A3 |
| 05b | [Mi cuenta · Seguridad](05b-Cuenta-Seguridad.md) | `/cuenta/seguridad` | Eddy | A3 |
| 06 | [Planes](06-Planes.md) | `/planes` | Javier | A1 |
| 07 | [Contratar plan](07-Contratar.md) | `/planes/contratar?plan=` | Javier | A2 |
| 07b | [Contratar · resultados](07b-Contratar-resultados.md) | `/planes/contratar` | Javier | A2 |
| 08 | [Mi suscripción](08-Suscripcion.md) | `/suscripcion` | Javier (consumo: Eduardo) | A2 (consumo y actividad: A3) |
| 09 | [Historial de pagos](09-Pagos.md) | `/pagos` | Javier | A3 |
| 09b | [Historial de pagos · vacío](09b-Pagos-vacio.md) | `/pagos` | Javier | A3 |
| 10 | [Proyectos](10-Proyectos.md) | `/projects` | Eduardo | A1 |
| 10b | [Proyectos · primer proyecto](10b-Proyectos-vacio.md) | `/projects` | Eduardo | A1 |
| 10c | [Proyectos · suscripción vencida](10c-Proyectos-vencida.md) | `/projects` | Eduardo + Javier | A3 |
| 11a | [Nuevo proyecto · 1 Repositorio](11a-Nuevo-fuente.md) | `/projects/nuevo` | Eduardo | A1 |
| 11c | [Nuevo proyecto · 2 Variables](11c-Nuevo-variables.md) | `/projects/nuevo` | Eduardo | A2 (en A1 el paso se muestra deshabilitado) |
| 11d | [Nuevo proyecto · 3 Revisar](11d-Nuevo-revisar.md) | `/projects/nuevo` | Eduardo | A1 |
| 11e | [Nuevo proyecto · errores](11e-Nuevo-errores.md) | `/projects/nuevo` | Eduardo | A1 |
| 12 | [Despliegue en curso](12-Despliegue-construyendo.md) | `/projects/[proyecto]/despliegues/[n]` | Eduardo (datos: Derek) | A2 (A1: el estado se ve en la lista) |
| 12b | [Despliegue · Saludable](12b-Despliegue-saludable.md) | `/projects/[proyecto]/despliegues/[n]` | Eduardo (datos: Derek) | A2 |
| 12c | [Despliegue · Fallido](12c-Despliegue-fallido.md) | `/projects/[proyecto]/despliegues/[n]` | Eduardo (datos: Derek) | A2 (reintentar: A3) |
| 13 | [Proyecto · Resumen](13-Proyecto-resumen.md) | `/projects/[proyecto]` | Eduardo | A3 |
| 14 | [Proyecto · Despliegues](14-Proyecto-despliegues.md) | `/projects/[proyecto]/despliegues` | Eduardo | A3 |
| 17 | [Proyecto · Variables de entorno](17-Proyecto-variables.md) | `/projects/[proyecto]/variables` | Eduardo | A2 |
| 19 | [Proyecto · Configuración](19-Proyecto-configuracion.md) | `/projects/[proyecto]/configuracion` | Eduardo | A3 |
| 19b | [Eliminar proyecto · confirmación](19b-Eliminar-dialogo.md) | `/projects/[proyecto]/configuracion` | Eduardo | A3 |
| 24 | [Correos del sistema](24-Correos.md) | `— (plantillas M10)` | Eddy | A1 (recuperación: A2) |
| 25 | [Admin · Usuarios](25-Admin-usuarios.md) | `/admin/usuarios` | Javier | A3 |
| 25b | [Admin · Suspender cuenta](25b-Admin-suspender.md) | `/admin/usuarios` | Javier | A3 |
| 28 | [Estados del sistema](28-Estados-del-sistema.md) | `not-found · 403 · sesión expirada · suspendida · error de API · carga` | Eduardo (403 y sesión: Eddy; suspendida: Javier) | A2–A3 |
