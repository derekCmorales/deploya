# Spec Delta

## ADDED Requirements

### Requirement: Correo de la instalación

En autoalojado, el sistema SHALL mandar cada correo según lo que guardó el asistente o Admin · Instalación: por el SMTP guardado, sin enviar si se eligió «Sin correo por ahora», o con las `SMTP_*` del entorno si nadie lo configuró. Cambiarlo SHALL aplicar en el siguiente envío, sin reiniciar. El último envío SHALL seguir registrándose para el estado de la instalación.

#### Scenario: SMTP guardado

- **WHEN** la instalación tiene un SMTP guardado y se manda una verificación de cuenta
- **THEN** sale por ese servidor, con la contraseña descifrada solo para el envío

#### Scenario: Sin correo

- **WHEN** la instalación eligió «Sin correo por ahora» y se manda un aviso
- **THEN** no se envía nada y quien avisa no recibe error

#### Scenario: Sin configurar

- **WHEN** nadie configuró el correo en la web
- **THEN** se usan las `SMTP_*` del entorno, como en la nube
