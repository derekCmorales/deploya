# Spec Delta

## ADDED Requirements

### Requirement: Superficie de operación en el panel

El sistema SHALL mostrar, en la etapa Operación del panel y con el kit visual canónico, métricas de consumo y bitácoras del entorno seleccionado. En esta historia los valores SHALL ser mock; no se exige canal en vivo ni motor real.

#### Scenario: Métricas mock del entorno

- **WHEN** el cliente abre Operación de un proyecto
- **THEN** ve CPU, memoria y transferencia comparadas con límites de plan (datos mock) y el mismo lenguaje visual que el resto del panel

#### Scenario: Bitácoras mock

- **WHEN** el cliente abre Operación de un proyecto en construcción o en runtime
- **THEN** ve líneas de bitácora ordenadas (mock) etiquetadas como construcción o runtime

#### Scenario: Aviso de cuota mock

- **WHEN** el muestreo mock de un entorno se acerca al límite del plan
- **THEN** el panel muestra un aviso de cuota en Operación
