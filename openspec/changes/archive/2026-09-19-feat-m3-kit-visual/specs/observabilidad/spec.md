# Spec Delta

## ADDED Requirements

### Requirement: Observabilidad reutiliza el kit visual

Cuando este módulo tenga superficie en `apps/web`, SHALL usar el kit visual canónico (`docs/kit-visual.md`): tokens, AppShell, primitivos shadcn, Geist, toggle claro/oscuro y copy en español. SHALL NOT introducir otra paleta. Este change SHALL NOT implementar métricas, bitácoras ni aviso de cuota en el panel.

#### Scenario: Sin pantalla de operación en este change

- **WHEN** el cliente navega las rutas de este PR
- **THEN** no hay vista de operación con métricas o bitácoras mock

#### Scenario: Misma cromática en una historia futura

- **WHEN** una historia de observabilidad añade superficie web
- **THEN** comparte shell, tipografía y tokens con el resto de `apps/web`, incluido el tema activo
