# Spec Delta

## ADDED Requirements

### Requirement: Primera configuración

En modo autoalojado y sin administrador, el sistema SHALL ofrecer `/configurar`, que SHALL pedir el código de configuración de un solo uso antes de crear la cuenta de administrador verificada y SHALL volver a validarlo al crearla; aunque lleguen dos altas a la vez, SHALL crear un solo administrador. Crear el administrador SHALL dejar su sesión iniciada para seguir con correo, registro y límites. El asistente SHALL permitir probar el SMTP o seguir sin correo y SHALL guardar la elección en la instalación, no en archivos. Con administrador y sin sesión de administrador, o en modo nube, `/configurar` y sus endpoints SHALL responder 404.

#### Scenario: Código válido

- **WHEN** quien instaló escribe el código que imprimió `instalar.sh` dentro de los 30 min
- **THEN** pasa al paso de administrador

#### Scenario: Código vencido

- **WHEN** el código tiene más de 30 min
- **THEN** ve «El código venció; genera otro con ./scripts/instalar.sh --codigo-nuevo» y no puede seguir

#### Scenario: Código usado

- **WHEN** se intenta reutilizar un código con el que ya se creó el administrador
- **THEN** responde 404

#### Scenario: Sesión al crear el administrador

- **WHEN** quien instaló crea la cuenta de administrador con un código válido
- **THEN** la respuesta deja la sesión iniciada, el código ya no sirve y el asistente sigue en el paso de correo sin pedir el login

#### Scenario: Administrador sin código

- **WHEN** sin administrador, alguien llama a `POST /instalacion/administrador` sin código o con uno inválido o vencido
- **THEN** responde 401 o 410 y no crea la cuenta

#### Scenario: Dos administradores a la vez

- **WHEN** llegan a la vez dos `POST /instalacion/administrador` con el código válido
- **THEN** solo una crea la cuenta y la otra responde 404

#### Scenario: Correo de prueba

- **WHEN** el administrador prueba un SMTP que acepta el envío
- **THEN** ve «Llegó a ops@miempresa.com en 1.2 s»

#### Scenario: SMTP rechazado

- **WHEN** el SMTP rechaza el usuario
- **THEN** ve el error del servidor y puede corregir o elegir «Sin correo por ahora»

#### Scenario: Correo guardado sin editar archivos

- **WHEN** el administrador guarda su SMTP en el paso de correo
- **THEN** queda en la instalación con la contraseña cifrada y el siguiente correo sale por ese servidor sin reiniciar

#### Scenario: Ya configurada

- **WHEN** ya hay un administrador y alguien sin sesión de administrador abre /configurar o llama a `POST /instalacion/codigo`
- **THEN** responde 404
