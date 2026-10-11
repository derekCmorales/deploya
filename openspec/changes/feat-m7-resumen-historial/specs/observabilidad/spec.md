# Spec Delta

## MODIFIED Requirements

### Requirement: Resumen del proyecto

El sistema SHALL mostrar el estado actual, la URL pública, la versión activa (número, commit, digest y tamaño de imagen), los recursos aplicados del plan y la línea de tiempo del último despliegue, con las acciones Visitar, Reiniciar, Detener y Desplegar.

#### Scenario: Proyecto saludable

- **WHEN** el cliente abre un proyecto con un despliegue Saludable
- **THEN** ve la URL, la versión activa con su digest y los CPU y memoria aplicados por su plan

#### Scenario: Proyecto sin despliegue Saludable

- **WHEN** el cliente abre un proyecto cuyo único despliegue terminó Fallido
- **THEN** no ve versión activa ni URL y el último despliegue aparece con su estado y un enlace a su vista

#### Scenario: Línea de tiempo del último despliegue

- **WHEN** el último despliegue terminó Saludable
- **THEN** la línea de tiempo muestra Commit recibido, Imagen construida, Contenedor iniciado y Tráfico redirigido con su hora

### Requirement: Historial de despliegues

El sistema SHALL listar los despliegues del proyecto con versión, commit, fecha, duración, estado e imagen, filtrables por todos, saludables y fallidos, de 20 en 20 del más reciente al más antiguo, con la versión activa resaltada. Por fila SHALL ofrecer la acción que corresponda: revertir (artefacto disponible y no activo), redesplegar o reintentar (fallido).

#### Scenario: Filtrar fallidos

- **WHEN** el cliente filtra por fallidos
- **THEN** solo ve los despliegues en estado Fallido

#### Scenario: Cargar más

- **WHEN** el proyecto tiene 25 despliegues y el cliente pide «Cargar más»
- **THEN** ve los 5 más antiguos sin repetir ninguno de los 20 primeros

#### Scenario: Fila activa marcada

- **WHEN** el activo es #13 y el más reciente es #14 Fallido
- **THEN** #13 aparece como «Versión activa» y #14 ofrece «Reintentar»

#### Scenario: Imagen retirada

- **WHEN** una fila tiene su artefacto con `disponible = false`
- **THEN** la acción de revertir aparece deshabilitada con «imagen retirada»
