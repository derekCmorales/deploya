# Spec Delta

## ADDED Requirements

### Requirement: Ajustes de la instalación

En autoalojado, un administrador SHALL ver el estado de la instalación y SHALL poder cambiar la política de registro, crear y revocar invitaciones y fijar los límites por proyecto. Cada cambio SHALL dejar una acción administrativa. Los límites SHALL aplicar en el próximo despliegue de cada proyecto.

#### Scenario: Registro con invitación

- **WHEN** la política es «Con invitación» y alguien se registra con un enlace válido
- **THEN** se crea su cuenta de Cliente y el enlace queda usado

#### Scenario: Invitación vencida o reusada

- **WHEN** alguien usa un enlace de hace 8 días o ya usado
- **THEN** el registro responde 410 y no crea la cuenta

#### Scenario: Registro cerrado

- **WHEN** la política es «Cerrado» y alguien intenta registrarse
- **THEN** responde 403 y las cuentas existentes siguen entrando

#### Scenario: Límites en el próximo despliegue

- **WHEN** el admin baja la memoria a 512 MB con un despliegue en curso
- **THEN** el despliegue en curso conserva su límite y el siguiente usa 512 MB

#### Scenario: Estado con aviso

- **WHEN** el último envío de correo falló
- **THEN** Estado muestra Correo con aviso y el error del servidor

#### Scenario: Solo en autoalojado

- **WHEN** un admin de la nube abre /admin/instalacion
- **THEN** responde 404
