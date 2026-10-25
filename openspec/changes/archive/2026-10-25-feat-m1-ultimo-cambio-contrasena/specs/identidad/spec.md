# Spec Delta

## ADDED Requirements

### Requirement: Último cambio de contraseña

El sistema SHALL guardar la fecha del último cambio de contraseña, al cambiarla desde Mi cuenta y al restablecerla, y Mi cuenta · Seguridad SHALL mostrarla.

#### Scenario: Fecha después de cambiarla

- **WHEN** el cliente cambia su contraseña el 22 sep 2026
- **THEN** 05b muestra «Último cambio: 22 sep 2026»

#### Scenario: Fecha después de restablecerla

- **WHEN** el cliente restablece su contraseña con un enlace de recuperación
- **THEN** la fecha del último cambio es la del restablecimiento

#### Scenario: Nunca cambiada

- **WHEN** una cuenta recién creada abre 05b
- **THEN** ve «Nunca la has cambiado»
