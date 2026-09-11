# orquestacion (M5)

Alcance §6.1: ciclo de vida del contenedor, aislamiento de red, límites de CPU y memoria, reversión de versiones. Dueño: Derek.

## Purpose

Ejecutar el artefacto en un contenedor aislado con la cuota del plan, vía `ContenedorPuerto` y `VerificacionEntornoPuerto`.

## Requirements

### Requirement: Límites del plan

CPU, memoria y procesos SHALL aplicarse al contenedor según el plan activo (vínculo con M2). El orquestador no llama a Docker: usa `ContenedorPuerto`.

#### Scenario: Arranque con cuota

- **WHEN** hay un artefacto listo y suscripción Activa
- **THEN** el contenedor arranca con los límites del plan

### Requirement: Reversión

Revertir SHALL levantar un artefacto previo ya construido.

#### Scenario: Reversión inmediata

- **WHEN** el cliente pide revertir y existe versión anterior
- **THEN** el estado pasa por Revirtiendo y se publica el artefacto previo

### Requirement: Suscripción suspendida

Si la suscripción está Suspendida (§4.4), los contenedores SHALL detenerse. Los datos se conservan.
