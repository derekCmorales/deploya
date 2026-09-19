# Arquitectura de Deploya

Lectura corta (C4 + ciclo). Anexo largo: [arquitectura-maestro.md](arquitectura-maestro.md). Producto: [propuesta.md](propuesta.md). Auditoría de nombres: [AUDITORIA_SOLID_CLEAN.md](AUDITORIA_SOLID_CLEAN.md).

Archivos Mermaid únicos: [diagramas/compartido/](diagramas/compartido/).

## Qué es

PaaS de alojamiento: el cliente pasa de un repositorio o un archivo comprimido a una aplicación en línea, con subdominio y certificado HTTPS, sin escribir infraestructura.

Arquitectura: **monolito modular** (NestJS + Next.js) con **trabajadores asíncronos**. PostgreSQL, Redis, Docker, enrutador de borde con TLS automático.

La API no invoca Docker ni el enrutador: pide la operación a adaptadores (`ContenedorPuerto`, `EnrutamientoPuerto`, `VerificacionEntornoPuerto`). Sin prefijo `I`.

## Ciclo de despliegue (§3.2)

Cada despliegue produce un **artefacto versionado e inmutable**. Revertir es levantar un artefacto ya construido; no reconstruir.

| Etapa | Responsable | Resultado |
|---|---|---|
| Recepción | API de control | Se registra el despliegue y se encola la construcción |
| Construcción | Trabajador M4 | Stack detectado e imagen versionada |
| Ejecución | Orquestador M5 | Contenedor con límites de CPU y memoria |
| Enrutamiento | Enrutador M6 | Subdominio, TLS, conmutación de tráfico |
| Operación | Observabilidad M7 | Bitácoras y métricas al panel |

**Estados de despliegue** (no son los de suscripción): Encolado, Construyendo, Aprovisionando, Publicando, Saludable, Fallido, Revirtiendo, Detenido. Diagrama: [m4-m5-m6-estados-despliegue.mmd](diagramas/m1-m10/m4-m5-m6-estados-despliegue.mmd).

**Estados de suscripción** (§4.4): Activa, Por vencer, Vencida, Suspendida, Cancelada. Diagrama: [m2-estados-suscripcion.mmd](diagramas/m1-m10/m2-estados-suscripcion.mmd).

## C4 nivel 1 — contexto

Fuente: [diagramas/compartido/c4-contexto.mmd](diagramas/compartido/c4-contexto.mmd).

```mermaid
---
title: C4 Nivel 1 — Contexto de Deploya
---
flowchart TB
    subgraph ACTORES["Actores"]
        CLIENTE["Cliente"]
        ADMIN["Administrador"]
        OPERADOR["Operador de infraestructura"]
        SOPORTE["Soporte técnico"]
    end

    DEPLOYA["Deploya<br/>PaaS de alojamiento web<br/>panel, API, motor de despliegue"]

    subgraph EXTERNOS["Sistemas externos"]
        GIT["Proveedor de repositorios<br/>código fuente"]
        NUBE["Motor de contenedores<br/>nodo Docker / nube"]
        DNS["Proveedor DNS<br/>registro comodín"]
        CA["Autoridad certificadora<br/>certificados TLS"]
        CORREO["Correo transaccional"]
        PAGOS["Pasarela de pagos<br/>simulada"]
        LLM["Proveedor de modelo<br/>de lenguaje"]
    end

    CLIENTE --> DEPLOYA
    ADMIN --> DEPLOYA
    OPERADOR --> DEPLOYA
    SOPORTE --> DEPLOYA

    DEPLOYA --> GIT
    DEPLOYA --> NUBE
    DEPLOYA --> DNS
    DEPLOYA --> CA
    DEPLOYA --> CORREO
    DEPLOYA --> PAGOS
    DEPLOYA --> LLM
```

## C4 nivel 2 — contenedores

Fuente: [diagramas/compartido/c4-contenedores.mmd](diagramas/compartido/c4-contenedores.mmd).

```mermaid
---
title: C4 Nivel 2 — Contenedores de Deploya
---
flowchart TB
    CLIENTE["Cliente / Administrador /<br/>Operador / Soporte"]

    subgraph DEPLOYA["Deploya — monolito modular con trabajadores"]
        WEB["Interfaz web<br/>Next.js"]
        API["API de control<br/>NestJS<br/>M1–M3, M8, M9, M10"]
        MOTOR["Motor de despliegue<br/>trabajadores M4 M5 M6"]
        HERR["Capa de herramientas M8<br/>asistente e integración"]
        OBS["Observabilidad M7<br/>métricas y bitácoras en vivo"]
        COLA["Cola y caché<br/>Redis"]
        BD[("PostgreSQL")]
    end

    NUBE["Motor de contenedores<br/>Docker"]
    EDGE["Enrutador de borde<br/>TLS automático"]
    GIT["Proveedor de repositorios"]
    CORREO["Correo transaccional"]
    PAGOS["Pasarela de pagos simulada"]
    LLM["Modelo de lenguaje"]

    CLIENTE --> WEB
    WEB --> API
    API --> BD
    API --> COLA
    API --> HERR
    API --> OBS
    MOTOR --> COLA
    MOTOR --> BD
    MOTOR --> NUBE
    MOTOR --> EDGE
    OBS --> COLA
    HERR --> API
    HERR --> LLM
    API --> CORREO
    API --> PAGOS
    API --> GIT
    EDGE --> NUBE
```

## C4 nivel 3 — motor (M4–M6)

Fuente: [diagramas/compartido/c4-componentes-motor.mmd](diagramas/compartido/c4-componentes-motor.mmd). La API depende de puertos; Docker y el borde viven detrás de adaptadores.

## Módulos (§6.1) y dueños

| Id | Módulo | Dueño | Código |
|---|---|---|---|
| M1 | Identidad y acceso | Eddy | `apps/api/src/modules/identidad` |
| M2 | Suscripciones y pagos | Javier | `apps/api/src/modules/suscripciones` |
| M3 | Proyectos y fuentes | Eduardo | `apps/api/src/modules/proyectos` |
| M4 | Motor de construcción | Derek | `apps/api/src/modules/construccion` |
| M5 | Orquestación y ejecución | Derek | `apps/api/src/modules/orquestacion` |
| M6 | Enrutamiento y TLS | Derek | `apps/api/src/modules/enrutamiento` |
| M7 | Observabilidad | Eduardo | `apps/api/src/modules/observabilidad` |
| M8 | Asistente e integración | Derek (tools) / Eduardo (UI) | `apps/api/src/modules/herramientas` |
| M9 | Administración | Javier | `apps/api/src/modules/administracion` |
| M10 | Notificaciones | Eddy | `apps/api/src/modules/notificaciones` |

## Sistema de diseño

Canon: [kit-visual.md](kit-visual.md). Geist, tokens claro/oscuro (toggle), acento cian/teal, primitivos shadcn + Lucide, grafo `@xyflow/react`. Las pantallas en `apps/web` **validan** el kit con mock; cada módulo construye su dominio encima, sin paleta propia.

## Fuera de alcance (no implementar)

Microservicios, escalado horizontal, CDN, cobro con dinero real, CLI/desktop, previews por PR.
