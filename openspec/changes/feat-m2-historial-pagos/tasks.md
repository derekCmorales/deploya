# Tasks

Requiere `feat-m2-contratacion-suscripcion` (archivado). Sin base ni reloj reales.

## 1. Lectura

- [x] 1.1 `RepositorioPagos.deUsuario` (Prisma y memoria), `HistorialPagosService.deUsuario`, `GET /suscripciones/pagos`
- [x] 1.2 Pruebas: «Ver historial» (orden y concepto), «Sin pagos» (lista vacía), sin sesión → 401

## 2. Comprobante

- [x] 2.1 `Comprobante` (VO), `ComprobantePdfPuerto`, `ComprobantePdfKit` y `ComprobanteTextoFalso`; `GET /suscripciones/pagos/:id/comprobante.pdf`
- [x] 2.2 Pruebas: «Descargar comprobante» (número, fecha, concepto, vigencia, método, total y la leyenda «sin valor fiscal»), «Comprobante de otro cliente» → 404, pago rechazado → 404

## 3. Web

- [x] 3.1 `/pagos` (09) con tabla, panel «Comprobante» y «Descargar PDF»; 09b vacío con «Ver planes»
- [x] 3.2 Pruebas `node --test`: formato de monto y fecha, fila seleccionada por defecto (el pago más reciente aprobado)
- [x] 3.3 Revisión contra los artboards 09 y 09b en claro y oscuro

## 4. Cierre

- [x] 4.1 `clases-unificado.mmd`; `pnpm check` en verde; cobertura ≥ 80 % en `suscripciones/`
- [ ] 4.2 Demo: contratar Starter y descargar su PDF; una cuenta nueva ve 09b
- [ ] 4.3 `/opsx-archive` después del merge
