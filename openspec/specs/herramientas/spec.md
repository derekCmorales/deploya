# herramientas (M8)

**Fuera del alcance núcleo v4.1** ([docs/alcance.md](../../../docs/alcance.md)). No hay pantallas. El módulo queda como stub con `GET /herramientas/health`. Dueño código: Derek; UI: Eduardo.

## Purpose

Reservar el lugar de la capa de herramientas (asistente de diagnóstico y servidor de integración) sin implementarla en el núcleo.

## Requirements

### Requirement: Stub

El módulo SHALL seguir registrado y responder `GET /herramientas/health`. No SHALL exponer operaciones mientras esté fuera de alcance.

#### Scenario: Health

- **WHEN** se consulta `GET /herramientas/health`
- **THEN** responde que el módulo está registrado

## Fuera de alcance · solo si da el tiempo

Última prioridad de la lista de `docs/alcance.md`. Si se retoma, entra con un change propio y estas reglas del diseño original:

- Una sola capa (`CapaHerramientas`) para el asistente del panel y para clientes externos: consultar, desplegar, bitácoras, redesplegar, variables.
- El asistente hereda los permisos del usuario y nunca los excede; toda operación destructiva exige confirmación humana.
- Bitácoras y repositorios son entrada no confiable: se analizan, no se ejecutan instrucciones contenidas en ellos.
