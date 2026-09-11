# Auditoría SOLID y clean code — Deploya

Fuente de inventario (cerrado, no re-inventariado):
`internal/docsdeploya-local-inventory.md` del Agent Store.

Alcance: entregas en `/Users/derekmorales/Desktop/DOCSDEPLOYA`. Originales de compañeros **intactos**. Correcciones aplicadas solo en copias `_pulido` y en el artefacto unificado (ERD + clases).

## 1. Hallazgos de nombres (antes → después)

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

## 2. Vocabulario de dominio unificado

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

## 3. Violaciones SOLID por componente

### SRP — un motivo de cambio

| Componente | Problema | Corrección en conglomerado |
|---|---|---|
| `ServicioSuscripciones` | Crea, renueva, cambia plan, cancela **y** avanza el ciclo de estados | Se conserva como fachada de agregado; el ciclo queda en `PoliticaCicloSuscripcion` (clase de dominio) |
| `ObservabilityController` / `ControladorObservabilidad` | Métricas HTTP + bitácoras WSS | Dos servicios: `ServicioMetricas`, `ServicioBitacoras`; el controlador solo adapta HTTP/WSS |
| `Controlador de administracion` (M2 componentes) | Usuarios, planes e infraestructura en un solo controlador | Tres controladores: usuarios, planes, estado de infraestructura |
| `ProjectController` | Alta de proyecto **y** elección de fuente | `ServicioProyectos` orquesta; `ProveedorFuente` es puerto; el controlador no conoce el adaptador |
| Actividad M3 `EnviarSolicitudDespliegue` | Mezcla alta de proyecto (M3) con encolar construcción (M4) | M3 termina en proyecto persistido; M4 arranca en Recepción del despliegue |

### OCP — abierto a extensión

| Componente | Problema | Corrección |
|---|---|---|
| M3 `ISourceProvider` | Idea correcta, nombre sucio y vendor `GitHubSource` | `ProveedorFuente` + `FuenteRepositorio` / `FuenteArchivoComprimido` |
| M4 (ausente) | No había extensión de stacks | `DetectorStack` + `RecetaConstruccion` por stack; nuevas recetas sin tocar el orquestador |
| M6 | Ausente | `EnrutamientoPuerto` permite cambiar el enrutador de borde sin tocar la API |

### LSP

Sin violaciones graves. `PasarelaSimulada` sustituye `PasarelaPago`. Cuidado futuro: no especializar `cobrar` con excepciones distintas a `ResultadoPago`.

### ISP

| Puerto | Veredicto |
|---|---|
| `IPasarelaPago.cobrar` | Estrecho, correcto |
| `ISourceProvider.fetchSourceCode` | Estrecho, correcto |
| Capa M8 (§9.3) | Un solo conjunto de operaciones (consultar, desplegar, bitácoras, métricas, revertir, variables) para asistente **y** clientes externos — ISP a propósito: misma superficie, dos consumidores |

### DIP

| Sitio | Problema | Corrección |
|---|---|---|
| M2 | DIP anotado hacia `IPasarelaPago` | Se mantiene hacia `PasarelaPago` (sin `I`) |
| M1 | `EMAIL_PORT` en componentes, pero **no hay classDiagram** ni puerto tipado | `CorreoPuerto` en clases unificadas |
| M3 | Controlador depende del puerto (aceptable) pero en inglés | Controlador → servicio → `ProveedorFuente` |
| API (§7) | «La API nunca invoca directamente al motor de contenedores» — no estaba diagramado | Tres puertos: `ContenedorPuerto`, `EnrutamientoPuerto`, `VerificacionEntornoPuerto` |
| Varios servicios → PostgreSQL directo | Sin repositorio | Repositorios por agregado en el unificado (no explosión de 20 puertos en C4) |

## 4. ERD y clases: de varios a uno

Inventario: 2 classDiagram (M2 rico, M3 mínimo) + 1 ERD parcial (solo `PROYECTO`, `VARIABLE_ENTORNO`, `METRICA_CONSUMO`).

Artefacto único (pulido):

- `/Users/derekmorales/Desktop/DOCSDEPLOYA/DEPLOYA_erd_unificado.mmd`
- `/Users/derekmorales/Desktop/DOCSDEPLOYA/DEPLOYA_diagrama_clases_unificado.mmd`

Incluye lo que faltaba de M4–M6: imagen, artefacto, contenedor, certificado, subdominio, trabajo de construcción, despliegue. Capa M8: `CapaHerramientas`.

Copias `_pulido` (originales sin tocar):

- `M2_M9_Suscripciones_Admin/M2_M9_propuesta_diagrama_clases_pulido.mmd`
- `M3_M7_Proyectos_Observabilidad/M3_M7_propuesta_diagrama_clases_pulido.mmd`

## 5. Otros clean-code (señalados, no reescritos en cada .mmd de compañeros)

- `subgraph DEPLOYA["."]` en M1/M2: etiqueta vacía; el maestro usa `Deploya`.
- M2 sin tildes (`catalogo`, `administracion`); M1 con tildes. El unificado usa tildes de la propuesta.
- `LimitePlan.valor : String` — en el unificado: `cantidad` numérica + `unidad`.
- `VARIABLE_ENTORNO.valor` sin cifrado en el ERD M3 pese a §6.1 — unificado: `valorCifrado`.
- CU de autenticación es flowchart, no `useCase` UML; se acepta como entrega (Mermaid no tiene use case nativo fiable).
- «Actividad» M3/M7 es `stateDiagram-v2`; el maestro las reexpresa como flowchart sin borrar los originales.

## 6. Huecos que esta carpeta cierra (M4, M5, M6 + M8 herramientas)

C4 contexto y contenedores, C4 componente del motor, secuencia §3.2, secuencia de reversión, estados de despliegue, actividades del motor, componentes M4–M6, componentes M8 herramientas. Ver archivos `.mmd` de esta carpeta.
