> Anexo largo. Lectura corta: [arquitectura.md](arquitectura.md).

# Documento maestro — Arquitectura de Deploya

> Insumo para el documento formal de diseño (otro agente). Diagramas Mermaid **embebidos**, no solo enlaces.
> Fuente de producto: `00_GUIA_GENERAL_Propuesta_Deploya.md`. Originales de compañeros intactos; este maestro usa versiones pulidas (sin prefijo `I`, español de la propuesta).
> ERD y clases: **un solo artefacto** cada uno (`DEPLOYA_erd_unificado.mmd`, `DEPLOYA_diagrama_clases_unificado.mmd`).

## Índice

1. Qué es Deploya
2. Arquitectura C4
3. Capa de herramientas M8
4. UML por módulo (compañeros, nombres corregidos)
5. Sistema de diseño (en curso)
6. ERD unificado
7. Diagrama de clases unificado
8. Estados
9. Secuencias
10. Actividades
11. Auditoría resumida
12. Extracto de la propuesta (módulos y estados)

---

## 1. Qué es Deploya

Deploya es una plataforma como servicio (PaaS) orientada al alojamiento de aplicaciones y sitios web. Un desarrollador pasa de un repositorio (o un archivo comprimido) a una aplicación en línea, con subdominio y certificado HTTPS, sin escribir configuración de infraestructura ni administrar servidores.

Recorrido (§3.1): registro y verificación de correo → contratación de plan (pago simulado) → alta de proyecto → construcción encolada → contenedor aislado con HTTPS → métricas, reinicio, variables, nuevo despliegue o reversión.

Arquitectura (§7): **monolito modular** (NestJS + Next.js) con **trabajadores asíncronos**. La API no invoca Docker ni el enrutador de borde: pide la operación a adaptadores (`ContenedorPuerto`, `EnrutamientoPuerto`, `VerificacionEntornoPuerto`). Stack: PostgreSQL, Redis, Docker, enrutador de borde con TLS automático.

Ciclo de despliegue (§3.2): **Recepción → Construcción → Ejecución → Enrutamiento → Operación**. Cada despliegue produce un **artefacto versionado e inmutable**. La reversión levanta un artefacto ya construido; no reconstruye.

---

## 2. Arquitectura C4

### 2.1 Contexto (nivel 1)

Actores: Cliente, Administrador, Operador de infraestructura, Soporte técnico.
Externos: Git, motor de contenedores, DNS, autoridad certificadora, correo, pasarela simulada, modelo de lenguaje (M8).


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

    classDef actor fill:#eef2ff,stroke:#818cf8,stroke-width:2px,color:#1e1b4b
    classDef sistema fill:#f5f3ff,stroke:#a78bfa,stroke-width:2px,color:#312e81
    classDef externo fill:#f0f9ff,stroke:#38bdf8,stroke-width:2px,color:#0c4a6e
    class CLIENTE,ADMIN,OPERADOR,SOPORTE actor
    class DEPLOYA sistema
    class GIT,NUBE,DNS,CA,CORREO,PAGOS,LLM externo
```

### 2.2 Contenedores (nivel 2)

Web Next.js, API NestJS, motor de despliegue (trabajadores M4–M6), capa de herramientas M8, observabilidad M7, Redis, PostgreSQL. Fuera: Docker, enrutador de borde, Git, correo, pagos, LLM.


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

    classDef persona fill:#eef2ff,stroke:#818cf8,stroke-width:2px,color:#1e1b4b
    classDef app fill:#f5f3ff,stroke:#a78bfa,stroke-width:2px,color:#312e81
    classDef data fill:#fefce8,stroke:#facc15,stroke-width:2px,color:#713f12
    classDef ext fill:#f0f9ff,stroke:#38bdf8,stroke-width:2px,color:#0c4a6e
    class CLIENTE persona
    class WEB,API,MOTOR,HERR,OBS app
    class COLA,BD data
    class NUBE,EDGE,GIT,CORREO,PAGOS,LLM ext
```

### 2.3 Componentes del motor (nivel 3)

El contenedor «motor» se descompone en M4 (cola, detector, constructor, registro de artefactos), M5 (orquestador, límites, reversión) y M6 (subdominio, TLS, conmutación). Puertos sin prefijo `I`.


```mermaid
---
title: C4 Nivel 3 — Componentes del motor de despliegue
---
flowchart TB
    API["API de control"]

    subgraph M4["M4 Motor de construcción"]
        COLA_C["Consumidor de cola<br/>de construcción"]
        DETECTOR["Detector de stack"]
        CONSTRUCTOR["Constructor de imágenes"]
        REGISTRO["Registro de artefactos<br/>versionados e inmutables"]
    end

    subgraph M5["M5 Orquestación y ejecución"]
        ORQ["Orquestador de contenedores"]
        LIMITES["Aplicador de límites<br/>CPU memoria procesos"]
        REVERSION["Reversión de versión"]
    end

    subgraph M6["M6 Enrutamiento y TLS"]
        SUBDOM["Asignador de subdominio"]
        CERT["Gestor de certificados TLS"]
        TRAFICO["Conmutador de tráfico"]
        DOMINIO["Dominios personalizados"]
    end

    subgraph PUERTOS["Capa de adaptadores — la API no llama a Docker"]
        P_FUENTE["ProveedorFuente"]
        P_CONT["ContenedorPuerto"]
        P_RUTA["EnrutamientoPuerto"]
        P_SALUD["VerificacionEntornoPuerto"]
    end

    subgraph M8["M8 Capa de herramientas"]
        HERR["CapaHerramientas<br/>consultar desplegar bitácoras<br/>métricas revertir variables"]
    end

    DOCKER["Docker"]
    EDGE["Enrutador de borde"]
    GIT["Repositorio / archivo comprimido"]
    NOTIF["M10 Notificaciones"]
    OBS["M7 Observabilidad"]

    API --> COLA_C
    API --> HERR
    COLA_C --> DETECTOR
    DETECTOR --> CONSTRUCTOR
    CONSTRUCTOR --> REGISTRO
    REGISTRO --> ORQ
    ORQ --> LIMITES
    ORQ --> REVERSION
    ORQ --> SUBDOM
    SUBDOM --> CERT
    CERT --> TRAFICO
    TRAFICO --> DOMINIO

    DETECTOR --> P_FUENTE
    P_FUENTE --> GIT
    LIMITES --> P_CONT
    ORQ --> P_CONT
    REVERSION --> P_CONT
    P_CONT --> DOCKER
    SUBDOM --> P_RUTA
    CERT --> P_RUTA
    TRAFICO --> P_RUTA
    P_RUTA --> EDGE
    ORQ --> P_SALUD
    P_SALUD --> DOCKER

    ORQ --> NOTIF
    COLA_C --> NOTIF
    ORQ --> OBS
    HERR --> API

    classDef mod fill:#f5f3ff,stroke:#a78bfa,stroke-width:2px,color:#312e81
    classDef port fill:#fff7ed,stroke:#fb923c,stroke-width:2px,color:#7c2d12
    classDef ext fill:#f0f9ff,stroke:#38bdf8,stroke-width:2px,color:#0c4a6e
    class COLA_C,DETECTOR,CONSTRUCTOR,REGISTRO,ORQ,LIMITES,REVERSION,SUBDOM,CERT,TRAFICO,DOMINIO,HERR,API mod
    class P_FUENTE,P_CONT,P_RUTA,P_SALUD port
    class DOCKER,EDGE,GIT,NOTIF,OBS ext
```

### 2.4 Componentes M4–M6 (detalle de servicios)


```mermaid
---
title: Componentes M4 M5 M6 — motor de despliegue
---
flowchart TB
    UI["Interfaz web Next.js"]

    subgraph API["Capa de entrada"]
        DEP_CTRL["Controlador de despliegues"]
        ENV_CTRL["Controlador de entornos"]
        DOM_CTRL["Controlador de dominios"]
    end

    subgraph M4["M4 Motor de construcción"]
        COLA_TRABAJO["Servicio de cola de trabajos"]
        DETECTOR["Servicio detector de stack"]
        CONSTRUCTOR["Servicio constructor de imágenes"]
        ARTEFACTOS["Servicio de artefactos"]
    end

    subgraph M5["M5 Orquestación y ejecución"]
        ORQ["Servicio de orquestación"]
        CUOTA_CTR["Servicio de límites de contenedor"]
        REV["Servicio de reversión"]
    end

    subgraph M6["M6 Enrutamiento y TLS"]
        SUB["Servicio de subdominios"]
        TLS["Servicio de certificados"]
        CUT["Servicio de conmutación de tráfico"]
    end

    subgraph ADAPTADORES["Adaptadores"]
        P_FUENTE["ProveedorFuente"]
        P_CONT["ContenedorPuerto"]
        P_RUTA["EnrutamientoPuerto"]
        P_SALUD["VerificacionEntornoPuerto"]
    end

    BD[("PostgreSQL")]
    REDIS[("Redis")]
    DOCKER["Docker"]
    EDGE["Enrutador de borde"]
    GIT["Repositorio o archivo comprimido"]
    M2["M2 Cuotas del plan"]
    M7["M7 Observabilidad"]
    M10["M10 Notificaciones"]

    UI --> DEP_CTRL
    UI --> ENV_CTRL
    UI --> DOM_CTRL

    DEP_CTRL --> COLA_TRABAJO
    DEP_CTRL --> ORQ
    DEP_CTRL --> REV
    ENV_CTRL --> ORQ
    DOM_CTRL --> SUB
    DOM_CTRL --> TLS

    COLA_TRABAJO --> REDIS
    COLA_TRABAJO --> DETECTOR
    DETECTOR --> P_FUENTE
    P_FUENTE --> GIT
    DETECTOR --> CONSTRUCTOR
    CONSTRUCTOR --> ARTEFACTOS
    ARTEFACTOS --> BD
    ARTEFACTOS --> ORQ

    ORQ --> CUOTA_CTR
    CUOTA_CTR --> M2
    ORQ --> P_CONT
    REV --> P_CONT
    P_CONT --> DOCKER
    ORQ --> P_SALUD
    ORQ --> SUB
    SUB --> TLS
    TLS --> CUT
    CUT --> P_RUTA
    P_RUTA --> EDGE

    ORQ --> M7
    ORQ --> M10
    COLA_TRABAJO --> M10
    COLA_TRABAJO --> BD
    ORQ --> BD

    classDef entry fill:#eef2ff,stroke:#818cf8,stroke-width:2px
    classDef m4 fill:#f5f3ff,stroke:#a78bfa,stroke-width:2px
    classDef m5 fill:#fff7ed,stroke:#fb923c,stroke-width:2px
    classDef m6 fill:#f0fdfa,stroke:#2dd4bf,stroke-width:2px
    classDef port fill:#fdf4ff,stroke:#e879f9,stroke-width:2px
    classDef data fill:#fefce8,stroke:#facc15,stroke-width:2px
    class DEP_CTRL,ENV_CTRL,DOM_CTRL entry
    class COLA_TRABAJO,DETECTOR,CONSTRUCTOR,ARTEFACTOS m4
    class ORQ,CUOTA_CTR,REV m5
    class SUB,TLS,CUT m6
    class P_FUENTE,P_CONT,P_RUTA,P_SALUD port
    class BD,REDIS data
```

---

## 3. Capa de herramientas M8 (§9.3, §10.3)

Derek integra M4–M6 **y** la capa de herramientas de M8. Misma superficie para el asistente del panel y para clientes externos. Hereda permisos del usuario; operaciones destructivas piden confirmación humana; bitácoras y repositorios son entrada no confiable.


```mermaid
---
title: M8 Capa de herramientas — asistente e integración §9.3 §10.3
---
flowchart TB
    PANEL["Asistente en el panel"]
    EXT["Cliente externo<br/>protocolo abierto"]

    HERR["CapaHerramientas<br/>misma superficie para ambos"]

    subgraph OPS["Operaciones"]
        OP1["Consultar proyectos"]
        OP2["Desplegar"]
        OP3["Obtener bitácoras"]
        OP4["Obtener métricas"]
        OP5["Revertir versión"]
        OP6["Gestionar variables"]
    end

    API["API de control<br/>hereda permisos del usuario"]
    LLM["Proveedor de modelo de lenguaje"]
    CONF["Confirmación humana<br/>en operaciones destructivas"]

    PANEL --> HERR
    EXT --> HERR
    PANEL --> LLM
    HERR --> OP1
    HERR --> OP2
    HERR --> OP3
    HERR --> OP4
    HERR --> OP5
    HERR --> OP6
    OP1 --> API
    OP2 --> API
    OP3 --> API
    OP4 --> API
    OP5 --> API
    OP6 --> API
    OP2 --> CONF
    OP5 --> CONF

    classDef ext fill:#f0f9ff,stroke:#38bdf8,stroke-width:2px
    classDef core fill:#f5f3ff,stroke:#a78bfa,stroke-width:2px
    classDef op fill:#f0fdfa,stroke:#2dd4bf,stroke-width:2px
    class PANEL,EXT,LLM ext
    class HERR,API,CONF core
    class OP1,OP2,OP3,OP4,OP5,OP6 op
```

---

## 4. UML por módulo (compañeros, ya corregido)

Los `.mmd` originales no se borran. Aquí va la versión pulida de clases (sin `I`) y el resto de diagramas de compañeros tal cual, salvo que el original ya estaba limpio.

### 4.1 M1 Identidad y acceso + M10 Notificaciones

#### Casos de uso de autenticación


```mermaid
---
config:
  layout: fixed
---
flowchart LR
 subgraph DEPLOYA["."]
        REG(("Registrarse"))
        VERIFY(("Verificar correo"))
        LOGIN(("Iniciar sesión"))
        LOGOUT(("Cerrar sesión"))
        RECOVERY(("Recuperar contraseña"))
        RESET(("Restablecer contraseña"))
        PROFILE(("Consultar perfil"))
        SESSION(("Gestionar sesiones"))
        ACCESS(("Acceder según rol"))
        VALID_REG(("Validar datos de registro"))
        SEND_VERIFY(("Enviar correo de verificación"))
        VALID_TOKEN_VERIFY(("Validar token de verificación"))
        VALID_CREDENTIALS(("Validar credenciales"))
        CREATE_SESSION(("Crear sesión"))
        VALID_PERMISSION(("Validar permisos"))
        GENERATE_RESET(("Generar token de recuperación"))
        SEND_RESET(("Enviar enlace de recuperación"))
        VALID_RESET_TOKEN(("Validar token de recuperación"))
        UPDATE_PASSWORD(("Actualizar contraseña"))
        AUDIT(("Registrar evento de auditoría"))
        RESEND_VERIFY(("Reenviar correo de verificación"))
        NEW_RECOVERY(("Solicitar nuevo enlace de recuperación"))
  end
    CLIENTE["👤 Cliente"] --- REG & VERIFY & LOGIN & LOGOUT & RECOVERY & RESET & PROFILE & SESSION & ACCESS
    ADMIN["👤 Administrador"] --- LOGIN & LOGOUT & SESSION & ACCESS
    OPERADOR["👤 Operador de infraestructura"] --- LOGIN & LOGOUT & SESSION & ACCESS
    SOPORTE["👤 Soporte técnico"] --- LOGIN & LOGOUT & SESSION & ACCESS
    REG -. include .-> VALID_REG & SEND_VERIFY & AUDIT
    VERIFY -. include .-> VALID_TOKEN_VERIFY & AUDIT
    LOGIN -. include .-> VALID_CREDENTIALS & CREATE_SESSION & AUDIT
    LOGOUT -. include .-> AUDIT
    ACCESS -. include .-> VALID_PERMISSION
    RECOVERY -. include .-> GENERATE_RESET & SEND_RESET & AUDIT
    RESET -. include .-> VALID_RESET_TOKEN & UPDATE_PASSWORD & AUDIT
    RESEND_VERIFY -. extend .-> VERIFY
    NEW_RECOVERY -. extend .-> RECOVERY

    linkStyle 0 stroke:#FFD600,fill:none
    linkStyle 1 stroke:#FFD600,fill:none
    linkStyle 2 stroke:#FFD600,fill:none
    linkStyle 3 stroke:#FFD600,fill:none
    linkStyle 4 stroke:#FFD600,fill:none
    linkStyle 5 stroke:#FFD600,fill:none
    linkStyle 6 stroke:#FFD600,fill:none
    linkStyle 7 stroke:#FFD600,fill:none
    linkStyle 8 stroke:#FFD600,fill:none
    linkStyle 9 stroke:#FF6D00,fill:none
    linkStyle 10 stroke:#FF6D00,fill:none
    linkStyle 11 stroke:#FF6D00,fill:none
    linkStyle 12 stroke:#FF6D00,fill:none
    linkStyle 13 stroke:#00C853,fill:none
    linkStyle 14 stroke:#00C853,fill:none
    linkStyle 15 stroke:#00C853,fill:none
    linkStyle 16 stroke:#00C853,fill:none
    linkStyle 17 stroke:#2962FF,fill:none
    linkStyle 18 stroke:#2962FF,fill:none
    linkStyle 19 stroke:#2962FF,fill:none
    linkStyle 20 stroke:#2962FF
```

#### Componentes M1 + M10

El puerto de correo ya no lleva prefijo `I`. En el unificado se nombra `CorreoPuerto`.


```mermaid
---
config:
  layout: elk
---
flowchart TB
    USER["Usuario"] --> UI["Interfaz web<br/>Next.js"]

    subgraph DEPLOYA["."]
        direction TB

        subgraph API["Capa de entrada"]
            direction LR
            ACCOUNT_CTRL["Controlador de cuentas"]
            AUTH_CTRL["Controlador de autenticación"]
            SESSION_CTRL["Controlador de sesiones"]
            RECOVERY_CTRL["Controlador de recuperación"]
            VERIFY_CTRL["Controlador de verificación"]
        end

        subgraph M1["M1 · Identidad y acceso"]
            direction TB
            ACCOUNT["Servicio de cuentas"]
            AUTH["Servicio de autenticación"]
            SESSION["Servicio de sesiones"]
            AUTHZ["Servicio de autorización"]
            RECOVERY["Servicio de recuperación"]
            VERIFY["Servicio de verificación"]
            AUDIT["Servicio de auditoría"]
        end

        subgraph M10["M10 · Notificaciones"]
            direction TB
            NOTIFICATION["Servicio de notificaciones"]
            EMAIL_PORT["Puerto de correo"]
        end

        subgraph ADAPTERS["Capa de adaptadores"]
            direction TB
            EMAIL_ADAPTER["Adaptador de proveedor<br/>de correo"]
        end

        DB[("PostgreSQL")]
    end

    EMAIL["Servicio externo<br/>de correo"]

    UI --> ACCOUNT_CTRL
    UI --> AUTH_CTRL
    UI --> SESSION_CTRL
    UI --> RECOVERY_CTRL
    UI --> VERIFY_CTRL

    ACCOUNT_CTRL --> ACCOUNT
    AUTH_CTRL --> AUTH
    SESSION_CTRL --> SESSION
    RECOVERY_CTRL --> RECOVERY
    VERIFY_CTRL --> VERIFY

    AUTH --> SESSION
    AUTH --> AUTHZ

    ACCOUNT --> AUDIT
    AUTH --> AUDIT
    SESSION --> AUDIT
    RECOVERY --> AUDIT
    VERIFY --> AUDIT

    ACCOUNT --> DB
    AUTH --> DB
    SESSION --> DB
    AUTHZ --> DB
    RECOVERY --> DB
    VERIFY --> DB
    AUDIT --> DB

    ACCOUNT --> NOTIFICATION
    VERIFY --> NOTIFICATION
    RECOVERY --> NOTIFICATION

    NOTIFICATION --> EMAIL_PORT
    EMAIL_PORT --> EMAIL_ADAPTER
    EMAIL_ADAPTER --> EMAIL

    classDef external fill:#f0f9ff,stroke:#38bdf8,stroke-width:2px;
    classDef entry fill:#eef2ff,stroke:#818cf8,stroke-width:2px;
    classDef identity fill:#f5f3ff,stroke:#a78bfa,stroke-width:2px;
    classDef notification fill:#f0fdfa,stroke:#2dd4bf,stroke-width:2px;
    classDef adapter fill:#fff7ed,stroke:#fb923c,stroke-width:2px;
    classDef data fill:#fefce8,stroke:#facc15,stroke-width:2px;

    class USER,UI,EMAIL external;
    class ACCOUNT_CTRL,AUTH_CTRL,SESSION_CTRL,RECOVERY_CTRL,VERIFY_CTRL entry;
    class ACCOUNT,AUTH,SESSION,AUTHZ,RECOVERY,VERIFY,AUDIT identity;
    class NOTIFICATION,EMAIL_PORT notification;
    class EMAIL_ADAPTER adapter;
    class DB data;
```

#### Actividad: registro


```mermaid
---
config:
  layout: fixed
---
flowchart TB
    START(("Inicio")) --> A["Usuario selecciona<br>Registrarse"]
    A --> B["Ingresar correo<br>y contraseña"]
    B --> C["Enviar solicitud<br>de registro"]
    C --> D{"¿Datos válidos?"}
    D -- No --> E["Mostrar errores<br>de validación"]
    E --> B
    D -- Sí --> F["Verificar si el<br>correo ya existe"]
    F --> G{"¿Correo registrado?"}
    G -- Sí --> H["Informar que la cuenta<br>ya existe"]
    H --> END1(("Fin"))
    G -- No --> I["Crear cuenta<br>en estado pendiente"]
    I --> J["Generar token temporal<br>de verificación"]
    J --> K["Enviar correo<br>de verificación"]
    K --> L["Mostrar confirmación:<br>revisar correo"]
    L --> END2(("Fin"))

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
     J:::process
     K:::process
     L:::success
     END2:::startEnd
    classDef startEnd fill:#f5f3ff,stroke:#a78bfa,stroke-width:2px,color:#312e81
    classDef input fill:#eef2ff,stroke:#818cf8,stroke-width:2px,color:#1e1b4b
    classDef process fill:#f0fdfa,stroke:#2dd4bf,stroke-width:2px,color:#134e4a
    classDef decision fill:#fefce8,stroke:#facc15,stroke-width:2px,color:#713f12
    classDef error fill:#fff1f2,stroke:#fb7185,stroke-width:2px,color:#881337
    classDef success fill:#f0fdf4,stroke:#4ade80,stroke-width:2px,color:#166534
    linkStyle 4 stroke:#fb7185,stroke-width:2px,fill:none
    linkStyle 5 stroke:#fb7185,stroke-width:2px,fill:none
    linkStyle 6 stroke:#4ade80,stroke-width:2px,fill:none
    linkStyle 7 stroke:#4ade80,stroke-width:2px,fill:none
    linkStyle 8 stroke:#4ade80,stroke-width:2px,fill:none
    linkStyle 9 stroke:#4ade80,stroke-width:2px,fill:none
```

#### Actividad: verificación de correo


```mermaid
---
config:
  layout: elk
---
flowchart TD

    START((Inicio))

    A["Usuario recibe<br/>correo de verificación"]
    B["Seleccionar enlace<br/>de verificación"]
    C["Enviar token<br/>a la plataforma"]

    D["Buscar token"]
    E{"¿Token válido<br/>y vigente?"}

    F["Rechazar verificación"]
    G["Solicitar un nuevo<br/>enlace de verificación"]

    H["Activar cuenta"]
    I["Marcar token<br/>como utilizado"]
    J["Registrar evento<br/>de auditoría"]
    K["Confirmar cuenta<br/>verificada"]

    END1((Fin))
    END2((Fin))

    START --> A
    A --> B
    B --> C
    C --> D
    D --> E

    E -->|"No"| F
    F --> G
    G --> END1

    E -->|"Sí"| H
    H --> I
    I --> J
    J --> K
    K --> END2

    classDef startEnd fill:#f5f3ff,stroke:#a78bfa,stroke-width:2px,color:#312e81;
    classDef input fill:#eef2ff,stroke:#818cf8,stroke-width:2px,color:#1e1b4b;
    classDef process fill:#f0fdfa,stroke:#2dd4bf,stroke-width:2px,color:#134e4a;
    classDef decision fill:#fefce8,stroke:#facc15,stroke-width:2px,color:#713f12;
    classDef error fill:#fff1f2,stroke:#fb7185,stroke-width:2px,color:#881337;
    classDef success fill:#f0fdf4,stroke:#4ade80,stroke-width:2px,color:#166534;

    class START,END1,END2 startEnd;
    class A,B,C input;
    class D,H,I,J process;
    class E decision;
    class F,G error;
    class K success;

    linkStyle 5,6,7 stroke:#fb7185,stroke-width:2px;
    linkStyle 8,9,10,11,12 stroke:#4ade80,stroke-width:2px;
```

#### Actividad: recuperación de contraseña


```mermaid
---
config:
  layout: elk
---
flowchart TD

    START((Inicio))

    A["Usuario selecciona<br/>«Recuperar contraseña»"]
    B["Ingresar correo"]
    C["Enviar solicitud"]
    D["Buscar cuenta"]

    E{"¿Cuenta encontrada?"}

    F["Generar token temporal"]
    G["Almacenar token"]
    H["Enviar enlace<br/>de recuperación"]
    I["Mostrar respuesta<br/>genérica"]

    J["Usuario abre<br/>el enlace"]
    K["Validar token"]

    L{"¿Token válido<br/>y vigente?"}

    M["Rechazar solicitud"]
    N["Solicitar nueva<br/>recuperación"]

    O["Mostrar formulario<br/>de nueva contraseña"]
    P["Ingresar nueva contraseña"]
    Q["Actualizar credencial"]
    R["Invalidar token"]
    S["Registrar evento<br/>de auditoría"]
    T["Confirmar cambio"]

    END((Fin))

    START --> A
    A --> B
    B --> C
    C --> D
    D --> E

    E -->|"No"| I
    I --> J
    J --> K
    K --> L

    E -->|"Sí"| F
    F --> G
    G --> H
    H --> I

    L -->|"No"| M
    M --> N
    N --> END

    L -->|"Sí"| O
    O --> P
    P --> Q
    Q --> R
    R --> S
    S --> T
    T --> END

    classDef startEnd fill:#f5f3ff,stroke:#a78bfa,stroke-width:2px,color:#312e81;
    classDef userAction fill:#eef2ff,stroke:#818cf8,stroke-width:2px,color:#1e1b4b;
    classDef systemProcess fill:#f0fdfa,stroke:#2dd4bf,stroke-width:2px,color:#134e4a;
    classDef decision fill:#fefce8,stroke:#facc15,stroke-width:2px,color:#713f12;
    classDef error fill:#fff1f2,stroke:#fb7185,stroke-width:2px,color:#881337;
    classDef success fill:#f0fdf4,stroke:#4ade80,stroke-width:2px,color:#166534;

    class START,END startEnd;
    class A,B,C,J,O,P userAction;
    class D,F,G,H,I,K,Q,R,S systemProcess;
    class E,L decision;
    class M,N error;
    class T success;

    linkStyle 5,6,7,8 stroke:#38bdf8,stroke-width:2px;
    linkStyle 9,10,11 stroke:#4ade80,stroke-width:2px;
    linkStyle 12,13,14 stroke:#fb7185,stroke-width:2px;
    linkStyle 15,16,17,18,19,20,21,22 stroke:#4ade80,stroke-width:2px;
```

### 4.2 M2 Suscripciones y pagos + M9 Administración

#### Componentes M2 + M9


```mermaid
---
config:
  layout: elk
---
flowchart TB
    USER["Cliente"] --> UI["Interfaz web<br/>Next.js"]
    ADMIN_USER["Administrador"] --> UI

    subgraph DEPLOYA["."]
        direction TB

        subgraph API["Capa de entrada"]
            direction LR
            PLAN_CTRL["Controlador de planes"]
            SUB_CTRL["Controlador de suscripciones"]
            PAY_CTRL["Controlador de pagos"]
            ADMIN_CTRL["Controlador de administracion"]
        end

        subgraph M2["M2 · Suscripciones y pagos"]
            direction TB
            CATALOGO["Servicio de catalogo<br/>(planes y complementos)"]
            SUSCRIPCION["Servicio de suscripciones"]
            PAGOS["Servicio de pagos"]
            CUOTAS["Servicio de cuotas"]
            HISTORIAL["Servicio de historial<br/>de pagos"]
        end

        subgraph M9["M9 · Administracion"]
            direction TB
            ADMIN_USUARIOS["Servicio de administracion<br/>de usuarios"]
            ADMIN_PLANES["Servicio de administracion<br/>de planes"]
            ADMIN_INFRA["Servicio de estado<br/>de infraestructura"]
            ADMIN_AUDIT["Servicio de auditoria<br/>administrativa"]
        end

        subgraph ADAPTERS["Capa de adaptadores"]
            direction TB
            PAY_ADAPTER["Adaptador de pasarela<br/>de pagos (simulada)"]
        end

        DB[("PostgreSQL")]
    end

    M1_USUARIO["M1 · Identidad y acceso<br/>(Usuario, Rol)"]
    M5_ORQUESTA["M5 · Orquestacion<br/>(aplica limites al contenedor)"]
    M7_OBSERVA["M7 · Observabilidad<br/>(metricas y consumo)"]
    M10_NOTIF["M10 · Notificaciones"]

    UI --> PLAN_CTRL
    UI --> SUB_CTRL
    UI --> PAY_CTRL
    UI --> ADMIN_CTRL

    PLAN_CTRL --> CATALOGO
    SUB_CTRL --> SUSCRIPCION
    PAY_CTRL --> PAGOS
    ADMIN_CTRL --> ADMIN_USUARIOS
    ADMIN_CTRL --> ADMIN_PLANES
    ADMIN_CTRL --> ADMIN_INFRA

    SUSCRIPCION --> CATALOGO
    SUSCRIPCION --> CUOTAS
    SUSCRIPCION --> PAGOS
    PAGOS --> HISTORIAL
    PAGOS --> PAY_ADAPTER

    ADMIN_PLANES --> CATALOGO
    ADMIN_USUARIOS --> M1_USUARIO
    ADMIN_INFRA --> M5_ORQUESTA
    ADMIN_INFRA --> M7_OBSERVA

    CUOTAS --> M5_ORQUESTA
    SUSCRIPCION --> M10_NOTIF
    ADMIN_PLANES --> ADMIN_AUDIT
    ADMIN_USUARIOS --> ADMIN_AUDIT

    CATALOGO --> DB
    SUSCRIPCION --> DB
    PAGOS --> DB
    HISTORIAL --> DB
    ADMIN_AUDIT --> DB

    classDef external fill:#f0f9ff,stroke:#38bdf8,stroke-width:2px;
    classDef entry fill:#eef2ff,stroke:#818cf8,stroke-width:2px;
    classDef suscripciones fill:#f5f3ff,stroke:#a78bfa,stroke-width:2px;
    classDef administracion fill:#fff7ed,stroke:#fb923c,stroke-width:2px;
    classDef adapter fill:#fdf4ff,stroke:#e879f9,stroke-width:2px;
    classDef data fill:#fefce8,stroke:#facc15,stroke-width:2px;
    classDef otromodulo fill:#f1f5f9,stroke:#94a3b8,stroke-width:2px,stroke-dasharray: 4 3;

    class USER,ADMIN_USER,UI external;
    class PLAN_CTRL,SUB_CTRL,PAY_CTRL,ADMIN_CTRL entry;
    class CATALOGO,SUSCRIPCION,PAGOS,CUOTAS,HISTORIAL suscripciones;
    class ADMIN_USUARIOS,ADMIN_PLANES,ADMIN_INFRA,ADMIN_AUDIT administracion;
    class PAY_ADAPTER adapter;
    class DB data;
    class M1_USUARIO,M5_ORQUESTA,M7_OBSERVA,M10_NOTIF otromodulo;
```

#### Clases M2 + M9 (pulido: `IPasarelaPago` → `PasarelaPago`)

Original conservado: `M2_M9_propuesta_diagrama_clases.mmd`.


```mermaid
classDiagram
    direction LR

    class ServicioCatalogo {
        +listarPlanes() List~Plan~
        +obtenerPlan(planId) Plan
        +listarComplementos() List~Complemento~
    }

    class ServicioSuscripciones {
        +crearSuscripcion(clienteId, planId, vigencia) Suscripcion
        +renovar(suscripcionId) Suscripcion
        +cambiarPlan(suscripcionId, planNuevoId) Suscripcion
        +cancelar(suscripcionId) Suscripcion
        +actualizarEstadoPorCiclo(suscripcionId) Suscripcion
    }

    class ServicioPagos {
        -pasarela : PasarelaPago
        +procesarCargo(suscripcion, monto) Transaccion
    }

    class PasarelaPago {
        <<interface>>
        +cobrar(monto, metodo) ResultadoPago
    }

    class PasarelaSimulada {
        +cobrar(monto, metodo) ResultadoPago
    }

    class ServicioCuotas {
        +aplicarLimites(suscripcion, plan)
        +reaplicarLimites(suscripcion, plan)
    }

    class ServicioHistorialPagos {
        +registrar(transaccion)
        +listarPorSuscripcion(suscripcionId) List~Transaccion~
    }

    class ServicioAdministracionPlanes {
        +crearPlan(datosPlan) Plan
        +actualizarPlan(planId, datosPlan) Plan
        +descontinuarPlan(planId)
    }

    class ServicioAdministracionUsuarios {
        +listarUsuarios(filtros) List~Usuario~
        +suspenderCuenta(usuarioId)
    }

    class ServicioAuditoriaAdministrativa {
        +registrarAccion(adminId, accion, entidad, entidadId)
    }

    class Plan {
        +id : UUID
        +nombre : String
        +descripcion : String
        +precio : Decimal
        +vigenciaDias : Integer
        +activo : Boolean
    }

    class LimitePlan {
        +id : UUID
        +planId : UUID
        +recurso : String
        +valor : String
    }

    class Complemento {
        +id : UUID
        +nombre : String
        +descripcion : String
        +precio : Decimal
    }

    class Suscripcion {
        +id : UUID
        +usuarioId : UUID
        +planId : UUID
        +estado : EstadoSuscripcion
        +renovacionAutomatica : Boolean
        +fechaInicio : DateTime
        +fechaFin : DateTime
        +fechaCreacion : DateTime
        +fechaActualizacion : DateTime
    }

    class SuscripcionComplemento {
        +suscripcionId : UUID
        +complementoId : UUID
        +cantidad : Integer
        +fechaInicio : DateTime
        +fechaFin : DateTime
    }

    class Transaccion {
        +id : UUID
        +suscripcionId : UUID
        +tipo : TipoTransaccion
        +monto : Decimal
        +estado : EstadoTransaccion
        +fecha : DateTime
        +comprobante : String
    }

    class AccionAdministrativa {
        +id : UUID
        +adminId : UUID
        +accion : String
        +entidadAfectada : String
        +entidadId : UUID
        +fecha : DateTime
        +detalle : String
    }

    class EstadoSuscripcion {
        <<enumeration>>
        ACTIVA
        POR_VENCER
        VENCIDA
        SUSPENDIDA
        CANCELADA
    }

    class TipoTransaccion {
        <<enumeration>>
        CONTRATACION
        RENOVACION
        CAMBIO_PLAN
        COMPLEMENTO
    }

    class EstadoTransaccion {
        <<enumeration>>
        APROBADA
        RECHAZADA
        PENDIENTE
    }

    PasarelaPago <|.. PasarelaSimulada : implementa
    ServicioPagos --> PasarelaPago : depende de (DIP)
    ServicioSuscripciones --> ServicioCatalogo
    ServicioSuscripciones --> ServicioPagos
    ServicioSuscripciones --> ServicioCuotas
    ServicioPagos --> ServicioHistorialPagos
    ServicioAdministracionPlanes --> ServicioCatalogo
    ServicioAdministracionPlanes --> ServicioAuditoriaAdministrativa
    ServicioAdministracionUsuarios --> ServicioAuditoriaAdministrativa

    Plan "1" --> "0..*" LimitePlan
    Suscripcion "1" --> "1" Plan
    Suscripcion "1" --> "0..*" SuscripcionComplemento
    Complemento "1" --> "0..*" SuscripcionComplemento
    Suscripcion "1" --> "0..*" Transaccion
    Suscripcion "1" --> "1" EstadoSuscripcion
    Transaccion "1" --> "1" TipoTransaccion
    Transaccion "1" --> "1" EstadoTransaccion
```

#### Secuencia: contratación de plan


```mermaid
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

#### Secuencia: renovación


```mermaid
sequenceDiagram
    actor Cliente
    participant Sched as Programador de renovaciones
    participant UI as Interfaz web
    participant SubCtrl as Controlador de suscripciones
    participant Suscripcion as Servicio de suscripciones
    participant Pagos as Servicio de pagos
    participant Pasarela as Adaptador de pasarela (simulada)
    participant Cuotas as Servicio de cuotas
    participant Notif as M10 Notificaciones
    participant BD as PostgreSQL

    alt Renovacion manual
        Cliente->>UI: Solicita renovar suscripcion
        UI->>SubCtrl: POST /suscripciones/{id}/renovar
    else Renovacion automatica
        Sched->>SubCtrl: evaluarVencimientos() (tarea programada diaria)
        Note over Sched,SubCtrl: Solo continua si renovacionAutomatica = true<br/>y estado en PorVencer o Vencida
    end

    SubCtrl->>Suscripcion: obtenerEstado(suscripcionId)
    Suscripcion->>BD: SELECT suscripcion
    BD-->>Suscripcion: suscripcion (estado, plan, vigencia)

    alt Estado permite renovar (Activa por vencer, Vencida o Suspendida)
        SubCtrl->>Pagos: procesarCargo(suscripcion, plan)
        Pagos->>Pasarela: cobrar(monto, metodo)
        Pasarela-->>Pagos: resultado (aprobado | rechazado)

        alt Cargo aprobado
            Pagos->>BD: registrar transaccion (renovacion, aprobada)
            Suscripcion->>BD: UPDATE fechaFin, estado = Activa
            Suscripcion->>Cuotas: reaplicarLimites(suscripcion, plan)
            Cuotas-->>Suscripcion: cuota vigente
            Suscripcion->>Notif: enviarConfirmacionRenovacion(cliente)
            Suscripcion-->>SubCtrl: suscripcion renovada
            SubCtrl-->>UI: 200 Renovada
            UI-->>Cliente: Confirmacion de renovacion
        else Cargo rechazado
            Pagos->>BD: registrar transaccion (renovacion, rechazada)
            Suscripcion->>Notif: enviarAvisoFalloRenovacion(cliente)
            Note over Suscripcion: El estado no cambia por la renovacion fallida,<br/>continua su transicion natural (ver diagrama de estados)
            SubCtrl-->>UI: 402 Pago rechazado
            UI-->>Cliente: Muestra motivo del rechazo
        end
    else Estado no permite renovar (Cancelada)
        SubCtrl-->>UI: 409 No es posible renovar una suscripcion cancelada
        UI-->>Cliente: Debe contratar un plan nuevo
    end
```

#### Actividad: contratación y activación


```mermaid
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

#### Actividad: renovación


```mermaid
flowchart TB
    START(("Inicio")) --> A{"Origen"}
    A -- "Cliente (manual)" --> B["Cliente solicita<br>renovar desde el panel"]
    A -- "Programador (automatica)" --> C["Tarea programada detecta<br>vencimiento proximo"]
    C --> D{"renovacionAutomatica<br>activa?"}
    D -- No --> END0(("Fin<br>no se renueva"))
    D -- Si --> E
    B --> E{"Estado permite<br>renovar?"}
    E -- "Cancelada" --> F["Informar que debe<br>contratar un plan nuevo"]
    F --> END1(("Fin"))
    E -- "PorVencer / Vencida / Suspendida" --> G["Procesar cobro<br>en pasarela simulada"]
    G --> H{"Cargo aprobado?"}
    H -- No --> I["Registrar transaccion<br>rechazada"]
    I --> J["Notificar fallo de renovacion"]
    J --> K["El estado continua su<br>transicion natural"]
    K --> END2(("Fin"))
    H -- Si --> L["Registrar transaccion<br>aprobada"]
    L --> M["Extender fechaFin,<br>estado = Activa"]
    M --> N["Reaplicar limites<br>del plan (M5)"]
    N --> O["Notificar confirmacion<br>de renovacion"]
    O --> END3(("Fin"))

     START:::startEnd
     A:::decision
     B:::input
     C:::process
     D:::decision
     END0:::startEnd
     E:::decision
     F:::error
     END1:::startEnd
     G:::process
     H:::decision
     I:::error
     J:::error
     K:::error
     END2:::startEnd
     L:::process
     M:::process
     N:::process
     O:::success
     END3:::startEnd
    classDef startEnd fill:#e0f2fe,stroke:#0284c7,stroke-width:2px,color:#0c4a6e
    classDef input fill:#ecfeff,stroke:#06b6d4,stroke-width:2px,color:#164e63
    classDef process fill:#eff6ff,stroke:#3b82f6,stroke-width:2px,color:#1e3a8a
    classDef decision fill:#fff7ed,stroke:#f97316,stroke-width:2px,color:#7c2d12
    classDef error fill:#fef2f2,stroke:#ef4444,stroke-width:2px,color:#7f1d1d
    classDef success fill:#ecfdf5,stroke:#10b981,stroke-width:2px,color:#065f46
```

#### Actividad: gestión de planes (M9)


```mermaid
flowchart TB
    START(("Inicio")) --> A["Administrador inicia sesion<br>en el panel"]
    A --> B["Selecciona plan existente<br>o crea uno nuevo"]
    B --> C["Ingresa nombre, precio,<br>vigencia y recursos asignados"]
    C --> D{"Datos validos?"}
    D -- No --> E["Mostrar errores<br>de validacion"]
    E --> C
    D -- Si --> F["Guardar cambios<br>en el catalogo (M2)"]
    F --> G["Registrar accion<br>administrativa (auditoria)"]
    G --> H{"Afecta suscripciones<br>ya activas?"}
    H -- "No (aplica solo<br>a nuevas contrataciones)" --> END1(("Fin"))
    H -- "Si (ej. plan<br>descontinuado)" --> I["Notificar impacto<br>a clientes afectados"]
    I --> END2(("Fin"))

     START:::startEnd
     A:::input
     B:::input
     C:::input
     D:::decision
     E:::error
     F:::process
     G:::process
     H:::decision
     END1:::startEnd
     I:::success
     END2:::startEnd
    classDef startEnd fill:#e0f2fe,stroke:#0284c7,stroke-width:2px,color:#0c4a6e
    classDef input fill:#ecfeff,stroke:#06b6d4,stroke-width:2px,color:#164e63
    classDef process fill:#eff6ff,stroke:#3b82f6,stroke-width:2px,color:#1e3a8a
    classDef decision fill:#fff7ed,stroke:#f97316,stroke-width:2px,color:#7c2d12
    classDef error fill:#fef2f2,stroke:#ef4444,stroke-width:2px,color:#7f1d1d
    classDef success fill:#ecfdf5,stroke:#10b981,stroke-width:2px,color:#065f46
```

### 4.3 M3 Proyectos y fuentes + M7 Observabilidad

#### Componentes M3 + M7


```mermaid
flowchart TD
    %% Interfaz
    UI[Interfaz Next.js - Panel de Cliente]

    %% Componentes M3
    subgraph M3 [Módulo 3: Proyectos y fuentes]
        G[Gestor de Fuentes]
        V[Gestor de Variables de Entorno]
    end

    %% Componentes M7
    subgraph M7 [Módulo 7: Observabilidad]
        M[Visor de Métricas de Recursos]
        B[Terminal de Bitácoras en Vivo]
    end

    %% Relaciones
    UI -->|Envía config| G
    UI -->|Cifra y guarda| V
    UI -->|Consulta API HTTP| M
    UI -->|Abre conexión WSS| B
```

#### Clases M3 + M7 (pulido: `ISourceProvider` → `SourceProvider`; `ProjectController` → `ControladorProyecto`)

Original conservado: `M3_M7_propuesta_diagrama_clases.mmd`. El ERD/clases **canónico** es el unificado (§6 y §7). En el unificado el puerto pasa a `ProveedorFuente` (español de la propuesta).


```mermaid
classDiagram
    class SourceProvider {
        <<interface>>
        +obtenerCodigoFuente() CodigoFuente
    }
    class FuenteRepositorio {
        +obtenerCodigoFuente() CodigoFuente
    }
    class FuenteArchivoComprimido {
        +obtenerCodigoFuente() CodigoFuente
    }
    SourceProvider <|.. FuenteRepositorio
    SourceProvider <|.. FuenteArchivoComprimido

    class ControladorProyecto {
        -proveedorFuente: SourceProvider
        +crearProyecto(nombre, variablesEntorno) Proyecto
    }
    ControladorProyecto --> SourceProvider

    class ControladorObservabilidad {
        +consultarMetricasEnVivo(proyectoId) List~MetricaConsumo~
        +transmitirBitacorasConstruccion(proyectoId)
    }
```

#### Propuesta ERD de compañeros (parcial; no usar como fuente — ver §6)


```mermaid
erDiagram
    PROYECTO {
        uuid id_proyecto PK
        string nombre
        string tipo_fuente
        string url_repositorio
    }

    VARIABLE_ENTORNO {
        uuid id_variable PK
        uuid id_proyecto FK
        string clave
        string valor
    }

    METRICA_CONSUMO {
        uuid id_metrica PK
        uuid id_proyecto FK
        float porcentaje_cpu
        int uso_ram_mb
    }

    PROYECTO ||--o{ VARIABLE_ENTORNO : configura
    PROYECTO ||--o{ METRICA_CONSUMO : registra
```

#### Actividad: crear proyecto (original de compañeros; es `stateDiagram-v2`)


```mermaid
stateDiagram-v2
    [*] --> IniciarFormulario
    IniciarFormulario --> IngresarNombreYFuente
    IngresarNombreYFuente --> AgregarVariablesEntorno
    AgregarVariablesEntorno --> ValidarDatos

    state ValidarDatos {
        [*] --> Verificacion
        Verificacion --> DatosInvalidos
        Verificacion --> DatosValidos
    }

    DatosInvalidos --> IngresarNombreYFuente : Corregir errores
    DatosValidos --> EnviarSolicitudDespliegue
    EnviarSolicitudDespliegue --> [*]
```

#### Actividad: consultar métricas (original de compañeros)


```mermaid
stateDiagram-v2
    [*] --> EntrarDashboardProyecto
    EntrarDashboardProyecto --> CargarDatos

    fork
        CargarDatos --> PeticionHTTPMetricas
        PeticionHTTPMetricas --> RenderizarGraficasCPUyRAM
    end

    fork
        CargarDatos --> IniciarConexionWebSocket
        IniciarConexionWebSocket --> RecibirLogsEnVivo
        RecibirLogsEnVivo --> RenderizarConsola
    end

    RenderizarGraficasCPUyRAM --> [*]
    RenderizarConsola --> [*]
```

---

## 5. Sistema de diseño (en curso)

No hay kit visual canónico. Paleta, tipografía y tokens están en diseño; no se copian ni se fijan en este repositorio. La web del bootstrap es un placeholder neutro.

## 6. ERD unificado

Única fuente. Incluye identidad, planes, proyecto, **imagen, artefacto, contenedor, certificado, subdominio**, métricas, notificaciones y administración.


```mermaid
---
title: ERD unificado Deploya — un solo artefacto
---
erDiagram
    USUARIO ||--o{ SESION : abre
    USUARIO }o--|{ ROL : posee
    USUARIO ||--o{ EVENTO_AUDITORIA : origina
    USUARIO ||--o{ TOKEN_CUENTA : recibe
    USUARIO ||--o{ SUSCRIPCION : contrata
    USUARIO ||--o{ ESPACIO_TRABAJO : posee
    USUARIO ||--o{ MIEMBRO_ESPACIO : participa
    USUARIO ||--o{ ACCION_ADMINISTRATIVA : ejecuta

    ROL {
        uuid id PK
        string nombre
        string descripcion
    }

    USUARIO {
        uuid id PK
        string correo UK
        string nombre
        string hashContrasena
        string estadoCuenta
        datetime fechaAlta
    }

    SESION {
        uuid id PK
        uuid usuarioId FK
        datetime expiracion
        string origen
    }

    TOKEN_CUENTA {
        uuid id PK
        uuid usuarioId FK
        string tipo
        string hashToken
        datetime expiracion
        boolean utilizado
    }

    EVENTO_AUDITORIA {
        uuid id PK
        uuid usuarioId FK
        string accion
        string entidad
        uuid entidadId
        datetime fecha
    }

    PLAN ||--o{ LIMITE_PLAN : define
    PLAN ||--o{ SUSCRIPCION : cubre
    COMPLEMENTO ||--o{ SUSCRIPCION_COMPLEMENTO : aplica
    SUSCRIPCION ||--o{ SUSCRIPCION_COMPLEMENTO : incluye
    SUSCRIPCION ||--o{ TRANSACCION : genera

    PLAN {
        uuid id PK
        string nombre
        string descripcion
        decimal precio
        int vigenciaDias
        boolean activo
    }

    LIMITE_PLAN {
        uuid id PK
        uuid planId FK
        string recurso
        decimal cantidad
        string unidad
    }

    COMPLEMENTO {
        uuid id PK
        string nombre
        string descripcion
        decimal precio
    }

    SUSCRIPCION {
        uuid id PK
        uuid usuarioId FK
        uuid planId FK
        string estado
        boolean renovacionAutomatica
        datetime fechaInicio
        datetime fechaFin
    }

    SUSCRIPCION_COMPLEMENTO {
        uuid suscripcionId FK
        uuid complementoId FK
        int cantidad
        datetime fechaInicio
        datetime fechaFin
    }

    TRANSACCION {
        uuid id PK
        uuid suscripcionId FK
        string tipo
        decimal monto
        string estado
        datetime fecha
        string comprobante
    }

    ESPACIO_TRABAJO ||--o{ MIEMBRO_ESPACIO : agrupa
    ESPACIO_TRABAJO ||--o{ PROYECTO : contiene
    PROYECTO ||--o{ VARIABLE_ENTORNO : configura
    PROYECTO ||--o{ DESPLIEGUE : tiene
    PROYECTO ||--o{ DOMINIO_PERSONALIZADO : declara
    PROYECTO ||--o{ METRICA_CONSUMO : registra
    PROYECTO ||--o{ SUBDOMINIO : expone

    ESPACIO_TRABAJO {
        uuid id PK
        uuid propietarioId FK
        string nombre
    }

    MIEMBRO_ESPACIO {
        uuid espacioId FK
        uuid usuarioId FK
        string rolEspacio
    }

    PROYECTO {
        uuid id PK
        uuid espacioId FK
        string nombre
        string tipoFuente
        string urlRepositorio
        string rutaArchivoComprimido
        string recetaConstruccion
        string comandoArranque
        int puertoHttp
    }

    VARIABLE_ENTORNO {
        uuid id PK
        uuid proyectoId FK
        string clave
        string valorCifrado
    }

    TRABAJO_CONSTRUCCION {
        uuid id PK
        uuid despliegueId FK
        string estado
        string stackDetectado
        text bitacora
        datetime inicio
        datetime fin
    }

    IMAGEN {
        uuid id PK
        string digest UK
        string referencia
        datetime creacion
    }

    ARTEFACTO {
        uuid id PK
        uuid proyectoId FK
        uuid imagenId FK
        int numeroVersion
        boolean inmutable
        datetime creacion
    }

    DESPLIEGUE {
        uuid id PK
        uuid proyectoId FK
        uuid artefactoId FK
        uuid trabajoId FK
        string estado
        string disparador
        datetime creacion
        datetime actualizacion
    }

    CONTENEDOR {
        uuid id PK
        uuid despliegueId FK
        string identificadorRuntime
        decimal cpu
        int memoriaMb
        string estadoRuntime
    }

    SUBDOMINIO {
        uuid id PK
        uuid proyectoId FK
        uuid certificadoId FK
        string fqdn UK
    }

    DOMINIO_PERSONALIZADO {
        uuid id PK
        uuid proyectoId FK
        uuid certificadoId FK
        string fqdn UK
        string estadoDns
    }

    CERTIFICADO_TLS {
        uuid id PK
        string dominio
        datetime emision
        datetime vencimiento
        string emisor
    }

    METRICA_CONSUMO {
        uuid id PK
        uuid proyectoId FK
        uuid contenedorId FK
        float porcentajeCpu
        int usoRamMb
        decimal transferenciaGb
        datetime captura
    }

    ENTRADA_BITACORA {
        uuid id PK
        uuid contenedorId FK
        uuid despliegueId FK
        string flujo
        text mensaje
        datetime fecha
    }

    NOTIFICACION {
        uuid id PK
        uuid usuarioId FK
        uuid despliegueId FK
        string tipo
        string canal
        datetime fecha
    }

    ACCION_ADMINISTRATIVA {
        uuid id PK
        uuid adminId FK
        string accion
        string entidadAfectada
        uuid entidadId
        datetime fecha
        string detalle
    }

    DESPLIEGUE ||--o| TRABAJO_CONSTRUCCION : dispara
    DESPLIEGUE }o--|| ARTEFACTO : usa
    ARTEFACTO }o--|| IMAGEN : empaqueta
    PROYECTO ||--o{ ARTEFACTO : versiona
    DESPLIEGUE ||--o| CONTENEDOR : ejecuta
    CONTENEDOR ||--o{ ENTRADA_BITACORA : emite
    DESPLIEGUE ||--o{ ENTRADA_BITACORA : produce
    CONTENEDOR ||--o{ METRICA_CONSUMO : genera
    SUBDOMINIO }o--|| CERTIFICADO_TLS : protege
    DOMINIO_PERSONALIZADO }o--|| CERTIFICADO_TLS : protege
    CONTENEDOR }o--o| SUBDOMINIO : publica
    DESPLIEGUE ||--o{ NOTIFICACION : dispara
    USUARIO ||--o{ NOTIFICACION : recibe
```

---

## 7. Diagrama de clases unificado

Única fuente. Puertos sin `I`. Dominio en español. Tres adaptadores de infraestructura (§7) + `PasarelaPago` + `ProveedorFuente` + `CorreoPuerto` + `CapaHerramientas`.


```mermaid
---
title: Diagrama de clases unificado Deploya — un solo artefacto
---
classDiagram
    direction TB

    class Usuario {
        +id UUID
        +correo String
        +nombre String
        +estadoCuenta String
    }
    class Rol {
        +nombre String
    }
    class Sesion {
        +expiracion DateTime
    }
    class Plan {
        +nombre String
        +precio Decimal
        +vigenciaDias Integer
        +activo Boolean
    }
    class LimitePlan {
        +recurso String
        +cantidad Decimal
        +unidad String
    }
    class Complemento {
        +nombre String
        +precio Decimal
    }
    class Suscripcion {
        +estado EstadoSuscripcion
        +renovacionAutomatica Boolean
        +fechaInicio DateTime
        +fechaFin DateTime
    }
    class PoliticaCicloSuscripcion {
        +avanzar(suscripcion, ahora) EstadoSuscripcion
    }
    class Transaccion {
        +tipo TipoTransaccion
        +monto Decimal
        +estado EstadoTransaccion
        +comprobante String
    }
    class EspacioTrabajo {
        +nombre String
    }
    class Proyecto {
        +nombre String
        +tipoFuente String
        +urlRepositorio String
        +recetaConstruccion String
        +comandoArranque String
        +puertoHttp Integer
    }
    class VariableEntorno {
        +clave String
        +valorCifrado String
    }
    class TrabajoConstruccion {
        +estado String
        +stackDetectado String
    }
    class Imagen {
        +digest String
        +referencia String
    }
    class Artefacto {
        +numeroVersion Integer
        +inmutable Boolean
    }
    class Despliegue {
        +estado EstadoDespliegue
        +disparador String
    }
    class Contenedor {
        +identificadorRuntime String
        +cpu Decimal
        +memoriaMb Integer
    }
    class Subdominio {
        +fqdn String
    }
    class DominioPersonalizado {
        +fqdn String
        +estadoDns String
    }
    class CertificadoTls {
        +dominio String
        +emision DateTime
        +vencimiento DateTime
    }
    class MetricaConsumo {
        +porcentajeCpu Float
        +usoRamMb Integer
        +transferenciaGb Decimal
    }
    class EntradaBitacora {
        +flujo String
        +mensaje String
    }
    class Notificacion {
        +tipo String
        +canal String
    }
    class AccionAdministrativa {
        +accion String
        +entidadAfectada String
    }

    class EstadoSuscripcion {
        <<enumeration>>
        ACTIVA
        POR_VENCER
        VENCIDA
        SUSPENDIDA
        CANCELADA
    }
    class EstadoDespliegue {
        <<enumeration>>
        ENCOLADO
        CONSTRUYENDO
        APROVISIONANDO
        PUBLICANDO
        SALUDABLE
        FALLIDO
        REVIRTIENDO
        DETENIDO
    }
    class TipoTransaccion {
        <<enumeration>>
        CONTRATACION
        RENOVACION
        CAMBIO_PLAN
        COMPLEMENTO
    }
    class EstadoTransaccion {
        <<enumeration>>
        APROBADA
        RECHAZADA
        PENDIENTE
    }

    class PasarelaPago {
        <<interface>>
        +cobrar(monto, metodo) ResultadoPago
    }
    class PasarelaSimulada {
        +cobrar(monto, metodo) ResultadoPago
    }
    class ProveedorFuente {
        <<interface>>
        +obtenerCodigoFuente() CodigoFuente
    }
    class FuenteRepositorio {
        +obtenerCodigoFuente() CodigoFuente
    }
    class FuenteArchivoComprimido {
        +obtenerCodigoFuente() CodigoFuente
    }
    class ContenedorPuerto {
        <<interface>>
        +crear(imagen, limites) Contenedor
        +detener(contenedorId)
        +reemplazar(contenedorId, artefacto) Contenedor
    }
    class EnrutamientoPuerto {
        <<interface>>
        +asignarSubdominio(proyecto) Subdominio
        +emitirCertificado(dominio) CertificadoTls
        +conmutarTrafico(contenedor)
    }
    class VerificacionEntornoPuerto {
        <<interface>>
        +comprobarSalud(contenedor) ResultadoSalud
    }
    class CorreoPuerto {
        <<interface>>
        +enviar(destinatario, plantilla, datos)
    }

    class ServicioSuscripciones {
        +crearSuscripcion(clienteId, planId, vigencia) Suscripcion
        +renovar(suscripcionId) Suscripcion
        +cambiarPlan(suscripcionId, planNuevoId) Suscripcion
        +cancelar(suscripcionId) Suscripcion
    }
    class ServicioPagos {
        -pasarela PasarelaPago
        +procesarCargo(suscripcion, monto) Transaccion
    }
    class ServicioProyectos {
        -proveedorFuente ProveedorFuente
        +crearProyecto(nombre, variablesEntorno) Proyecto
    }
    class ServicioConstruccion {
        +encolar(proyecto) TrabajoConstruccion
        +construir(trabajo) Artefacto
    }
    class ServicioOrquestacion {
        -contenedores ContenedorPuerto
        -salud VerificacionEntornoPuerto
        +aprovisionar(artefacto, limites) Contenedor
        +revertir(despliegueId) Despliegue
        +detener(contenedorId)
    }
    class ServicioEnrutamiento {
        -enrutamiento EnrutamientoPuerto
        +publicar(proyecto, contenedor) Subdominio
    }
    class ServicioMetricas {
        +consultarEnVivo(proyectoId) List~MetricaConsumo~
    }
    class ServicioBitacoras {
        +transmitir(proyectoId)
    }
    class ServicioNotificaciones {
        -correo CorreoPuerto
        +notificarDespliegue(despliegue)
        +notificarVencimiento(suscripcion)
    }
    class CapaHerramientas {
        +consultarProyectos()
        +desplegar(proyectoId)
        +obtenerBitacoras(proyectoId)
        +obtenerMetricas(proyectoId)
        +revertir(despliegueId)
        +gestionarVariables(proyectoId)
    }

    Usuario "1" --> "*" Sesion
    Usuario "*" --> "*" Rol
    Usuario "1" --> "*" Suscripcion
    Usuario "1" --> "*" EspacioTrabajo
    Plan "1" --> "*" LimitePlan
    Plan "1" --> "*" Suscripcion
    Suscripcion "1" --> "*" Transaccion
    Suscripcion --> EstadoSuscripcion
    ServicioSuscripciones --> PoliticaCicloSuscripcion
    ServicioSuscripciones --> ServicioPagos
    ServicioPagos --> PasarelaPago
    PasarelaPago <|.. PasarelaSimulada
    EspacioTrabajo "1" --> "*" Proyecto
    Proyecto "1" --> "*" VariableEntorno
    Proyecto "1" --> "*" Despliegue
    Proyecto "1" --> "*" Artefacto
    Despliegue --> EstadoDespliegue
    Despliegue "1" --> "0..1" TrabajoConstruccion
    Despliegue "*" --> "1" Artefacto
    Artefacto "*" --> "1" Imagen
    Despliegue "1" --> "0..1" Contenedor
    Proyecto "1" --> "1" Subdominio
    Proyecto "1" --> "*" DominioPersonalizado
    Subdominio --> CertificadoTls
    DominioPersonalizado --> CertificadoTls
    Contenedor "1" --> "*" MetricaConsumo
    Contenedor "1" --> "*" EntradaBitacora
    Despliegue "1" --> "*" Notificacion
    ServicioProyectos --> ProveedorFuente
    ProveedorFuente <|.. FuenteRepositorio
    ProveedorFuente <|.. FuenteArchivoComprimido
    ServicioConstruccion --> ServicioOrquestacion
    ServicioOrquestacion --> ContenedorPuerto
    ServicioOrquestacion --> VerificacionEntornoPuerto
    ServicioEnrutamiento --> EnrutamientoPuerto
    ServicioNotificaciones --> CorreoPuerto
    CapaHerramientas --> ServicioProyectos
    CapaHerramientas --> ServicioConstruccion
    CapaHerramientas --> ServicioOrquestacion
    CapaHerramientas --> ServicioMetricas
    CapaHerramientas --> ServicioBitacoras
    ServicioOrquestacion --> ServicioEnrutamiento
    ServicioOrquestacion --> ServicioNotificaciones
```

---

## 8. Estados

### 8.1 Suscripción (§4.4) — entrega M2

No copiar estos cinco estados al despliegue.


```mermaid
stateDiagram-v2
    [*] --> Activa : contratacion con pago aprobado

    Activa --> PorVencer : faltan 7 dias o menos<br/>para el vencimiento
    PorVencer --> Activa : renovacion exitosa<br/>(manual o automatica)
    PorVencer --> Vencida : se cumple la fecha<br/>de vencimiento sin renovar

    Vencida --> Activa : renovacion exitosa dentro<br/>del periodo de gracia (5 dias)
    Vencida --> Suspendida : termina el periodo de<br/>gracia sin renovacion

    Suspendida --> Activa : renovacion exitosa durante<br/>la suspension (*)
    Suspendida --> Cancelada : 30 dias en Suspendida<br/>sin renovar, o cancelacion<br/>solicitada por el cliente

    Activa --> Cancelada : cancelacion solicitada<br/>por el cliente
    PorVencer --> Cancelada : cancelacion solicitada<br/>por el cliente

    Cancelada --> [*] : recursos liberados<br/>(tras ventana de exportacion)

    note right of Activa
        Todos los entornos operan
        con la cuota contratada
    end note
    note right of Vencida
        Entornos en linea;
        nuevos despliegues bloqueados
    end note
    note right of Suspendida
        Contenedores detenidos;
        datos y configuracion conservados
    end note
    note right of Cancelada
        Recursos liberados;
        cliente puede exportar datos antes
    end note
```

### 8.2 Despliegue / contenedor — dominio §3.2

Encolado → Construyendo → Aprovisionando → Publicando → Saludable. Fallido, Revirtiendo y Detenido son estados de error, reversión y parada (p. ej. suscripción Suspendida). **No** son Activa / Por vencer / Vencida / Suspendida / Cancelada.


```mermaid
---
title: Estados del despliegue — dominio §3.2 (no son los de suscripción)
---
stateDiagram-v2
    [*] --> Encolado : API registra y encola la construcción

    Encolado --> Construyendo : trabajador toma el trabajo
    Construyendo --> Aprovisionando : imagen versionada registrada
    Construyendo --> Fallido : falla la construcción

    Aprovisionando --> Publicando : contenedor con límites en ejecución
    Aprovisionando --> Fallido : no se levantó el contenedor

    Publicando --> Saludable : subdominio TLS y healthcheck correctos
    Publicando --> Fallido : falla enrutamiento o healthcheck

    Saludable --> Encolado : nuevo despliegue
    Saludable --> Revirtiendo : reversión a artefacto previo
    Saludable --> Detenido : suscripción Suspendida o parada

    Revirtiendo --> Publicando : se levanta el artefacto previo
    Revirtiendo --> Fallido : no se pudo revertir

    Detenido --> Aprovisionando : reanudar entorno
    Fallido --> Encolado : reintentar construcción
    Fallido --> Revirtiendo : revertir a versión anterior

    note right of Encolado
        Recepción §3.2
        El despliegue queda registrado.
    end note
    note right of Construyendo
        Construcción §3.2
        Detector de stack e imagen.
    end note
    note right of Aprovisionando
        Ejecución §3.2
        Contenedor aislado con cuota.
    end note
    note right of Publicando
        Enrutamiento §3.2
        Subdominio, TLS, conmutación.
    end note
    note right of Saludable
        Operación §3.2
        Bitácoras y métricas al panel.
    end note
    note right of Detenido
        Distinto de Cancelada.
        Datos conservados.
    end note
```

---

## 9. Secuencias de despliegue

### 9.1 Despliegue completo (§3.2) hasta Saludable / Fallido + notificaciones


```mermaid
---
title: Secuencia del despliegue completo — propuesta §3.2
---
sequenceDiagram
    actor Cliente
    participant UI as Interfaz web
    participant API as API de control
    participant BD as PostgreSQL
    participant Cola as Cola Redis
    participant M4 as Trabajador de construcción
    participant M5 as Orquestador de contenedores
    participant Salud as VerificacionEntornoPuerto
    participant M6 as Enrutador de borde
    participant M7 as Observabilidad
    participant M10 as Notificaciones

    Note over Cliente,M10: 1. Recepción
    Cliente->>UI: Desplegar proyecto
    UI->>API: POST despliegues
    API->>BD: registrar Despliegue Encolado
    API->>Cola: encolar construcción
    API-->>UI: 202 aceptado

    Note over Cliente,M10: 2. Construcción
    Cola->>M4: entregar trabajo
    M4->>M4: detectar stack
    M4->>M4: construir imagen versionada

    alt Construcción correcta
        M4->>BD: registrar Artefacto inmutable
        M4->>Cola: encolar ejecución

        Note over Cliente,M10: 3. Ejecución
        Cola->>M5: entregar artefacto
        M5->>M5: crear contenedor con límites del plan
        M5->>BD: Despliegue Aprovisionando

        alt Contenedor en ejecución
            Note over Cliente,M10: 4. Enrutamiento
            M5->>M6: asignar subdominio y certificado TLS
            M6->>M6: conmutar tráfico
            M5->>Salud: comprobar salud HTTP
            alt Healthcheck correcto
                Note over Cliente,M10: 5. Operación
                M5->>BD: Despliegue Saludable
                M5->>M7: transmitir bitácoras y métricas
                M5->>M10: resultado de despliegue correcto
                M10-->>Cliente: correo de publicación
                M7-->>UI: métricas y bitácoras en vivo
            else Healthcheck fallido
                M5->>BD: Despliegue Fallido
                M5->>M10: resultado de despliegue fallido
                M10-->>Cliente: correo de fallo
            end
        else No se pudo levantar el contenedor
            M5->>BD: Despliegue Fallido
            M5->>M10: resultado de despliegue fallido
            M10-->>Cliente: correo de fallo
        end
    else Construcción fallida
        M4->>BD: Despliegue Fallido
        M4->>M10: resultado de despliegue fallido
        M10-->>Cliente: correo de fallo
    end
```

### 9.2 Reversión (sin reconstruir)


```mermaid
---
title: Secuencia de reversión — artefacto previo, sin reconstruir
---
sequenceDiagram
    actor Cliente
    participant UI as Interfaz web
    participant API as API de control
    participant BD as PostgreSQL
    participant M5 as Orquestador de contenedores
    participant Salud as VerificacionEntornoPuerto
    participant M6 as Enrutador de borde
    participant M10 as Notificaciones

    Cliente->>UI: Revertir a versión anterior
    UI->>API: POST despliegues reversión
    API->>BD: obtener Artefacto previo del proyecto
    API->>BD: Despliegue Revirtiendo
    Note over API,M5: No se reconstruye. Se levanta un artefacto ya registrado.

    alt Hay versión para reversión según el plan
        API->>M5: levantar artefacto previo
        M5->>M5: reemplazar contenedor con límites vigentes
        M5->>M6: conmutar tráfico al contenedor revertido
        M5->>Salud: comprobar salud HTTP
        alt Healthcheck correcto
            M5->>BD: Despliegue Saludable
            M5->>M10: reversión correcta
            M10-->>Cliente: correo
            API-->>UI: 200 revertido
        else Healthcheck fallido
            M5->>BD: Despliegue Fallido
            M5->>M10: reversión fallida
            M10-->>Cliente: correo
            API-->>UI: 409 reversión fallida
        end
    else No hay artefacto previo o el plan no incluye reversión
        API-->>UI: 409 no hay versión para revertir
        UI-->>Cliente: informar límite del plan
    end
```

---

## 10. Actividades del motor

Construcción, aprovisionamiento, publicación, comprobación de salud y reversión.


```mermaid
---
title: Actividades del motor — construcción, aprovisionamiento, publicación, salud, reversión
---
flowchart TB
    START(("Inicio")) --> ORIGEN{"Origen"}

    ORIGEN -->|Desplegar| BUILD["Detectar stack y construir imagen"]
    ORIGEN -->|Revertir| SKIP["Tomar artefacto previo<br/>sin reconstruir"]

    BUILD --> BUILD_OK{"¿Imagen lista?"}
    BUILD_OK -->|No| FAIL1["Marcar Fallido"]
    FAIL1 --> MAIL1["Notificar fallo de construcción"]
    MAIL1 --> FIN1(("Fin"))

    BUILD_OK -->|Sí| ART["Registrar artefacto inmutable"]
    ART --> PROV
    SKIP --> PROV["Aprovisionar contenedor<br/>con límites de CPU y memoria"]

    PROV --> PROV_OK{"¿Contenedor en ejecución?"}
    PROV_OK -->|No| FAIL2["Marcar Fallido"]
    FAIL2 --> MAIL2["Notificar fallo de ejecución"]
    MAIL2 --> FIN2(("Fin"))

    PROV_OK -->|Sí| REL["Asignar subdominio y certificado TLS<br/>conmutar tráfico"]
    REL --> HEALTH["Comprobar salud HTTP"]
    HEALTH --> HEALTH_OK{"¿Respuesta saludable?"}
    HEALTH_OK -->|No| FAIL3["Marcar Fallido"]
    FAIL3 --> MAIL3["Notificar fallo de publicación"]
    MAIL3 --> FIN3(("Fin"))

    HEALTH_OK -->|Sí| OK["Marcar Saludable"]
    OK --> OBS["Transmitir bitácoras y métricas"]
    OBS --> MAIL4["Notificar resultado de despliegue"]
    MAIL4 --> FIN4(("Fin"))

    classDef startEnd fill:#f5f3ff,stroke:#a78bfa,stroke-width:2px,color:#312e81
    classDef process fill:#f0fdfa,stroke:#2dd4bf,stroke-width:2px,color:#134e4a
    classDef decision fill:#fefce8,stroke:#facc15,stroke-width:2px,color:#713f12
    classDef error fill:#fff1f2,stroke:#fb7185,stroke-width:2px,color:#881337
    classDef success fill:#f0fdf4,stroke:#4ade80,stroke-width:2px,color:#166534
    class START,FIN1,FIN2,FIN3,FIN4 startEnd
    class BUILD,SKIP,ART,PROV,REL,HEALTH,OBS process
    class ORIGEN,BUILD_OK,PROV_OK,HEALTH_OK decision
    class FAIL1,MAIL1,FAIL2,MAIL2,FAIL3,MAIL3 error
    class OK,MAIL4 success
```

---

## 11. Auditoría resumida

Informe completo: `M4_M5_M6_Motor_Despliegue/AUDITORIA_SOLID_CLEAN.md`.

| Antes | Después |
|---|---|
| `IPasarelaPago` | `PasarelaPago` |
| `ISourceProvider` | `SourceProvider` (pulido M3) → `ProveedorFuente` (unificado, español) |
| `ProjectController` | `ControladorProyecto` |
| `ObservabilityController` | `ControladorObservabilidad` + `ServicioMetricas` / `ServicioBitacoras` |
| `GitHubSource` / `ZipSource` | `FuenteRepositorio` / `FuenteArchivoComprimido` |
| 2 classDiagram + 1 ERD parcial | 1 ERD unificado + 1 classDiagram unificado |
| API → Docker implícito | `ContenedorPuerto`, `EnrutamientoPuerto`, `VerificacionEntornoPuerto` |

SOLID: DIP de pagos se conserva; M1 gana `CorreoPuerto`; controladores gordos de admin y observabilidad se parten en el unificado; `PoliticaCicloSuscripcion` saca el ciclo de estados de `ServicioSuscripciones`. Originales de compañeros no se borran.

---

## 12. Extracto de la propuesta — módulos y estados

### 12.1 Módulos M1–M10 (§6.1)

| Id | Módulo | Contenido comprometido |
|---|---|---|
| M1 | Identidad y acceso | Registro, validación de correo, recuperación de contraseña, autenticación, sesiones, roles y bitácora de auditoría. |
| M2 | Suscripciones y pagos | Catálogo de planes y complementos (§4); contratación con pago simulado, historial, renovación, cambio de plan y aplicación efectiva de cuotas. |
| M3 | Proyectos y fuentes | Alta de proyectos, conexión por repositorio o archivo comprimido, configuración de construcción y variables de entorno cifradas. |
| M4 | Motor de construcción | Cola de trabajos, detección del stack, construcción de imágenes y registro de artefactos versionados. |
| M5 | Orquestación y ejecución | Ciclo de vida del contenedor, aislamiento de red, límites de CPU y memoria, y reversión de versiones. |
| M6 | Enrutamiento y TLS | Asignación de subdominios, certificados automáticos, conmutación de tráfico y dominios personalizados. |
| M7 | Observabilidad | Bitácoras en vivo, métricas de consumo de recursos y avisos por proximidad al límite de cuota. |
| M8 | Asistente e integración | Capa de herramientas de la plataforma, asistente de diagnóstico y servidor de integración para clientes externos. |
| M9 | Administración | Panel administrativo de usuarios, planes y estado de la infraestructura. |
| M10 | Notificaciones | Correo transaccional para eventos de cuenta, resultado de despliegues y vencimiento de planes. |

§10.3: arquitecto e integrador = **M4, M5, M6 y la capa de herramientas de M8**.

### 12.2 Estados de suscripción §4.4

| Estado | Condición | Efecto sobre los servicios |
|---|---|---|
| Activa | Dentro del período de vigencia | Todos los entornos operan con la cuota contratada. |
| Por vencer | Faltan siete días o menos para el vencimiento | Operación normal; se notifica al cliente por correo y en el panel. |
| Vencida | Superada la fecha de vigencia, dentro del período de gracia de cinco días | Los entornos siguen en línea; se bloquean nuevos despliegues. |
| Suspendida | Concluido el período de gracia sin renovación | Los contenedores se detienen; los datos y configuraciones se conservan. |
| Cancelada | Suspendida durante treinta días o cancelada por el cliente | Se liberan los recursos; el cliente puede exportar sus datos antes. |

### 12.3 Estados de despliegue (derivados de §3.2; no son los de suscripción)

| Estado | Etapa §3.2 | Significado |
|---|---|---|
| Encolado | Recepción | La API registró el despliegue y encoló la construcción. |
| Construyendo | Construcción | El trabajador detecta el stack y produce la imagen versionada. |
| Aprovisionando | Ejecución | La imagen corre en un contenedor con límites de CPU y memoria. |
| Publicando | Enrutamiento | Subdominio, certificado TLS y conmutación de tráfico; healthcheck. |
| Saludable | Operación | Entorno en línea; bitácoras y métricas al panel. |
| Fallido | cualquier etapa | Construcción, ejecución, enrutamiento o salud no superados; se notifica. |
| Revirtiendo | — | Se levanta un artefacto previo; no se reconstruye. |
| Detenido | — | Contenedores parados (p. ej. suscripción Suspendida); datos conservados. |
