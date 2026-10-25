# administracion (M9)

Alcance núcleo v4.1 ([docs/alcance.md](../../../docs/alcance.md)): lista de usuarios y suspensión de cuentas. Pantallas 25 y 25b. Dueño: Javier.

## Purpose

Permitir al administrador encontrar una cuenta, ver su suscripción, proyectos y pagos, y suspenderla con un motivo registrado.

## Requirements

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

### Requirement: Reactivar cuenta

Un administrador SHALL poder reactivar una cuenta suspendida con un detalle para el registro. La cuenta SHALL volver a iniciar sesión; sus contenedores SHALL reanudarse solo si la suscripción está vigente.

#### Scenario: Reactivar con suscripción vigente

- **WHEN** el admin reactiva una cuenta suspendida con suscripción Activa y 2 proyectos detenidos
- **THEN** la cuenta entra, sus 2 proyectos vuelven a Saludable y queda una acción «reactivar-cuenta»

#### Scenario: Reactivar con suscripción suspendida

- **WHEN** la suscripción de la cuenta también está Suspendida
- **THEN** la cuenta entra pero sus contenedores siguen detenidos y 25c lo avisa

#### Scenario: Cuenta no suspendida

- **WHEN** el admin intenta reactivar una cuenta Activa
- **THEN** responde 409 CuentaNoSuspendida

#### Scenario: Cliente no puede

- **WHEN** un Cliente llama al endpoint
- **THEN** responde 403

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

#### Scenario: Estado sin correo

- **WHEN** en el asistente se eligió «Sin correo por ahora»
- **THEN** Estado muestra Correo con aviso «Sin correo», aunque haya un envío anterior anotado como entregado

#### Scenario: Estado en una instalación nueva

- **WHEN** todavía no se ha desplegado ningún proyecto y el directorio de trabajo del trabajador no existe
- **THEN** el trabajador lo crea al medir y Estado muestra Docker y Disco con su lectura, no en error

#### Scenario: Solo en autoalojado

- **WHEN** un admin de la nube abre /admin/instalacion
- **THEN** responde 404

## Fuera de alcance · solo si da el tiempo

- Reactivar una cuenta suspendida desde el panel.
- Crear, editar y descontinuar planes (el catálogo es fijo por seed).
- Estado de la infraestructura (nodo, cola, consumo agregado).
