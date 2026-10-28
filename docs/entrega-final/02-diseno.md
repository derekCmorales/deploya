# Documento de diseño

## Arquitectura general

### Resumen de la decisión

Deploya es un **monolito modular** con **arquitectura hexagonal** dentro de cada módulo, desplegado como cinco servicios de `docker compose` en un solo nodo. La decisión completa, con alternativas y consecuencias, está en el [ADR 0009](../adr/0009-monolito-modular-hexagonal.md). En una línea: **un solo sistema fácil de operar y de instalar, con fronteras internas tan claras como las de un sistema distribuido, y un dominio que se prueba sin infraestructura.**

| Atributo de calidad que manda | Cómo lo atiende la arquitectura |
|---|---|
| **Aislamiento y seguridad** de las apps de los clientes | La API no toca Docker: solo el trabajador monta `docker.sock`. Cada app corre sin privilegios, con límites de CPU y memoria y en su propia red |
| **Disponibilidad** de lo que ya está publicado | Conmutación sin corte: la ruta se mueve al contenedor nuevo solo después de que pasa la verificación de salud |
| **Capacidad de respuesta** del panel | Construir tarda minutos: va por una cola (BullMQ) a un proceso aparte, y la API responde al encolar |
| **Mantenibilidad y pruebas** | Puertos como `abstract class` y adaptadores intercambiables: 1 069 pruebas corren sin Docker, red, base ni reloj reales |
| **Portabilidad** (autoalojado) | Todo es configuración: el mismo código corre en local, en el VPS y en el servidor de un tercero |
| **Costo** en un nodo de 4 GB | Dos procesos Node en vez de diez servicios; la memoria queda para las apps de los clientes |

### Contexto (C4 nivel 1)

Deploya se ubica entre dos actores humanos y cinco sistemas externos. El cliente solo usa el navegador; la plataforma traduce sus acciones en operaciones sobre GitHub, Docker, el DNS, la autoridad certificadora y el correo.

<!-- diagrama: docs/diagramas/compartido/c4-contexto.mmd -->
```mermaid
---
title: C4 Nivel 1 — Contexto de Deploya (núcleo v4.1)
---
flowchart TB
    subgraph ACTORES["Actores"]
        CLIENTE["Cliente<br/>despliega sus aplicaciones"]
        ADMIN["Administrador<br/>ve usuarios y suspende cuentas"]
    end

    DEPLOYA["Deploya<br/>PaaS de un solo nodo<br/>panel, API y motor de despliegue"]

    subgraph EXTERNOS["Sistemas externos"]
        GIT["GitHub<br/>repositorios públicos"]
        DOCKER["Docker Engine<br/>nodo único (VPS)"]
        DNS["DNS comodín<br/>*.deploya.app"]
        CA["Let's Encrypt<br/>certificado comodín"]
        CORREO["Proveedor SMTP<br/>Mailpit en desarrollo"]
    end

    CLIENTE -->|"panel web, HTTPS"| DEPLOYA
    ADMIN -->|"panel web, HTTPS"| DEPLOYA
    CLIENTE -.->|"visita su app<br/>https://proyecto.deploya.app"| DOCKER

    DEPLOYA -->|"lee archivos y clona"| GIT
    DEPLOYA -->|"construye y corre contenedores"| DOCKER
    DEPLOYA -->|"resuelve subdominios"| DNS
    DEPLOYA -->|"desafío DNS-01"| CA
    DEPLOYA -->|"verificación y recuperación"| CORREO

    classDef actor fill:#eef2ff,stroke:#818cf8,stroke-width:2px,color:#1e1b4b
    classDef sistema fill:#f5f3ff,stroke:#a78bfa,stroke-width:2px,color:#312e81
    classDef externo fill:#f0f9ff,stroke:#38bdf8,stroke-width:2px,color:#0c4a6e
    class CLIENTE,ADMIN actor
    class DEPLOYA sistema
    class GIT,DOCKER,DNS,CA,CORREO externo
```

### Contenedores (C4 nivel 2)

| Contenedor | Tecnología | Responsabilidad | Habla con |
|---|---|---|---|
| **web** | Next.js 15 · React 19 · Tailwind 4 | Panel del cliente y del administrador con el design system v4.1. Sondea cada 3 s lo que está en curso | api (HTTPS + cookie) |
| **api** | NestJS 10 · Prisma 6 | Casos de uso de M1, M2, M3, M7, M9 y M10; produce trabajos de M4 y M5. **No habla con Docker** | postgres, redis, GitHub, SMTP |
| **worker** | Misma imagen de la API (`trabajador.ts`) | Consume las colas: clona, construye, ejecuta, publica, muestrea métricas | redis, postgres, Docker, Traefik |
| **postgres** | PostgreSQL 16 | Almacén único de la plataforma | — |
| **redis** | Redis 7 | Colas BullMQ (`despliegues`, operación, muestreo) y señales de cancelación | — |
| **traefik** | Traefik v3.3 | Enrutador de borde: rutas por archivo, TLS comodín, redirección a HTTPS | contenedores de clientes |
| **mailpit** | Mailpit (solo desarrollo) | Atrapa los correos para verlos en el navegador | — |

<!-- diagrama: docs/diagramas/compartido/c4-contenedores.mmd -->
```mermaid
---
title: C4 Nivel 2 — Contenedores de Deploya (núcleo v4.1, docker compose)
---
flowchart TB
    CLIENTE["Cliente / Administrador"]
    VISITANTE["Visitante de una app desplegada"]

    subgraph DEPLOYA["Deploya — monolito modular + trabajador"]
        WEB["web<br/>Next.js · design system v4.1<br/>polling cada 3 s"]
        API["api<br/>NestJS · M1 M2 M3 M7 M9 M10<br/>+ productor de M4<br/>no habla con Docker"]
        WORKER["worker<br/>misma imagen de la API<br/>M4 construye · M5 ejecuta · M6 publica"]
        REDIS[("redis<br/>cola BullMQ «despliegues»")]
        BD[("postgres<br/>Prisma · schema del núcleo")]
        EDGE["traefik v3<br/>proveedor de archivo<br/>*.localhost / *.deploya.app"]
        MAILPIT["mailpit<br/>SMTP de desarrollo · :8025"]
    end

    DOCKER["Docker Engine<br/>/var/run/docker.sock"]
    APPS["Contenedores de clientes<br/>límites del plan · red por proyecto"]
    GIT["GitHub"]
    SMTP["Proveedor SMTP (VPS)"]

    CLIENTE -->|HTTPS| WEB
    WEB -->|"REST JSON, cookie de sesión"| API
    API --> BD
    API -->|"encola TrabajoDespliegue"| REDIS
    API -->|"lee archivos (11a)"| GIT
    API -->|"SMTP"| MAILPIT
    API -.->|"SMTP en el VPS"| SMTP
    WORKER -->|"consume"| REDIS
    WORKER -->|"estado, etapas, bitácora, artefactos"| BD
    WORKER -->|"git clone --depth 1"| GIT
    WORKER -->|"build, run, stop"| DOCKER
    WORKER -->|"escribe rutas dinámicas"| EDGE
    DOCKER --> APPS
    VISITANTE -->|"http(s)://proyecto.dominio"| EDGE
    EDGE -->|"red del proyecto"| APPS

    classDef persona fill:#eef2ff,stroke:#818cf8,stroke-width:2px,color:#1e1b4b
    classDef app fill:#f5f3ff,stroke:#a78bfa,stroke-width:2px,color:#312e81
    classDef data fill:#fefce8,stroke:#facc15,stroke-width:2px,color:#713f12
    classDef ext fill:#f0f9ff,stroke:#38bdf8,stroke-width:2px,color:#0c4a6e
    class CLIENTE,VISITANTE persona
    class WEB,API,WORKER,EDGE,MAILPIT app
    class REDIS,BD data
    class DOCKER,APPS,GIT,SMTP ext
```

### El ciclo de despliegue

Todo el producto gira alrededor de un ciclo de cinco etapas. Cada una tiene un módulo responsable y un paso del pipeline del trabajador.

| Etapa | Módulo | Paso | Qué produce |
|---|---|---|---|
| Recepción | M4 | `PasoRecepcion` | Clon de la rama, commit registrado, stack detectado |
| Construcción | M4 | `PasoConstruccion` | Imagen `deploya/<subdominio>:<n>` y su artefacto (digest, tamaño, receta) |
| Ejecución | M5 | `PasoEjecucion` | Contenedor con los límites del plan que **pasa la salud** |
| Enrutamiento | M6 | `PasoEnrutamiento` | Ruta de Traefik al contenedor nuevo; el anterior se retira después |
| Operación | M5 / M7 | `PasoOperacion` | Despliegue *Saludable*, versión activa actualizada, oyentes avisados |

Una **reversión** usa el mismo pipeline con otro plan: arranca en *Revirtiendo* y omite Recepción y Construcción, porque la imagen ya existe.

## Arquitectura de cada módulo

### Puertos y adaptadores

Dentro de `apps/api/src/modules/<módulo>/` el código se ordena en cinco anillos. Las flechas de dependencia apuntan siempre hacia dentro: el dominio no conoce a nadie y los adaptadores conocen solo el puerto que implementan.

<!-- diagrama: docs/diagramas/diseno/arquitectura-hexagonal.mmd -->
```mermaid
---
title: Arquitectura hexagonal dentro de cada módulo — ejemplo real del motor (M4–M6)
---
flowchart LR
    ENTRADA["<b>Entrada · adapta</b><br/>DesplieguesController<br/>AccionesDespliegueController<br/>ReversionController<br/>consumirDespliegues() del trabajador<br/>SesionGuard · RolGuard"]
    APLICACION["<b>Aplicación · orquesta</b><br/>ConstruccionService<br/>ReversionService<br/>AccionesDespliegueService<br/>PipelineDespliegue y sus cinco pasos"]
    DOMINIO["<b>Dominio · decide</b><br/>TypeScript puro, sin Nest ni Prisma<br/>TransicionesDespliegue<br/>PoliticaAcciones · PoliticaDespliegue<br/>PoliticaRetencion · RecetaStack"]
    PUERTOS["<b>Puertos · contratos</b><br/>ColaConstruccionPuerto<br/>RepositorioDespliegues · RepositorioArtefactos<br/>ClonadorRepositorioPuerto · ConstructorImagenPuerto<br/>ContenedorPuerto · VerificacionEntornoPuerto<br/>EnrutamientoPuerto · CertificadoPuerto"]
    ADAPTADORES["<b>Adaptadores · hablan con el exterior</b><br/>ColaBullMq · ColaMemoria<br/>RepositorioDesplieguesPrisma · …Memoria<br/>ClonadorGit · ConstructorDocker<br/>ContenedorDocker · VerificacionHttp<br/>EnrutamientoTraefikArchivo · CertificadoAcmeArchivo"]
    EXTERIOR["<b>Exterior</b><br/>PostgreSQL · Redis<br/>git · Docker Engine<br/>Traefik · Let's Encrypt"]

    ENTRADA -->|"llama"| APLICACION
    APLICACION -->|"decide con"| DOMINIO
    APLICACION -->|"depende solo de"| PUERTOS
    ADAPTADORES -. "implementan" .-> PUERTOS
    ADAPTADORES -->|"hablan con"| EXTERIOR

    classDef capaEntrada fill:#fefdfb,stroke:#a5a09a,color:#1a1510,text-align:left
    classDef capaAplicacion fill:#fefdfb,stroke:#a5a09a,color:#1a1510,text-align:left
    classDef capaDominio fill:#e2e9ec,stroke:#0065b4,stroke-width:1.5px,color:#1a1510,text-align:left
    classDef capaPuerto fill:#ece9e4,stroke:#a5a09a,color:#1a1510,text-align:left
    classDef capaExterna fill:#f2efe9,stroke:#a5a09a,stroke-dasharray:4 3,color:#1a1510,text-align:left
    class ENTRADA capaEntrada
    class APLICACION capaAplicacion
    class DOMINIO capaDominio
    class PUERTOS capaPuerto
    class ADAPTADORES,EXTERIOR capaExterna
```

| Capa | Qué vive ahí | Puede depender de | Nunca depende de |
|---|---|---|---|
| **Entrada** | Controladores HTTP, consumidores de cola, guards, filtros de errores | El servicio de su módulo | Prisma, adaptadores |
| **Aplicación** | Servicios que orquestan un caso de uso; el pipeline del motor | Dominio y puertos | Adaptadores concretos |
| **Dominio** | Entidades, objetos valor, políticas y máquinas de estado | Solo TypeScript | Nest, Prisma, Docker, HTTP, `Date.now()` |
| **Puertos** | Contratos que la aplicación necesita, como `abstract class` | Tipos del dominio | Implementaciones |
| **Adaptadores** | Prisma, Docker, BullMQ, Traefik, SMTP, GitHub, memoria y *stubs* | El puerto que implementan | Otros módulos |

> [!IMPORTANT]
> Los puertos son `abstract class` y no `interface` porque en TypeScript la interfaz desaparece al compilar y Nest necesita un valor como token de inyección. No llevan prefijo `I`: se llaman por lo que hacen (`ContenedorPuerto`, `PasarelaPago`, `CorreoPuerto`).

Un puerto real del motor, tal como está en el código:

```ts
/** Puerto DIP — la API no llama a Docker. Sin prefijo I. */
export abstract class ContenedorPuerto {
  abstract crear(espec: EspecContenedor): Promise<ContenedorCreado>;
  abstract iniciar(contenedorId: string): Promise<void>;
  abstract detener(contenedorId: string): Promise<void>;
  abstract eliminar(contenedorId: string): Promise<void>;
  abstract eliminarContenedoresDe(subdominio: string): Promise<void>;
  abstract eliminarImagen(imagen: string): Promise<void>;
  abstract eliminarImagenesDe(subdominio: string): Promise<void>;
  abstract bitacora(contenedorId: string, consulta: ConsultaSalida): Promise<LineaSalida[]>;
}
```

El adaptador se elige **en un solo lugar** y por configuración. Así, `MOTOR_ADAPTADORES=stub` levanta la plataforma completa sin Docker (desarrollo y CI) y `docker` usa los adaptadores reales, sin tocar ningún servicio:

| Puerto | Adaptador real | Doble para pruebas y modo `stub` |
|---|---|---|
| `ColaConstruccionPuerto` | `ColaBullMq` | `ColaMemoria` |
| `ClonadorRepositorioPuerto` | `ClonadorGit` | `ClonadorStub` |
| `ConstructorImagenPuerto` | `ConstructorDocker` | `ConstructorImagenStub` |
| `ContenedorPuerto` | `ContenedorDocker` (dockerode) | `ContenedorStub` |
| `VerificacionEntornoPuerto` | `VerificacionHttp` | `VerificacionEntornoStub` |
| `EnrutamientoPuerto` | `EnrutamientoTraefikArchivo` | `EnrutamientoStub` |
| `CertificadoPuerto` | `CertificadoAcmeArchivo` | `CertificadoAusente` (Null Object) |
| `MetricasContenedorPuerto` | `MetricasDockerStats` | `MetricasContenedorStub` |
| `CorreoPuerto` | `CorreoSmtpAdaptador` (nodemailer) | `CorreoConsolaAdaptador` |
| `PasarelaPago` | `PasarelaSimulada` | La misma (es simulada por diseño) |
| `ProveedorFuente` | `FuenteGitHubPublica` | Dobles en las pruebas |
| `RepositorioDespliegues`, `RepositorioProyectos`… | `…Prisma` | `…Memoria` |

`adapters/stubs/contratos-stubs.spec.ts` comprueba, método por método, que el *stub* y el adaptador real exponen el mismo contrato: es la prueba de Liskov hecha código.

### Módulos y contratos entre ellos

Un módulo solo usa lo que otro **exporta** en su `*.module.ts`, y casi siempre a través de un puerto del consumidor: M3 no importa el servicio de M2, declara `CuotaProyectosPuerto` y un adaptador lo resuelve contra M2. Los datos que cruzan módulos están firmados en `docs/contratos/`.

| Módulo | Expone a otros | Consume de otros (puerto del consumidor) |
|---|---|---|
| M1 Identidad | `SesionGuard`, `RolGuard`, `@UsuarioActual()`, directorio de cuentas | M2 `AsignacionSandboxPuerto`; M10 `CorreoPuerto`; M9 `PoliticaRegistroPuerto` |
| M2 Suscripciones | `cuotaDe(usuarioId)`, catálogo, estado de la suscripción | M5 `ContenedoresClientePuerto` (detener y reanudar); M10 `AvisosPuerto` |
| M3 Proyectos | Lectura de proyectos y variables descifradas | M2 `CuotaProyectosPuerto`; M4 `DeteccionStackService`, `crearDespliegue` |
| M4 Construcción | `crearDespliegue`, vista y bitácora del despliegue, tiempos por etapa | M3 `ProyectosLecturaPuerto`; M5 `BloqueoDespliegue`; M10 `AvisosPuerto` (Observer) |
| M5 Orquestación | Acciones de contenedor, reversión, métricas | M2 `CuotaPlanPuerto`; M3 `VariablesEntornoPuerto` |
| M6 Enrutamiento | `EnrutamientoPuerto`, `CertificadoPuerto` | — |
| M7 Observabilidad | Resumen, historial, consumo, métricas, bitácora de ejecución | M4 y M5 (lectura) |
| M9 Administración | Usuarios, suspensión, instalación, infraestructura | M1 `CuentasSuspensionPuerto`; M5 contenedores |
| M10 Notificaciones | `CorreoPuerto`, `AvisosPuerto` | M1 `DestinatariosPuerto` |

| Contrato | Productor → consumidor | Qué fija |
|---|---|---|
| `datos-nucleo.md` | Prisma → todos | Modelo de datos del núcleo (v2 con métricas) |
| `despliegues.md` | M4/M5 → web | Vista del despliegue, etapas, bitácora, acciones (v2 con reversión) |
| `metricas.md` | M5 → M7 → web | Serie de 1 h y 24 h, picos, eventos |
| `avisos.md` | M2/M4 → M10 | Avisos de despliegue y de suscripción |
| `instalacion.md` | instalador → M1/M9 | Código de configuración, modo, salud de la instalación |

## El motor de despliegue

### Componentes del motor (C4 nivel 3)

<!-- diagrama: docs/diagramas/compartido/c4-componentes-motor.mmd -->
```mermaid
---
title: C4 Nivel 3 — Componentes del motor de despliegue (M4 M5 M6), hexagonal
---
flowchart TB
    WEB["web · pantallas 11a, 12, 13, 14"]
    M3["M3 ProyectosService"]
    M2["M2 SuscripcionesService<br/>cuotaDe(usuarioId)"]

    subgraph ENTRADA["Entrada"]
        CTRL["DesplieguesController<br/>POST /proyectos/:id/despliegues<br/>GET /despliegues/:id · /bitacora?desde="]
        CTRL_V2["AccionesController (v2)<br/>reversiones · cancelar · reintentar<br/>reiniciar · detener · artefactos"]
        PROC["ProcesadorDespliegues<br/>consumidor BullMQ (worker)"]
    end

    subgraph APLICACION["Aplicación"]
        CONS["ConstruccionService<br/>Facade exportada: crearDespliegue,<br/>consultar, bitacoraDesde"]
        DETS["DeteccionStackService<br/>exportado a M3"]
        PIPE["PipelineDespliegue<br/>recorre los pasos del plan"]
        ORQ["OrquestacionService<br/>aprovisionar, activar, detener,<br/>detenerTodosDe"]
        REV["ReversionService (v2)<br/>valida y crea el despliegue"]
        ENR["EnrutamientoService<br/>publicar, retirar"]
        RET["RetencionArtefactos<br/>escucha DespliegueTerminado"]
        PASOS["PasoRecepcion · PasoConstruccion<br/>PasoEjecucion · PasoEnrutamiento<br/>PasoOperacion<br/>Chain of Responsibility"]
    end

    subgraph DOMINIO["Dominio puro"]
        TRANS["TransicionesDespliegue<br/>State"]
        RECETAS["RecetaStack (Strategy)<br/>Dockerfile · Node · Python · Go · Estática<br/>decide sobre un mapa de archivos"]
        POL["PoliticaDespliegue<br/>PoliticaRetencion · LimitesContenedor"]
    end

    subgraph PUERTOS["Puertos (abstract class, sin I)"]
        P_COLA["ColaConstruccionPuerto"]
        P_CLON["ClonadorRepositorioPuerto"]
        P_BUILD["ConstructorImagenPuerto"]
        P_LECT["LectorFuente"]
        P_REPO["RepositorioDespliegues<br/>RepositorioArtefactos"]
        P_CONT["ContenedorPuerto"]
        P_SALUD["VerificacionEntornoPuerto"]
        P_RUTA["EnrutamientoPuerto"]
        P_RELOJ["Reloj"]
    end

    subgraph ADAPTADORES["Adaptadores (y un stub por puerto para pruebas)"]
        A_BULL["ColaBullMq"]
        A_GIT["ClonadorGit"]
        A_DBUILD["ConstructorDocker (dockerode)"]
        A_FS["LectorFuenteLocal · LectorFuenteGitHub (M3)"]
        A_PRISMA["RepositorioDesplieguesPrisma"]
        A_DRUN["ContenedorDocker (dockerode)"]
        A_HTTP["VerificacionHttp"]
        A_TRAEFIK["EnrutamientoTraefikArchivo"]
    end

    REDIS[("Redis")]
    PG[("PostgreSQL")]
    DOCKER["Docker Engine"]
    GIT["GitHub"]
    TRAEFIK["Traefik"]

    WEB --> CTRL
    WEB --> CTRL_V2
    M3 --> CONS
    M3 --> DETS
    CTRL --> CONS
    CTRL_V2 --> REV
    CTRL_V2 --> ORQ
    CONS --> M2
    CONS --> TRANS
    CONS --> POL
    CONS --> P_COLA
    CONS --> P_REPO
    REV --> P_REPO
    REV --> P_COLA
    PROC --> PIPE
    PIPE --> PASOS
    PIPE --> TRANS
    PASOS --> P_CLON
    PASOS --> DETS
    PASOS --> P_BUILD
    PASOS --> ORQ
    PASOS --> ENR
    DETS --> RECETAS
    DETS --> P_LECT
    ORQ --> POL
    ORQ --> M2
    ORQ --> P_CONT
    ORQ --> P_SALUD
    ENR --> P_RUTA
    RET --> POL
    RET --> P_CONT
    PIPE --> P_REPO
    PIPE --> P_RELOJ

    P_COLA -.-> A_BULL
    P_CLON -.-> A_GIT
    P_BUILD -.-> A_DBUILD
    P_LECT -.-> A_FS
    P_REPO -.-> A_PRISMA
    P_CONT -.-> A_DRUN
    P_SALUD -.-> A_HTTP
    P_RUTA -.-> A_TRAEFIK

    A_BULL --> REDIS
    A_PRISMA --> PG
    A_GIT --> GIT
    A_DBUILD --> DOCKER
    A_DRUN --> DOCKER
    A_TRAEFIK --> TRAEFIK

    classDef entry fill:#eef2ff,stroke:#818cf8,stroke-width:2px,color:#1e1b4b
    classDef app fill:#f5f3ff,stroke:#a78bfa,stroke-width:2px,color:#312e81
    classDef dom fill:#f0fdf4,stroke:#4ade80,stroke-width:2px,color:#166534
    classDef port fill:#fff7ed,stroke:#fb923c,stroke-width:2px,color:#7c2d12
    classDef adapter fill:#fdf4ff,stroke:#e879f9,stroke-width:2px,color:#701a75
    classDef ext fill:#f0f9ff,stroke:#38bdf8,stroke-width:2px,color:#0c4a6e
    class CTRL,CTRL_V2,PROC entry
    class CONS,DETS,PIPE,ORQ,REV,ENR,RET,PASOS app
    class TRANS,RECETAS,POL dom
    class P_COLA,P_CLON,P_BUILD,P_LECT,P_REPO,P_CONT,P_SALUD,P_RUTA,P_RELOJ port
    class A_BULL,A_GIT,A_DBUILD,A_FS,A_PRISMA,A_DRUN,A_HTTP,A_TRAEFIK adapter
    class WEB,M3,M2,REDIS,PG,DOCKER,GIT,TRAEFIK ext
```

### El pipeline como cadena de pasos

`PipelineDespliegue` es el corazón del trabajador. Recibe un `TrabajoDespliegue { despliegueId, plan }` de la cola y recorre una **lista ordenada de pasos**. Cada paso conoce su etapa y su estado, y el pipeline hace lo común: valida la transición, marca la etapa en curso, ejecuta, la marca completada y vacía la bitácora.

- **Chain of Responsibility:** los pasos se ejecutan en orden y cada uno deja su resultado en el `ContextoDespliegue` (clon, receta, imagen, contenedor, URL) para el siguiente.
- **Strategy:** cada *plan* es una lista de pasos. `construccion` usa los cinco; `reversion`, los tres últimos. Un plan nuevo no toca ni los pasos ni el pipeline.
- **Compensación (estilo *saga*):** si un paso falla, el pipeline llama a `compensar()` de los que ya corrieron, en orden inverso. Un contenedor que no pasó la salud se borra y la ruta sigue en el anterior. `liberar()` corre siempre (borra el clon temporal).
- **Observer:** al terminar, el pipeline anuncia `DespliegueTerminado` a los `OyenteDespliegue` registrados: `RetencionArtefactos` retira imágenes viejas y `AvisoDespliegueOyente` manda el correo. El pipeline no sabe que existen el correo ni la retención.
- **Cancelación cooperativa:** `VigiaCancelacion` escucha una señal en Redis y aborta el `AbortController` del despliegue; los pasos largos (`git clone`, `docker build`) respetan la señal.

<!-- diagrama: docs/diagramas/diseno/clases-m4-m6-motor.mmd -->
```mermaid
---
title: Clases del motor de despliegue (M4 Construcción, M5 Orquestación, M6 Enrutamiento)
---
classDiagram
    direction TB
    class PipelineDespliegue {
        +ejecutar(trabajo) void
        -recorrer(contexto, pasos) void
        -fallar(contexto, error) void
        -cancelar(contexto) void
    }
    class PasoPipeline {
        <<abstract>>
        +etapa Etapa
        +estado EstadoDespliegue
        +ejecutar(contexto)* void
        +compensar(contexto) void
        +liberar(contexto) void
    }
    class PasoRecepcion
    class PasoConstruccion
    class PasoEjecucion
    class PasoEnrutamiento
    class PasoOperacion

    class TransicionesDespliegue {
        <<dominio>>
        +puedeTransicionar(de, a) boolean
        +transicionar(de, a) EstadoDespliegue
    }
    class DeteccionStackService {
        +detectar(fuente, rutaDockerfile) ResultadoDeteccion
    }
    class RecetaStack {
        <<abstract>>
        +reconoce(archivos)* boolean
        +describir(archivos)* DescripcionReceta
        +dockerfile(archivos)* string
        +puertoSugerido(archivos)* number
    }
    class RecetaDockerfile
    class RecetaNode
    class RecetaPython
    class RecetaGo
    class RecetaEstatica

    class OyenteDespliegue {
        <<abstract>>
        +alTerminar(evento)* void
    }
    class RetencionArtefactos
    class AvisoDespliegueOyente

    class ClonadorRepositorioPuerto {
        <<puerto>>
    }
    class ConstructorImagenPuerto {
        <<puerto>>
    }
    class ContenedorPuerto {
        <<puerto>>
        +crear(espec) ContenedorCreado
        +detener(id) void
        +eliminarImagen(imagen) void
    }
    class VerificacionEntornoPuerto {
        <<puerto>>
        +saludable(objetivo) ResultadoSalud
    }
    class EnrutamientoPuerto {
        <<puerto>>
        +publicar(ruta) url
        +retirar(subdominio) void
    }
    class RepositorioDespliegues {
        <<puerto>>
    }

    class ClonadorGit
    class ConstructorDocker
    class ContenedorDocker
    class VerificacionHttp
    class EnrutamientoTraefikArchivo

    PipelineDespliegue o-- PasoPipeline : plan construccion o reversion
    PipelineDespliegue --> TransicionesDespliegue
    PipelineDespliegue --> RepositorioDespliegues
    PipelineDespliegue --> OyenteDespliegue : DespliegueTerminado
    PasoPipeline <|-- PasoRecepcion
    PasoPipeline <|-- PasoConstruccion
    PasoPipeline <|-- PasoEjecucion
    PasoPipeline <|-- PasoEnrutamiento
    PasoPipeline <|-- PasoOperacion
    PasoRecepcion --> ClonadorRepositorioPuerto
    PasoRecepcion --> DeteccionStackService
    PasoConstruccion --> ConstructorImagenPuerto
    PasoEjecucion --> ContenedorPuerto
    PasoEjecucion --> VerificacionEntornoPuerto
    PasoEnrutamiento --> EnrutamientoPuerto
    DeteccionStackService o-- RecetaStack : en orden
    RecetaStack <|-- RecetaDockerfile
    RecetaStack <|-- RecetaNode
    RecetaStack <|-- RecetaPython
    RecetaStack <|-- RecetaGo
    RecetaStack <|-- RecetaEstatica
    OyenteDespliegue <|-- RetencionArtefactos
    OyenteDespliegue <|-- AvisoDespliegueOyente
    ClonadorRepositorioPuerto <|.. ClonadorGit
    ConstructorImagenPuerto <|.. ConstructorDocker
    ContenedorPuerto <|.. ContenedorDocker
    VerificacionEntornoPuerto <|.. VerificacionHttp
    EnrutamientoPuerto <|.. EnrutamientoTraefikArchivo
```

### Máquina de estados del despliegue

Los estados viven en **una sola tabla pura**, `TransicionesDespliegue`. Ningún servicio cambia un estado sin pasar por `transicionar(de, a)`, que lanza `TransicionInvalida` si el cambio no está permitido:

```ts
const SIGUIENTES: Readonly<Record<EstadoDespliegue, readonly EstadoDespliegue[]>> = {
  encolado: ["construyendo", "cancelado"],
  construyendo: ["aprovisionando", "fallido", "cancelado"],
  revirtiendo: ["aprovisionando", "fallido", "cancelado"],
  aprovisionando: ["publicando", "fallido"],
  publicando: ["saludable", "fallido"],
  saludable: ["detenido"],
  detenido: ["aprovisionando"],
  fallido: [],
  cancelado: [],
};
```

<!-- diagrama: docs/diagramas/m1-m10/m4-m5-m6-estados-despliegue.mmd -->
```mermaid
---
title: Estados del despliegue — núcleo v4.1 con reversión (no son los de suscripción)
---
stateDiagram-v2
    [*] --> Encolado : crearDespliegue (alta, manual, reintento, redespliegue, variables)
    [*] --> Revirtiendo : revertir a un artefacto disponible (no consume construcciones)

    Encolado --> Construyendo : el trabajador toma el trabajo
    Encolado --> Cancelado : el cliente cancela
    Construyendo --> Aprovisionando : artefacto #n registrado (digest y tamaño)
    Construyendo --> Fallido : clon falla, stack no reconocido, docker build falla o pasa de 10 min
    Construyendo --> Cancelado : el cliente cancela

    Revirtiendo --> Aprovisionando : la imagen del artefacto sigue en el nodo
    Revirtiendo --> Fallido : la imagen ya fue retirada

    Aprovisionando --> Publicando : contenedor con límites del plan responde a la salud (máx. 60 s)
    Aprovisionando --> Fallido : el contenedor no arranca o no responde

    Publicando --> Saludable : Traefik apunta al contenedor nuevo y se detiene el anterior
    Publicando --> Fallido : falla el enrutamiento

    Saludable --> Detenido : el cliente detiene o reinicia (cola operación), suscripción Suspendida o cuenta suspendida
    Detenido --> Aprovisionando : el cliente reinicia (mismo contenedor, sin reconstruir ni consumir construcciones)

    Fallido --> [*]
    Cancelado --> [*]

    note right of Encolado
        Etapa Recepción pendiente.
        Reintentar y redesplegar crean
        un despliegue nuevo (#n+1).
    end note
    note right of Construyendo
        Etapas Recepción y Construcción:
        git clone, detección de stack,
        docker build con Dockerfile o receta.
    end note
    note left of Revirtiendo
        Recepción y Construcción
        quedan «omitida».
        Reusa la imagen deploya/p:n.
    end note
    note right of Aprovisionando
        Etapa Ejecución: red del proyecto,
        --cpus y --memory de cuotaDe,
        sin privilegios.
    end note
    note right of Publicando
        Etapa Enrutamiento: ruta dinámica
        de Traefik; conmutación sin corte.
    end note
    note right of Saludable
        Etapa Operación. Proyecto.despliegueActivo
        cambia aquí; el anterior se detiene
        y la retención deja 5 artefactos.
    end note
    note left of Fallido
        La versión activa sigue
        sirviendo tráfico.
        Guarda codigoSalida y motivo.
    end note
```

### Detección de stack

<!-- diagrama: docs/diagramas/m1-m10/m4-actividad-deteccion-stack.mmd -->
```mermaid
---
title: Actividad — detección de stack (M4-03, Strategy de recetas en orden fijo)
---
flowchart TB
    START(("LectorFuente<br/>GitHub en 11a · disco en el trabajador")) --> LEER["Leer solo los archivos que piden las recetas<br/>Dockerfile, package.json, requirements.txt,<br/>pyproject.toml, go.mod, index.html"]
    LEER --> D{"¿Dockerfile en<br/>rutaDockerfile?"}
    D -->|Sí| R_DF["RecetaDockerfile<br/>usa el del repo<br/>puerto = primer EXPOSE o 8080"]
    D -->|No| N{"¿package.json<br/>con script start?"}
    N -->|Sí| R_N["RecetaNode<br/>node:22-alpine · npm ci · build si existe<br/>npm start · PORT=8080"]
    N -->|No| P{"¿requirements.txt o<br/>pyproject.toml, y main.py o app.py?"}
    P -->|Sí| R_P["RecetaPython<br/>python:3.12-slim · pip install<br/>gunicorn si está, si no python main.py"]
    P -->|No| G{"¿go.mod?"}
    G -->|Sí| R_G["RecetaGo<br/>golang:1.23 → distroless<br/>binario estático · PORT=8080"]
    G -->|No| E{"¿index.html<br/>en la raíz?"}
    E -->|Sí| R_E["RecetaEstatica<br/>nginx-unprivileged · :8080"]
    E -->|No| NO["StackNoReconocido<br/>11e: falta Dockerfile y no se reconoce el stack"]

    R_N --> GEN["Generar Dockerfile.deploya en el clon<br/>bitácora: Stack detectado · receta Deploya"]
    R_P --> GEN
    R_G --> GEN
    R_E --> GEN
    R_DF --> RES(("ResultadoDeteccion<br/>receta, descripcion,<br/>puertoSugerido, evidencia"))
    GEN --> RES

    classDef startEnd fill:#f5f3ff,stroke:#a78bfa,stroke-width:2px,color:#312e81
    classDef process fill:#f0fdfa,stroke:#2dd4bf,stroke-width:2px,color:#134e4a
    classDef decision fill:#fefce8,stroke:#facc15,stroke-width:2px,color:#713f12
    classDef error fill:#fff1f2,stroke:#fb7185,stroke-width:2px,color:#881337
    classDef success fill:#f0fdf4,stroke:#4ade80,stroke-width:2px,color:#166534
    class START,RES startEnd
    class LEER,GEN process
    class D,N,P,G,E decision
    class NO error
    class R_DF,R_N,R_P,R_G,R_E success
```

Las recetas son **puras**: deciden sobre un mapa de archivos ya leído. Por eso la misma detección sirve en el alta (M3 lee por la API de GitHub con `LectorFuenteGitHub`) y en el trabajador (lee del clon con `LectorFuenteLocal`). Agregar un stack es crear una clase `RecetaX extends RecetaStack` y registrarla en la lista: **abierto a extensión, cerrado a modificación** ([ADR 0003](../adr/0003-construccion-dockerfile-o-receta.md)).

## Diagramas UML

### Clases · Identidad y notificaciones

`IdentidadService` depende de **nueve** abstracciones y de ninguna implementación. `CorreoConRegistro` es un **Decorator**: envuelve cualquier `CorreoPuerto` para registrar el último envío (lo usa Admin · Instalación) sin que el adaptador SMTP lo sepa. `PlantillaCorreo` es un **Template Method**: `componer()` arma el mensaje con el kit visual y cada plantilla solo define asunto, título, párrafo y botón.

<!-- diagrama: docs/diagramas/diseno/clases-m1-m10-identidad.mmd -->
```mermaid
---
title: Clases de Identidad (M1) y Notificaciones (M10)
---
classDiagram
    direction LR
    class IdentidadController
    class SesionController
    class RecuperacionController
    class CuentaController
    class SesionGuard
    class RolGuard

    class IdentidadService {
        +registrar(solicitud) CuentaRegistrada
        +verificar(token) CuentaVerificada
        +reenviarVerificacion(solicitud) void
    }
    class SesionService {
        +iniciar(credenciales) SesionIniciada
        +usuarioDe(token) UsuarioSesion
        +cerrar(token) void
    }
    class RecuperacionService {
        +solicitar(correo) void
        +restablecer(solicitud) void
    }
    class CuentaService {
        +perfil(usuarioId) PerfilCuenta
        +renombrar(usuarioId, nombre) PerfilCuenta
        +cambiarContrasena(usuarioId, sesion, cambio) void
        +cerrarTodas(usuarioId) void
    }

    class PoliticaContrasena {
        <<dominio>>
        +validar(clave) ResultadoPolitica
    }
    class PoliticaReenvio {
        <<dominio>>
        +segundosRestantes(creadoUltimo, ahora) number
    }
    class NombreCuenta {
        <<objeto valor>>
    }

    class RepositorioUsuarios {
        <<puerto>>
    }
    class RepositorioSesiones {
        <<puerto>>
    }
    class RepositorioTokensCuenta {
        <<puerto>>
    }
    class HashContrasena {
        <<puerto>>
        +calcular(clave) string
        +coincide(clave, hash) boolean
    }
    class GeneradorToken {
        <<puerto>>
    }
    class AsignacionSandboxPuerto {
        <<puerto>>
    }
    class Reloj {
        <<puerto>>
        +ahora() Date
    }

    class CorreoPuerto {
        <<puerto>>
        +enviar(destinatario, plantilla, datos) void
    }
    class PlantillaCorreo {
        <<template method>>
        +componer(datos) MensajeCorreo
        #asunto(datos)* string
        #titulo(datos)* string
        #parrafo(datos)* string
        #textoBoton(datos)* string
    }
    class CorreoSmtpAdaptador
    class CorreoConsolaAdaptador
    class CorreoConRegistro {
        <<decorator>>
    }
    class CorreoSegunInstalacion
    class PlantillaVerificacion
    class PlantillaRecuperacion
    class HashContrasenaScrypt
    class RepositorioUsuariosPrisma
    class AsignacionSandboxSuscripciones

    IdentidadController --> IdentidadService
    SesionController --> SesionService
    RecuperacionController --> RecuperacionService
    CuentaController --> CuentaService
    SesionGuard --> SesionService

    IdentidadService --> PoliticaContrasena
    IdentidadService --> PoliticaReenvio
    IdentidadService --> RepositorioUsuarios
    IdentidadService --> RepositorioTokensCuenta
    IdentidadService --> HashContrasena
    IdentidadService --> GeneradorToken
    IdentidadService --> CorreoPuerto
    IdentidadService --> AsignacionSandboxPuerto
    IdentidadService --> Reloj
    SesionService --> RepositorioSesiones
    RecuperacionService --> CorreoPuerto
    CuentaService --> NombreCuenta

    HashContrasena <|-- HashContrasenaScrypt
    RepositorioUsuarios <|-- RepositorioUsuariosPrisma
    AsignacionSandboxPuerto <|-- AsignacionSandboxSuscripciones
    CorreoPuerto <|-- CorreoSmtpAdaptador
    CorreoPuerto <|-- CorreoConsolaAdaptador
    CorreoPuerto <|-- CorreoConRegistro
    CorreoPuerto <|-- CorreoSegunInstalacion
    CorreoConRegistro o-- CorreoPuerto : envuelve
    PlantillaCorreo <|-- PlantillaVerificacion
    PlantillaCorreo <|-- PlantillaRecuperacion
    CorreoPuerto ..> PlantillaCorreo : usa
```

### Clases · Suscripciones y administración

<!-- diagrama: docs/diagramas/m1-m10/m2-m9-clases.mmd -->
```mermaid
---
title: Clases — Suscripciones y pagos (M2) y Administración (M9)
---
classDiagram
    direction LR

    class SuscripcionesService {
        <<facade>>
        +catalogo() PlanCatalogo[]
        +asignarSandbox(usuarioId) void
        +cuotaDe(usuarioId) Cuota
    }
    class ContratacionService {
        +miSuscripcion(usuarioId) VistaSuscripcion
        +cotizar(usuarioId, solicitud) Cotizacion
        +contratar(usuarioId, solicitud) ResultadoContratacion
        +programarDescenso(usuarioId, codigoPlan) VistaSuscripcion
    }
    class HistorialPagosService {
        +deUsuario(usuarioId) FilaPago[]
        +pdfDe(usuarioId, pagoId) ArchivoComprobante
    }
    class CicloSuscripcionService {
        +ejecutar() ResultadoCiclo
    }
    class TareaCicloDiaria
    class PoliticaCiclo {
        <<dominio>>
        +siguiente(suscripcion, ahora) SaltoCiclo
        +cambioPorSalto(suscripcion, salto, ahora) CambioSuscripcion
    }

    class PasarelaPago {
        <<puerto>>
        +cobrar(cargo) ResultadoCobro
    }
    class PasarelaSimulada
    class CatalogoPlanes {
        <<puerto · Strategy>>
        +enVenta() PlanCatalogo[]
        +planInicial() Plan
        +exigirCobro() void
    }
    class CatalogoNube
    class CatalogoAutoalojado
    class PoliticaCuotas {
        <<puerto · Strategy>>
    }
    class CuotasDelPlan
    class LimitesDeInstalacion
    class ComprobantePdfPuerto {
        <<puerto>>
    }
    class ComprobantePdfKit
    class RepositorioSuscripciones {
        <<puerto>>
    }
    class RepositorioPagos {
        <<puerto>>
    }
    class RepositorioPlanes {
        <<puerto>>
    }
    class ContenedoresClientePuerto {
        <<puerto · M5>>
    }
    class AvisosPuerto {
        <<puerto · M10>>
    }

    class SuspensionService {
        +suspender(adminId, usuarioId, solicitud) void
    }
    class ReactivacionCuentaService {
        +reactivar(adminId, usuarioId, solicitud) ResultadoReactivacion
    }
    class CuentasSuspensionPuerto {
        <<puerto>>
        +cuenta(usuarioId) CuentaObjetivo
        +suspender(suspension) void
        +reactivar(reactivacion) void
    }

    ContratacionService --> PasarelaPago
    ContratacionService --> RepositorioPlanes
    ContratacionService --> RepositorioSuscripciones
    ContratacionService --> RepositorioPagos
    SuscripcionesService --> CatalogoPlanes
    SuscripcionesService --> PoliticaCuotas
    HistorialPagosService --> RepositorioPagos
    HistorialPagosService --> ComprobantePdfPuerto
    TareaCicloDiaria --> CicloSuscripcionService
    CicloSuscripcionService --> PoliticaCiclo
    CicloSuscripcionService --> RepositorioSuscripciones
    CicloSuscripcionService --> ContenedoresClientePuerto
    CicloSuscripcionService --> AvisosPuerto
    PasarelaPago <|-- PasarelaSimulada
    CatalogoPlanes <|-- CatalogoNube
    CatalogoPlanes <|-- CatalogoAutoalojado
    PoliticaCuotas <|-- CuotasDelPlan
    PoliticaCuotas <|-- LimitesDeInstalacion
    ComprobantePdfPuerto <|-- ComprobantePdfKit

    SuspensionService --> CuentasSuspensionPuerto
    SuspensionService --> ContenedoresClientePuerto
    ReactivacionCuentaService --> CuentasSuspensionPuerto
    ReactivacionCuentaService --> ContenedoresClientePuerto
```

### Clases · Proyectos y observabilidad

<!-- diagrama: docs/diagramas/m1-m10/m3-m7-clases.mmd -->
```mermaid
---
title: Clases — Proyectos (M3) y Observabilidad (M7)
---
classDiagram
    direction LR
    class ProyectosController
    class ProyectosService {
        +validarRepositorio(consulta) ValidacionRepositorio
        +listar(usuarioId) ListaProyectos
        +crear(usuarioId, alta) ProyectoCreado
        +configurar(usuarioId, proyectoId, cambios) Proyecto
        +eliminar(usuarioId, proyectoId, confirmacion) void
    }
    class VariablesProyectoService {
        +guardarVariables(usuarioId, proyectoId, pedido) VariablesGuardadas
        +listarVariables(usuarioId, proyectoId) VariablePublica[]
        +mostrarVariable(usuarioId, proyectoId, clave) string
    }
    class ProveedorFuente {
        <<puerto>>
        +validar(consulta) ValidacionRepositorio
        +lector(consulta) LectorFuente
    }
    class RepositorioProyectos {
        <<puerto>>
        +guardar(proyecto) Proyecto
        +porId(id) Proyecto
        +deUsuario(usuarioId) Proyecto[]
        +existeSubdominio(subdominio) boolean
    }
    class CuotaProyectosPuerto {
        <<puerto>>
        +cuotaDe(usuarioId) CuotaProyectos
    }
    class CifradorVariables {
        <<puerto>>
        +cifrar(valor) string
        +descifrar(valorCifrado) string
    }
    class FuenteGitHubPublica
    class CifradorAesGcm
    class CuotaProyectosSuscripciones
    class RepositorioProyectosPrisma

    class DeteccionStackService {
        <<M4>>
    }
    class ConstruccionService {
        <<M4>>
        +crearDespliegue(pedido) Despliegue
    }
    class BloqueosService {
        <<M5>>
    }

    class ResumenProyectoService {
        +resumen(proyectoId, usuarioId) ResumenProyecto
    }
    class ConsumoService {
        +de(usuarioId) ConsumoPeriodoDto
        +diario(usuarioId) ConsumoDiarioDto
    }
    class LecturaMetricasService {
        +leer(proyectoId, usuarioId, rango) RespuestaMetricas
    }
    class TiemposService {
        +leer(proyectoId, usuarioId, ultimos) RespuestaTiempos
    }
    class BitacoraEjecucionService {
        +leer(proyectoId, usuarioId, desde) RespuestaBitacora
    }
    class SalidaContenedorPuerto {
        <<puerto>>
    }

    ProyectosController --> ProyectosService
    ProyectosService --> ProveedorFuente
    ProyectosService --> RepositorioProyectos
    ProyectosService --> CuotaProyectosPuerto
    ProyectosService --> VariablesProyectoService
    ProyectosService --> DeteccionStackService
    ProyectosService --> ConstruccionService
    ProyectosService --> BloqueosService
    VariablesProyectoService --> CifradorVariables
    ProveedorFuente <|-- FuenteGitHubPublica
    CifradorVariables <|-- CifradorAesGcm
    CuotaProyectosPuerto <|-- CuotaProyectosSuscripciones
    RepositorioProyectos <|-- RepositorioProyectosPrisma
    BitacoraEjecucionService --> SalidaContenedorPuerto
```

### Secuencia · Recorrido completo

Del registro a la aplicación en línea, cruzando todos los módulos del núcleo.

<!-- diagrama: docs/diagramas/compartido/secuencia-recorrido-e2e.mmd -->
```mermaid
---
title: Recorrido de punta a punta del Avance 1 — de registrarse a ver la app Saludable
---
sequenceDiagram
    autonumber
    actor Cliente
    participant Web as web
    participant M1 as M1 Identidad
    participant M10 as M10 CorreoPuerto
    participant Mail as Mailpit
    participant M2 as M2 Suscripciones
    participant M3 as M3 Proyectos
    participant GH as GitHub
    participant M4 as M4 Construcción (api)
    participant W as worker M4 M5 M6
    participant Edge as Traefik

    Note over Cliente,Edge: Eddy · pantallas 01, 02, 03
    Cliente->>Web: Registro (01)
    Web->>M1: POST /identidad/registro
    M1->>M2: asignarSandbox(usuarioId)
    M1->>M10: enviar(verificacion, enlace 24 h)
    M10->>Mail: SMTP
    Cliente->>Mail: abre el correo (localhost:8025)
    Cliente->>Web: enlace de verificación (02)
    Web->>M1: POST /identidad/verificar
    Cliente->>Web: Iniciar sesión (03)
    Web->>M1: POST /identidad/sesion
    M1-->>Web: cookie de sesión (SesionGuard)

    Note over Cliente,Edge: Javier · pantalla 06
    Cliente->>Web: Planes
    Web->>M2: GET /suscripciones/planes
    M2-->>Web: 4 planes · Sandbox es el plan actual

    Note over Cliente,Edge: Eduardo · pantallas 10b, 11a, 11d
    Cliente->>Web: Nuevo proyecto: URL, rama, nombre
    Web->>M3: POST /proyectos/validar
    M3->>GH: API pública: repo, rama, último commit, Dockerfile
    M3->>M4: DeteccionStackService.detectar(LectorFuenteGitHub) · desde A2
    M3-->>Web: Dockerfile detectado · puerto de EXPOSE
    Cliente->>Web: Revisar → Desplegar
    Web->>M3: POST /proyectos
    M3->>M2: cuotaDe · 0 de 1 proyectos
    M3->>M4: crearDespliegue(proyectoId, alta)
    M4-->>Web: despliegue #1 encolado

    Note over Cliente,Edge: Derek · motor, pantallas 10 y 12
    M4->>W: TrabajoDespliegue por Redis
    W->>W: clonar → detectar → docker build → artefacto #1
    W->>W: contenedor 0.25 vCPU · 256 MB → salud OK
    W->>Edge: ruta hola-deploya.localhost → contenedor
    loop cada 3 s
        Web->>M4: GET /despliegues/:id y /bitacora?desde=n
    end
    M4-->>Web: saludable · url
    Cliente->>Edge: http://hola-deploya.localhost
    Edge-->>Cliente: la app responde
```

### Secuencia · Contratación de un plan

<!-- diagrama: docs/diagramas/m1-m10/m2-secuencia-contratacion-plan.mmd -->
```mermaid
---
title: Secuencia — contratación de un plan con la pasarela simulada (M2)
---
sequenceDiagram
    actor Cliente
    participant UI as Interfaz web
    participant SubCtrl as Controlador de suscripciones
    participant Catalogo as Servicio de catalogo
    participant Suscripcion as Servicio de suscripciones
    participant Pagos as Servicio de pagos
    participant Pasarela as Adaptador de pasarela (simulada)
    participant Cuotas as Servicio de cuotas
    participant Orquesta as M5 Orquestacion
    participant Notif as M10 Notificaciones
    participant BD as PostgreSQL

    Cliente->>UI: Selecciona plan y vigencia (30/365 dias)
    UI->>SubCtrl: POST /suscripciones (planId, vigencia)
    SubCtrl->>Catalogo: obtenerPlan(planId)
    Catalogo->>BD: SELECT plan
    BD-->>Catalogo: plan (precio, recursos, vigencia)
    Catalogo-->>SubCtrl: plan valido

    SubCtrl->>Pagos: procesarCargo(cliente, plan, vigencia)
    Pagos->>Pasarela: cobrar(monto, metodo)
    Pasarela-->>Pagos: resultado (aprobado | rechazado)

    alt Cargo aprobado
        Pagos->>BD: registrar transaccion (aprobada)
        Pagos-->>SubCtrl: pago aprobado

        SubCtrl->>Suscripcion: crearSuscripcion(cliente, plan, vigencia)
        Suscripcion->>BD: INSERT suscripcion (estado = Activa)
        BD-->>Suscripcion: suscripcion creada

        Suscripcion->>Cuotas: aplicarLimites(suscripcion, plan)
        Cuotas->>Orquesta: configurarLimites(cpu, memoria, proyectos, ...)
        Orquesta-->>Cuotas: limites aplicados
        Cuotas-->>Suscripcion: cuota activa

        Suscripcion->>Notif: enviarConfirmacionContratacion(cliente, plan)
        Notif-->>Suscripcion: notificacion encolada

        Suscripcion-->>SubCtrl: suscripcion activa
        SubCtrl-->>UI: 201 Creada (suscripcion, comprobante)
        UI-->>Cliente: Confirmacion de contratacion
    else Cargo rechazado
        Pagos->>BD: registrar transaccion (rechazada)
        Pagos-->>SubCtrl: pago rechazado
        SubCtrl-->>UI: 402 Pago rechazado
        UI-->>Cliente: Muestra motivo del rechazo, no se crea la cuota
    end
```

### Secuencia · Despliegue

<!-- diagrama: docs/diagramas/m1-m10/m4-m5-m6-secuencia-despliegue.mmd -->
```mermaid
---
title: Secuencia de un despliegue por construcción — Recepción → Construcción → Ejecución → Enrutamiento → Operación
---
sequenceDiagram
    autonumber
    actor Cliente
    participant Web as web (pantallas 11d, 12)
    participant API as ConstruccionService (api)
    participant M2 as SuscripcionesService
    participant BD as PostgreSQL
    participant Cola as ColaBullMq (Redis)
    participant W as PipelineDespliegue (worker)
    participant Git as ClonadorGit
    participant Det as DeteccionStackService
    participant Img as ConstructorDocker
    participant Orq as OrquestacionService
    participant Cont as ContenedorDocker
    participant Salud as VerificacionHttp
    participant Ruta as EnrutamientoTraefikArchivo

    Cliente->>Web: Desplegar
    Web->>API: POST /proyectos/:id/despliegues
    API->>M2: cuotaDe(usuarioId)
    API->>BD: Despliegue #n encolado + 5 etapas pendientes
    API->>Cola: encolar(TrabajoDespliegue{despliegueId, plan: construccion})
    API-->>Web: 201 {id, numero, estado: encolado}

    loop cada 3 s mientras terminado = false
        Web->>API: GET /despliegues/:id y /bitacora?desde=n
        API->>BD: estado, etapas, líneas n > desde
        API-->>Web: riel de etapas + líneas nuevas
    end

    Cola->>W: trabajo
    W->>BD: construyendo · recepción en curso
    Note over W,Det: 1 · Recepción
    W->>Git: clonar(url, rama, destino) --depth 1
    Git-->>W: commit {sha, mensaje, autor}
    W->>Det: detectar(LectorFuenteLocal)
    Det-->>W: receta dockerfile o node/python/go/estatica
    W->>BD: commit, receta, líneas de bitácora

    Note over W,Img: 2 · Construcción
    W->>Img: construir(directorio, etiqueta deploya/p:n, 10 min, alLinea)
    loop cada línea de docker build
        Img-->>W: alLinea(texto)
        W->>BD: LineaBitacora n, marca, etapa construccion
    end

    alt build correcto
        Img-->>W: {digest, tamanoBytes}
        W->>BD: Artefacto #n · aprovisionando
        Note over W,Salud: 3 · Ejecución
        W->>Orq: aprovisionar(contexto)
        Orq->>M2: cuotaDe(usuarioId)
        Orq->>Cont: crear({nombre, imagen, red del proyecto, cpus, memoriaMb, variables})
        Cont-->>Orq: {id, host}
        Orq->>Salud: saludable({host, puerto, ruta /, 60 s})
        alt responde
            Salud-->>Orq: ok, 200 en 38 ms
            Note over W,Ruta: 4 · Enrutamiento
            W->>BD: publicando
            W->>Ruta: publicar({subdominio, host, puerto})
            Ruta-->>W: url http(s)://p.dominio
            Note over W,Cont: 5 · Operación
            W->>BD: saludable · Proyecto.despliegueActivo = #n
            W->>Cont: detener(contenedor anterior)
            W->>W: publica DespliegueTerminado (retención de artefactos)
        else no responde en 60 s
            Salud-->>Orq: falla
            Orq->>Cont: eliminar(contenedor nuevo)
            W->>BD: fallido · la versión activa no cambia
        end
    else build falla o pasa de 10 min
        Img-->>W: ConstruccionFallida(codigoSalida)
        W->>BD: fallido · codigoSalida · motivo · construcción fallida
    end
```

### Secuencia · Reversión sin reconstruir

<!-- diagrama: docs/diagramas/m1-m10/m4-m5-m6-secuencia-reversion.mmd -->
```mermaid
---
title: Secuencia de reversión — vuelve a un artefacto anterior sin reconstruir (M5-04)
---
sequenceDiagram
    autonumber
    actor Cliente
    participant Web as web (pantalla 14)
    participant Rev as ReversionService (api)
    participant BD as PostgreSQL
    participant Cola as ColaBullMq (Redis)
    participant W as PipelineDespliegue (worker)
    participant Orq as OrquestacionService
    participant Cont as ContenedorDocker
    participant Salud as VerificacionHttp
    participant Ruta as EnrutamientoTraefikArchivo

    Cliente->>Web: Revertir a la versión #13
    Web->>Rev: POST /proyectos/:id/reversiones {artefactoId}
    Rev->>BD: artefacto #13 del proyecto
    alt no disponible, ya activo o hay un despliegue en curso
        Rev-->>Web: 409 artefacto-no-disponible · artefacto-ya-activo · despliegue-en-curso
    else disponible
        Rev->>BD: Despliegue #16 revirtiendo · disparador reversion · artefacto #13 · recepción y construcción omitidas
        Rev->>Cola: encolar(TrabajoDespliegue{despliegueId, plan: reversion})
        Rev-->>Web: 201 {id, numero: 16, estado: revirtiendo}
        Note over Rev,W: No se clona ni se construye. No consume construcciones del mes.
        Cola->>W: trabajo
        W->>BD: aprovisionando · ejecución en curso
        W->>Orq: aprovisionar(contexto con la imagen deploya/p:13)
        Orq->>Cont: crear(imagen deploya/p:13, límites vigentes, variables vigentes)
        Orq->>Salud: saludable(host, puerto, 60 s)
        alt responde
            W->>Ruta: publicar(subdominio → contenedor #16)
            W->>BD: saludable · Proyecto.despliegueActivo = #16
            W->>Cont: detener(contenedor de #15)
        else no responde
            W->>Cont: eliminar(contenedor #16)
            W->>BD: fallido · #15 sigue activo
        end
    end
```

### Estados · Suscripción

`PoliticaCiclo.siguiente(suscripcion, ahora)` es una función pura: recibe la fecha como parámetro, así que el ciclo de 7, 5 y 30 días se prueba con fechas literales y sin esperar. Cada corrida mueve una suscripción **un estado como máximo**, lo que la hace idempotente.

<!-- diagrama: docs/diagramas/m1-m10/m2-estados-suscripcion.mmd -->
```mermaid
---
title: Estados de la suscripción — ciclo §4.4 (no son los de despliegue)
---
stateDiagram-v2
    [*] --> Activa : contratacion con pago aprobado<br/>(Sandbox: Activa sin vencimiento)

    Activa --> PorVencer : faltan 7 dias o menos<br/>(DIAS_POR_VENCER)
    Activa --> Vencida : se cumple la fecha de vigencia<br/>(un solo salto por corrida)
    PorVencer --> Activa : renovacion manual aprobada
    PorVencer --> Vencida : se cumple la fecha<br/>de vigencia sin renovar

    Activa --> Activa : descenso programado a Sandbox<br/>al vencer (sin cobro)
    PorVencer --> Vencida : descenso programado a un plan<br/>de pago al vencer (sin cobro)

    Vencida --> Activa : renovacion aprobada<br/>durante la gracia
    Vencida --> Suspendida : 5 dias en Vencida<br/>(DIAS_GRACIA)

    Suspendida --> Activa : renovacion aprobada<br/>(M5 reanuda los contenedores)
    Suspendida --> Cancelada : 30 dias en Suspendida<br/>(DIAS_HASTA_CANCELAR)

    Cancelada --> Activa : contratacion aprobada<br/>(M5 reanuda los contenedores)

    note right of Activa
        Todos los entornos operan
        con la cuota contratada
    end note
    note right of Vencida
        Entornos en linea;
        nuevos despliegues bloqueados
    end note
    note right of Suspendida
        Contenedores detenidos (M5);
        datos y configuracion conservados
    end note
    note right of Cancelada
        Datos conservados;
        solo cambia el estado
    end note
    note left of PorVencer
        Tarea diaria 00:05 UTC (BullMQ)
        o POST /admin/ciclo/ejecutar;
        idempotente el mismo dia
    end note
```

### Actividad · Registro y verificación

<!-- diagrama: docs/diagramas/m1-m10/m1-actividad-registro.mmd -->
```mermaid
---
title: Actividad — registro de cuenta (M1, M10)
config:
  layout: fixed
---
flowchart TB
    START(("Inicio")) --> A["Usuario abre<br>Crear cuenta"]
    A --> B["Ingresar correo, contraseña<br>y confirmación"]
    B --> C["Enviar solicitud<br>de registro"]
    C --> D{"¿Correo válido y contraseña<br>cumple la política?"}
    D -- No --> E["Mostrar errores<br>de validación (400)"]
    E --> B
    D -- Sí --> F["Verificar si el<br>correo ya existe"]
    F --> G{"¿Correo registrado?"}
    G -- Sí --> H["Informar que la cuenta ya existe (409):<br>iniciar sesión o recuperar contraseña"]
    H --> END1(("Fin"))
    G -- No --> I["Crear cuenta pendiente<br>con hash de la contraseña"]
    I --> S["Pedir Sandbox a M2<br>(asignarSandbox)"]
    S --> J["Generar token de verificación<br>(se guarda su huella; vence en 24 h)"]
    J --> K["Enviar correo<br>de verificación (M10)"]
    K --> M{"¿Correo enviado?"}
    M -- Sí --> L["Mostrar confirmación:<br>revisar correo"]
    L --> END2(("Fin"))
    M -- No --> N["Cuenta creada con aviso<br>(correoEnviado: false)"]
    N --> END3(("Fin"))

     START:::startEnd
     A:::input
     B:::input
     C:::input
     D:::decision
     E:::error
     F:::process
     G:::decision
     H:::error
     END1:::startEnd
     I:::process
     S:::process
     J:::process
     K:::process
     M:::decision
     L:::success
     N:::error
     END2:::startEnd
     END3:::startEnd
    classDef startEnd fill:#f5f3ff,stroke:#a78bfa,stroke-width:2px,color:#312e81
    classDef input fill:#eef2ff,stroke:#818cf8,stroke-width:2px,color:#1e1b4b
    classDef process fill:#f0fdfa,stroke:#2dd4bf,stroke-width:2px,color:#134e4a
    classDef decision fill:#fefce8,stroke:#facc15,stroke-width:2px,color:#713f12
    classDef error fill:#fff1f2,stroke:#fb7185,stroke-width:2px,color:#881337
    classDef success fill:#f0fdf4,stroke:#4ade80,stroke-width:2px,color:#166534
    linkStyle 4 stroke:#fb7185,stroke-width:2px,fill:none
    linkStyle 5 stroke:#fb7185,stroke-width:2px,fill:none
    linkStyle 8 stroke:#fb7185,stroke-width:2px,fill:none
    linkStyle 9 stroke:#fb7185,stroke-width:2px,fill:none
    linkStyle 17 stroke:#fb7185,stroke-width:2px,fill:none
    linkStyle 18 stroke:#fb7185,stroke-width:2px,fill:none
    linkStyle 6 stroke:#4ade80,stroke-width:2px,fill:none
    linkStyle 7 stroke:#4ade80,stroke-width:2px,fill:none
    linkStyle 10 stroke:#4ade80,stroke-width:2px,fill:none
    linkStyle 11 stroke:#4ade80,stroke-width:2px,fill:none
    linkStyle 12 stroke:#4ade80,stroke-width:2px,fill:none
    linkStyle 13 stroke:#4ade80,stroke-width:2px,fill:none
    linkStyle 14 stroke:#4ade80,stroke-width:2px,fill:none
    linkStyle 15 stroke:#4ade80,stroke-width:2px,fill:none
    linkStyle 16 stroke:#4ade80,stroke-width:2px,fill:none
```

### Actividad · Contratación y activación

<!-- diagrama: docs/diagramas/m1-m10/m2-actividad-contratacion-activacion.mmd -->
```mermaid
---
title: Actividad — contratación y activación de un plan (M2)
---
flowchart TB
    START(("Inicio")) --> A["Cliente consulta<br>catalogo de planes"]
    A --> B["Selecciona plan<br>y vigencia (30/365 dias)"]
    B --> C["Confirma cargo simulado"]
    C --> D["Pasarela simulada<br>procesa el cobro"]
    D --> E{"Cargo aprobado?"}
    E -- No --> F["Registrar transaccion<br>rechazada"]
    F --> G["Mostrar motivo<br>del rechazo"]
    G --> END1(("Fin"))
    E -- Si --> H["Registrar transaccion<br>aprobada"]
    H --> I["Crear suscripcion<br>estado = Activa"]
    I --> J["Aplicar limites del plan<br>al contenedor (M5)"]
    J --> K["Registrar en historial<br>de pagos"]
    K --> L["Enviar confirmacion<br>de contratacion"]
    L --> END2(("Fin"))

     START:::startEnd
     A:::process
     B:::input
     C:::input
     D:::process
     E:::decision
     F:::error
     G:::error
     END1:::startEnd
     H:::process
     I:::process
     J:::process
     K:::process
     L:::success
     END2:::startEnd
    classDef startEnd fill:#e0f2fe,stroke:#0284c7,stroke-width:2px,color:#0c4a6e
    classDef input fill:#ecfeff,stroke:#06b6d4,stroke-width:2px,color:#164e63
    classDef process fill:#eff6ff,stroke:#3b82f6,stroke-width:2px,color:#1e3a8a
    classDef decision fill:#fff7ed,stroke:#f97316,stroke-width:2px,color:#7c2d12
    classDef error fill:#fef2f2,stroke:#ef4444,stroke-width:2px,color:#7f1d1d
    classDef success fill:#ecfdf5,stroke:#10b981,stroke-width:2px,color:#065f46
    linkStyle 4 stroke:#ef4444,stroke-width:2px,fill:none
    linkStyle 5 stroke:#ef4444,stroke-width:2px,fill:none
    linkStyle 6 stroke:#10b981,stroke-width:2px,fill:none
    linkStyle 7 stroke:#10b981,stroke-width:2px,fill:none
    linkStyle 8 stroke:#10b981,stroke-width:2px,fill:none
    linkStyle 9 stroke:#10b981,stroke-width:2px,fill:none
    linkStyle 10 stroke:#10b981,stroke-width:2px,fill:none
```

## SOLID aplicado

Cada principio con la regla que sigue el equipo y dónde se puede comprobar en el código.

| Principio | Regla en Deploya | Evidencia en el código |
|---|---|---|
| **S** · Responsabilidad única | El controlador adapta HTTP, el servicio orquesta, la política decide, el adaptador habla con el exterior | `PoliticaCiclo` saca el ciclo de `SuscripcionesService`; `PoliticaRetencion` (decide) y `RetencionArtefactos` (ejecuta) están separadas; un controlador por recurso en M9 |
| **O** · Abierto/cerrado | Se extiende con una implementación nueva, no con `if/switch` por tipo | Recetas de stack (`RecetaNode`, `RecetaPython`…), planes del pipeline, `ManejadorAccion` por acción (`DetenerManejador`, `ReiniciarManejador`, `EliminarManejador`), modo de instalación ([ADR 0008](../adr/0008-autoalojado-y-codigo-abierto.md)) |
| **L** · Sustitución de Liskov | Stub, doble y adaptador real cumplen el mismo contrato y lanzan los mismos errores de dominio | `contratos-stubs.spec.ts`; `CertificadoAusente` devuelve `null` igual que el real sin TLS; `RecetaDockerfile` es una receta más, sin casos especiales |
| **I** · Segregación de interfaces | Puertos estrechos pensados desde quien los usa | ~70 puertos; `VerificacionEntornoPuerto` tiene un solo método; `ProyectosLecturaPuerto` y `DetalleProyectoPuerto` son vistas distintas del mismo repositorio |
| **D** · Inversión de dependencias | Servicios reciben puertos por constructor; nada de `new` de Docker, Prisma, SMTP ni `Date.now()` en el dominio | `IdentidadService` recibe 9 puertos; el tiempo entra por `Reloj`; los bindings viven en `AdaptersModule` y en cada `*.module.ts` |

> [!TIP]
> Los nombres siguen el dominio en español (`Despliegue`, `Suscripcion`, `cuotaDe`) y los sufijos de Nest quedan en inglés (`ConstruccionService`, `ProyectosController`): el diagrama dice `ServicioConstruccion` y el código `ConstruccionService`, y son el mismo componente.

### Clean code

- **Errores de dominio con nombre** en lugar de `Error('x')`: `CorreoYaRegistrado`, `CuotaConstruccionesAgotada`, `TransicionInvalida`, `ArtefactoNoDisponible`, `StackNoReconocido`. Un filtro por módulo los traduce a HTTP (`ErroresIdentidadFilter`, `RechazosOrquestacionFilter`, `ErroresMotorFilter`).
- **Sin números mágicos:** `TIEMPO_MAXIMO_CONSTRUCCION_MS = 10 * 60 * 1000`, `TIEMPO_MAXIMO_SALUD_MS`, `DIAS_POR_VENCER = 7`, `DIAS_GRACIA = 5`, `ESPERA_REENVIO_MS = 60_000`.
- **Tipos estrictos:** sin `any`; lo externo entra como `unknown` y se valida en el borde.
- **Consultas separadas de comandos:** M7 solo lee; el motor escribe.

## Patrones de diseño

| Patrón | Dónde | Clases | Por qué |
|---|---|---|---|
| **Ports & Adapters** (hexagonal) | Todos los módulos | ~70 puertos `abstract class` | El dominio se prueba sin infraestructura y el proveedor se cambia por configuración |
| **Repository** (Fowler) | Persistencia por agregado | `RepositorioUsuarios`, `RepositorioDespliegues`, `RepositorioPagos`… con versión Prisma y en memoria | El servicio no conoce SQL ni Prisma |
| **Adapter** (GoF) | Exterior | `ContenedorDocker`, `EnrutamientoTraefikArchivo`, `FuenteGitHubPublica`, `CorreoSmtpAdaptador` | Traducir una API externa al contrato del puerto |
| **Strategy** | Pagos, recetas, planes del pipeline, modo de instalación | `PasarelaPago`, `RecetaStack`, `PlanesPipeline`, `CatalogoPlanes`, `PoliticaCuotas` | Variar el algoritmo sin tocar a quien lo usa |
| **State** (tabla pura) | Despliegue y suscripción | `TransicionesDespliegue`, `PoliticaCiclo` | Una sola fuente de verdad de las transiciones, probada sin base |
| **Chain of Responsibility** | Motor | `PasoPipeline` y sus cinco pasos | Cada etapa es una clase con su compensación |
| **Command** + productor/consumidor | Colas | `TrabajoDespliegue`, acciones de operación | Construir fuera del ciclo HTTP; `jobId = despliegueId` lo hace idempotente |
| **Observer** | Fin de un despliegue | `OyenteDespliegue` ← `RetencionArtefactos`, `AvisoDespliegueOyente` | El pipeline no depende del correo ni de la retención |
| **Decorator** | Correo | `CorreoConRegistro` envuelve un `CorreoPuerto` | Registrar envíos sin tocar el adaptador SMTP |
| **Template Method** | Plantillas de correo | `PlantillaCorreo.componer()` | Mismo kit visual; cada correo define solo su texto |
| **Null Object** | Certificado sin TLS | `CertificadoAusente` | La vista no pregunta si hay TLS |
| **Facade** | Fronteras entre módulos | `SuscripcionesService.cuotaDe`, `asignarSandbox` | Una sola puerta por módulo |
| **Composite** | Salud de la instalación | `SaludInstalacion` y sus comprobaciones | Un estado general a partir de varias comprobaciones |
| **Guard / Decorator de Nest** | Autorización | `SesionGuard`, `RolGuard`, `@Roles()`, `@UsuarioActual()` | La autorización no ensucia los controladores |
| **Container / Presentational** | Web | Hooks (`useDespliegue`) y componentes sin `fetch` | La lógica de la web se prueba con `node --test` |

## Modelo de datos

### Modelo entidad-relación

Dieciséis tablas en PostgreSQL. El modelo se agrupa por el módulo dueño de cada tabla; las relaciones que cruzan módulos (`Usuario → Proyecto`, `Plan → Suscripcion`) están firmadas en `docs/contratos/datos-nucleo.md`.

<!-- diagrama: docs/diagramas/compartido/erd-unificado.mmd -->
```mermaid
---
title: ERD del núcleo v4.1 — fuente del schema Prisma (docs/contratos/datos-nucleo.md)
---
erDiagram
    USUARIO ||--o{ TOKEN_CUENTA : recibe
    USUARIO ||--o{ SESION : abre
    USUARIO ||--|| SUSCRIPCION : tiene
    USUARIO ||--o{ PAGO : realiza
    USUARIO ||--o{ PROYECTO : posee
    USUARIO ||--o{ ACCION_ADMINISTRATIVA : "ejecuta (admin)"
    USUARIO ||--o{ ACCION_ADMINISTRATIVA : "recibe"
    PLAN ||--o{ SUSCRIPCION : "plan actual"
    PLAN |o--o{ SUSCRIPCION : "descenso programado"
    PLAN ||--o{ PAGO : cobra
    SUSCRIPCION ||--o{ PAGO : genera
    PROYECTO ||--o{ VARIABLE_ENTORNO : configura
    PROYECTO ||--o{ DESPLIEGUE : tiene
    PROYECTO ||--o{ ARTEFACTO : versiona
    PROYECTO |o--o| DESPLIEGUE : "activo"
    ARTEFACTO |o--o{ DESPLIEGUE : "construido o reusado por"
    DESPLIEGUE ||--|{ ETAPA_DESPLIEGUE : "cinco etapas"
    DESPLIEGUE ||--o{ LINEA_BITACORA : produce
    DESPLIEGUE ||--o{ MUESTRA_METRICA : "se muestrea (24 h)"

    USUARIO {
        string id PK
        string correo UK
        string nombre
        string hashContrasena
        Rol rol "cliente | administrador"
        EstadoCuenta estadoCuenta "pendiente | activa | suspendida"
        string motivoSuspension
        datetime contrasenaCambiadaEn "null = nunca (SP-03)"
        datetime creado
    }
    TOKEN_CUENTA {
        string id PK
        string usuarioId FK
        TipoTokenCuenta tipo "verificacion 24 h | recuperacion 30 min"
        string hashToken UK
        datetime expira
        datetime usadoEn "un solo uso"
    }
    SESION {
        string id PK
        string usuarioId FK
        string hashToken UK
        datetime ultimaActividad "expira a los 7 días sin actividad"
        datetime revocadaEn
    }
    PLAN {
        string id PK
        string codigo UK "sandbox | starter | pro | business"
        decimal precio30
        decimal precio365
        int maxProyectos
        decimal cpus
        int memoriaMb
        int construccionesMes
    }
    SUSCRIPCION {
        string id PK
        string usuarioId FK,UK "una por cuenta"
        string planId FK
        EstadoSuscripcion estado "activa | por-vencer | vencida | suspendida | cancelada"
        datetime estadoDesde
        int vigenciaDias "30 | 365 | null"
        datetime vence "null en Sandbox"
        string planSiguienteId FK
    }
    PAGO {
        string id PK
        string usuarioId FK
        string suscripcionId FK
        string planId FK
        ConceptoPago concepto
        decimal monto
        EstadoPago estado "aprobado | rechazado"
        string tarjetaUltimos4
        string numeroComprobante UK
    }
    ACCION_ADMINISTRATIVA {
        string id PK
        string adminId FK
        string usuarioAfectadoId FK
        string accion "suspender-cuenta"
        string motivo
        string detalle
    }
    PROYECTO {
        string id PK
        string usuarioId FK
        string nombre
        string subdominio UK "inmutable"
        string urlRepositorio
        string rama
        string rutaDockerfile
        int puertoInterno
        RecetaConstruccion receta "dockerfile | node | python | go | estatica"
        string despliegueActivoId FK,UK
    }
    VARIABLE_ENTORNO {
        string id PK
        string proyectoId FK
        string clave "UK con proyectoId"
        string valorCifrado "AES-256-GCM"
    }
    ARTEFACTO {
        string id PK
        string proyectoId FK
        int numero "UK con proyectoId"
        string imagen "deploya/subdominio:n"
        string digest
        bigint tamanoBytes
        string commitSha
        RecetaConstruccion receta
        boolean disponible "retención: últimos 5"
    }
    DESPLIEGUE {
        string id PK
        string proyectoId FK
        int numero "UK con proyectoId"
        EstadoDespliegue estado
        DisparadorDespliegue disparador
        string commitSha
        string artefactoId FK
        string contenedorId
        string url
        decimal cpus
        int memoriaMb
        int codigoSalida
        string motivoFallo
        datetime creado
        datetime terminado
    }
    ETAPA_DESPLIEGUE {
        string despliegueId PK,FK
        Etapa etapa PK "recepcion..operacion"
        EstadoEtapa estado "pendiente | en-curso | completada | fallida | omitida"
        datetime iniciada
        datetime terminada
    }
    LINEA_BITACORA {
        string despliegueId PK,FK
        int n PK "consecutivo; desde= filtra n mayor"
        datetime marca
        Etapa etapa
        NivelBitacora nivel "info | aviso | error"
        string texto
    }
    CONFIGURACION_INSTALACION {
        string id PK "una fila: instalacion"
        string hashCodigo "sha256 del código; null si ya hay administrador"
        datetime codigoVence "30 min"
        PoliticaRegistro politicaRegistro "abierto | invitacion | cerrado"
        decimal cpuPorProyecto
        int memoriaMbPorProyecto
        int proyectosPorUsuario "null = sin límite"
        string smtpHost "correo de la instalación (SP-17)"
        string smtpClaveCifrada "AES-GCM; nunca en claro"
        boolean sinCorreo
    }
    MUESTRA_METRICA {
        string despliegueId PK,FK
        datetime tomada PK "una por minuto; se purga a las 24 h"
        decimal cpu
        int memoriaMb
    }
    INVITACION {
        string id PK
        string correo
        string hashToken UK "sha256; un solo uso"
        datetime vence "7 días"
        datetime usada
        datetime revocada
        string creadaPor "id del administrador"
    }
```

### Decisiones de diseño de la base

| Decisión | Por qué |
|---|---|
| Claves primarias `uuid` generadas por la aplicación | No revelan volumen ni orden; se pueden crear antes de insertar (el despliegue y su trabajo comparten id) |
| Claves naturales únicas aparte del `id` | `Usuario.correo`, `Plan.codigo`, `Proyecto.subdominio`, `Pago.numeroComprobante`: el *seed* es idempotente por clave natural |
| Únicas compuestas donde el dominio lo pide | `(proyectoId, numero)` en `Despliegue` y `Artefacto`; `(usuarioId, nombre)` en `Proyecto`; `(proyectoId, clave)` en `VariableEntorno` |
| Claves compuestas sin `id` artificial | `EtapaDespliegue (despliegueId, etapa)`, `LineaBitacora (despliegueId, n)`, `MuestraMetrica (despliegueId, tomada)`: son series que se leen siempre por su despliegue |
| Dinero en `numeric(10,2)` y moneda `char(3)` | Nada de flotantes para importes |
| Enums de PostgreSQL para los estados | La base rechaza un estado que no existe; los valores coinciden con el contrato (`por-vencer`, `en-curso`) |
| Borrado en cascada desde el agregado raíz | Eliminar un proyecto borra variables, despliegues, etapas, bitácora, artefactos y muestras; eliminar un usuario borra todo lo suyo |
| `SetNull` en referencias débiles | `Proyecto.despliegueActivoId` y `Despliegue.artefactoId` no bloquean el borrado del otro lado |
| Índices por la consulta que los usa | `(estado, vence)` para el ciclo diario; `(usuarioId, creado)` para el historial de pagos; `(proyectoId, creado)` para el historial de despliegues; `tomada` para purgar métricas |
| Secretos nunca en claro | Contraseñas con `scrypt`; tokens solo como SHA-256; variables y SMTP con AES-256-GCM |
| Una fila de configuración | `ConfiguracionInstalacion.id = "instalacion"` garantiza una sola configuración en autoalojado |

**Migraciones:** siete migraciones de Prisma versionadas en `apps/api/prisma/migrations` (núcleo del 29 de septiembre, más métricas, configuración de la instalación, fecha de cambio de contraseña, invitaciones y correo de la instalación). `prisma migrate deploy` las aplica en orden y el servicio `migracion` de compose las corre antes que la API.

### Diccionario de datos

Generado desde `apps/api/prisma/schema.prisma` cada vez que se construye este documento, así que no puede desfasarse del modelo real. Claves: **PK** primaria, **FK** foránea, **UQ** única.

<!-- diccionario-datos -->

## Seguridad por diseño

| Amenaza (STRIDE) | Dónde podría ocurrir | Control |
|---|---|---|
| **S**uplantación | Robo de sesión | Cookie `HttpOnly` + `SameSite=Lax` + `Secure`; en la base solo la huella SHA-256 del token; cambiar o restablecer la contraseña revoca sesiones |
| **S**uplantación | Fuerza bruta de credenciales | Política de 12 caracteres; límite de intentos por IP en el código de configuración (y en el inicio de sesión con EST-01a) |
| **T**ampering | Variables del cliente alteradas en la base | AES-256-GCM: un valor alterado falla la autenticación y el despliegue falla sin tocar la versión activa |
| **R**epudio | Acciones del administrador | `AccionAdministrativa` registra quién, a quién, qué, motivo y cuándo |
| **I**nformation disclosure | Enumerar cuentas o recursos | Respuestas neutras en registro y recuperación; 404 (no 403) para recursos ajenos; la bitácora nunca muestra valores de variables |
| **D**enial of service | Un cliente acapara el nodo | `--cpus` y `--memory` del plan; construcciones por mes; concurrencia 1 en el trabajador; tiempo máximo de 10 min por construcción |
| **E**levation of privilege | Escapar del contenedor o llegar a Docker | Contenedores sin privilegios, `CapDrop: ALL`, `no-new-privileges`, red propia; solo el trabajador monta `docker.sock`; nombres reservados (`api`, `www`) prohibidos como subdominio |

## Infraestructura y despliegue

### Diagrama de despliegue

<!-- diagrama: docs/diagramas/compartido/despliegue-infraestructura.mmd -->
```mermaid
---
title: Despliegue — servicios de docker compose, redes y volúmenes (desarrollo y VPS)
---
flowchart LR
    subgraph HOST["Nodo único · Docker Engine"]
        subgraph RED_INTERNA["red deploya_interna"]
            PG[("postgres:16<br/>:5432 · volumen deploya_pg")]
            RD[("redis:7<br/>:6379")]
            API["api<br/>Dockerfile.api · node dist/main.js<br/>:3001 → 3000"]
            WK["worker<br/>Dockerfile.api · node dist/trabajador.js<br/>git + docker.sock"]
            WEB["web<br/>Dockerfile.web<br/>:3000"]
            MP["mailpit<br/>:1025 SMTP · :8025 UI"]
            TR["traefik:v3<br/>:80 (:443 y redirección 80→443 en el VPS)"]
        end

        subgraph RED_P1["red deploya-p-hola-deploya"]
            C1["deploya-hola-deploya-3<br/>imagen deploya/hola-deploya:3<br/>NanoCpus 0.25e9 · Memory 256 MiB<br/>sin privilegios · CapDrop ALL"]
        end

        subgraph RED_P2["red deploya-p-api-tienda"]
            C2["deploya-api-tienda-14"]
        end

        SOCK["/var/run/docker.sock"]
        VOL["volumen traefik_dinamico<br/>/traefik/dinamico/*.yml"]
        ACME[("volumen traefik_acme<br/>/acme/acme.json · solo VPS")]
    end

    subgraph EXTERNOS["Solo en el VPS (docker-compose.vps.yml)"]
        LE["Let's Encrypt<br/>certificado comodín *.deploya.app"]
        DNS["Proveedor DNS<br/>registros A · desafío DNS-01<br/>token solo de la zona"]
        SMTP["Proveedor SMTP<br/>Resend o Brevo · SPF y DKIM"]
    end

    NAV["Navegador"]

    NAV -->|"localhost:3000"| WEB
    NAV -->|"localhost:3001"| API
    NAV -->|"hola-deploya.localhost"| TR
    NAV -->|"localhost:8025 (sin Mailpit en el VPS)"| MP
    NAV -->|"https://deploya.app · https://api.deploya.app · https://hola-deploya.deploya.app"| TR
    TR -->|"emite y renueva por DNS-01"| LE
    LE -->|"verifica el TXT"| DNS
    TR -->|"escribe"| ACME
    API -->|"lee solo el vencimiento"| ACME
    API -->|"SMTP del proveedor"| SMTP
    API --> PG
    API --> RD
    API -->|SMTP| MP
    WK --> RD
    WK --> PG
    WK --> SOCK
    WK -->|escribe| VOL
    TR -->|"vigila"| VOL
    TR -->|"conectado por el worker"| RED_P1
    TR --> RED_P2
    WK -.->|"salud HTTP · conectado por el worker"| RED_P1

    classDef data fill:#fefce8,stroke:#facc15,stroke-width:2px,color:#713f12
    classDef app fill:#f5f3ff,stroke:#a78bfa,stroke-width:2px,color:#312e81
    classDef cliente fill:#f0fdf4,stroke:#4ade80,stroke-width:2px,color:#166534
    classDef ext fill:#f0f9ff,stroke:#38bdf8,stroke-width:2px,color:#0c4a6e
    class PG,RD,VOL,ACME data
    class API,WK,WEB,MP,TR app
    class C1,C2 cliente
    class SOCK,NAV,LE,DNS,SMTP ext
```

### Entornos

| Entorno | Cómo se levanta | Motor | Correo | Dominio |
|---|---|---|---|---|
| Pruebas unitarias y CI | `pnpm test` | En memoria | Consola | — |
| Desarrollo | `docker compose up` | Docker real | Mailpit | `http://<proyecto>.localhost` |
| VPS (demostración) | `scripts/desplegar-vps.sh` | Docker real | Proveedor SMTP | `https://<proyecto>.deploya.app` con comodín |
| Autoalojado | `scripts/instalar.sh` | Docker real | El que configure el administrador | El dominio de quien instala |

## Diseño de la interfaz

La web sigue el **design system Deploya v4.1** (`docs/diseno/`), el mismo con el que está hecho este documento. Sus reglas tienen consecuencias de diseño concretas:

| Principio | Qué significa en la interfaz |
|---|---|
| **Sobrio en la forma, vivo en el estado** | La personalidad está en cómo se ve lo que pasa: el riel de cinco etapas y el cursor de la bitácora |
| **Claro por defecto**, oscuro siempre disponible | Toggle en el encabezado; cada pantalla se revisa en ambos |
| **Neutros cálidos y una sola tinta** | Papel en claro y grafito en oscuro; nada de paletas por módulo |
| **Señal = lo que está en curso** | El azul solo marca la etapa actual, *Construyendo*, lo no leído y el foco |
| **Bordes antes que sombras** | La sombra se reserva para diálogos y menús |
| **Geist para hablar, Geist Mono para medir** | Hashes, dominios, variables, puertos y tiempos van en monoespaciada |
| **Informa, no decora** | Sin gradientes ni emoji; ilustraciones solo en las pantallas de acceso |

Los tokens se definen una vez en `apps/web/src/app/globals.css` en OKLCH (colores perceptualmente uniformes) y los componentes viven en `apps/web/src/components`, con un catálogo vivo en `/sistema`. La interfaz tiene **45 fichas de pantalla** (una por artboard del canvas), y cada estado lleva palabra e icono, nunca solo color.

| Token | Uso | Muestra |
|---|---|---|
| `foreground` / `primary` | Tinta y botón principal | <span class="estado neutro">Tinta</span> |
| `signal` | Solo lo que está en curso | <span class="estado curso">Construyendo</span> |
| `ok` | Saludable, Activa | <span class="estado ok">Saludable</span> |
| `warn` | Por vencer, Vencida, límite cerca | <span class="estado warn">Por vencer</span> |
| `bad` | Fallido, Suspendida, errores | <span class="estado bad">Fallido</span> |

## Decisiones de arquitectura

Cada decisión grande tiene su registro con contexto, alternativas y consecuencias (formato de Michael Nygard) en `docs/adr/`.

| ADR | Decisión | Alternativa descartada principal |
|---|---|---|
| [0001](../adr/0001-correo-por-smtp-configurable.md) | Correo por un adaptador SMTP configurable; Mailpit solo en desarrollo | Un SDK por proveedor |
| [0002](../adr/0002-cola-bullmq-y-trabajador-aparte.md) | Cola BullMQ y un trabajador aparte con la misma imagen | Construir dentro de la API |
| [0003](../adr/0003-construccion-dockerfile-o-receta.md) | `Dockerfile` del repositorio o receta por stack detectado | Buildpacks (Nixpacks, Paketo) |
| [0004](../adr/0004-versionado-y-reversion-sin-reconstruir.md) | Artefactos inmutables y reversión sin reconstruir, retención de 5 | Registro de imágenes aparte |
| [0005](../adr/0005-traefik-proveedor-de-archivo.md) | Traefik v3 con proveedor de archivo y una red por proyecto | Etiquetas de Docker |
| [0006](../adr/0006-polling-en-vez-de-websocket.md) | *Polling* cada 3 s en vez de WebSocket o SSE | WebSocket |
| [0007](../adr/0007-certificado-comodin-por-dns-01.md) | Certificado comodín por DNS-01 | HTTP-01 por proyecto |
| [0008](../adr/0008-autoalojado-y-codigo-abierto.md) | Código abierto (AGPL-3.0) y autoalojado por Strategy de puertos | Un fork para autoalojado |
| [0009](../adr/0009-monolito-modular-hexagonal.md) | Monolito modular hexagonal y TypeScript de punta a punta | Microservicios |

## Calidad y pruebas

<div class="metricas">
<div class="metrica"><b>1 069</b><span>pruebas de la API en 146 suites</span></div>
<div class="metrica"><b>272</b><span>pruebas de lógica de la web</span></div>
<div class="metrica"><b>96.8 %</b><span>líneas cubiertas en la API</span></div>
<div class="metrica"><b>42</b><span>changes de OpenSpec archivados</span></div>
</div>

| Nivel | Herramienta | Qué cubre |
|---|---|---|
| Unitarias de dominio y servicios | Jest + `@nestjs/testing` | Un `it(...)` por escenario del spec, con puertos dobles y `Reloj` falso |
| Contratos de adaptadores | Jest | Stub y real con los mismos métodos (`contratos-stubs.spec.ts`) |
| Lógica de la web | `node --test` | Formato, validaciones, fusión de bitácora, acciones por fila |
| *Smoke* de compose | GitHub Actions + `e2e/smoke.mjs` | La plataforma completa arranca y responde |
| Recorrido e2e | `e2e/recorrido.mjs` (QA-01, se suma en esta entrega) | Registro → verificación → sesión → plan → proyecto → despliegue, y sus negativos |
| Seguridad del repositorio | `gitleaks`, `shellcheck` | Sin secretos en el historial; scripts del instalador sin errores |

Cada PR corre el job **Build y pruebas** (pruebas, build y validación de diagramas), **Secretos**, **Scripts** y **Smoke compose**. Nada entra a `main` sin pasar por PR y por la revisión del dueño del módulo (`CODEOWNERS`).
