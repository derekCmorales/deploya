# Proposal

Change: `feat/m2-historial-pagos`. Módulo dueño: **suscripciones (M2)** — Javier. Spec tocada: `suscripciones`. Historia: **M2-06** Historial de pagos y comprobante PDF (3 pts, Avance 3). Pantallas 09 y 09b.

## Why

M2-02 ya registra cada pago con su comprobante `DPY-AAAA-NNNNNN`, pero el cliente no puede verlos ni descargarlos. El requisito «Historial de pagos» está en el spec sin implementar.

## What Changes

- `GET /suscripciones/pagos` → `[{ id, fecha, concepto, monto, moneda, estado, comprobante, vigencia: { desde, hasta } | null, tarjeta: "•••• 4242" }]`, del más reciente al más antiguo.
- `GET /suscripciones/pagos/:id/comprobante.pdf` → PDF (solo pagos aprobados del propio cliente; ajeno o inexistente → 404).
- `ComprobantePdfPuerto` con un adaptador sobre una librería de PDF (p. ej. `pdfkit`) y un doble que devuelve el texto plano para las pruebas.
- Web: `/pagos` (09) con la tabla, el panel «Comprobante» y «Descargar PDF»; 09b cuando no hay pagos. Enlace «Pagos» en la cabecera de cobro.

## Non-goals

- Facturas con valor fiscal, impuestos o reembolsos.
- Exportar el historial completo (CSV).
- Comprobante de pagos rechazados (se listan, sin PDF).

## Capabilities

### New Capabilities

- (ninguna)

### Modified Capabilities

- `suscripciones`: «Historial de pagos» con lista, comprobante, PDF y estado vacío.

## Impact

- Código: `suscripciones/pagos.controller.ts`, `HistorialPagosService`, `ComprobantePdfPuerto`, `RepositorioPagos.deUsuario` (si falta).
- Web: `apps/web/src/app/(billing)/pagos/`.
- Dependencia nueva en `apps/api`: librería de PDF (la elige Javier; se nombra en el PR).
