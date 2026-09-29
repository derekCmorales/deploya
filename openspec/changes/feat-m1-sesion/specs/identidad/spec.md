# Spec Delta

## MODIFIED Requirements

### Requirement: Inicio y cierre de sesión

El sistema SHALL emitir una sesión al validar credenciales de una cuenta Activa. La sesión SHALL expirar tras 7 días sin actividad. El sistema SHALL exponer un guard de sesión y el usuario actual para el resto de módulos.

El token de la sesión SHALL viajar solo en una cookie HttpOnly y en la base SHALL guardarse solo su huella. Cerrar sesión SHALL revocarla. Las rutas de proyectos y despliegues SHALL responder 401 sin una sesión vigente.

#### Scenario: Credenciales válidas

- **WHEN** una cuenta Activa envía su correo y contraseña
- **THEN** recibe la cookie de sesión y la respuesta trae solo su usuario

#### Scenario: Credenciales incorrectas

- **WHEN** el correo o la contraseña no coinciden
- **THEN** se muestra un error genérico sin revelar cuál falló

#### Scenario: Cuenta sin verificar

- **WHEN** una cuenta pendiente intenta entrar
- **THEN** se rechaza y se ofrece reenviar el correo de verificación

#### Scenario: Cuenta suspendida

- **WHEN** una cuenta suspendida por administración intenta entrar
- **THEN** se rechaza y se muestra el motivo registrado por M9

#### Scenario: Sesión expirada

- **WHEN** pasan 7 días sin actividad
- **THEN** el token ya no resuelve a ningún usuario y la ruta protegida responde 401

#### Scenario: Ruta protegida sin sesión

- **WHEN** alguien sin cookie de sesión vigente pide `/proyectos` o un despliegue
- **THEN** la API responde 401 y la web lleva a `/ingresar`

#### Scenario: Cerrar sesión

- **WHEN** el usuario cierra sesión
- **THEN** la sesión queda revocada y la cookie vencida
