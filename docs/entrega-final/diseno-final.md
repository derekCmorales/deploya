# Documento de diseño final · Deploya v1.0.0 (DOC-03)

Arquitectura, módulos, puertos, patrones, decisiones y modelo de datos de la versión entregada. El detalle vivo está en [arquitectura.md](../arquitectura.md), [arquitectura-maestro.md](../arquitectura-maestro.md) (una sección por historia) e [ingenieria.md](../ingenieria.md); este documento es el resumen para la entrega y el índice hacia ellos.

## 1. Vista general

Deploya es un **monolito modular** en TypeScript, en un repositorio con pnpm workspaces:

| Pieza | Tecnología | Qué hace |
|---|---|---|
| `apps/web` | Next.js 15 (App Router), React 19, Tailwind 4, design system v4.1 | Panel del cliente y del administrador, portada y asistente de instalación |
| `apps/api` · proceso **api** | NestJS 10, Prisma | API HTTP: identidad, suscripciones, proyectos, consultas y acciones. **No** llama a Docker ni al enrutador |
| `apps/api` · proceso **trabajador** | La misma imagen, `node dist/trabajador.js` | Motor: clona, construye, ejecuta, enruta y verifica salud; tareas diarias (ciclo y limpieza); muestreo de métricas. Único proceso con `docker.sock` |
| PostgreSQL 16 | Prisma (16 modelos, migraciones versionadas) | Datos del sistema |
| Redis 7 | BullMQ | Colas de construcción, operación, muestreo, ciclo y limpieza; estado compartido |
| Traefik v3 | Proveedor de archivo | Enrutador de borde: `<proyecto>.<dominio>` → contenedor; HTTPS comodín |
| Proveedor SMTP | Mailpit en desarrollo; Resend o Brevo en el VPS | Correos de cuenta y avisos |

Ciclo de un despliegue: **Recepción → Construcción → Ejecución → Enrutamiento → Operación** ([m4-m5-m6-secuencia-despliegue.mmd](../diagramas/m1-m10/m4-m5-m6-secuencia-despliegue.mmd)).

Diagramas C4: [contexto](../diagramas/compartido/c4-contexto.mmd), [contenedores](../diagramas/compartido/c4-contenedores.mmd), [componentes del motor](../diagramas/compartido/c4-componentes-motor.mmd) y [despliegue en el VPS](../diagramas/compartido/despliegue-infraestructura.mmd).

## 2. Arquitectura hexagonal por módulo

Cada módulo Nest tiene tres capas ([ingenieria.md §1](../ingenieria.md#1-arquitectura-monolito-modular-con-puertos-y-adaptadores)):

```text
entrada (controlador HTTP, trabajador BullMQ)
   └─▶ servicio (orquesta un caso de uso; depende solo de puertos)
          ├─▶ dominio puro (políticas, máquinas de estado, errores con nombre; sin Nest, Prisma ni reloj)
          └─▶ puertos (abstract class) ◀── adaptadores (Prisma, Docker, SMTP, GitHub, Traefik, BullMQ, memoria)
```

- Los **puertos** son `abstract class` (sirven de token de Nest) **sin prefijo `I`**. Los adaptadores reales viven en `apps/api/src/adapters` y en `adaptadores/` de cada módulo; las pruebas usan dobles en memoria que cumplen el mismo contrato.
- El tiempo entra por el puerto `Reloj`: ningún dominio llama a `Date.now()`.
- Un módulo solo usa lo que otro **exporta** en su `*.module.ts`; los contratos entre módulos están en [docs/contratos/](../contratos/).
- Los estados de **despliegue** y los de **suscripción** son vocabularios separados (§4.4).

## 3. Módulos

| Módulo | Carpeta | Dueño | Responsabilidad | Puertos principales |
|---|---|---|---|---|
| M1 Identidad | `identidad` | Eddy | Registro, verificación, sesión, roles, recuperación, Mi cuenta, límite de intentos, asistente de primera configuración | `RepositorioUsuarios`, `RepositorioSesiones`, `RepositorioTokensCuenta`, `HashContrasena`, `GeneradorToken`, `AsignacionSandboxPuerto` |
| M10 Notificaciones | `notificaciones` | Eddy | Correo por SMTP configurable, plantillas, avisos | `CorreoPuerto`, `PlantillaCorreo`, `AvisosPuerto`, `DestinatariosPuerto`, `RegistroEnviosCorreo`, `PruebaCorreoPuerto` |
| M2 Suscripciones | `suscripciones` | Javier | Catálogo, Sandbox, contratación con pasarela simulada, renovación, pagos y PDF, cuotas, ciclo §4.4, seed, modo de instalación | `PasarelaPago`, `RepositorioSuscripciones`, `RepositorioPagos`, `RepositorioPlanes`, `CatalogoPlanes`, `PoliticaCuotas`, `ComprobantePdfPuerto`, `ColaCicloPuerto`, `RepositorioConfiguracionInstalacion` |
| M3 Proyectos | `proyectos` | Eduardo | Alta desde GitHub, variables cifradas, configuración y eliminación | `ProveedorFuente`, `RepositorioProyectos`, `RepositorioVariables`, `CifradorVariables`, `CuotaProyectosPuerto` |
| M4 Construcción | `construccion` | Derek | Recepción y cola, pipeline, Dockerfile o receta por stack, bitácora, acciones, máquina de estados, tiempos | `ColaConstruccionPuerto`, `ClonadorRepositorioPuerto`, `ConstructorImagenPuerto`, `RecetaStack`, `LectorFuente`, `PasoPipeline`, `RepositorioDespliegues`, `RepositorioArtefactos`, `CancelacionesPuerto` |
| M5 Orquestación | `orquestacion` | Derek | Contenedor con límites del plan, salud, acciones, suspensión, versionado, reversión sin reconstruir, bloqueos, variables, métricas | `ContenedorPuerto`, `VerificacionEntornoPuerto`, `ContenedoresClientePuerto`, `CuotaPlanPuerto`, `VariablesEntornoPuerto`, `MetricasContenedorPuerto`, `MuestrasMetricas`, `ColaOperacionPuerto`, `ColaMuestreoPuerto` |
| M6 Enrutamiento | `enrutamiento` | Derek | Subdominio automático, HTTPS, conmutación sin interrupción | `EnrutamientoPuerto`, `CertificadoPuerto` |
| M7 Observabilidad | `observabilidad` | Eduardo | Vista del despliegue, resumen, historial, consumo, métricas, tiempo por etapa, ritmo, bitácora de ejecución | `DetalleProyectoPuerto`, `SalidaContenedorPuerto` |
| M9 Administración | `administracion` | Javier | Usuarios, suspender y reactivar, infraestructura, ajustes de la instalación, invitaciones, limpieza diaria | `ConsultaUsuariosPuerto`, `CuentasSuspensionPuerto`, `RegistroAccionesPuerto`, `MetricasNodoPuerto`, `PoliticaRegistroPuerto`, `RepositorioInvitaciones`, `EstadoScriptsPuerto`, `ResolutorDnsPuerto`, `PurgaDatosVencidosPuerto`, `RegistroLimpiezaPuerto`, `ColaLimpiezaPuerto` |
| M8 Herramientas | `herramientas` | Derek | Stub (`GET /herramientas/health`) | — |
| Compartido | `compartido` | — | Prisma, reloj, proxy de confianza | `Reloj` |

En total, unas 70 `abstract class` entre puertos y errores base. El diagrama de clases unificado con cada puerto, adaptador y estado está en [clases-unificado.mmd](../diagramas/compartido/clases-unificado.mmd), y los de cada módulo en [docs/diagramas/m1-m10/](../diagramas/m1-m10/README.md).

## 4. Patrones de diseño

| Patrón | Dónde | Por qué |
|---|---|---|
| **Ports & Adapters** (hexagonal) | Todos los módulos | Probar el dominio sin Docker, red, base ni reloj; cambiar proveedor sin tocar el servicio |
| **Repository** | `Repositorio*` sobre Prisma | El servicio no conoce SQL |
| **Adapter** | `ContenedorDocker`, `EnrutamientoTraefikArchivo`, `FuenteGitHubPublica`, `CorreoSmtpAdaptador`, `PasarelaSimulada` | Traducir APIs externas al lenguaje del dominio |
| **Strategy** | `RecetaStack` (Dockerfile, Node, Python, Go, estática); estrategia de certificado (comodín o HTTP-01); `PoliticaRegistroPuerto` (abierto o de instalación) | Extender con una implementación nueva, no con `if/switch` (O de SOLID) |
| **State** | Máquina de estados del despliegue (`estados.ts`) y ciclo de la suscripción (`politica-ciclo.ts`) | Transiciones válidas en un solo lugar |
| **Pipeline / Chain of Responsibility** | `PasoPipeline`: recepción → construcción → ejecución → enrutamiento → operación | Cada etapa con su bitácora, su tiempo y su fallo |
| **Observer** | `OyenteDespliegue`: `AvisoDespliegueOyente` (correo al quedar Saludable o Fallido) y `RetencionArtefactos` | M4 no conoce a M10 ni a la retención de M5 |
| **Facade** | `InstalacionService`, `ResumenProyectoService` | Una vista que junta varios puertos |
| **Composite** | Salud de la instalación (`SaludInstalacion`) | Comprobaciones independientes con un solo resultado |
| **Policy (regla pura)** | `PoliticaContrasena`, `PoliticaCuotas`, `politica-ciclo.ts`, `LimiteIntentos`, `cortesDeLimpieza` | Reglas del negocio sin efectos, probadas en tabla |
| **Factory** | `LimitesIdentidad`, `AdaptersModule.paraTrabajador()`, `colaLimpiezaPara` | Elegir adaptadores según el modo (`stub` o `docker`) |
| **Template Method** | `PlantillaCorreo` | Correos con el mismo marco y contenido distinto |

Cada change archivado nombra sus patrones en su `design.md` ([openspec/changes/archive/](../../openspec/changes/archive/)). La auditoría SOLID y de clean code está en [AUDITORIA_SOLID_CLEAN.md](../AUDITORIA_SOLID_CLEAN.md).

## 5. Decisiones de arquitectura (ADR)

| ADR | Decisión |
|---|---|
| [0001](../adr/0001-correo-por-smtp-configurable.md) | Correo por un adaptador SMTP configurable; Mailpit solo en desarrollo |
| [0002](../adr/0002-cola-bullmq-y-trabajador-aparte.md) | Cola BullMQ y un trabajador aparte con la misma imagen |
| [0003](../adr/0003-construccion-dockerfile-o-receta.md) | Construcción con el `Dockerfile` del repositorio o con una receta por stack detectado |
| [0004](../adr/0004-versionado-y-reversion-sin-reconstruir.md) | Versionado inmutable y reversión sin reconstruir |
| [0005](../adr/0005-traefik-proveedor-de-archivo.md) | Traefik v3 con proveedor de archivo y una red por proyecto |
| [0006](../adr/0006-polling-en-vez-de-websocket.md) | Polling cada 3 s en vez de WebSocket o SSE |
| [0007](../adr/0007-certificado-comodin-por-dns-01.md) | Certificado comodín por DNS-01 en el VPS |
| [0008](../adr/0008-autoalojado-y-codigo-abierto.md) | Código abierto y autoalojado con un modo de instalación |

## 6. Modelo de datos

16 modelos en [schema.prisma](../../apps/api/prisma/schema.prisma); el diagrama entidad-relación completo está en [erd-unificado.mmd](../diagramas/compartido/erd-unificado.mmd) y el contrato de datos entre módulos en [datos-nucleo.md](../contratos/datos-nucleo.md).

| Módulo | Modelos | Notas |
|---|---|---|
| M1 | `Usuario`, `TokenCuenta`, `Sesion` | Contraseña con hash scrypt; el token de sesión se guarda como sha256; la limpieza diaria borra tokens y sesiones vencidos |
| M2 | `Plan`, `Suscripcion`, `Pago` | Del pago solo quedan los últimos 4 dígitos; estados de suscripción §4.4 |
| M9 | `AccionAdministrativa`, `Invitacion`, `ConfiguracionInstalacion` | Toda suspensión y reactivación deja una acción con motivo; una sola fila de configuración |
| M3 | `Proyecto`, `VariableEntorno` | Valor cifrado con AES-256-GCM |
| M4, M5 | `Artefacto`, `Despliegue`, `EtapaDespliegue`, `LineaBitacora` | El artefacto (imagen) es inmutable: revertir lo reutiliza |
| M7 | `MuestraMetrica` | Muestras de CPU y memoria por contenedor |

## 7. Seguridad

| Amenaza | Medida |
|---|---|
| Código del cliente malicioso | Contenedor sin privilegios (`CapDrop ALL`, `no-new-privileges`), red propia por proyecto, CPU y memoria del plan, construcción con tiempo máximo; solo el trabajador toca `docker.sock` |
| Robo de sesión | Cookie `HttpOnly`, `SameSite=Lax`, `Secure` con HTTPS; token guardado como hash; cerrar todas las sesiones |
| Fuerza bruta | Límite de intentos (EST-01a) por IP real (`trust proxy` detrás de Traefik) |
| Enumeración de cuentas | Recuperación y reenvío responden igual exista o no la cuenta |
| Fuga de secretos | Variables cifradas; secretos solo en `.env.vps` del servidor; gitleaks en CI |
| *Clickjacking* y *sniffing* | `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`; HSTS en Traefik |

## 8. Calidad

- **Pruebas:** Jest en la API (una prueba por `Scenario` de cada spec, sin Docker, red, base ni reloj reales) y `node --test` en la web y en los scripts de shell.
- **CI** ([ci.yml](../../.github/workflows/ci.yml)): build y pruebas, gitleaks, shellcheck y «Smoke compose», que levanta todo con `docker compose` y corre el smoke y el **recorrido e2e** de QA-01 ([e2e/recorrido.mjs](../../e2e/recorrido.mjs)).
- **Proceso:** OpenSpec (un change por historia, archivado tras el merge), PR con plantilla y CODEOWNERS, Conventional Commits. Ver [METODOLOGIA.md](../../METODOLOGIA.md).
