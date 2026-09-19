# Spec Delta

## ADDED Requirements

### Requirement: Kit visual canónico en el panel

El sistema SHALL presentar el panel de proyectos con el kit visual canónico de Deploya (SaaS oscuro, tipografía Geist, copy en español). Los estados visibles SHALL ser estados de despliegue, no de suscripción.

#### Scenario: Panel con kit aplicado

- **WHEN** el cliente abre el panel de proyectos
- **THEN** ve una composición lista + detalle, navegación por el ciclo Recepción → Construcción → Ejecución → Enrutamiento → Operación, y no un placeholder neutro de bootstrap

#### Scenario: Estados de despliegue

- **WHEN** un proyecto mock está en curso
- **THEN** el panel muestra un estado de despliegue (Encolado, Construyendo, Aprovisionando, Publicando, Saludable, Fallido, Revirtiendo o Detenido) y no un estado de suscripción

### Requirement: Lista y detalle de proyectos mock

El sistema SHALL listar proyectos con fuente (`ProveedorFuente`: repositorio o archivo comprimido) y, al seleccionar uno, mostrar su detalle. En esta historia los datos SHALL ser mock; no encola construcción real (M4).

#### Scenario: Selección en la lista

- **WHEN** el cliente elige un proyecto de la lista
- **THEN** el detalle muestra nombre, fuente, etapa del ciclo y estado de despliegue de ese proyecto

#### Scenario: Fuente visible

- **WHEN** el detalle de un proyecto está abierto
- **THEN** indica si la fuente es repositorio o archivo comprimido

### Requirement: Lienzo del ciclo de despliegue

El sistema SHALL ofrecer una vista de flujo del ciclo Recepción → Construcción → Ejecución → Enrutamiento → Operación para el proyecto seleccionado, con datos mock.

#### Scenario: Abrir el flujo

- **WHEN** el cliente abre la vista de flujo de un proyecto
- **THEN** ve los cinco nodos del ciclo y puede volver a la lista y al detalle
