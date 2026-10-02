# Spec Delta

## MODIFIED Requirements

### Requirement: Límite y estado de la suscripción

El alta SHALL bloquearse si el cliente alcanzó el límite de proyectos de su plan (`cuotaDe(usuarioId).maxProyectos`), si su suscripción está Vencida o Suspendida o si agotó las construcciones del mes. El bloqueo por límite SHALL ocurrir antes de consultar GitHub, y todas las verificaciones SHALL hacerse antes de persistir el proyecto. Un proyecto cuyo último despliegue está Fallido SHALL NOT contar contra el límite.

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
