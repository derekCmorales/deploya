# Spec Delta

## ADDED Requirements

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
