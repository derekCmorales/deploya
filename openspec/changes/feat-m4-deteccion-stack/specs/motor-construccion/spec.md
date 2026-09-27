# Spec Delta

## ADDED Requirements

### Requirement: Detección de stack

Cuando la rama no tiene `Dockerfile` en `rutaDockerfile`, el sistema SHALL reconocer el stack probando recetas en este orden: Node (`package.json` con script `start`), Python (`requirements.txt` o `pyproject.toml`, y `main.py` o `app.py`), Go (`go.mod`) y sitio estático (`index.html` en la raíz). Si hay `Dockerfile`, SHALL usarse siempre el del repositorio. La detección SHALL ser la misma en el alta (M3, sobre GitHub) y en el trabajador (sobre el clon), vía `LectorFuente`. Todas las recetas SHALL escuchar en el puerto 8080 (`PORT`).

#### Scenario: El Dockerfile manda

- **WHEN** la rama tiene `Dockerfile` y también `package.json`
- **THEN** la receta es `dockerfile` y el puerto sugerido es el primer `EXPOSE` (o 8080 si no hay)

#### Scenario: Proyecto Node sin Dockerfile

- **WHEN** la rama tiene `package.json` con script `start` y no tiene `Dockerfile`
- **THEN** la receta es `node`, la descripción dice «Node.js 22 · npm start» y la evidencia incluye `package.json`

#### Scenario: Proyecto Python sin Dockerfile

- **WHEN** la rama tiene `requirements.txt` y `main.py`
- **THEN** la receta es `python`

#### Scenario: Proyecto Go sin Dockerfile

- **WHEN** la rama tiene `go.mod`
- **THEN** la receta es `go`

#### Scenario: Sitio estático

- **WHEN** la rama solo tiene `index.html` y recursos estáticos
- **THEN** la receta es `estatica` y se sirve con un servidor sin privilegios en 8080

#### Scenario: Stack no reconocido

- **WHEN** la rama no tiene `Dockerfile` ni coincide con ninguna receta
- **THEN** se lanza `StackNoReconocido` y el despliegue (o el alta) se rechaza con el motivo «falta Dockerfile y no se reconoce el stack»

#### Scenario: Node sin script start

- **WHEN** hay `package.json` sin script `start` y ningún otro archivo reconocible
- **THEN** se lanza `StackNoReconocido` con la pista «agrega un script start o un Dockerfile»

## MODIFIED Requirements

### Requirement: Construcción con Dockerfile

El trabajador SHALL clonar la rama con profundidad 1, registrar el commit (sha, mensaje, autor), detectar el stack y ejecutar `docker build` con el `Dockerfile` del repositorio o, si no hay, con el `Dockerfile.deploya` que genera la receta detectada, detrás de `ConstructorImagenPuerto`, con un tiempo máximo de 10 minutos. Cada construcción exitosa SHALL registrar un artefacto `deploya/<subdominio>:<n>` con digest, tamaño, commit y receta.

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

- **WHEN** la construcción pasa de 10 minutos
- **THEN** se detiene, el despliegue queda Fallido con motivo «tiempo de construcción agotado» y la versión activa no cambia

#### Scenario: Repositorio que no se puede clonar

- **WHEN** el clon falla (repositorio borrado, privado o rama inexistente)
- **THEN** el despliegue queda Fallido en la etapa Recepción con el motivo del error de git
