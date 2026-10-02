# Spec Delta

## ADDED Requirements

### Requirement: Variables de entorno en el contenedor

Al crear el contenedor, el sistema SHALL pasarle las variables del proyecto descifradas, obtenidas de M3 por `VariablesEntornoPuerto`, además de `PORT` con el puerto interno. La bitácora SHALL registrar cuántas variables se aplicaron y nunca sus claves ni valores. Una variable que no se puede descifrar SHALL hacer fallar el despliegue sin tocar la versión activa.

#### Scenario: Variables llegan al contenedor

- **WHEN** un proyecto con `SALUDO=hola` se despliega
- **THEN** `ContenedorPuerto.crear` recibe `SALUDO=hola` y `PORT` con el puerto interno

#### Scenario: La bitácora no muestra valores

- **WHEN** se aplican tres variables
- **THEN** la bitácora dice «3 variables aplicadas» y no contiene ninguna clave ni valor

#### Scenario: Variable ilegible

- **WHEN** un valor cifrado fue alterado
- **THEN** el despliegue queda Fallido con motivo «variable ilegible» y la versión anterior sigue sirviendo
