# administracion (M9)

Alcance §6.1: panel administrativo de usuarios, planes y estado de la infraestructura. Dueño: Javier.

## Purpose

Permitir al administrador gestionar cuentas, el catálogo de planes y ver el estado de la infraestructura sin mezclar tres controladores en uno.

## Requirements

### Requirement: Usuarios

El administrador SHALL listar usuarios y suspender cuentas.

#### Scenario: Suspender cuenta

- **WHEN** el administrador suspende un usuario
- **THEN** se registra una acción administrativa y el usuario no inicia sesión

### Requirement: Planes

El administrador SHALL crear, actualizar y descontinuar planes del catálogo M2.

#### Scenario: Descontinuar plan

- **WHEN** un plan se descontinúa
- **THEN** deja de ofrecerse a nuevas contrataciones; las suscripciones vigentes siguen hasta el fin de vigencia

### Requirement: Estado de infraestructura

El administrador SHALL consultar un resumen de entornos y salud del nodo (datos que proveen M5 y M7). El módulo no orquesta contenedores.
