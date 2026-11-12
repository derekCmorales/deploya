# Spec Delta

## MODIFIED Requirements

### Requirement: Construcción con Dockerfile

El trabajador SHALL clonar la rama con profundidad 1, registrar el commit (sha, mensaje, autor), detectar el stack y ejecutar `docker build` con el `Dockerfile` del repositorio o, si no hay, con el `Dockerfile.deploya` que genera la receta detectada, detrás de `ConstructorImagenPuerto`, con el tiempo máximo de `MOTOR_TIEMPO_MAXIMO_CONSTRUCCION_MIN` (20 minutos por omisión). Cada construcción exitosa SHALL registrar un artefacto `deploya/<subdominio>:<n>` con digest, tamaño, commit y receta.

#### Scenario: Construcción exitosa

- **WHEN** `docker build` termina bien
- **THEN** se registra el artefacto #n con imagen, digest, tamaño y receta, la etapa Construcción queda Completada con su duración y el despliegue pasa a Aprovisionando

#### Scenario: Construcción con receta

- **WHEN** la receta detectada es `node`
- **THEN** la bitácora registra «Stack detectado: Node.js 22 · receta Deploya», se construye con `Dockerfile.deploya` y el artefacto guarda `receta = node`

#### Scenario: Construcción fallida

- **WHEN** un paso del `Dockerfile` termina con código 127
- **THEN** el despliegue queda Fallido con `codigoSalida = 127`, la etapa Construcción queda Fallida, la última línea de bitácora es de nivel error y la versión activa del proyecto no cambia

#### Scenario: Tiempo de construcción agotado

- **WHEN** la construcción pasa del tiempo máximo configurado
- **THEN** se detiene, el despliegue queda Fallido con motivo «tiempo de construcción agotado» y la versión activa no cambia

#### Scenario: Tiempo de construcción configurable

- **WHEN** `MOTOR_TIEMPO_MAXIMO_CONSTRUCCION_MIN` vale 30 (o falta, o no es un número positivo)
- **THEN** cada `docker build` recibe un tope de 30 minutos (o de 20 por omisión)

#### Scenario: Repositorio que no se puede clonar

- **WHEN** el clon falla (repositorio borrado, privado o rama inexistente)
- **THEN** el despliegue queda Fallido en la etapa Recepción con el motivo del error de git
