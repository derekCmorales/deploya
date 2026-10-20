# Spec Delta

## ADDED Requirements

### Requirement: Avisos por correo

El sistema SHALL avisar por correo al titular cuando un despliegue termina Saludable o Fallido y cuando su suscripción pasa a Por vencer o a Suspendida, con las plantillas de la pantalla 24b. Un error al enviar SHALL registrarse y SHALL NOT propagarse a quien avisa.

#### Scenario: Despliegue saludable

- **WHEN** el despliegue #14 de api-tienda termina Saludable
- **THEN** el titular recibe «api-tienda está en línea» con versión, duración y URL

#### Scenario: Despliegue fallido

- **WHEN** el despliegue #15 falla en Construcción con la #14 activa
- **THEN** el titular recibe «Falló el despliegue #15 de api-tienda» con la etapa, la versión activa y las dos últimas líneas de la bitácora

#### Scenario: Cancelado no avisa

- **WHEN** el cliente cancela un despliegue en Construyendo
- **THEN** no se manda ningún correo

#### Scenario: Error del SMTP

- **WHEN** el servidor SMTP rechaza el envío de un aviso
- **THEN** el despliegue conserva su estado y el error queda en la bitácora del API
