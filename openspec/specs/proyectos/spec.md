# proyectos (M3)

Alcance §6.1: alta de proyectos, conexión por repositorio o archivo comprimido, configuración de construcción y variables de entorno cifradas. Dueño: Eduardo.

## Purpose

Registrar el proyecto y su fuente. No encola la construcción (eso es M4).

## Requirements

### Requirement: Alta de proyecto

El sistema SHALL crear un proyecto en un espacio de trabajo con nombre y fuente.

#### Scenario: Fuente repositorio

- **WHEN** el cliente indica la URL de un repositorio público
- **THEN** el proyecto queda persistido con `ProveedorFuente` = repositorio

#### Scenario: Fuente archivo comprimido

- **WHEN** el cliente carga un archivo comprimido
- **THEN** el proyecto queda persistido con fuente archivo comprimido

### Requirement: Variables cifradas

Las variables de entorno SHALL almacenarse cifradas en reposo (`valorCifrado`).

#### Scenario: Guardar variable

- **WHEN** el cliente guarda una variable
- **THEN** el valor no se persiste en claro

### Requirement: Receta de construcción

El sistema SHALL guardar receta, comando de arranque y puerto HTTP. La detección automática de stack es M4.
