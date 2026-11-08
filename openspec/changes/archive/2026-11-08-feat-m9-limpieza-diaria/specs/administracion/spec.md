# Spec Delta

## ADDED Requirements

### Requirement: Limpieza diaria

El sistema SHALL borrar una vez al día los tokens de cuenta usados o vencidos hace más de 7 días, las sesiones revocadas hace más de 7 días o sin actividad hace más de 14, y las invitaciones usadas, revocadas o vencidas hace más de 30 días. SHALL guardar cuándo corrió y cuántas filas borró. Un administrador SHALL poder correrla a mano. No SHALL tocar ninguna otra tabla.

#### Scenario: Borra lo vencido

- **WHEN** corre la limpieza con un token usado hace 8 días, una sesión sin actividad hace 15 días y una invitación vencida hace 31 días
- **THEN** las tres se borran y queda registrado «3 filas»

#### Scenario: Respeta lo vigente

- **WHEN** hay un token vencido hace 2 días y una sesión con actividad de ayer
- **THEN** ninguno se borra

#### Scenario: Correr dos veces el mismo día

- **WHEN** la limpieza corre dos veces seguidas
- **THEN** la segunda borra 0 filas y no falla

#### Scenario: Cliente no puede

- **WHEN** un Cliente llama `POST /admin/limpieza/ejecutar`
- **THEN** responde 403
