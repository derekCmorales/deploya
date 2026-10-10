# Tasks

Sin base ni reloj reales: `Reloj` falso y repositorios en memoria.

## 1. Seed de demo (Javier)

- [x] 1.1 `vencida@deploya.app` (Vencida) y `suspendida@deploya.app` (Suspendida) en el seed, con la misma contraseña de demo que `cliente@deploya.app`
- [x] 1.2 Pruebas: el seed sigue idempotente y crea las dos cuentas con su estado
- [x] 1.3 Delta «Seed idempotente» en `specs/suscripciones` con las cuentas de demo y un escenario por prueba

## 2. Política y servicio (Derek)

- [x] 2.1 `PoliticaDespliegue`, `inicioDelMes`, errores, `BloqueosService`, `CuotaPlanPuerto.permisoDe`, `RepositorioDespliegues.contarConstruccionesDesde` (Prisma y memoria)
- [x] 2.2 Pruebas: «Suscripción vencida bloquea el despliegue», «Suscripción suspendida bloquea el despliegue», «Cuota de construcciones agotada», «Dentro de la cuota», «La reversión no cuenta», «Mes nuevo, cuota nueva»

## 3. Puntos de entrada

- [x] 3.1 Derek: `ConstruccionService.crearDespliegue` verifica; filtro 409 con `codigo`
- [x] 3.2 Eduardo: `POST /proyectos` verifica antes de persistir; banner en 11d y 17 con enlace a `/suscripcion`
- [x] 3.3 Pruebas: controlador de despliegues 409 con cada `codigo` (**hecho**, filtro global `RechazosOrquestacionFilter`); «Alta con la suscripción vencida» no persiste el proyecto (Eduardo, con 3.2)

## 4. Cierre

- [x] 4.1 `clases-unificado.mmd` y `pnpm diagramas:sync`
- [x] 4.2 `pnpm check` en verde; cobertura ≥ 80 % en `orquestacion/`
- [ ] 4.3 Demo en compose: con `vencida@deploya.app`, «Desplegar» muestra el banner; con Sandbox y 30 construcciones en el mes, la 31 se rechaza
- [ ] 4.4 Marcar la tarea 5.3 de `feat/m3-alta-proyecto`; `/opsx-archive` después del merge
