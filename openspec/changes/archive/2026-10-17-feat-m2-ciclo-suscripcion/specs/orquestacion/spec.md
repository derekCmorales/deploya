# Spec Delta

## MODIFIED Requirements

### Requirement: Suspensión

Si la suscripción pasa a Suspendida o la cuenta se suspende (M9), los contenedores del cliente SHALL detenerse. Los datos se conservan. Al reactivar la suscripción, el sistema SHALL volver a arrancar el despliegue activo de cada proyecto que quedó Detenido. M5 SHALL hacerlo por la cola de operación, sin que M2 ni M9 conozcan Docker.

#### Scenario: Suscripción suspendida

- **WHEN** M2 marca la suscripción como Suspendida
- **THEN** todos los contenedores del cliente se detienen y su configuración se conserva

#### Scenario: Reanudar al renovar

- **WHEN** M2 reactiva la suscripción de un cliente con dos proyectos Detenidos
- **THEN** se encola un `reiniciar` por cada uno y, tras la salud, vuelven a Saludable

#### Scenario: Proyecto sin despliegue activo

- **WHEN** se suspende a un cliente con un proyecto que nunca quedó Saludable
- **THEN** ese proyecto se omite y los demás se detienen
