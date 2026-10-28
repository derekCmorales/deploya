# Spec Delta

## ADDED Requirements

### Requirement: Web lista para el público

Un error inesperado al dibujar una pantalla SHALL mostrar el estado de error del design system con «Reintentar», nunca una página en blanco. El cambio entre rutas SHALL mostrar un esqueleto. La web SHALL mandar cabeceras que impidan incrustarla en otro sitio y adivinar tipos de contenido. Cada página SHALL tener título propio con el sufijo «· Deploya» y la pestaña SHALL mostrar el ícono de Deploya.

#### Scenario: Error inesperado en una pantalla

- **WHEN** un componente de `(projects)` lanza una excepción al dibujarse
- **THEN** se ve `ErrorConexionApi` con «Reintentar» dentro del shell, y al reintentar se vuelve a dibujar

#### Scenario: Carga entre rutas

- **WHEN** se navega a la lista de proyectos y los datos aún no llegan
- **THEN** se ve `EsqueletoProyectos`

#### Scenario: Cabeceras de seguridad

- **WHEN** se pide cualquier página de la web
- **THEN** la respuesta trae `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff` y `Referrer-Policy: strict-origin-when-cross-origin`

#### Scenario: Título por página

- **WHEN** se abre «Mi suscripción»
- **THEN** la pestaña dice «Mi suscripción · Deploya»
