# Spec Delta

## ADDED Requirements

### Requirement: Kit visual canónico reutilizable

El sistema SHALL ofrecer en `apps/web` el kit visual canónico de Deploya (tipografía Geist, tokens claros y oscuros, primitivos shadcn, copy en español). Las rutas de este change SHALL ser stubs que apuntan a `docs/kit-visual.md`. SHALL NOT presentar pantallas de producto (lista/detalle, flujo montado, operación) ni mocks de proyectos.

#### Scenario: Home con kit y sin producto fingido

- **WHEN** el cliente abre `/`
- **THEN** ve «Deploya», el shell con toggle de tema, y una referencia a `docs/kit-visual.md`, sin lista de proyectos ni grafo

#### Scenario: Toggle claro y oscuro

- **WHEN** el cliente activa el control de tema en el header
- **THEN** la superficie pasa entre modo claro y modo oscuro usando los mismos tokens, sin recargar ni cambiar de paleta inventada

#### Scenario: Stub de proyectos

- **WHEN** el cliente abre `/projects`
- **THEN** ve un stub corto en español que apunta al kit, no un panel lista + detalle

### Requirement: Specs con UI reutilizan el kit

Las historias posteriores de este módulo que pinten en `apps/web` SHALL reutilizar `docs/kit-visual.md` (tokens, AppShell, primitivos, Geist, toggle). SHALL NOT introducir otra paleta ni otro layout raíz.

#### Scenario: Misma cromática

- **WHEN** una historia de proyectos añade superficie web
- **THEN** comparte shell, tipografía y tokens con el resto de `apps/web`, incluido el tema activo
