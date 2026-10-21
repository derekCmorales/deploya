# instalacion Specification

## Purpose
Deploya como código abierto y autoalojable (transversal, ADR 0008): repositorio público con licencia y guías, instalador por etapas y operación con un comando. Dueño de los scripts: Derek; modo y ajustes de instalación: Javier.

## Requirements

### Requirement: Repositorio de código abierto

El repositorio SHALL incluir licencia, README para usuarios externos, guía de contribución y política de seguridad, y su historial SHALL revisarse con `gitleaks`; cualquier secreto encontrado SHALL rotarse, porque el repositorio ya es público.

#### Scenario: Historial sin secretos

- **WHEN** CI corre `gitleaks` sobre todo el historial
- **THEN** no encuentra secretos, o cada secreto encontrado ya fue rotado y está en la lista de permitidos con su motivo

#### Scenario: Contribuir

- **WHEN** alguien de fuera lee CONTRIBUTING.md
- **THEN** sabe cómo proponer un change, nombrar la rama y correr `pnpm check`
