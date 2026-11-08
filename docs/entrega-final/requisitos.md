# Documento de requisitos · Deploya v1.0.0 (DOC-01)

Entrega final del 100 % (145 de 145 puntos del núcleo v4.1 más el sprint fuera de alcance). Este documento junta en un solo lugar lo que ya estaba repartido en la propuesta, el alcance y los specs de OpenSpec, y lo ata a pantallas y pruebas.

| Fuente | Qué manda |
|---|---|
| [alcance.md](../alcance.md) | Qué entra (núcleo v4.1 y sprint fuera de alcance). Manda sobre la propuesta |
| `openspec/specs/<módulo>/spec.md` | Requisitos y escenarios de cada módulo. **Cada requisito funcional de este documento es un `Requirement` de un spec** |
| [diseno/pantallas/](../diseno/pantallas/README.md) | La ficha de cada pantalla del canvas Deploya v4.1 |
| [propuesta.md](../propuesta.md) | Documento histórico: problema, usuarios, riesgos y criterios de éxito |

## 1. Introducción

**Deploya** es una plataforma como servicio (PaaS) de alojamiento: un cliente pega la URL de un repositorio público de GitHub con `Dockerfile` o con un stack que Deploya reconoce (Node, Python, Go o sitio estático) y la plataforma lo construye, lo corre en un contenedor con los límites de su plan y lo publica en `https://<proyecto>.<dominio>`. Cada versión queda guardada y se puede volver a una anterior sin reconstruir. Es de código abierto y se puede instalar en un servidor propio (modo autoalojado).

### 1.1 Alcance

Dentro: el recorrido que se evalúa ([alcance.md § Recorrido](../alcance.md#recorrido-que-se-evalúa)) —registro, verificación, sesión, planes y pago simulado, alta de proyecto, cinco etapas de despliegue, operación (redesplegar, revertir, reiniciar, detener, variables, eliminar), ciclo de la suscripción y administración— más el sprint fuera de alcance aprobado el 20 de octubre (avisos por correo, métricas y gráficas, bitácoras de ejecución, reactivar cuenta, infraestructura y autoalojado) y el endurecimiento de la entrega final (límite de intentos, limpieza diaria, web lista para el público).

Fuera: M8 (asistente e integración) queda como stub; repositorios privados, otros proveedores de Git, dominios propios por proyecto, complementos (bases de datos administradas) y escalado horizontal ([alcance.md § Fuera de alcance](../alcance.md#fuera-de-alcance--solo-si-da-el-tiempo)).

### 1.2 Actores

| Actor | Qué hace | Cómo llega |
|---|---|---|
| Visitante | Ve la portada y los planes; se registra | Sin sesión |
| Cliente | Contrata, crea proyectos, despliega, opera y observa; administra su cuenta | Registro y verificación de correo |
| Administrador | Ve usuarios, suspende y reactiva cuentas, corre el ciclo y la limpieza, ve la infraestructura; en autoalojado, ajusta la instalación | Seed (nube) o asistente de primera configuración (autoalojado) |
| Sistema (trabajador) | Construye, ejecuta, enruta y verifica salud; corre las tareas diarias (ciclo 00:05 UTC, limpieza 00:35 UTC) | Proceso aparte con BullMQ (ADR 0002) |
| Externos | GitHub (API pública), proveedor SMTP, Let's Encrypt y proveedor DNS | Puertos y adaptadores |

## 2. Requisitos funcionales

Un requisito funcional (RF) por cada `Requirement` de los specs. «Escenarios» es el número de `Scenario` del spec; **cada escenario tiene su prueba unitaria con el mismo nombre** en el `it(...)` (regla de [ingenieria.md](../ingenieria.md)).

| Id | Módulo | Requisito | Escenarios | Pantalla | Spec | Dueño |
|---|---|---|---|---|---|---|
| RF-M1-01 | M1 | Registro de cuenta | 4 | 01, 01b | [identidad](../../openspec/specs/identidad/spec.md#requirement-registro-de-cuenta) | Eddy |
| RF-M1-02 | M1 | Verificación de correo | 5 | 02, 24 | [identidad](../../openspec/specs/identidad/spec.md#requirement-verificación-de-correo) | Eddy |
| RF-M1-03 | M1 | Inicio y cierre de sesión | 7 | 03, 03b, 28 | [identidad](../../openspec/specs/identidad/spec.md#requirement-inicio-y-cierre-de-sesión) | Eddy |
| RF-M1-04 | M1 | Roles | 2 | 28 | [identidad](../../openspec/specs/identidad/spec.md#requirement-roles) | Eddy |
| RF-M1-05 | M1 | Recuperación de contraseña | 7 | 04, 24 | [identidad](../../openspec/specs/identidad/spec.md#requirement-recuperación-de-contraseña) | Eddy |
| RF-M1-06 | M1 | Mi cuenta | 7 | 05, 05b | [identidad](../../openspec/specs/identidad/spec.md#requirement-mi-cuenta) | Eddy |
| RF-M1-07 | M1 | Ilustraciones de acceso | 3 | 01, 03 | [identidad](../../openspec/specs/identidad/spec.md#requirement-ilustraciones-de-acceso) | Eddy |
| RF-M1-08 | M1 | Último cambio de contraseña | 3 | 05b | [identidad](../../openspec/specs/identidad/spec.md#requirement-último-cambio-de-contraseña) | Eddy |
| RF-M1-09 | M1 | Primera configuración | 10 | 31 | [identidad](../../openspec/specs/identidad/spec.md#requirement-primera-configuración) | Eddy |
| RF-M1-10 | M1 | Límite de intentos | 6 | 01, 03 | [identidad](../../openspec/specs/identidad/spec.md#requirement-límite-de-intentos) | Eddy |
| RF-M10-01 | M10 | Puerto de correo | 1 | 24 | [notificaciones](../../openspec/specs/notificaciones/spec.md#requirement-puerto-de-correo) | Eddy |
| RF-M10-02 | M10 | Proveedor intercambiable por configuración | 4 | 24 | [notificaciones](../../openspec/specs/notificaciones/spec.md#requirement-proveedor-intercambiable-por-configuración) | Eddy |
| RF-M10-03 | M10 | Plantillas | 3 | 24, 24b | [notificaciones](../../openspec/specs/notificaciones/spec.md#requirement-plantillas) | Eddy |
| RF-M10-04 | M10 | Avisos por correo | 4 | 24b | [notificaciones](../../openspec/specs/notificaciones/spec.md#requirement-avisos-por-correo) | Eddy |
| RF-M10-05 | M10 | Correo de la instalación | 3 | 31, 32 | [notificaciones](../../openspec/specs/notificaciones/spec.md#requirement-correo-de-la-instalación) | Eddy |
| RF-M2-01 | M2 | Catálogo | 3 | 06 | [suscripciones](../../openspec/specs/suscripciones/spec.md#requirement-catálogo) | Javier |
| RF-M2-02 | M2 | Sandbox inicial | 4 | 01b, 10b | [suscripciones](../../openspec/specs/suscripciones/spec.md#requirement-sandbox-inicial) | Javier |
| RF-M2-03 | M2 | Contratación con pago simulado | 5 | 07, 07b | [suscripciones](../../openspec/specs/suscripciones/spec.md#requirement-contratación-con-pago-simulado) | Javier |
| RF-M2-04 | M2 | Renovación y cambio de plan | 4 | 08 | [suscripciones](../../openspec/specs/suscripciones/spec.md#requirement-renovación-y-cambio-de-plan) | Javier |
| RF-M2-05 | M2 | Historial de pagos | 4 | 09, 09b | [suscripciones](../../openspec/specs/suscripciones/spec.md#requirement-historial-de-pagos) | Javier |
| RF-M2-06 | M2 | Cuotas aplicadas | 2 | 08, 10 | [suscripciones](../../openspec/specs/suscripciones/spec.md#requirement-cuotas-aplicadas) | Javier |
| RF-M2-07 | M2 | Ciclo de vida §4.4 | 8 | 10c, 28 | [suscripciones](../../openspec/specs/suscripciones/spec.md#requirement-ciclo-de-vida-44) | Javier |
| RF-M2-08 | M2 | Seed idempotente | 5 | — | [suscripciones](../../openspec/specs/suscripciones/spec.md#requirement-seed-idempotente) | Javier |
| RF-M2-09 | M2 | Mi suscripción | 3 | 08 | [suscripciones](../../openspec/specs/suscripciones/spec.md#requirement-mi-suscripción) | Javier |
| RF-M2-10 | M2 | Seed de autoalojado sin administrador | 4 | 31 | [suscripciones](../../openspec/specs/suscripciones/spec.md#requirement-seed-de-autoalojado-sin-administrador) | Javier |
| RF-M2-11 | M2 | Modo de instalación | 6 | 30 | [suscripciones](../../openspec/specs/suscripciones/spec.md#requirement-modo-de-instalación) | Javier |
| RF-M2-12 | M2 | Avisos del ciclo | 2 | 24b | [suscripciones](../../openspec/specs/suscripciones/spec.md#requirement-avisos-del-ciclo) | Javier |
| RF-M3-01 | M3 | Lista de proyectos | 4 | 10, 10b | [proyectos](../../openspec/specs/proyectos/spec.md#requirement-lista-de-proyectos) | Eduardo |
| RF-M3-02 | M3 | Alta desde repositorio | 11 | 11a, 11e | [proyectos](../../openspec/specs/proyectos/spec.md#requirement-alta-desde-repositorio) | Eduardo |
| RF-M3-03 | M3 | Límite y estado de la suscripción | 8 | 10c, 11e | [proyectos](../../openspec/specs/proyectos/spec.md#requirement-límite-y-estado-de-la-suscripción) | Eduardo |
| RF-M3-04 | M3 | Revisar y desplegar | 2 | 11d | [proyectos](../../openspec/specs/proyectos/spec.md#requirement-revisar-y-desplegar) | Eduardo |
| RF-M3-05 | M3 | Variables cifradas | 4 | 11c, 17 | [proyectos](../../openspec/specs/proyectos/spec.md#requirement-variables-cifradas) | Eduardo |
| RF-M3-06 | M3 | Configuración y eliminación | 7 | 19, 19b | [proyectos](../../openspec/specs/proyectos/spec.md#requirement-configuración-y-eliminación) | Eduardo |
| RF-M3-07 | M3 | Web lista para el público | 4 | Todas (28) | [proyectos](../../openspec/specs/proyectos/spec.md#requirement-web-lista-para-el-público) | Eduardo |
| RF-M4-01 | M4 | Recepción y cola | 3 | 12 | [motor-construccion](../../openspec/specs/motor-construccion/spec.md#requirement-recepción-y-cola) | Derek |
| RF-M4-02 | M4 | Construcción con Dockerfile | 5 | 12 | [motor-construccion](../../openspec/specs/motor-construccion/spec.md#requirement-construcción-con-dockerfile) | Derek |
| RF-M4-03 | M4 | Bitácora | 2 | 12, 12c | [motor-construccion](../../openspec/specs/motor-construccion/spec.md#requirement-bitácora) | Derek |
| RF-M4-04 | M4 | Acciones sobre despliegues | 7 | 12, 14 | [motor-construccion](../../openspec/specs/motor-construccion/spec.md#requirement-acciones-sobre-despliegues) | Derek |
| RF-M4-05 | M4 | Máquina de estados del despliegue | 2 | 12, 12b, 12c | [motor-construccion](../../openspec/specs/motor-construccion/spec.md#requirement-máquina-de-estados-del-despliegue) | Derek |
| RF-M4-06 | M4 | Vista del despliegue con cinco etapas | 1 | 12 | [motor-construccion](../../openspec/specs/motor-construccion/spec.md#requirement-vista-del-despliegue-con-cinco-etapas) | Derek |
| RF-M4-07 | M4 | Detección de stack | 7 | 11a, 12 | [motor-construccion](../../openspec/specs/motor-construccion/spec.md#requirement-detección-de-stack) | Derek |
| RF-M4-08 | M4 | Consulta por número de despliegue | 2 | 12 | [motor-construccion](../../openspec/specs/motor-construccion/spec.md#requirement-consulta-por-número-de-despliegue) | Derek |
| RF-M4-09 | M4 | Tiempos por etapa | 2 | 14c | [motor-construccion](../../openspec/specs/motor-construccion/spec.md#requirement-tiempos-por-etapa) | Derek |
| RF-M5-01 | M5 | Límites del plan | 2 | 13 | [orquestacion](../../openspec/specs/orquestacion/spec.md#requirement-límites-del-plan) | Derek |
| RF-M5-02 | M5 | Verificación de salud | 2 | 12b | [orquestacion](../../openspec/specs/orquestacion/spec.md#requirement-verificación-de-salud) | Derek |
| RF-M5-03 | M5 | Acciones del cliente | 6 | 13, 19 | [orquestacion](../../openspec/specs/orquestacion/spec.md#requirement-acciones-del-cliente) | Derek |
| RF-M5-04 | M5 | Suspensión | 3 | 25b, 28 | [orquestacion](../../openspec/specs/orquestacion/spec.md#requirement-suspensión) | Derek |
| RF-M5-05 | M5 | Versionado y retención | 2 | 14 | [orquestacion](../../openspec/specs/orquestacion/spec.md#requirement-versionado-y-retención) | Derek |
| RF-M5-06 | M5 | Reversión sin reconstruir | 6 | 14 | [orquestacion](../../openspec/specs/orquestacion/spec.md#requirement-reversión-sin-reconstruir) | Derek |
| RF-M5-07 | M5 | Bloqueos por suscripción y cuota | 6 | 10c, 28 | [orquestacion](../../openspec/specs/orquestacion/spec.md#requirement-bloqueos-por-suscripción-y-cuota) | Derek |
| RF-M5-08 | M5 | Variables de entorno en el contenedor | 3 | 17 | [orquestacion](../../openspec/specs/orquestacion/spec.md#requirement-variables-de-entorno-en-el-contenedor) | Derek |
| RF-M5-09 | M5 | Métricas de contenedor | 6 | 16 | [orquestacion](../../openspec/specs/orquestacion/spec.md#requirement-métricas-de-contenedor) | Derek |
| RF-M6-01 | M6 | Subdominio automático | 2 | 12b | [enrutamiento](../../openspec/specs/enrutamiento/spec.md#requirement-subdominio-automático) | Derek |
| RF-M6-02 | M6 | HTTPS | 3 | 12b | [enrutamiento](../../openspec/specs/enrutamiento/spec.md#requirement-https) | Derek |
| RF-M6-03 | M6 | Conmutación sin interrupción | 2 | 14 | [enrutamiento](../../openspec/specs/enrutamiento/spec.md#requirement-conmutación-sin-interrupción) | Derek |
| RF-M7-01 | M7 | Vista de despliegue | 5 | 12 | [observabilidad](../../openspec/specs/observabilidad/spec.md#requirement-vista-de-despliegue) | Eduardo |
| RF-M7-02 | M7 | Resumen del proyecto | 3 | 13 | [observabilidad](../../openspec/specs/observabilidad/spec.md#requirement-resumen-del-proyecto) | Eduardo |
| RF-M7-03 | M7 | Historial de despliegues | 4 | 14 | [observabilidad](../../openspec/specs/observabilidad/spec.md#requirement-historial-de-despliegues) | Eduardo |
| RF-M7-04 | M7 | Consumo del período | 3 | 08 | [observabilidad](../../openspec/specs/observabilidad/spec.md#requirement-consumo-del-período) | Eduardo |
| RF-M7-05 | M7 | Métricas del proyecto | 6 | 16 | [observabilidad](../../openspec/specs/observabilidad/spec.md#requirement-métricas-del-proyecto) | Eduardo |
| RF-M7-06 | M7 | Tiempo por etapa | 3 | 14c | [observabilidad](../../openspec/specs/observabilidad/spec.md#requirement-tiempo-por-etapa) | Eduardo |
| RF-M7-07 | M7 | Ritmo de construcciones | 3 | 08c | [observabilidad](../../openspec/specs/observabilidad/spec.md#requirement-ritmo-de-construcciones) | Eduardo |
| RF-M7-08 | M7 | Bitácora de ejecución | 3 | 15 | [observabilidad](../../openspec/specs/observabilidad/spec.md#requirement-bitácora-de-ejecución) | Eduardo |
| RF-M9-01 | M9 | Usuarios | 4 | 25 | [administracion](../../openspec/specs/administracion/spec.md#requirement-usuarios) | Javier |
| RF-M9-02 | M9 | Suspender cuenta | 4 | 25b | [administracion](../../openspec/specs/administracion/spec.md#requirement-suspender-cuenta) | Javier |
| RF-M9-03 | M9 | Reactivar cuenta | 4 | 25c | [administracion](../../openspec/specs/administracion/spec.md#requirement-reactivar-cuenta) | Javier |
| RF-M9-04 | M9 | Ajustes de la instalación | 8 | 32 | [administracion](../../openspec/specs/administracion/spec.md#requirement-ajustes-de-la-instalación) | Javier |
| RF-M9-05 | M9 | Infraestructura | 3 | 27 | [administracion](../../openspec/specs/administracion/spec.md#requirement-infraestructura) | Javier |
| RF-M9-06 | M9 | Limpieza diaria | 4 | 32 | [administracion](../../openspec/specs/administracion/spec.md#requirement-limpieza-diaria) | Javier |
| RF-T-01 | Transversal | Repositorio de código abierto | 2 | 30 | [instalacion](../../openspec/specs/instalacion/spec.md#requirement-repositorio-de-código-abierto) | Derek |
| RF-T-02 | Transversal | Instalador por etapas | 11 | 30, 31 | [instalacion](../../openspec/specs/instalacion/spec.md#requirement-instalador-por-etapas) | Derek |
| RF-T-03 | Transversal | Actualizar y respaldar | 5 | 32 | [instalacion](../../openspec/specs/instalacion/spec.md#requirement-actualizar-y-respaldar) | Derek |
| RF-M8-01 | M8 | Stub | 1 | — | [herramientas](../../openspec/specs/herramientas/spec.md#requirement-stub) | Derek |

**Total: 73 requisitos funcionales y 309 escenarios**, todos con prueba.

## 3. Requisitos no funcionales

| Id | Categoría | Requisito | Cómo se cumple | Cómo se verifica |
|---|---|---|---|---|
| RNF-01 | Seguridad | Contraseñas de 12 o más caracteres con mayúsculas, minúsculas, número y símbolo; guardadas con hash | `PoliticaContrasena`, `HashContrasena` (scrypt) | Escenarios de «Registro de cuenta» |
| RNF-02 | Seguridad | La sesión va en una cookie `HttpOnly`, `SameSite=Lax` y `Secure` con HTTPS; expira a los 7 días sin actividad | `cookieSesion`, `sesionVigente` | Escenarios de «Inicio y cierre de sesión» |
| RNF-03 | Seguridad | Límite de intentos: 5 fallos de contraseña por IP y correo en 15 min, 10 registros por IP por hora, 3 correos por cuenta por hora; 429 con `Retry-After` | `LimiteIntentos` (EST-01a) detrás de `trust proxy` | Escenarios de «Límite de intentos» y el recorrido e2e |
| RNF-04 | Seguridad | Las variables de entorno se guardan cifradas (AES-256-GCM) y nunca se devuelven en claro sin pedirlas | `CifradorAesGcm` (`CLAVE_CIFRADO_VARIABLES`) | «Variables cifradas» |
| RNF-05 | Seguridad | El código del cliente corre sin privilegios: `CapDrop ALL`, `no-new-privileges`, una red por proyecto y CPU y memoria del plan; la construcción se corta a los 10 min | `ContenedorDocker`, `TIEMPO_MAXIMO_CONSTRUCCION_MS` | «Límites del plan»; `contenedor-docker.spec.ts` |
| RNF-06 | Seguridad | Todo por HTTPS con certificado comodín; la web manda `X-Frame-Options`, `nosniff`, `Referrer-Policy` y `Permissions-Policy` | Traefik + Let's Encrypt DNS-01 (ADR 0007); `next.config.ts` | «HTTPS»; «Cabeceras de seguridad» |
| RNF-07 | Seguridad | Sin secretos en el repositorio | `.env.vps` solo en el servidor; gitleaks en CI | Job «Secretos (gitleaks)» |
| RNF-08 | Disponibilidad | Redesplegar y revertir no cortan el servicio: la versión anterior atiende hasta que la nueva pasa la salud. Los servicios y las apps vuelven solos tras un reinicio | «Conmutación sin interrupción»; `restart: unless-stopped` | Escenarios de enrutamiento; recorrido L7 en el VPS |
| RNF-09 | Rendimiento | Revertir a una versión anterior tarda segundos porque reutiliza la imagen guardada | `RepositorioArtefactos` (ADR 0004) | «Reversión sin reconstruir» |
| RNF-10 | Rendimiento | La web refleja el avance de un despliegue cada 3 s sin WebSocket | Polling (ADR 0006) | «Vista del despliegue con cinco etapas» |
| RNF-11 | Portabilidad | Todo se levanta con `docker compose up`; un servidor limpio se instala con `scripts/instalar.sh` | Compose, instalador por etapas (ADR 0008) | Job «Smoke compose»; L8 |
| RNF-12 | Mantenibilidad | Monolito modular hexagonal; SOLID; puertos como `abstract class`; ≥ 80 % de líneas en dominio y servicios | [ingenieria.md](../ingenieria.md) | `pnpm test:cov`; [AUDITORIA_SOLID_CLEAN.md](../AUDITORIA_SOLID_CLEAN.md) |
| RNF-13 | Calidad | Cada escenario con su prueba; CI en verde en cada PR | Jest y `node --test`; [ci.yml](../../.github/workflows/ci.yml) | Jobs «Build y pruebas» y «Smoke compose» (con el recorrido e2e) |
| RNF-14 | Usabilidad | Interfaz en español con el design system v4.1, en claro y oscuro; cada pantalla con su título y sus estados de carga y error | [diseno/](../diseno/README.md); EST-01c | Revisión en claro y oscuro de cada historia |
| RNF-15 | Accesibilidad | WCAG 2.1 AA en las pantallas del recorrido | Landmarks, nombres accesibles, foco visible | [accesibilidad.md](accesibilidad.md) |
| RNF-16 | Datos | Respaldo diario con 7 días de retención y restauración probada; limpieza diaria de tokens, sesiones e invitaciones vencidas | `respaldar.sh`; `LimpiezaService` (EST-01b) | «Actualizar y respaldar»; «Limpieza diaria» |
| RNF-17 | Interoperabilidad | El correo sale por cualquier proveedor SMTP y la pasarela, el proveedor de fuente y el enrutador se cambian implementando un puerto | `CorreoPuerto`, `PasarelaPago`, `ProveedorFuente`, `EnrutamientoPuerto` | Escenarios de «Proveedor intercambiable por configuración» |

## 4. Casos de uso

Los diagramas de casos de uso y de actividad están en [docs/diagramas/m1-m10/](../diagramas/m1-m10/README.md) (`m1-m10-casos-de-uso-autenticacion.mmd`, actividades por módulo) y la secuencia completa en [secuencia-recorrido-e2e.mmd](../diagramas/compartido/secuencia-recorrido-e2e.mmd).

| CU | Actor | Caso de uso | RF | Pantallas |
|---|---|---|---|---|
| CU-01 | Visitante | Registrarse y verificar el correo | RF-M1-01, RF-M1-02, RF-M2-02 | 01, 01b, 02 |
| CU-02 | Cliente | Iniciar y cerrar sesión; recuperar la contraseña | RF-M1-03, RF-M1-05 | 03, 03b, 04 |
| CU-03 | Cliente | Administrar su cuenta y sus sesiones | RF-M1-06, RF-M1-08 | 05, 05b |
| CU-04 | Cliente | Contratar, renovar o cambiar de plan con pago simulado | RF-M2-03, RF-M2-04, RF-M2-05 | 06, 07, 07b, 08, 09 |
| CU-05 | Cliente | Crear un proyecto desde un repositorio y desplegarlo | RF-M3-02, RF-M3-04, RF-M4-01, RF-M4-02, RF-M4-07, RF-M6-01 | 11a–11e, 12 |
| CU-06 | Cliente | Seguir un despliegue por sus cinco etapas | RF-M4-03, RF-M4-05, RF-M4-06, RF-M7-01 | 12, 12b, 12c |
| CU-07 | Cliente | Operar: redesplegar, revertir, reiniciar, detener | RF-M4-04, RF-M5-03, RF-M5-06, RF-M6-03 | 13, 14, 19 |
| CU-08 | Cliente | Cambiar variables, configuración o eliminar el proyecto | RF-M3-05, RF-M3-06, RF-M5-08 | 17, 19, 19b |
| CU-09 | Cliente | Observar: resumen, métricas, bitácoras, tiempos y ritmo | RF-M7-02 a RF-M7-08 | 13, 13c, 14c, 15, 16, 08c |
| CU-10 | Sistema | Correr el ciclo §4.4 y avisar por correo | RF-M2-07, RF-M2-12, RF-M10-04 | 10c, 24b, 28 |
| CU-11 | Administrador | Ver usuarios, suspender y reactivar | RF-M9-01, RF-M9-02, RF-M9-03, RF-M5-04 | 25, 25b, 25c |
| CU-12 | Administrador | Ver la infraestructura y correr la limpieza | RF-M9-05, RF-M9-06 | 27, 32 |
| CU-13 | Administrador | Instalar Deploya en un servidor propio y configurarlo | RF-T-01 a RF-T-03, RF-M1-09, RF-M9-04 | 30, 31, 32 |

## 5. Trazabilidad del recorrido evaluado

| Paso del recorrido ([alcance.md](../alcance.md#recorrido-que-se-evalúa)) | RF | Prueba automática de punta a punta |
|---|---|---|
| 1. Registro → verificación → sesión (Sandbox) | RF-M1-01 a 03, RF-M2-02 | `e2e/recorrido.mjs` pasos 1–5 (Mailpit real) |
| 2. Planes → contratar (aprobado / rechazado) | RF-M2-01, RF-M2-03 | `e2e/recorrido.mjs` paso 6 |
| 3. Crear proyecto → Desplegar | RF-M3-02, RF-M3-04 | `e2e/recorrido.mjs` paso 7 (despliegue #1 encolado) |
| 4. Cinco etapas → Saludable → URL HTTPS | RF-M4-01 a 06, RF-M5-02, RF-M6-01, RF-M6-02 | Unitarias del motor; L7 `e2e/vps.mjs` en el VPS |
| 5. Operar y revertir sin reconstruir | RF-M4-04, RF-M5-03, RF-M5-06 | Unitarias; L7 en el VPS |
| 6. Ciclo: vence → bloquea → suspende | RF-M2-07, RF-M5-07 | Unitarias de `PoliticaCiclo` |
| 7. Administración: listar y suspender | RF-M9-01, RF-M9-02 | Unitarias; negativo 403 de un Cliente en `e2e/recorrido.mjs` |

Los negativos del recorrido e2e: 403 sin verificar, 403 de un Cliente en `/admin/usuarios`, 404 de un proyecto ajeno y 429 al sexto fallo de contraseña.

## 6. Criterios de aceptación de la entrega

Los de la propuesta (§14), con dónde se comprueban:

| Criterio | Dónde |
|---|---|
| Un usuario nuevo completa registro, contratación y publicación por HTTPS sin ayuda | [manual-usuario.md](manual-usuario.md); guion de demo partes 2–4 |
| Los límites del plan se aplican sobre el contenedor y se ven en el panel | RF-M5-01; pantalla 13 «Recursos aplicados» |
| La reversión se completa sin reconstruir | RF-M5-06; bitácora «Imagen … reutilizada · sin reconstruir» |
| La plataforma se instala en un servidor limpio con el manual técnico | [manual-tecnico.md § Autoalojado](manual-tecnico.md#4-autoalojado-servidor-propio) |
| Cada decisión de arquitectura tiene su registro | ADR 0001–0008 en [docs/adr/](../adr/README.md) |
| La documentación está completa y es consistente con el sistema | Este directorio, [diseno-final.md](diseno-final.md) |
