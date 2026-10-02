# Spec Delta

## MODIFIED Requirements

### Requirement: Conmutación sin interrupción

Un nuevo despliegue saludable SHALL recibir el tráfico antes de que se retire el contenedor anterior. Si el nuevo no pasa la verificación de salud, la ruta SHALL seguir apuntando al anterior.

#### Scenario: Nuevo despliegue

- **WHEN** la versión #14 pasa la verificación de salud mientras #13 sirve tráfico
- **THEN** el subdominio apunta a #14 y solo después se detiene #13

#### Scenario: Salud fallida no conmuta

- **WHEN** la versión #14 no pasa la verificación de salud mientras #13 sirve tráfico
- **THEN** la ruta sigue en #13, el contenedor de #14 se elimina y #13 sigue siendo el activo
