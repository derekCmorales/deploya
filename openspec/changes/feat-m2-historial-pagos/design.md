# Design

## Context

`Pago` ya guarda monto, concepto, estado, número de comprobante y los últimos 4 dígitos (M2-02). Falta leerlos y armar el PDF.

## Goals / Non-Goals

**Goals:** ver los pagos propios, abrir el comprobante y descargarlo en PDF.

**Non-Goals:** valor fiscal, CSV, reembolsos.

## Decisions

### 1. Vista de lectura

`HistorialPagosService.deUsuario(usuarioId)` devuelve filas ya formateadas para 09 (concepto «Plan Starter · 30 días»). `comprobante(usuarioId, pagoId)` arma un `Comprobante` (VO) con número, fecha, concepto, vigencia, método, titular y total; lanza `PagoNoEncontrado` si es ajeno o no aprobado.

### 2. PDF detrás de un puerto

`ComprobantePdfPuerto.generar(comprobante): Promise<Buffer>`. El controlador responde `application/pdf` con `Content-Disposition: attachment; filename="DPY-2026-000142.pdf"`. Las pruebas usan `ComprobanteTextoFalso`, que devuelve las líneas como texto, para comprobar el contenido sin parsear PDF.

## Diseño: SOLID y patrones

| Clase / puerto | Patrón | Principio | Por qué |
|---|---|---|---|
| `HistorialPagosService` | Service Layer | S | Solo lectura y armado del comprobante |
| `Comprobante` | Value Object | S | Una sola fuente de los datos que van al PDF y al panel |
| `ComprobantePdfPuerto` → `ComprobantePdfKit` | Adapter | D, L | El servicio no conoce la librería; el doble cumple el mismo contrato |
| `RepositorioPagos.deUsuario` | Repository | I | Lectura ordenada por fecha |

Cambios de clases: `HistorialPagosService`, `Comprobante`, `ComprobantePdfPuerto` → `clases-unificado.mmd`.

## Risks / Trade-offs

- **Tamaño de la dependencia de PDF:** se carga solo en la API; la web descarga el archivo por enlace.

## Decisiones al aplicar (2026-10-17)

- **Librería de PDF:** `pdfkit` 0.17 (y `@types/pdfkit`) en `apps/api`. Helvetica estándar no trae «→»: el PDF muestra la vigencia con «–»; el panel de 09 conserva «→».
- **Vigencia del comprobante:** desde la fecha del pago por los días del plan. `Pago` no guarda el inicio de la vigencia (datos 1.3 sin cambios), así que en una renovación anticipada el comprobante no muestra la fecha en que empieza a sumar.
- **Titular:** el nombre de la cuenta (`Usuario.nombre`); la pasarela simulada no guarda el titular de la tarjeta.
- **Leyenda del PDF:** «Pago simulado · sin cobro real · sin valor fiscal.» (el escenario pide literalmente «sin valor fiscal»); el panel de 09 usa el texto de la ficha.
- **`GET /suscripciones/pagos`** devuelve además `plan` y `titular` por fila para el panel «Comprobante».
- **404:** pago ajeno, inexistente o rechazado responden `pago-no-encontrado` sin llamar al puerto del PDF.
- **Descarga:** «Descargar PDF» es un enlace directo a la API (la cookie de sesión viaja en la navegación) con `Content-Disposition: attachment`.
- **Revisión contra los artboards 09 y 09b (claro y oscuro):** el comprobante va en un panel lateral de alto completo con encabezado (descargar y cerrar) y el recibo en un recuadro punteado; 09b sobre `sunken` con «Ver planes» primario. Diferencia que queda: el artboard pone «Ver comprobante» y número también en el pago rechazado; aquí solo los aprobados tienen comprobante (spec).
