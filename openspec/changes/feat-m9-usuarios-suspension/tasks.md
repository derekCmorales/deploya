# Tasks

Requiere `feat-m1-estados-roles` en `main` (ya está) y la tarea 3.1 de `feat-m2-ciclo-suscripcion` (Derek) para detener contenedores. Sin base ni reloj reales.

## 1. Usuarios (M9-01)

- [x] 1.1 `ConsultaUsuariosPuerto` (Prisma y memoria); `GET /admin/usuarios` y `GET /admin/usuarios/:id` con `RolGuard`
- [x] 1.2 Pruebas: «Buscar por correo», «Filtrar por suscripción», «Detalle de un usuario», un Cliente → 403

## 2. Suspender (M9-02)

- [x] 2.1 `SuspensionService`, `MOTIVOS_SUSPENSION`, `POST /admin/usuarios/:id/suspension`
- [x] 2.2 Pruebas: «Suspender cuenta» (sesiones revocadas, acción registrada, contenedores pedidos a M5), «No se suspende a un administrador», «Cuenta ya suspendida», «Motivo fuera de la lista»

## 3. Web

- [x] 3.1 `/admin/usuarios` (25) con búsqueda, filtro de suscripción, tabla y panel; `Dialog` 25b; borrar el stub `/admin` y actualizar `nav-panel.tsx`
- [x] 3.2 Pruebas `node --test`: armado de la consulta (correo, filtro, página), iniciales del panel
- [ ] 3.3 Revisión contra los artboards 25 y 25b en claro y oscuro

## 4. Cierre

- [x] 4.1 `clases-unificado.mmd`; `pnpm check` en verde; cobertura ≥ 80 % en `administracion/`
- [ ] 4.2 Demo: `admin@deploya.app` suspende a `demo@deploya.app` → su app deja de responder y el login muestra el motivo (03b)
- [ ] 4.3 `/opsx-archive` después del merge
