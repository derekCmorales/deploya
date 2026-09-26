# administracion (M9)

Alcance núcleo v4.1 ([docs/alcance.md](../../../docs/alcance.md)): lista de usuarios y suspensión de cuentas. Pantallas 25 y 25b. Dueño: Javier.

## Purpose

Permitir al administrador encontrar una cuenta, ver su suscripción, proyectos y pagos, y suspenderla con un motivo registrado.

## Requirements

### Requirement: Usuarios

El administrador SHALL listar usuarios con búsqueda por correo y filtro por estado de suscripción, y ver el detalle de uno: rol, alta, suscripción, proyectos con su estado de despliegue y pagos.

#### Scenario: Filtrar por suscripción

- **WHEN** el administrador filtra por Vencida
- **THEN** solo ve cuentas cuya suscripción está Vencida

### Requirement: Suspender cuenta

El administrador SHALL suspender una cuenta indicando motivo y detalle. La suspensión SHALL quedar registrada como acción administrativa.

#### Scenario: Suspender cuenta

- **WHEN** el administrador confirma la suspensión
- **THEN** el usuario no puede iniciar sesión (ve el motivo), M5 detiene sus contenedores y el código, las variables y el historial se conservan

## Fuera de alcance · solo si da el tiempo

- Reactivar una cuenta suspendida desde el panel.
- Crear, editar y descontinuar planes (el catálogo es fijo por seed).
- Estado de la infraestructura (nodo, cola, consumo agregado).
