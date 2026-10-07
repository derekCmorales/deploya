# Tasks

Cada tarea de código tiene su tarea de pruebas. Sin Docker, red, base ni reloj reales. Nombre de cada `it(...)` = nombre del escenario.

## 1. Dominio

- [x] 1.1 `dominio/cambio-plan.ts` (`operacionDeCobro`, `cambioTrasCobro`, `validarDescenso`, `diasRestantes`), `pago.ts` (comprobante), `tarjeta.ts` (validación), `mi-suscripcion.ts` (vistas), errores con `codigo` (`ErrorSuscripciones`)
- [x] 1.2 Pruebas: «Ascenso», «Renovar ahora», «Bajar de plan no se cobra», contratación desde Sandbox, vigencia terminada, Sandbox sin cobro, sin precio anual, descenso válido e inválido, validación del cuerpo y de la tarjeta

## 2. Puertos y adaptadores

- [x] 2.1 `PasarelaPago` + `PasarelaSimulada` con `Espera`
- [x] 2.2 Pruebas: aprueba, rechaza, «Tarjeta que tarda», «Tarjeta que no es de prueba»
- [x] 2.3 `RepositorioPagos` (Prisma y memoria); `RepositorioSuscripciones.actualizar` y `programarDescenso` (Prisma y memoria); `planSiguiente` en la traducción
- [x] 2.4 Pruebas con Prisma doble: comprobante del año, rechazo sin comprobante (I2), `actualizar`, `programarDescenso`

## 3. Servicio y controlador

- [x] 3.1 `ContratacionService` (`miSuscripcion`, `cotizar`, `contratar`, `programarDescenso`); `CobroController` con `SesionGuard`; `ErroresSuscripcionesFilter`; `CobroModule` en `AppModule`
- [x] 3.2 Pruebas: «Contratación aprobada», «Contratación rechazada», «Comprobante consecutivo», «Ascenso», «Renovar ahora», «Descenso», «Bajar de plan no se cobra», «Ver mi suscripción», «Cotizar antes de pagar»
- [x] 3.3 Prueba con Nest real del controlador: «Sin sesión» (guard declarado), rutas y filtro por cada `codigo`

## 4. Web

- [x] 4.1 `lib/suscripcion.ts`, `hooks/use-suscripcion.ts`, `CabeceraCobro` compartida por 06 y 08
- [x] 4.2 `/planes/contratar`: 07 (resumen y tarjeta) y 07b (procesando, aprobado, rechazado)
- [x] 4.3 `/suscripcion`: 08 (plan actual, vigencia, consumo de proyectos, cambiar plan)
- [x] 4.4 06: «Contratar» activo, «Plan actual» con sesión; navegación «Suscripción»; enlaces `/billing` de M3 → `/suscripcion`
- [x] 4.5 Pruebas `node --test`: fechas, barra de vigencia, opciones de cambio, tarjeta, textos de las fichas, sin `fetch`/`any`/colores de Tailwind
- [x] 4.6 Revisado en claro y oscuro con Playwright (API simulada): 06, 07, 07 con errores, 07b procesando/aprobado/rechazado, 08

## 5. Cierre

- [x] 5.1 `clases-unificado.mmd` y `pnpm diagramas:sync`
- [x] 5.2 `pnpm check` en verde
- [ ] 5.3 Aplicar el descenso al vencer: M2-05
- [ ] 5.4 `/opsx-archive` después del merge
