# M5 Orquestación y ejecución

Dueño: Derek. Spec: [`openspec/specs/orquestacion/spec.md`](../../../../../openspec/specs/orquestacion/spec.md). Alcance: [docs/alcance.md](../../../../../docs/alcance.md).

**Núcleo v4.1:** Contenedor vía `ContenedorPuerto` con `--cpus` / `--memory` del plan, verificación de salud, reiniciar, detener, borrar y detener por suspensión.

**Pantallas:** 12b, 13, 19b (vía M7 y M3).

**Fuera de alcance (solo si da el tiempo):** Límite de procesos, volúmenes. (La reversión sin reconstruir volvió al núcleo: M5-04, Avance 3.)

Hoy (Avance 2):

- `PasoEjecucion` (límites del plan, variables del proyecto por `VariablesEntornoPuerto`, salud) y `PasoOperacion` (conmutación sin corte).
- `BloqueosService` (M5-03): Vencida, Suspendida o Cancelada, o la cuota de construcciones del mes, rechazan con 409.
- Acciones (M5-02): `POST /proyectos/:id/reiniciar` y `/detener` (202) encolan en `operacion`; el trabajador las ejecuta con un manejador por tipo. `AccionesProyectoService.pedirEliminacion` borra contenedores, imágenes y ruta al eliminar un proyecto.
- `RechazosOrquestacionFilter` (global) traduce sus rechazos a `{ codigo, mensaje }`.
