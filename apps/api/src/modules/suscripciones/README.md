# M2 Suscripciones y pagos

Dueño: Javier. Spec: [`openspec/specs/suscripciones/spec.md`](../../../../../openspec/specs/suscripciones/spec.md). Alcance: [docs/alcance.md](../../../../../docs/alcance.md).

**Núcleo v4.1:** Catálogo fijo de cuatro planes, Sandbox inicial, contratación con `PasarelaPago` simulada, Mi suscripción, renovar (manual), cambiar plan, historial con comprobante, ciclo §4.4 y cuotas (proyectos y construcciones).

**Pantallas:** 06–09.

**Fuera de alcance (solo si da el tiempo):** Renovación automática, prorrateo, complementos, cancelación por el cliente.

**Exporta** `SuscripcionesService`: `asignarSandbox(usuarioId)` (idempotente, lo llama M1 al registrar) y `cuotaDe(usuarioId)` (M3, M4, M5; lanza `SuscripcionNoEncontrada`).

**Exporta** también `ContratacionService`, solo para `CobroModule` (rutas con sesión; va aparte porque M1 importa este módulo y M2 necesita el `SesionGuard` de M1).

**Rutas:** `GET /suscripciones/health`, `GET /suscripciones/planes` (pública). Con sesión: `GET /suscripciones/mia`, `GET /suscripciones/cotizacion?plan=&vigenciaDias=`, `POST /suscripciones/contratar` (`{ plan, vigenciaDias, tarjeta }`; un rechazo responde 200 con `resultado: "rechazado"`), `POST /suscripciones/descenso` (`{ plan }`).

**Pasarela simulada:** `4242 4242 4242 4242` aprueba, `4000 0000 0000 0002` rechaza, `4000 0000 0000 3220` tarda 5 s.

Hecho: DB-01 y M2-01 (change `feat-m2-schema-nucleo`); M2-02, M2-03 y M2-04 (change `feat-m2-contratacion-suscripcion`).
