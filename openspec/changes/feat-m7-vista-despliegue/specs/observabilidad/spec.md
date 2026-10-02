# Spec Delta

## MODIFIED Requirements

### Requirement: Vista de despliegue

El sistema SHALL mostrar el riel de cinco etapas (Recepción, Construcción, Ejecución, Enrutamiento, Operación) con estado y duración de cada una, y la bitácora de construcción numerada, que se actualiza por polling cada 3 segundos y se puede copiar. El polling SHALL detenerse cuando el despliegue termina. La vista SHALL abrirse por el número del despliegue dentro de su proyecto.

#### Scenario: Construcción en curso

- **WHEN** M4 emite líneas de bitácora
- **THEN** el panel las muestra en orden sin recargar la página

#### Scenario: Construcción fallida

- **WHEN** el despliegue termina en Fallido
- **THEN** se resalta la línea del error y se indica que la versión anterior sigue sirviendo tráfico

#### Scenario: Despliegue saludable

- **WHEN** el despliegue termina en Saludable
- **THEN** se muestran la URL pública con «Visitar», el digest de la imagen, la receta con la que se construyó y los recursos aplicados

#### Scenario: Copiar bitácora

- **WHEN** el cliente pulsa «Copiar»
- **THEN** se copia la bitácora completa con número, hora y texto de cada línea

#### Scenario: El polling termina con el despliegue

- **WHEN** la API responde `terminado = true`
- **THEN** la vista deja de pedir la bitácora y el estado
