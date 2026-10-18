# Spec Delta

## MODIFIED Requirements

### Requirement: Límite y estado de la suscripción

El alta SHALL bloquearse si el cliente alcanzó el límite de proyectos de su plan (`cuotaDe(usuarioId).maxProyectos`), si su suscripción está Vencida o Suspendida o si agotó las construcciones del mes. El bloqueo por límite SHALL ocurrir antes de consultar GitHub, y todas las verificaciones SHALL hacerse antes de persistir el proyecto. Un proyecto cuyo último despliegue está Fallido SHALL NOT contar contra el límite. La lista de proyectos SHALL avisar del vencimiento antes de que el cliente intente desplegar. El panel SHALL mostrar un estado claro cuando la página no existe, cuando la API no responde y mientras carga.

#### Scenario: Límite de proyectos del plan

- **WHEN** un cliente en Sandbox con 1 proyecto intenta otro
- **THEN** se rechaza con `limite-proyectos` (409), no se consulta GitHub, no se guarda nada ni se pide despliegue, y en la web «Nuevo proyecto» queda deshabilitado con «Cambiar plan»

#### Scenario: Suscripción vencida

- **WHEN** la suscripción del cliente está Vencida
- **THEN** «Nuevo proyecto» y «Desplegar» quedan bloqueados y se ofrece renovar

#### Scenario: Proyecto fallido no cuenta

- **WHEN** el último despliegue de un proyecto está Fallido
- **THEN** el proyecto sigue en la lista, no suma al contador y el cliente puede crear otro aunque esté en el límite

#### Scenario: Alta con la suscripción vencida

- **WHEN** un cliente con la suscripción Vencida confirma el alta en Revisar
- **THEN** la API responde 409 `suscripcion-no-permite` y el proyecto no se guarda

#### Scenario: Construcciones agotadas en el alta

- **WHEN** un cliente sin construcciones disponibles confirma el alta
- **THEN** se muestra «Usaste las construcciones de tu plan este mes» con «Cambiar de plan» y el proyecto no se guarda

#### Scenario: Aviso con la fecha de gracia

- **WHEN** la suscripción Starter venció el 24 de septiembre
- **THEN** la lista muestra «Tu plan Starter venció el 24 sep · despliegues bloqueados» y que los servicios siguen en línea hasta el 29 sep

#### Scenario: Error de conexión con la API

- **WHEN** la lista de proyectos no puede conectar con la API
- **THEN** se muestra «No pudimos conectar con deploya», se reintenta solo a los 8 s y luego a los 16 s y 30 s, y «Reintentar ahora» lo hace de inmediato

#### Scenario: Página inexistente

- **WHEN** el cliente abre `/projects/api-tiendaa`, que no existe
- **THEN** ve «No encontramos esta página» con la ruta pedida e «Ir a proyectos»
