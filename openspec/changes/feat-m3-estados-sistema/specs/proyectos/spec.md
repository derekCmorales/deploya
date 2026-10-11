# Spec Delta

## MODIFIED Requirements

### Requirement: Límite y estado de la suscripción

El alta SHALL bloquearse si el cliente alcanzó el límite de proyectos de su plan o si su suscripción está Vencida o Suspendida. La lista de proyectos SHALL avisar del vencimiento antes de que el cliente intente desplegar. El panel SHALL mostrar un estado claro cuando la página no existe, cuando la API no responde y mientras carga.

#### Scenario: Suscripción vencida

- **WHEN** la suscripción del cliente está Vencida
- **THEN** «Nuevo proyecto» y «Desplegar» quedan bloqueados y se ofrece renovar

#### Scenario: Aviso con la fecha de gracia

- **WHEN** la suscripción Starter venció el 24 de septiembre
- **THEN** la lista muestra «Tu plan Starter venció el 24 sep · despliegues bloqueados» y que los servicios siguen en línea hasta el 29 sep

#### Scenario: Error de conexión con la API

- **WHEN** la lista de proyectos no puede conectar con la API
- **THEN** se muestra «No pudimos conectar con deploya», se reintenta solo a los 8 s y luego a los 16 s y 30 s, y «Reintentar ahora» lo hace de inmediato

#### Scenario: Página inexistente

- **WHEN** el cliente abre `/projects/api-tiendaa`, que no existe
- **THEN** ve «No encontramos esta página» con la ruta pedida e «Ir a proyectos»
