# Spec Delta

## ADDED Requirements

### Requirement: Primera configuración

En modo autoalojado y sin administrador, el sistema SHALL ofrecer `/configurar`, que SHALL pedir el código de configuración de un solo uso antes de crear la cuenta de administrador verificada, y SHALL permitir probar el SMTP o seguir sin correo. Con administrador o en modo nube, `/configurar` y sus endpoints SHALL responder 404.

#### Scenario: Código válido

- **WHEN** quien instaló escribe el código que imprimió `instalar.sh` dentro de los 30 min
- **THEN** pasa al paso de administrador

#### Scenario: Código vencido

- **WHEN** el código tiene más de 30 min
- **THEN** ve «El código venció; genera otro con ./scripts/instalar.sh --codigo-nuevo» y no puede seguir

#### Scenario: Código usado

- **WHEN** se intenta reutilizar un código con el que ya se creó el administrador
- **THEN** responde 404

#### Scenario: Correo de prueba

- **WHEN** el administrador prueba un SMTP que acepta el envío
- **THEN** ve «Llegó a ops@miempresa.com en 1.2 s»

#### Scenario: SMTP rechazado

- **WHEN** el SMTP rechaza el usuario
- **THEN** ve el error del servidor y puede corregir o elegir «Sin correo por ahora»

#### Scenario: Ya configurada

- **WHEN** ya hay un administrador y alguien abre /configurar
- **THEN** responde 404
