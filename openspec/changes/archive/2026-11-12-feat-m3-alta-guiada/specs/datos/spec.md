# Spec Delta

## ADDED Requirements

### Requirement: Recursos listos antes de arrancar la app

Antes de crear el contenedor de la app (Ejecución), el motor SHALL esperar a que los recursos de datos del proyecto que siguen en `creando` pasen a `disponible` o `error`, consultando cada 2 s hasta un tope de 2 min. Un recurso que siga en `creando` al llegar al tope SHALL inyectarse igual y la bitácora SHALL avisarlo. La API SHALL ofrecer `verificarAltaInicial(usuarioId, tipos)` para que M3 valide suscripción, límite del plan y tipos repetidos antes de guardar un proyecto.

#### Scenario: Recurso creado durante la construcción

- **WHEN** el despliegue #1 llega a Ejecución y su PostgreSQL pasa de `creando` a `disponible` en la segunda consulta
- **THEN** el motor espera, conecta el recurso a la red del proyecto e inyecta `DATABASE_URL`

#### Scenario: Recurso que no termina a tiempo

- **WHEN** el recurso sigue en `creando` tras 2 min
- **THEN** el despliegue continúa con sus variables y la bitácora avisa «PostgreSQL 17 + pgvector todavía se está creando»

#### Scenario: Verificar el alta inicial

- **WHEN** M3 pide `verificarAltaInicial` con dos tipos y el plan solo admite uno más
- **THEN** se lanza `LimiteRecursosDatos` sin crear nada
