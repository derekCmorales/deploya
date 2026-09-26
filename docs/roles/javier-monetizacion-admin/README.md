# Kit — Javier (monetización y admin)

[@Javier-r04](https://github.com/Javier-r04) · extra: Prisma, seeds, documentación de producto.

Alcance: [alcance.md](../../alcance.md) · Entregas: [plan-avances.md](../../plan-avances.md).

## Tus módulos

| Id | Qué entra (núcleo v4.1) | Código |
|---|---|---|
| M2 | Catálogo fijo, contratación con pasarela simulada, Mi suscripción, renovar (manual), cambiar plan, historial de pagos, ciclo §4.4, cuotas aplicadas | `apps/api/src/modules/suscripciones` |
| M9 | Usuarios (buscar, filtrar, detalle) y suspender cuenta | `apps/api/src/modules/administracion` |
| Datos | Schema y seed de todo el núcleo | `apps/api/prisma/` (CODEOWNERS: tú + Derek) |

Web: `apps/web/src/app/(billing)/`, `apps/web/src/app/(admin)/`

## Tus pantallas (canvas Deploya v4.1)

| # | Pantalla | Historia |
|---|---|---|
| 06 | Planes | M2-01 |
| 07, 07b | Contratar plan y resultados | M2-02 |
| 08 | Mi suscripción | M2-03, M2-04 |
| 09, 09b | Historial de pagos, comprobante, vacío | M2-06 |
| 25, 25b | Admin · Usuarios y Suspender | M9-01, M9-02 |
| 10c, 28 (suspendida) | Efectos de §4.4 en el panel (con Eduardo) | M2-05 |

## Planes v4.1 (seed)

| | Sandbox | Starter | Pro | Business |
|---|---|---|---|---|
| Precio | Sin costo | USD 5.00 | USD 15.00 | USD 40.00 |
| Proyectos | 1 | 3 | 10 | 25 |
| CPU | 0.25 vCPU | 0.5 vCPU | 1 vCPU | 2 vCPU |
| Memoria | 256 MB | 512 MB | 1 GB | 2 GB |
| Construcciones / mes | 30 | 150 | 500 | 2 000 |

Sandbox no vence. Precio de 365 días: lo defines tú en el seed. Tarjetas de prueba: `4242 4242 4242 4242` aprueba, `4000 0000 0000 0002` rechaza, `4000 0000 0000 3220` tarda 5 s.

## Estados §4.4

Activa → Por vencer (≤ 7 días) → Vencida (gracia 5 días; entornos en línea, altas y despliegues bloqueados) → Suspendida (contenedores detenidos) → Cancelada (30 días suspendida). Distinto de los estados de despliegue del motor.

## Qué entregas

| Avance | Historias | Pts |
|---|---|---|
| **A1 (30 %)** | DB-01 schema del núcleo + seed + Sandbox al registrarse · M2-01 catálogo | 5 |
| A2 (50 %) | M2-02 contratación · M2-03 Mi suscripción · M2-04 cambiar plan | 11 |
| A3 (80 %) | M2-05 ciclo §4.4 · M2-06 historial · M9-01 usuarios · M9-02 suspender | 13 |
| Final | DOC-01 requisitos y manual de usuario | 3 |

Detalle del Avance 1 y lo que presentas: [plan-avances.md § Javier](../../plan-avances.md#javier--monetización-5-pts).

**Dependencia crítica:** tu schema bloquea a todos. PR el lunes; pide antes los campos a cada módulo. Si te sobra tiempo en el Avance 1, adelanta M2-02.

## SOLID, patrones y pruebas

Regla general: [ingenieria.md](../../ingenieria.md). Lo tuyo:

- **Patrones:** `PasarelaPago` ← `PasarelaSimulada` (Strategy), `PoliticaCicloSuscripcion` (State como función pura), `SuscripcionesService` como Facade (`asignarSandbox`, `cuotaDe`), repositorios de planes y suscripciones.
- **SOLID:** el ciclo §4.4 no vive en el servicio (S); nueva pasarela = nueva clase (O); la simulada y una real devuelven el mismo `ResultadoPago` (L).
- **Pruebas mínimas A1:** seed idempotente; `asignarSandbox` crea Activa; `cuotaDe` para los 4 planes; precio 30 / 365 días. A2–A3: tarjetas `4242`/`0002`/`3220`, cada transición del ciclo con fecha inyectada.

## Fuera de alcance · solo si da el tiempo

Reactivar cuenta suspendida · renovación automática · prorrateo · complementos §4.3 · CRUD de planes · estado de infraestructura · cancelación por el cliente y exportar datos · límites de almacenamiento, transferencia, retención y miembros.

## Qué no tocas (salvo PR conjunta)

Identidad M1, motor Docker, cola de construcción, UI de proyectos.

## Diagramas

1. [m2-estados-suscripcion.mmd](../../diagramas/m1-m10/m2-estados-suscripcion.mmd) — §4.4
2. [m2-secuencia-contratacion-plan.mmd](../../diagramas/m1-m10/m2-secuencia-contratacion-plan.mmd)
3. [m2-secuencia-renovacion.mmd](../../diagramas/m1-m10/m2-secuencia-renovacion.mmd) — solo la rama manual
4. [m2-actividad-contratacion-activacion.mmd](../../diagramas/m1-m10/m2-actividad-contratacion-activacion.mmd)
5. [m2-m9-componentes.mmd](../../diagramas/m1-m10/m2-m9-componentes.mmd)
6. [m2-m9-clases.mmd](../../diagramas/m1-m10/m2-m9-clases.mmd) — `PasarelaPago` sin `I`
7. [m9-actividad-gestion-planes.mmd](../../diagramas/m1-m10/m9-actividad-gestion-planes.mmd) — fuera de alcance (catálogo fijo)

ERD: [erd-unificado.mmd](../../diagramas/compartido/erd-unificado.mmd). El schema del núcleo es un subconjunto; no hace falta modelar complementos, dominios ni miembros.

## Specs OpenSpec

- [openspec/specs/suscripciones/spec.md](../../../openspec/specs/suscripciones/spec.md)
- [openspec/specs/administracion/spec.md](../../../openspec/specs/administracion/spec.md)

Rama `feat/m2-<slug>` o `feat/m9-<slug>`. Commit `feat(m2):`.

## Reviewer

Tú en M2/M9 y schema. **Derek** en Prisma (segundo owner) e infra.
