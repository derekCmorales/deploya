# Design

## Context

`Cuota` (M2) ya trae `estado`, `vence`, `maxProyectos`, `cpus`, `memoriaMb` y `construccionesMes`. `CuotaPlanPuerto` de M5 hoy solo expone `recursosDe`. `Despliegue` guarda `disparador` y `creado`. El contrato v2 ya firmó los dos códigos 409.

**Orden de archivo:** el delta de `proyectos` parte del texto de `feat/m3-alta-proyecto` y `feat/m3-eliminar-proyecto`; se archiva después de ambos.

## Goals / Non-Goals

**Goals:** una sola regla de bloqueo, aplicada en el servidor para todas las entradas; contar construcciones sin tabla nueva.

**Non-Goals:** ciclo automático §4.4, detener por suspensión, vista de consumo (ver proposal).

## Decisions

1. **Mes calendario en UTC** (invariante I7 de `datos-nucleo.md`, firmada en el Avance 1). `inicioDelMes(ahora)` es pura y vive en el dominio de M5; el conteo lo hace M4, dueño de `Despliegue`. Mi suscripción (M7-03) mostrará «se reinicia el 1 de <mes>».
2. **Qué cuenta como construcción:** todo despliegue creado en el mes con disparador `alta`, `manual`, `variables`, `reintento` o `redespliegue`, termine como termine (una construcción fallida también gastó CPU). `reversion` no cuenta.
3. **Se verifica al crear, no en el trabajador.** El cliente recibe el 409 al instante y no queda un despliegue Fallido «por cuota».
4. **Orden de las reglas:** primero el estado de la suscripción, luego la cuota. Por Activa y Por vencer se permite; Vencida y Suspendida, no. **Cancelada** (sin suscripción vigente) también bloquea: la lista es de estados que permiten, no de los que bloquean, así un estado nuevo de M2 no abre la puerta por omisión.
6. **Un filtro global** (`RechazosOrquestacionFilter`, `APP_FILTER`) traduce los rechazos de M5 a 409 en cualquier ruta: `POST /proyectos/:id/despliegues`, el alta de M3 y `PUT …/variables` con `desplegar` responden igual sin que cada módulo los traduzca.
5. **`POST /proyectos` verifica antes de guardar** para no dejar un proyecto sin despliegue que además ocupa cupo.
7. **Seed de demo (M2, Javier):** `vencida@deploya.app` y `suspendida@deploya.app` quedan en **Starter** de 30 días con `vence` en el pasado, no en Sandbox: una Sandbox no vence, así que una Sandbox «Vencida» no podría darse en el ciclo §4.4. Con `ahora` del `Reloj`: `vencida@` tiene `vence` = `ahora` − 2 d y está Vencida desde `vence`; `suspendida@` tiene `vence` = `ahora` − 10 d y está Suspendida desde `vence` + 5 d (fin de la gracia). En ambas `inicio` = `vence` − 30 d, `vigenciaDias` = 30 y sin descenso pendiente. El seed solo las escribe si la suscripción sigue siendo la Sandbox recién asignada (`vence` nulo): una segunda corrida no las toca, ni tampoco una cuenta que ya movió la tarea diaria de M2-05. Contrato: `datos-nucleo.md` v1.2.

## Diseño: SOLID y patrones

| Clase / puerto | Patrón | Principio | Por qué |
|---|---|---|---|
| `PoliticaDespliegue` | Specification / política pura | S | La regla se prueba con objetos literales, sin base |
| `BloqueosService` (exportado por M5) | Service Layer / Facade | D, I | M4 y M3 llaman a un método; no conocen la cuota completa |
| `CuotaPlanPuerto.permisoDe` | Port sobre M2 | I | Un método más, estrecho: `{ estado, construccionesMes }` |
| `RepositorioDespliegues.contarConstruccionesDesde` | Repository | S | El conteo es una consulta, no lógica en el servicio |
| `SuscripcionNoPermite`, `CuotaConstruccionesAgotada` | Errores de dominio | — | El filtro los traduce a 409 con `codigo` |

Cambios para `clases-unificado.mmd`: las piezas anteriores.

## Risks / Trade-offs

- **Carrera:** dos despliegues simultáneos en la última construcción del mes pueden pasar ambos. Aceptado en el núcleo (a lo sumo una de más).
- **Toca tres módulos:** la regla vive solo en M5; M2 aporta el estado y el seed de demo, y M3 el mensaje. Se acuerda en la sincronización antes de mergear.

## Open Questions

- ¿Ventanas de 30 días desde el inicio de la suscripción en vez de mes calendario? Se descartó para el núcleo: cambiaría I7 y ya está firmada; se puede revisar en el Avance 3 con M7-03.
