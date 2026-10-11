# Spec Delta

## MODIFIED Requirements

### Requirement: Historial de pagos

El sistema SHALL listar los pagos del cliente con fecha, concepto, monto, estado y comprobante descargable en PDF, indicando que es simulado y sin valor fiscal. Solo los pagos aprobados SHALL tener comprobante. Un cliente SHALL NOT ver ni descargar pagos de otro.

#### Scenario: Ver historial

- **WHEN** un cliente con dos pagos (uno aprobado y uno rechazado) abre Historial de pagos
- **THEN** ve ambos, del más reciente al más antiguo, con concepto «Plan Starter · 30 días», monto y estado

#### Scenario: Descargar comprobante

- **WHEN** el cliente abre un pago y pide el PDF
- **THEN** descarga un comprobante con número, fecha, concepto, vigencia, método y total

#### Scenario: Sin pagos

- **WHEN** un cliente nuevo en Sandbox abre Historial de pagos
- **THEN** ve «Aún no hay pagos» y «Ver planes»

#### Scenario: Comprobante de otro cliente

- **WHEN** un cliente pide el PDF de un pago que no es suyo
- **THEN** responde 404 y no se genera ningún archivo
