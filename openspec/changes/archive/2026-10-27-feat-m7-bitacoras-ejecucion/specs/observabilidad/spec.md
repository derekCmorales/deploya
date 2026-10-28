# Spec Delta

## ADDED Requirements

### Requirement: Bitácora de ejecución

El cliente SHALL ver las últimas 500 líneas de la salida de su contenedor activo, actualizadas cada 3 s, con filtro por nivel, búsqueda, pausa y descarga. Deploya SHALL NOT guardar esas líneas.

#### Scenario: Líneas nuevas

- **WHEN** el contenedor escribe 6 líneas
- **THEN** aparecen en la siguiente consulta

#### Scenario: Pausa sin perder líneas

- **WHEN** el cliente pausa y llegan 6 líneas
- **THEN** ve «En pausa · 6 líneas nuevas» y al reanudar aparecen todas

#### Scenario: Filtro por nivel

- **WHEN** el cliente elige Error
- **THEN** solo ve las líneas de error
