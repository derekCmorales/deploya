# motor-construccion (M4)

Alcance §6.1: cola de trabajos, detección del stack, construcción de imágenes y registro de artefactos versionados. Dueño: Derek.

## Purpose

Convertir un proyecto en un artefacto versionado e inmutable. El bootstrap usa una cola Redis **stub**.

## Requirements

### Requirement: Recepción y cola

Tras el alta del despliegue, el trabajo SHALL encolarse (Redis). El trabajador no corre en el ciclo HTTP.

#### Scenario: Encolar

- **WHEN** la API registra un despliegue
- **THEN** el estado es Encolado y existe un trabajo en la cola

### Requirement: Detector de stack y receta

El constructor SHALL detectar el stack y aplicar una receta. Nuevas recetas no modifican el orquestador (OCP).

#### Scenario: Detección

- **WHEN** el trabajador toma el trabajo
- **THEN** queda registrado el stack detectado y se produce una imagen

### Requirement: Artefacto inmutable

Cada construcción exitosa SHALL registrar un artefacto con número de versión e imagen (digest). Revertir no reconstruye.
