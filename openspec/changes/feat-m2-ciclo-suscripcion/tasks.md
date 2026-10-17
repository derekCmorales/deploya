# Tasks

Requiere `feat-m5-acciones-contenedor` y `feat-m5-bloqueos-cuota` en `main` (ya están). Sin base, Redis, Docker ni reloj reales.

## 1. Dominio (Javier)

- [x] 1.1 `PoliticaCiclo.siguiente` con `DIAS_POR_VENCER`, `DIAS_GRACIA`, `DIAS_HASTA_CANCELAR`; Sandbox no vence
- [x] 1.2 Pruebas: «Por vencer», «Vencimiento sin renovar», «Fin de la gracia», «Treinta días suspendida», «Sandbox no vence», «Descenso programado al vencer», «Dos corridas el mismo día»

## 2. Servicio y tarea diaria (Javier)

- [x] 2.1 `CicloSuscripcionService.ejecutar()` (lee candidatas, aplica, guarda `estadoDesde`), `ContenedoresClientePuerto` y su doble
- [x] 2.2 `ColaCicloPuerto` (BullMQ repetible 00:05 UTC y memoria), procesador en el trabajador; `POST /admin/ciclo/ejecutar` con `RolGuard`
- [x] 2.3 Pruebas: «Fin de la gracia» pide detener los contenedores; «Renovar una suscripción suspendida» la deja Activa y pide reanudar; un Cliente en `/admin/ciclo/ejecutar` → 403

## 3. Contenedores (Derek)

- [x] 3.1 `AccionesProyectoService.detenerTodosDe(usuarioId)` y `reanudarTodosDe(usuarioId)`; `ContenedoresClientePuerto` y su adaptador `ContenedoresClienteM5` en `orquestacion/`, exportados por `OrquestacionModule` para M2 y M9
- [x] 3.2 Pruebas: «Suscripción suspendida» (encola un `detener` por proyecto Saludable y omite los demás), «Reanudar al renovar» (un `reiniciar` por proyecto Detenido)

## 4. Web (Javier)

- [ ] 4.1 «Suscripción suspendida · panel bloqueado» de 28 cuando `/suscripciones/mia` dice `suspendida`; «Renovar» lleva a 07
- [ ] 4.2 Revisión contra el artboard 28 en claro y oscuro

## 5. Cierre

- [ ] 5.1 `clases-unificado.mmd`, `m2-estados-suscripcion.mmd` y `pnpm diagramas:sync`; `pnpm check` en verde; cobertura ≥ 80 % en `suscripciones/`
- [ ] 5.2 Demo en compose: `suspendida@deploya.app` con un proyecto Saludable → `POST /admin/ciclo/ejecutar` → el subdominio deja de responder; renovar → vuelve
- [ ] 5.3 Marcar la tarea 5.3 de `feat-m2-contratacion-suscripcion` (archivada) en el resumen del archive; `/opsx-archive` después del merge
