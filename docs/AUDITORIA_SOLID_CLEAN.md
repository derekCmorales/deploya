# Auditoría SOLID y clean code — Deploya

Dos partes: la **auditoría vigente** (26 sep 2026: repositorio, diagramas, código y canvas Deploya v4.1) y el **anexo histórico** de la consolidación de diagramas del bootstrap. Las reglas que salen de aquí están en [ingenieria.md](ingenieria.md).

## Auditoría vigente — 26 sep 2026

### A. ¿La documentación habla de SOLID, clean code, patrones, arquitectura y pruebas?

| Tema | Antes de esta auditoría | Ahora |
|---|---|---|
| Arquitectura | **Sí.** C4 1–3, ciclo §3.2, monolito modular, puertos ([arquitectura.md](arquitectura.md), [diagramas/](diagramas/)) | Se suma la capa hexagonal por módulo y reglas de frontera ([ingenieria.md §1](ingenieria.md#1-arquitectura-monolito-modular-con-puertos-y-adaptadores)) |
| SOLID | **Parcial.** Solo DIP como regla (puertos sin `I`); S, O, L, I aparecían en este informe sobre diagramas, no como regla para el código | Tabla SOLID con regla, ejemplo y señal de violación ([§2](ingenieria.md#2-solid-aplicado-a-deploya)) |
| Clean code | **No** había reglas; solo higiene de nombres en diagramas | 11 reglas de revisión ([§3](ingenieria.md#3-clean-code--reglas-de-revisión)) |
| Patrones de diseño | **Implícitos** (Strategy en `PasarelaPago`, Adapter en puertos) pero sin nombrar | Catálogo por módulo + anti-patrones ([§4](ingenieria.md#4-patrones-de-diseño-por-módulo)) |
| Pruebas unitarias | **Débil.** DoD decía «Probado» sin definirlo; la plantilla de PR no las pedía; `openspec/config.yaml` tampoco; 11 pruebas y todas de `health` | Regla por historia, mínimos del Avance 1, cobertura `test:cov` ([§5](ingenieria.md#5-pruebas-unitarias--regla-por-historia)) |
| Reglas para agentes | `AGENTS.md` y `.cursor/rules` sin SOLID ni pruebas | `AGENTS.md`, `CLAUDE.md`, `.cursor/rules/calidad-solid-pruebas.mdc` y `openspec/config.yaml` lo exigen |
| Referencias | Ninguna | Martin, Meyer, Liskov, GoF, Fowler, Cockburn, Evans, Beck, Meszaros, Khorikov… ([§7](ingenieria.md#7-referencias)) |

### B. Diagramas frente a SOLID

Los diagramas **sí respetan SOLID en lo esencial**: DIP con puertos sin `I` (`ContenedorPuerto`, `EnrutamientoPuerto`, `VerificacionEntornoPuerto`, `PasarelaPago`, `ProveedorFuente`, `CorreoPuerto`), OCP en fuentes y pasarelas, LSP en `PasarelaSimulada`, SRP en controladores partidos y en `PoliticaCicloSuscripcion`. Hallazgos:

| # | Hallazgo | Principio | Estado |
|---|---|---|---|
| B1 | `EstadoDespliegue` del diagrama de clases no tenía `CANCELADO` (sí está en el diagrama de estados y en [arquitectura.md](arquitectura.md)) y no marcaba `REVIRTIENDO` como fuera de alcance | Consistencia | **Corregido** en `clases-unificado.mmd` |
| B2 | La cola de construcción no tenía puerto: `ServicioConstruccion` quedaba atado a BullMQ | DIP | **Corregido** en el diagrama: `ColaConstruccionPuerto`; el código lo implementa en M4-01 |
| B3 | Este informe prometía «repositorios por agregado en el unificado», pero el diagrama de clases no tenía ninguno | DIP / SRP | **Corregido:** `RepositorioDespliegues` como ejemplo del patrón; cada módulo agrega el suyo en su change |
| B4 | `ServicioOrquestacion` depende de contenedores, salud, enrutamiento **y** notificaciones, y además revierte: varios motivos de cambio | SRP | Recomendación para M5: notificar con un evento de dominio (`DespliegueTerminado`, Observer) en vez de llamar a `ServicioNotificaciones` |
| B5 | Firmas de los puertos distintas en tres lugares (ver tabla C) | LSP / consistencia | Se decide en el change de M4-01 / M5-01 y se actualiza el diagrama en el mismo PR |
| B6 | Clone y `docker build` no tienen puerto en ningún diagrama; si el trabajador llama a Docker directo se rompe la regla §7 | DIP | Recomendación para M4-01: `ConstructorImagenPuerto` (o `construir` en `ContenedorPuerto`) con stub para pruebas |
| B7 | `CapaHerramientas` (M8) es una interfaz ancha | ISP | Aceptado a propósito (misma superficie para asistente y clientes); fuera de alcance |

### C. Código (`apps/api`)

| # | Hallazgo | Dueño | Cuándo |
|---|---|---|---|
| C1 | `ColaConstruccionStub` se exporta como clase concreta, sin puerto, y usa `unknown` | Derek | M4-01 |
| C2 | Firmas divergentes: código `ContenedorPuerto.crear/detener`, `EnrutamientoPuerto.publicar`, `VerificacionEntornoPuerto.saludable`; diagrama `crear/detener/reemplazar`, `asignarSubdominio/emitirCertificado/conmutarTrafico`, `comprobarSalud`; canvas `ejecutar(...)`, `esperarSalud(url, 60 s)` | Derek | M4-01 / M5-01: una sola firma, en código y diagrama |
| C3 | `AdaptersModule` enlaza los stubs de forma global; cuando llegue el adaptador Docker, el binding debe elegirse en un solo punto y los stubs quedar para pruebas | Derek | M5-01 |
| C4 | Puertos como `abstract class`: **correcto** (sirven de token de Nest). El canvas mostraba `interface CorreoPuerto`, que no sirve como token | Eddy | M10-01 (el canvas ya se corrigió) |
| C5 | Solo hay pruebas de `health`; no hay pruebas de dominio todavía (esperado: el dominio entra desde el Avance 1) | Todos | Cada historia |
| C6 | `apps/api` no tenía script de cobertura | — | **Corregido:** `pnpm --filter @deploya/api test:cov` |
| C7 | `apps/web` solo prueba el home con `node --test`; no hay arnés para lógica de pantallas | Eduardo | Probar funciones puras con `node --test` en cada historia con UI |

### D. Canvas Deploya v4.1 — página *Entrega 1 · guía y presentación*

| # | Hallazgo | Estado |
|---|---|---|
| D1 | Las guías mencionaban pruebas sueltas (Eddy: servicio de identidad; Javier: seed y `cuotaDe`; Eduardo: validador; Derek: trabajador con stubs) pero ninguna hablaba de SOLID, clean code ni patrones | **Corregido:** hoja nueva *Entrega 1 · Calidad* y bloque «SOLID y pruebas» en cada guía |
| D2 | La regla de «Terminado» del resumen no decía qué es «con pruebas» | **Corregido:** remite a la regla por historia |
| D3 | `interface CorreoPuerto` en la guía de Eddy | **Corregido:** `abstract class CorreoPuerto` |
| D4 | Diapositiva *Cómo trabajamos* sin calidad; *Arquitectura* sin patrones | **Corregido:** se agregan SOLID, pruebas y patrones |

### E. Enlaces rotos

- El anexo de abajo cita rutas de la carpeta local original (`/Users/derekmorales/Desktop/DOCSDEPLOYA`, `internal/docsdeploya-local-inventory.md`); se conservan como registro histórico. Los artefactos vigentes son [diagramas/compartido/](diagramas/compartido/).
- `arquitectura-maestro.md §11` apuntaba a `M4_M5_M6_Motor_Despliegue/AUDITORIA_SOLID_CLEAN.md`: **corregido** a este archivo.

---

## Anexo histórico — consolidación de diagramas (bootstrap)

Fuente de inventario (cerrado, no re-inventariado):
`internal/docsdeploya-local-inventory.md` del Agent Store.

Alcance: entregas en `/Users/derekmorales/Desktop/DOCSDEPLOYA`. Originales de compañeros **intactos**. Correcciones aplicadas solo en copias `_pulido` y en el artefacto unificado (ERD + clases).

### 1. Hallazgos de nombres (antes → después)

| Antes | Después (quitar `I`) | Después (español de la propuesta) | Dónde |
|---|---|---|---|
| `IPasarelaPago` | `PasarelaPago` | `PasarelaPago` | `M2_M9_propuesta_diagrama_clases.mmd` |
| `ServicioPagos.pasarela : IPasarelaPago` | `PasarelaPago` | `PasarelaPago` | idem |
| `ISourceProvider` | `SourceProvider` | `ProveedorFuente` | `M3_M7_propuesta_diagrama_clases.mmd` |
| `ProjectController` | — | `ControladorProyecto` | M3 clases |
| `ObservabilityController` | — | `ControladorObservabilidad` | M3 clases |
| `GitHubSource` | — | `FuenteRepositorio` | M3 clases (el proveedor es Git, no un vendor en el dominio) |
| `ZipSource` | — | `FuenteArchivoComprimido` | M3 clases (§6.1 archivo comprimido) |
| `fetchSourceCode()` | — | `obtenerCodigoFuente()` | M3 clases |
| `createProject(name, envVars)` | — | `crearProyecto(nombre, variablesEntorno)` | M3 clases |
| `getLiveMetrics(projectId)` | — | `consultarMetricasEnVivo(proyectoId)` | M3 clases |
| `streamBuildLogs(projectId)` | — | `transmitirBitacorasConstruccion(proyectoId)` | M3 clases |
| `Project` / `projectId` | — | `Proyecto` / `proyectoId` | M3 clases vs ERD |
| `EMAIL_PORT` (ya sin `I`) | `CorreoPuerto` | `CorreoPuerto` | M1 componentes (consistencia de rol) |

M1 no usa prefijo `I` (correcto: `Puerto de correo`). M2 y M3 sí.

### 2. Vocabulario de dominio unificado

Canon de la propuesta (`00_GUIA_GENERAL_Propuesta_Deploya.md`):

| Usar | No usar |
|---|---|
| Proyecto | Project |
| Despliegue | Deploy / Deployment |
| Artefacto | Artifact (en diagramas en español) |
| Construcción | Build (salvo etapa técnica de imagen) |
| Reversión | Rollback (se admite como sinónimo técnico en notas) |
| Bitácora | Log |
| Suscripción | Subscription |
| Enrutador de borde | Edge / Traefik como nombre de producto |
| Cliente, Administrador, Operador de infraestructura, Soporte técnico | User genérico sin rol |

Estados de **suscripción** (§4.4): Activa, Por vencer, Vencida, Suspendida, Cancelada.
Estados de **despliegue** (dominio §3.2, distintos): Encolado, Construyendo, Aprovisionando, Publicando, Saludable, Fallido, Revirtiendo, Detenido.

### 3. Violaciones SOLID por componente

#### SRP — un motivo de cambio

| Componente | Problema | Corrección en conglomerado |
|---|---|---|
| `ServicioSuscripciones` | Crea, renueva, cambia plan, cancela **y** avanza el ciclo de estados | Se conserva como fachada de agregado; el ciclo queda en `PoliticaCicloSuscripcion` (clase de dominio) |
| `ObservabilityController` / `ControladorObservabilidad` | Métricas HTTP + bitácoras WSS | Dos servicios: `ServicioMetricas`, `ServicioBitacoras`; el controlador solo adapta HTTP/WSS |
| `Controlador de administracion` (M2 componentes) | Usuarios, planes e infraestructura en un solo controlador | Tres controladores: usuarios, planes, estado de infraestructura |
| `ProjectController` | Alta de proyecto **y** elección de fuente | `ServicioProyectos` orquesta; `ProveedorFuente` es puerto; el controlador no conoce el adaptador |
| Actividad M3 `EnviarSolicitudDespliegue` | Mezcla alta de proyecto (M3) con encolar construcción (M4) | M3 termina en proyecto persistido; M4 arranca en Recepción del despliegue |

#### OCP — abierto a extensión

| Componente | Problema | Corrección |
|---|---|---|
| M3 `ISourceProvider` | Idea correcta, nombre sucio y vendor `GitHubSource` | `ProveedorFuente` + `FuenteRepositorio` / `FuenteArchivoComprimido` |
| M4 (ausente) | No había extensión de stacks | `DetectorStack` + `RecetaConstruccion` por stack; nuevas recetas sin tocar el orquestador |
| M6 | Ausente | `EnrutamientoPuerto` permite cambiar el enrutador de borde sin tocar la API |

#### LSP

Sin violaciones graves. `PasarelaSimulada` sustituye `PasarelaPago`. Cuidado futuro: no especializar `cobrar` con excepciones distintas a `ResultadoPago`.

#### ISP

| Puerto | Veredicto |
|---|---|
| `IPasarelaPago.cobrar` | Estrecho, correcto |
| `ISourceProvider.fetchSourceCode` | Estrecho, correcto |
| Capa M8 (§9.3) | Un solo conjunto de operaciones (consultar, desplegar, bitácoras, métricas, revertir, variables) para asistente **y** clientes externos — ISP a propósito: misma superficie, dos consumidores |

#### DIP

| Sitio | Problema | Corrección |
|---|---|---|
| M2 | DIP anotado hacia `IPasarelaPago` | Se mantiene hacia `PasarelaPago` (sin `I`) |
| M1 | `EMAIL_PORT` en componentes, pero **no hay classDiagram** ni puerto tipado | `CorreoPuerto` en clases unificadas |
| M3 | Controlador depende del puerto (aceptable) pero en inglés | Controlador → servicio → `ProveedorFuente` |
| API (§7) | «La API nunca invoca directamente al motor de contenedores» — no estaba diagramado | Tres puertos: `ContenedorPuerto`, `EnrutamientoPuerto`, `VerificacionEntornoPuerto` |
| Varios servicios → PostgreSQL directo | Sin repositorio | Repositorios por agregado en el unificado (no explosión de 20 puertos en C4) |

### 4. ERD y clases: de varios a uno

Inventario: 2 classDiagram (M2 rico, M3 mínimo) + 1 ERD parcial (solo `PROYECTO`, `VARIABLE_ENTORNO`, `METRICA_CONSUMO`).

Artefacto único (pulido):

- `/Users/derekmorales/Desktop/DOCSDEPLOYA/DEPLOYA_erd_unificado.mmd`
- `/Users/derekmorales/Desktop/DOCSDEPLOYA/DEPLOYA_diagrama_clases_unificado.mmd`

Incluye lo que faltaba de M4–M6: imagen, artefacto, contenedor, certificado, subdominio, trabajo de construcción, despliegue. Capa M8: `CapaHerramientas`.

Copias `_pulido` (originales sin tocar):

- `M2_M9_Suscripciones_Admin/M2_M9_propuesta_diagrama_clases_pulido.mmd`
- `M3_M7_Proyectos_Observabilidad/M3_M7_propuesta_diagrama_clases_pulido.mmd`

### 5. Otros clean-code (señalados, no reescritos en cada .mmd de compañeros)

- `subgraph DEPLOYA["."]` en M1/M2: etiqueta vacía; el maestro usa `Deploya`.
- M2 sin tildes (`catalogo`, `administracion`); M1 con tildes. El unificado usa tildes de la propuesta.
- `LimitePlan.valor : String` — en el unificado: `cantidad` numérica + `unidad`.
- `VARIABLE_ENTORNO.valor` sin cifrado en el ERD M3 pese a §6.1 — unificado: `valorCifrado`.
- CU de autenticación es flowchart, no `useCase` UML; se acepta como entrega (Mermaid no tiene use case nativo fiable).
- «Actividad» M3/M7 es `stateDiagram-v2`; el maestro las reexpresa como flowchart sin borrar los originales.

### 6. Huecos que esta carpeta cierra (M4, M5, M6 + M8 herramientas)

C4 contexto y contenedores, C4 componente del motor, secuencia §3.2, secuencia de reversión, estados de despliegue, actividades del motor, componentes M4–M6, componentes M8 herramientas. Ver archivos `.mmd` de esta carpeta.
