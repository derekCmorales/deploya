# Spec Delta

## ADDED Requirements

### Requirement: Consulta por número de despliegue

El sistema SHALL permitir consultar un despliegue por su número dentro del proyecto, con el mismo detalle que por su identificador. Solo el dueño del proyecto SHALL poder hacerlo.

#### Scenario: Consultar por número

- **WHEN** el dueño pide el despliegue #3 de su proyecto
- **THEN** recibe el mismo detalle que por su identificador

#### Scenario: Número inexistente o proyecto ajeno

- **WHEN** se pide un número que no existe o un proyecto de otro cliente
- **THEN** la respuesta es 404
