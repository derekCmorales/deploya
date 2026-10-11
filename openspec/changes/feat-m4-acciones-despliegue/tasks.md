# Tasks

Requiere `feat-m4-motor-construccion` y `feat-m5-bloqueos-cuota` en `main` (ya están). Sin Docker, Redis, red ni reloj reales.

## 1. Dominio

- [ ] 1.1 `PoliticaAcciones` (cancelar, reintentar) y errores `YaNoSePuedeCancelar`, `SoloSeReintentaUnFallido`, `CommitDesconocido`
- [ ] 1.2 Pruebas: tabla completa de estados permitidos y rechazados

## 2. Cancelar

- [ ] 2.1 `CancelacionesPuerto` (Redis y memoria), `ColaConstruccionPuerto.quitar`, `VigiaCancelacion`, `AbortSignal` en `ConstructorImagenDocker` y en `PasoRecepcion`
- [ ] 2.2 `POST /despliegues/:id/cancelar`
- [ ] 2.3 Pruebas: «Cancelar encolado» (sale de la cola, queda Cancelado), «Cancelar» en Construyendo (la señal aborta el paso y la versión activa no cambia), «Cancelar tarde» (Aprovisionando → 409), proyecto ajeno → 404

## 3. Reintentar y redesplegar

- [ ] 3.1 `crearDespliegue` acepta `commitSha`; `PasoRecepcion` hace checkout del commit; `POST /despliegues/:id/reintentar` y `POST /proyectos/:id/redespliegues`
- [ ] 3.2 Pruebas: «Reintentar un fallido» (mismo commit, disparador `reintento`, cuenta como construcción), «Reintentar uno saludable» → 409, «Redesplegar reconstruye», «Commit desconocido» → 409, bloqueo por suscripción → 409 `suscripcion-no-permite`

## 4. Web (Derek)

- [ ] 4.1 «Cancelar» en 12 (Encolado y Construyendo), «Reintentar» en 12c; ambos llevan al despliegue nuevo o se quedan en el actual según la respuesta
- [ ] 4.2 Pruebas `node --test`: qué botones se muestran por estado (`accionesDe(estado)`)

## 5. Cierre

- [ ] 5.1 `clases-unificado.mmd` y `pnpm diagramas:sync`; `pnpm check` en verde; cobertura ≥ 80 % en `construccion/`
- [ ] 5.2 Demo en compose: cancelar `hola-deploya` en Construyendo (`docker ps` sin build colgado); reintentar `roto`; redesplegar #1 desde 14
- [ ] 5.3 Marcar la tarea 4.1 de `feat-m5-reversion-instantanea`; `/opsx-archive` después del merge (antes que la reversión)
