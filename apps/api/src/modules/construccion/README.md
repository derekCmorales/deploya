# M4 Motor de construcción

Dueño: Derek. Spec: [`openspec/specs/motor-construccion/spec.md`](../../../../../openspec/specs/motor-construccion/spec.md). Alcance: [docs/alcance.md](../../../../../docs/alcance.md).

**Núcleo v4.1:** Cola BullMQ, clonar, **detección de stack** (Dockerfile propio o receta Node, Python, Go o estática), `docker build`, artefacto versionado con digest y receta, bitácora; cancelar, reintentar y redesplegar (reconstruye, A3).

**Pantallas:** 11a, 11e (vía M3), 12, 14 (vía M7).

**Fuera de alcance (solo si da el tiempo):** Buildpacks, versiones finas por stack, monorepos.

Hoy (Avance 2):

- `POST /proyectos/:id/despliegues`, `GET /despliegues/:id`, `GET /despliegues/:id/bitacora?desde=` y `GET /proyectos/:id/despliegues/:numero` (contrato v2.1).
- Pipeline en el trabajador: `PasoRecepcion` clona y detecta el stack (`deteccion/`), `PasoConstruccion` construye con el `Dockerfile` del repo o el `Dockerfile.deploya` de la receta.
- Exporta `ConstruccionService` y `DeteccionStackService`; antes de crear un despliegue que construye llama a `BloqueosService` (M5).

Sprint fuera de alcance (SP-08, change `feat-m10-avisos-correo`): `AvisoDespliegueOyente` (`avisos/`) es un oyente más de `OYENTES_DESPLIEGUE`; Saludable y Fallido mandan su correo de 24b por `AvisosPuerto` (M10), Cancelado y Detenido no. Un fallo del aviso no cambia el estado. Antes de anunciar un Fallido el pipeline guarda la bitácora, así el correo trae sus dos últimas líneas (`RepositorioDespliegues.ultimasLineas`).
