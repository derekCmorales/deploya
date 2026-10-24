# M4 Motor de construcción

Dueño: Derek. Spec: [`openspec/specs/motor-construccion/spec.md`](../../../../../openspec/specs/motor-construccion/spec.md). Alcance: [docs/alcance.md](../../../../../docs/alcance.md).

**Núcleo v4.1:** Cola BullMQ, clonar, **detección de stack** (Dockerfile propio o receta Node, Python, Go o estática), `docker build`, artefacto versionado con digest y receta, bitácora; cancelar, reintentar y redesplegar (reconstruye, A3).

**Pantallas:** 11a, 11e (vía M3), 12, 14 (vía M7).

**Fuera de alcance (solo si da el tiempo):** Buildpacks, versiones finas por stack, monorepos.

Hoy (Avance 2):

- `POST /proyectos/:id/despliegues`, `GET /despliegues/:id`, `GET /despliegues/:id/bitacora?desde=` y `GET /proyectos/:id/despliegues/:numero` (contrato v2.1).
- Pipeline en el trabajador: `PasoRecepcion` clona y detecta el stack (`deteccion/`), `PasoConstruccion` construye con el `Dockerfile` del repo o el `Dockerfile.deploya` de la receta.
- Exporta `ConstruccionService` y `DeteccionStackService`; antes de crear un despliegue que construye llama a `BloqueosService` (M5).

Sprint fuera de alcance (SP-08, change `feat-m10-avisos-correo`): `AvisoDespliegueOyente` (en `avisos/`) es un oyente más de `OYENTES_DESPLIEGUE`. Con un Saludable o un Fallido arma el `AvisoDespliegue` del contrato `docs/contratos/avisos.md` (etapa con su nombre visible, versión que sigue activa y las dos últimas líneas con `RepositorioDespliegues.ultimasLineas`) y lo pasa a `AvisosPuerto` de M10. Cancelado y Detenido no se avisan.
