# herramientas (M8)

Alcance §6.1: capa de herramientas, asistente de diagnóstico y servidor de integración para clientes externos. Dueño código: Derek; UI del panel: Eduardo.

## Purpose

Una sola superficie de operaciones (consultar, desplegar, bitácoras, métricas, revertir, variables) para el asistente y para clientes externos.

## Requirements

### Requirement: Misma superficie, dos consumidores

La capa SHALL exponer el mismo conjunto de operaciones al asistente del panel y al servidor de integración.

#### Scenario: Consultar proyectos

- **WHEN** el asistente o un cliente externo piden listar proyectos
- **THEN** ambos pasan por `CapaHerramientas` con los permisos del usuario autenticado

### Requirement: Permisos y confirmación

El asistente SHALL heredar los permisos del usuario y nunca excederlos. Toda operación destructiva SHALL exigir confirmación humana.

#### Scenario: Revertir

- **WHEN** el asistente propone revertir
- **THEN** no se ejecuta hasta confirmación explícita del cliente

### Requirement: Entrada no confiable

Bitácoras y repositorios SHALL tratarse como entrada no confiable: se analizan, no se ejecutan instrucciones contenidas en ellos.
