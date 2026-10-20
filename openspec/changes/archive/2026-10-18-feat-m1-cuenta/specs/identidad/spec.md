# Spec Delta

## MODIFIED Requirements

### Requirement: Mi cuenta

El cliente SHALL poder editar su nombre (máximo 64 caracteres), ver su correo y rol en solo lectura, cambiar su contraseña con la actual y cerrar sesión en todos los dispositivos. Cambiar la contraseña SHALL aplicar la misma política del registro y SHALL cerrar las demás sesiones sin cerrar la actual.

#### Scenario: Ver mi cuenta

- **WHEN** un cliente con sesión abre Mi cuenta
- **THEN** ve su nombre editable, su correo verificado y su rol en solo lectura y la fecha de alta

#### Scenario: Editar nombre

- **WHEN** el cliente guarda el nombre «  Derek Calderón  »
- **THEN** se guarda «Derek Calderón» y el encabezado lo muestra

#### Scenario: Nombre vacío o de más de 64 caracteres

- **WHEN** el cliente guarda un nombre vacío o de 65 caracteres
- **THEN** se rechaza con `NombreInvalido` y el nombre no cambia

#### Scenario: Cambiar contraseña

- **WHEN** el cliente con dos sesiones abiertas cambia su contraseña desde una de ellas con la actual correcta y una nueva válida
- **THEN** el hash cambia, la otra sesión queda revocada y la sesión desde la que cambió sigue activa

#### Scenario: Contraseña actual incorrecta

- **WHEN** el cliente escribe mal la contraseña actual
- **THEN** se rechaza con `ContrasenaActualIncorrecta` y ninguna sesión se revoca

#### Scenario: Nueva contraseña débil

- **WHEN** la nueva contraseña no cumple la política del registro
- **THEN** se rechaza con `ContrasenaDebil` y la contraseña no cambia

#### Scenario: Cerrar sesión en todos los dispositivos

- **WHEN** el cliente confirma «Cerrar todas»
- **THEN** todas sus sesiones, incluida la actual, quedan invalidadas y debe iniciar sesión de nuevo
