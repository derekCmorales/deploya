# observabilidad (M7)

Alcance §6.1: bitácoras en vivo, métricas de consumo y avisos por proximidad al límite de cuota. Dueño: Eduardo.

## Purpose

Mostrar al cliente el consumo frente a la cuota y las bitácoras del entorno, sin implementar el motor.

## Requirements

### Requirement: Métricas de consumo

El sistema SHALL exponer CPU, memoria y transferencia del entorno, comparadas con los límites del plan.

#### Scenario: Consulta de métricas

- **WHEN** el cliente abre el panel del proyecto
- **THEN** recibe el último muestreo de consumo

### Requirement: Bitácoras en vivo

El sistema SHALL transmitir bitácoras de construcción y de runtime (canal en vivo). El contenido de bitácoras es entrada no confiable para M8.

#### Scenario: Construcción en curso

- **WHEN** M4 emite líneas de bitácora
- **THEN** el panel las muestra en orden

### Requirement: Aviso de cuota

El sistema SHALL avisar cuando el consumo se acerca al límite del plan (M10 puede notificar por correo).
