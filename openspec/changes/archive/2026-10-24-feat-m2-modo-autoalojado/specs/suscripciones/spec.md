# Spec Delta

## ADDED Requirements

### Requirement: Modo de instalación

El sistema SHALL funcionar en modo `nube` o `autoalojado` según `MODO_INSTALACION`. En autoalojado SHALL existir un único plan «Autoalojado» sin cobro ni vencimiento, los límites por proyecto SHALL salir de la configuración de la instalación, la tarea del ciclo §4.4 SHALL NOT programarse y el primer administrador SHALL crearse solo con el código de configuración.

#### Scenario: Nube por defecto

- **WHEN** no se define `MODO_INSTALACION`
- **THEN** el sistema se comporta como hoy, con los cuatro planes y el ciclo

#### Scenario: Sin cobro en autoalojado

- **WHEN** un usuario abre /planes en autoalojado
- **THEN** responde 404 y la navegación no muestra Suscripción

#### Scenario: Límites de la instalación

- **WHEN** la instalación tiene 1 vCPU y 1 GB por proyecto y el usuario despliega
- **THEN** el contenedor corre con `--cpus 1` y `--memory 1g`

#### Scenario: Sin límite de proyectos

- **WHEN** `proyectosPorUsuario` es nulo y el usuario crea su proyecto 30
- **THEN** se crea sin bloqueo

#### Scenario: Sin código no hay administrador

- **WHEN** alguien se registra en autoalojado antes de usar el código
- **THEN** su cuenta es Cliente y la instalación sigue sin administrador

#### Scenario: El ciclo no corre

- **WHEN** el trabajador arranca en autoalojado
- **THEN** no se programa la tarea diaria del ciclo
