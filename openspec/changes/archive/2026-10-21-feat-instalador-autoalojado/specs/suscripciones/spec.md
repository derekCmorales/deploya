# Spec Delta

## ADDED Requirements

### Requirement: Seed de autoalojado sin administrador

En `MODO_INSTALACION=autoalojado` el seed SHALL NOT crear administrador ni cuentas de demo. Si el entorno trae `HASH_CODIGO_CONFIGURACION` (sha256 hex) y `CODIGO_VENCE`, SHALL copiarlos a `ConfiguracionInstalacion` solo mientras no exista un usuario administrador. Un par inválido SHALL NOT escribir nada.

#### Scenario: Autoalojado sin administrador ni cuentas de demo

- **WHEN** el seed corre en autoalojado sin `ADMIN_CLAVE`
- **THEN** no crea administrador ni cuentas de demo

#### Scenario: El hash del instalador queda guardado

- **WHEN** el seed corre en autoalojado con hash y vencimiento y todavía no hay administrador
- **THEN** `ConfiguracionInstalacion` guarda ese hash, y un hash nuevo lo reemplaza

#### Scenario: Con administrador el hash no vuelve

- **WHEN** ya hay un administrador y el seed vuelve a correr con un hash
- **THEN** no reescribe el hash

#### Scenario: Hash inválido no escribe nada

- **WHEN** el hash no es sha256 hex
- **THEN** el seed no escribe planes ni cuentas
