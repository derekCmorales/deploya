# Spec Delta

## ADDED Requirements

### Requirement: Comando de construcción en las recetas

Cuando el proyecto tiene `comandoConstruccion` y se construye con receta, el `Dockerfile.deploya` SHALL correrlo en forma shell (`RUN <comando>`): en Node SHALL reemplazar `npm run build` después de instalar; en Python SHALL correr después de `pip install`; en Go SHALL correr antes de `go build`. Con `Dockerfile` propio o con sitio estático el comando SHALL ignorarse y la bitácora de Recepción SHALL decirlo.

#### Scenario: Node con comando de construcción

- **WHEN** la receta es `node` y el proyecto tiene `comandoConstruccion: "npm run build:prod"`
- **THEN** el `Dockerfile.deploya` instala con `npm ci`, corre `RUN npm run build:prod` y no corre `npm run build`

#### Scenario: Python con comando de construcción

- **WHEN** la receta es `python` y el proyecto tiene `comandoConstruccion: "python manage.py collectstatic --noinput"`
- **THEN** la línea `RUN python manage.py collectstatic --noinput` va después de `pip install`

#### Scenario: Go con comando de construcción

- **WHEN** la receta es `go` y el proyecto tiene `comandoConstruccion: "go generate ./..."`
- **THEN** la línea `RUN go generate ./...` va antes de `go build`

#### Scenario: Comando de construcción con Dockerfile propio

- **WHEN** la rama trae `Dockerfile` y el proyecto tiene `comandoConstruccion`
- **THEN** se construye con el `Dockerfile` del repositorio y la bitácora dice «Comando de construcción ignorado: el Dockerfile manda»

#### Scenario: Receta sin comando de construcción

- **WHEN** el proyecto no tiene `comandoConstruccion`
- **THEN** el `Dockerfile.deploya` es el mismo de antes
