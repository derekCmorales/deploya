# Spec Delta

## ADDED Requirements

### Requirement: Repositorio de código abierto

El repositorio SHALL incluir licencia, README para usuarios externos, guía de contribución y política de seguridad, y su historial SHALL estar libre de secretos antes de hacerse público.

#### Scenario: Historial sin secretos

- **WHEN** CI corre `gitleaks` sobre todo el historial
- **THEN** no encuentra secretos

#### Scenario: Contribuir

- **WHEN** alguien de fuera lee CONTRIBUTING.md
- **THEN** sabe cómo proponer un change, nombrar la rama y correr `pnpm check`
