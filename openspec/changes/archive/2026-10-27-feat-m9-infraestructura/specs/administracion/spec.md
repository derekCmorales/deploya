# Spec Delta

## ADDED Requirements

### Requirement: Infraestructura

Un administrador SHALL ver, de solo lectura, el uso de CPU, memoria y disco del servidor, el estado de la cola de construcción y la última muestra de cada entorno.

#### Scenario: Vista del nodo

- **WHEN** el admin abre Infraestructura
- **THEN** ve CPU, memoria y disco con su total

#### Scenario: Cola atascada

- **WHEN** hay 3 construcciones en espera
- **THEN** la cola muestra 3 en espera con su tiempo de espera

#### Scenario: Cliente no puede

- **WHEN** un Cliente abre /admin/infraestructura
- **THEN** responde 403
