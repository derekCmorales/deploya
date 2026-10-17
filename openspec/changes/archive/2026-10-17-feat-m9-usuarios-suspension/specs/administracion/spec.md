# Spec Delta

## MODIFIED Requirements

### Requirement: Usuarios

El administrador SHALL listar usuarios con búsqueda por correo y filtro por estado de suscripción, y ver el detalle de uno: rol, alta, suscripción, proyectos con su estado de despliegue y pagos. Solo el rol Administrador SHALL acceder.

#### Scenario: Buscar por correo

- **WHEN** el administrador escribe «tiendademo»
- **THEN** solo ve cuentas cuyo correo contiene ese texto

#### Scenario: Filtrar por suscripción

- **WHEN** el administrador filtra por Vencida
- **THEN** solo ve cuentas cuya suscripción está Vencida

#### Scenario: Detalle de un usuario

- **WHEN** el administrador abre una cuenta con tres proyectos y dos pagos
- **THEN** ve su plan y estado de suscripción, los tres proyectos con el estado de su despliegue activo y los dos pagos

#### Scenario: Cliente en administración

- **WHEN** un Cliente pide `GET /admin/usuarios`
- **THEN** responde 403 `SoloAdministracion`

### Requirement: Suspender cuenta

El administrador SHALL suspender una cuenta indicando motivo y detalle. La suspensión SHALL quedar registrada como acción administrativa. Un administrador SHALL NOT suspender a otro administrador.

#### Scenario: Suspender cuenta

- **WHEN** el administrador confirma la suspensión
- **THEN** el usuario no puede iniciar sesión (ve el motivo), M5 detiene sus contenedores y el código, las variables y el historial se conservan

#### Scenario: No se suspende a un administrador

- **WHEN** el administrador intenta suspender a `admin@deploya.app`
- **THEN** se rechaza con `NoSePuedeSuspenderAdministrador` y nada cambia

#### Scenario: Cuenta ya suspendida

- **WHEN** el administrador suspende una cuenta que ya está Suspendida
- **THEN** se rechaza con `CuentaYaSuspendida` y no se registra otra acción

#### Scenario: Motivo fuera de la lista

- **WHEN** el motivo no es uno de los de la lista de 25b
- **THEN** se rechaza con `MotivoInvalido`
