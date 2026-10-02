# Plan de avances — alcance núcleo v4.1

Qué entrega cada quien en cada avance. Alcance: [alcance.md](alcance.md). Rituales y definición de terminado: [METODOLOGIA.md](../METODOLOGIA.md).

## Cómo se mide el porcentaje

Cada historia del núcleo tiene puntos (1 = medio día, 5 = casi una semana a tiempo parcial). El porcentaje de un avance es la suma acumulada de puntos **terminados** (según la definición de terminado) sobre el total del núcleo. Lo de "solo si da el tiempo" no suma ni resta.

| Entrega | Puntos nuevos | Acumulado | % del sistema |
|---|---|---|---|
| Ya entregado (bootstrap, diagramas, design system v4.1) | 13 | 13 | 9 % |
| **Avance 1** | 33 | 46 | **32 %** |
| Avance 2 | 37 (11 ya en `main`) | 83 | 57 % |
| Avance 3 | 40 | 123 | 85 % |
| Entrega final | 22 | 145 | 100 % |

El Avance 1 queda por encima del 30 % a propósito. Con la detección de stack (M4-03, 5 pts) y la reversión sin reconstruir (M5-04, 3 pts), que volvieron al núcleo por la retroalimentación de la entrega 1, el total pasa de 137 a 145 puntos y el Avance 1 baja de 34 % a 32 %: sigue habiendo margen, pero ahora es de una historia pequeña.

| Persona | Hecho | A1 | A2 | A3 | Final | Total |
|---|---|---|---|---|---|---|
| Eddy | — | 10 | 6 | 4 | 5 | 25 |
| Javier | — | 5 | 11 | 13 | 3 | 32 |
| Eduardo | 3 | 8 | 8 | 10 | 3 | 32 |
| Derek | 5 | 10 | 12 | 13 | 3 | 43 |
| Todos | 5 | — | — | — | 8 | 13 |

Javier tiene menos puntos en el Avance 1 porque su schema bloquea a todos: tiene que estar en `main` el lunes.

## Backlog del núcleo

| Id | Historia | Pantallas | Dueño | Pts | Entrega |
|---|---|---|---|---|---|
| H-01 | Monorepo, compose, CI y stubs `health` | — | Derek | 3 | Hecho |
| H-02 | Kit visual canónico en `apps/web` | — | Eduardo | 3 | Hecho |
| H-03 | Diagramas UML, ERD y C4 + specs OpenSpec | — | Todos | 5 | Hecho |
| M10-01 | `CorreoPuerto` + adaptador SMTP configurable (Mailpit en desarrollo) + adaptador de consola + correo de verificación | 24 | Eddy | 2 | **A1** |
| M1-01 | Registro (cuenta pendiente de verificación) | 01, 01b | Eddy | 3 | **A1** |
| M1-02 | Verificación de correo por enlace | 02 | Eddy | 2 | **A1** |
| M1-03 | Iniciar y cerrar sesión + guard de sesión | 03 | Eddy | 3 | **A1** |
| M1-04 | Estados de login, reenviar verificación, roles y 403 | 02, 03b, 28 | Eddy | 2 | A2 |
| M1-05 | Recuperar contraseña | 04 | Eddy | 3 | A2 |
| M10-02 | Correo de recuperación | 24 | Eddy | 1 | A2 |
| M1-06 | Mi cuenta · Perfil | 05 | Eddy | 2 | A3 |
| M1-07 | Mi cuenta · Seguridad | 05b | Eddy | 2 | A3 |
| QA-01 | Pruebas e2e del recorrido completo en CI | — | Eddy | 5 | Final |
| DB-01 | Schema Prisma del núcleo + seed (planes v4.1, admin) + Sandbox al registrarse | — | Javier | 3 | **A1** |
| M2-01 | Catálogo de planes (público) | 06 | Javier | 2 | **A1** |
| M2-02 | Contratación con pasarela simulada | 07, 07b | Javier | 5 | A2 |
| M2-03 | Mi suscripción: vigencia, consumo, renovar | 08 | Javier | 3 | A2 |
| M2-04 | Cambiar plan (ascenso / descenso) | 08 | Javier | 3 | A2 |
| M2-05 | Ciclo §4.4 (tarea diaria) y bloqueos | 10c, 28 | Javier | 5 | A3 |
| M2-06 | Historial de pagos y comprobante PDF | 09, 09b | Javier | 3 | A3 |
| M9-01 | Admin · Usuarios | 25 | Javier | 3 | A3 |
| M9-02 | Admin · Suspender cuenta | 25b | Javier | 2 | A3 |
| DOC-01 | Documento de requisitos y manual de usuario | — | Javier | 3 | Final |
| WEB-01 | Design system v4.1 migrado: tokens, componentes, shell, `/sistema` y `docs/diseno` | Main | Derek | 2 | Hecho |
| M3-01 | Lista de proyectos y primer proyecto | 10, 10b | Eduardo | 3 | **A1** |
| M3-02 | Nuevo proyecto: repositorio, revisar y desplegar | 11a, 11d, 11e | Eduardo | 5 | **A1** |
| M7-01 | Vista de despliegue: riel de etapas y bitácora | 12, 12b, 12c | Eduardo | 5 | A2 |
| M3-03 | Variables de entorno cifradas | 11c, 17 | Eduardo | 3 | A2 |
| M7-02 | Resumen e historial del proyecto | 13, 14 | Eduardo | 3 | A3 |
| M3-04 | Configuración y eliminar proyecto | 19, 19b | Eduardo | 3 | A3 |
| WEB-02 | Estados del sistema + banner de vencida | 10c, 28 | Eduardo | 2 | A3 |
| M7-03 | Consumo del período y actividad | 08, 13 | Eduardo | 2 | A3 |
| DOC-02 | Guion de demo, video y revisión de accesibilidad | — | Eduardo | 3 | Final |
| ENG-01 | Compose: trabajador, Traefik y Mailpit | — | Derek | 2 | **A1** |
| M4-01 | Cola + clonar + `docker build` + artefacto + bitácora | 12 | Derek | 5 | **A1** |
| M5-01 | Ejecutar contenedor con límites + verificación de salud | 12b | Derek | 3 | **A1** |
| M6-01 | Subdominio `<proyecto>.localhost` vía `EnrutamientoPuerto` | 12b | Derek | 2 | A2 |
| M5-02 | Conmutación sin corte, reiniciar y detener | 12b, 13 | Derek | 3 | A2 |
| M5-03 | Bloqueos por suscripción y cuota de construcciones | 10c | Derek | 2 | A2 |
| M4-03 | Detección de stack sin `Dockerfile` (Node, Python, Go, estático) con recetas de Deploya | 11a, 11e, 12 | Derek (+ Eduardo en 11a/11e) | 5 | A2 |
| M4-02 | Cancelar, reintentar y redesplegar | 12, 12c, 14 | Derek | 3 | A3 |
| M5-04 | Versionado con retención (5 artefactos) y reversión sin reconstruir (estado Revirtiendo) | 13, 14 | Derek (+ Eduardo en 14) | 3 | A3 |
| M6-02 | VPS con `*.deploya.app`, HTTPS comodín y credenciales SMTP del proveedor de correo (SPF/DKIM) | — | Derek | 5 | A3 |
| ADR | ADR: Dockerfile, cola, polling, Traefik | — | Derek | 2 | A3 |
| DOC-03 | Documento de diseño final y manual técnico | — | Derek | 3 | Final |
| EST-01 | Estabilización, corrección de errores y ensayo | — | Todos | 8 | Final |

Rama por historia: `feat/m<n>-<slug>` (p. ej. `feat/m1-registro`). Cada historia entra con su change de OpenSpec.

---

## Avance 1 — 30 % (miércoles 30 de septiembre)

La versión visual de esta sección, con las pantallas de cada quien y la presentación, está en la página **Entrega 1 · guía y presentación** del canvas Deploya v4.1 (<https://claude.ai/artifact/B89rty3MNxRKW9RHJQwSZT>).

### Regla de calidad para todas las historias

La hoja **Entrega 1 · Calidad** del canvas resume esta regla. Cada historia del avance entra con su diseño en SOLID y patrones en el `design.md` del change y con sus **pruebas unitarias** (una por escenario del spec) en verde en CI. Los mínimos por historia están en [ingenieria.md §5.3](ingenieria.md#53-pruebas-mínimas-del-avance-1). Sin eso la historia no suma puntos.

### Qué se demuestra

> Un usuario nuevo se registra, verifica su correo, inicia sesión, ve los planes, crea un proyecto desde un repositorio público con `Dockerfile` y lo ve pasar de *Construyendo* a *Saludable*; la aplicación responde en el navegador.

La contratación con pago, la vista rica de despliegue (riel + bitácora) y el subdominio llegan en el Avance 2. En el Avance 1 el usuario trabaja con su Sandbox (1 proyecto).

### Eddy — cuentas (10 pts)

| Id | Entrega | Terminado cuando |
|---|---|---|
| M10-01 | `CorreoPuerto` + adaptador SMTP configurable (apunta a Mailpit) + plantilla de verificación (pantalla 24) | El correo aparece en Mailpit con el enlace; con `CORREO_ADAPTADOR=consola` sale en el log |
| M1-01 | Registro (01, 01b): validación de contraseña, correo único, cuenta *pendiente* | Correo repetido muestra el error de 01b |
| M1-02 | Verificación (02): token de 24 h y un solo uso; estados válido y expirado | El enlace activa la cuenta una sola vez |
| M1-03 | Iniciar y cerrar sesión (03) + `SesionGuard` y `@UsuarioActual()` para el resto de módulos | Cuenta sin verificar no entra; `/projects` exige sesión |

**Presenta:** registro en vivo → correo en Mailpit → cuenta activa → login. Muestra el intento con contraseña débil y con cuenta sin verificar. Enseña las pruebas unitarias del servicio de identidad.

**Entrega a otros:** el guard y el decorador el **martes a las 12:00** a más tardar. Hasta entonces Eduardo usa el usuario del seed.

### Javier — monetización (5 pts)

| Id | Entrega | Terminado cuando |
|---|---|---|
| DB-01 | Schema Prisma del núcleo: `Usuario`, `TokenCuenta`, `Sesion`, `Plan`, `Suscripcion`, `Pago`, `Proyecto`, `VariableEntorno`, `Despliegue`, `LineaBitacora`. Seed de los cuatro planes v4.1 y del admin. Suscripción Sandbox al crear la cuenta | Migración aplicada en compose; seed idempotente |
| M2-01 | Catálogo público de planes (06) con la tabla de recursos y el cambio 30 / 365 días | `/planes` lee de la base, no de constantes |

**Presenta:** el ERD del núcleo frente al schema real, la página de planes y cómo un usuario nuevo queda en Sandbox. Si le da el tiempo, adelanta M2-02 (contratación) sin prometerla.

**Entrega a otros:** PR del schema **lunes 28**. Antes de abrirlo, pide a Eddy, Eduardo y Derek sus campos (15 minutos en la sincronización).

### Eduardo — proyectos (8 pts)

| Id | Entrega | Terminado cuando |
|---|---|---|
| M3-01 | Lista de proyectos (10) y primer proyecto (10b), con contador frente al límite del plan | Con 0 proyectos se ve 10b; con Sandbox el botón se bloquea al llegar a 1 |
| M3-02 | Nuevo proyecto (11a → 11d): URL, rama, nombre, puerto desde `EXPOSE`; errores de 11e; **Desplegar** llama a la API de Derek | Repo privado y repo sin `Dockerfile` muestran 11e; un repo válido queda desplegando |

El design system ya está migrado (WEB-01): usa `docs/diseno/` y los componentes de `apps/web/src/components`; revisa los PRs con UI de los demás.

**Presenta:** el flujo del panel de punta a punta con un repositorio de ejemplo, los dos errores de 11e y la lista actualizando el estado por polling.

### Derek — motor (10 pts)

| Id | Entrega | Terminado cuando |
|---|---|---|
| ENG-01 | Compose con trabajador, Traefik y Mailpit; repositorio de ejemplo con `Dockerfile` para la demo | `docker compose up` levanta todo con un comando |
| M4-01 | Cola BullMQ, trabajador: clonar rama → `docker build` → artefacto `#n` con digest → líneas de bitácora en la base. API: `POST /proyectos/:id/despliegues`, `GET /despliegues/:id`, `GET /despliegues/:id/bitacora?desde=` | Contrato ya publicado en `docs/contratos/despliegues.md`; la implementación lo respeta |
| M5-01 | Correr la imagen vía `ContenedorPuerto` con `--cpus` y `--memory` del plan (Sandbox), sin privilegios; verificación de salud HTTP → Saludable o Fallido | `docker inspect` muestra los límites |

**Presenta:** el diagrama de estados de despliegue y la secuencia contra lo que corre, la bitácora en la base, `docker inspect` con los límites y la app respondiendo en `hola-deploya.localhost` (Traefik por archivo dinámico, [ADR 0005](adr/0005-traefik-proveedor-de-archivo.md)). Cierra con el diseño ya firmado de la detección de stack y la reversión sin reconstruir (lo que pidió el curso): diagramas de actividad y de secuencia, y cuándo llega cada una.

**Entrega a otros:** el contrato de datos del núcleo ([contratos/datos-nucleo.md](contratos/datos-nucleo.md)) a Javier el **domingo 27**, para que DB-01 salga el lunes sin idas y vueltas; el contrato de despliegues v2 ([contratos/despliegues.md](contratos/despliegues.md)) a Eduardo (v1 no cambia para el Avance 1).

### Calendario hasta el miércoles

| Día | Qué |
|---|---|
| Sáb 26 – dom 27 | Cada quien lee su guía y abre su change con `/opsx-propose`. Javier sube el schema en PR borrador. El contrato de despliegues ya está en `docs/contratos/despliegues.md` |
| Lun 28 | **12:00** schema en `main`. Compose con trabajador, Traefik y Mailpit (Derek). Registro y verificación (Eddy). Lista de proyectos contra el contrato (Eduardo). Catálogo (Javier) |
| Mar 29 | **12:00** guard de sesión en `main` (Eddy). Alta contra la API real (Eduardo). Contenedor con límites y salud (Derek). **20:00** todo en `main`. **21:00** ensayo completo y video de respaldo |
| Mié 30 | Ensayo corto en la mañana sobre `main` limpio. **Presentación** |

### Guion de la presentación (≈ 12 min, 14 diapositivas en el canvas)

1. **Contexto (Derek, 1 min):** qué es Deploya y el recorte de alcance ([alcance.md](alcance.md)): núcleo + lista "solo si da el tiempo".
2. **Cuentas (Eddy, 3 min):** registro → Mailpit → verificación → login; errores.
3. **Planes y datos (Javier, 2 min):** ERD → schema → planes; Sandbox automático.
4. **Proyecto (Eduardo, 3 min):** alta desde el repo de ejemplo; errores; **Desplegar**.
5. **Motor (Derek, 2 min):** bitácora, límites aplicados, app en línea.
6. **Proceso y calidad (Eddy, 1 min):** PRs revisados, CI verde con las pruebas unitarias de cada historia, SOLID y patrones por módulo ([ingenieria.md](ingenieria.md)), changes de OpenSpec archivados, porcentaje con la tabla de arriba.

Plan B: el video grabado el martes en el ensayo, por si falla la red o Docker durante la presentación.

---

## Avance 2 — 50 % (cierre de F3: viernes 9 de octubre)

La versión visual de esta sección (resumen, una hoja por persona, integración y calidad, con las pantallas de cada quien y el estado de cada historia) está en la página **Avance 2 · 50 % · guía** del canvas Deploya v4.1 (<https://claude.ai/artifact/B89rty3MNxRKW9RHJQwSZT>). Fecha: la propuesta cierra F3 el viernes 9 de octubre; si el curso fija otro día de presentación, se mueve el calendario completo y nada más.

### Dónde estamos (2 de octubre)

| | Puntos | Acumulado | % |
|---|---|---|---|
| Hecho hasta el Avance 1 | 46 | 46 | 32 % |
| Javier ya adelantó M2-02, M2-03 y M2-04 (en `main`, PR #15) | 11 | 57 | 39 % |
| **Falta para el 50 %** | **16** de 26 | 73 | 50 % |
| Si entra todo el Avance 2 | 26 | 83 | **57 %** |

Hay margen de una historia grande (10 puntos), pero no de dos. Lo que más pesa: M4-03 (5), M7-01 (5) y M1-05 (3).

### Regla de calidad (igual que en el Avance 1)

Cada historia entra con su change de OpenSpec (diseño en SOLID y patrones en el `design.md`) y con **una prueba unitaria por escenario** en verde en CI. Los mínimos por historia del Avance 2 están en [ingenieria.md §5.4](ingenieria.md#54-pruebas-mínimas-del-avance-2). Sin eso la historia no suma.

### Qué se demuestra

> Todo lo del Avance 1, y además: un usuario recupera su contraseña desde Mailpit, **contrata Starter** con la tarjeta de prueba, crea un proyecto con una variable `SALUDO`, lo ve pasar por el **riel de cinco etapas con la bitácora en vivo** y lo abre en `hola-deploya.localhost`. Cambia `SALUDO` en Variables → **Guardar y desplegar** → la versión nueva entra **sin corte**. Lo detiene y lo reinicia. Despliega la rama `sin-dockerfile` y la bitácora dice **«Stack detectado: Node.js 22»**. Con una cuenta Vencida, «Desplegar» se bloquea y ofrece renovar.

### Changes de OpenSpec del Avance 2 (ya propuestos)

Los changes están en `openspec/changes/` y validan con `openspec validate --all`. Cada dueño los **revisa** (si algo no le cuadra, `/opsx-update`) y luego `/opsx-apply`.

| Change | Historias | Dueño | Toca a |
|---|---|---|---|
| `feat-m1-estados-roles` | M1-04 | Eddy | Javier (usa `RolGuard` en M9) |
| `feat-m1-recuperacion` | M1-05, M10-02 | Eddy | — |
| `feat-m2-contratacion-suscripcion` | M2-02, M2-03, M2-04 | Javier | **Hecho**; falta archivar |
| `feat-m7-vista-despliegue` | M7-01 | Eduardo | Derek (consulta por número) |
| `feat-m3-variables-cifradas` | M3-03 | Eduardo | Derek (variables al contenedor) |
| `feat-m4-deteccion-stack` | M4-03 | Derek | Eduardo (11a, 11e) |
| `feat-m5-acciones-contenedor` | M5-02 y cierre de M6-01 | Derek | Eduardo (botones en 12b; eliminar encola) |
| `feat-m5-bloqueos-cuota` | M5-03 | Derek | Javier (seed de demo), Eduardo (banner en 11d y 17) |

### Eddy — cuentas (6 pts)

| Id | Entrega | Terminado cuando |
|---|---|---|
| M1-04 | Reenviar verificación con cuenta atrás de 60 s (02, 03b); 03b suspendida con motivo y fecha; `RolGuard` + `@Roles()` exportados; 403 y «Sesión expirada» (28) | Un Cliente en `/admin` ve 403; el reenvío antes de 60 s se rechaza con los segundos que faltan |
| M1-05 | Recuperar contraseña (04): solicitud neutra, token de 30 min y un uso, nueva contraseña con la política, cierra todas las sesiones | Un enlace usado o de más de 30 min muestra «Este enlace ya no sirve»; otra sesión abierta queda cerrada |
| M10-02 | `PlantillaRecuperacion` (24) sobre el mismo esqueleto que verificación | El correo llega a Mailpit con botón y enlace en texto plano |

**Presenta:** «Olvidé mi contraseña» → Mailpit → nueva contraseña → el otro navegador pierde la sesión; un Cliente en `/admin` (403).

**Entrega a otros:** `RolGuard` y `@Roles()` el **lunes 5 a las 12:00** (Javier los usa en M9, Avance 3). CI verde en cada PR (dueño de workflows).

### Javier — monetización (11 pts, ya en `main`)

| Id | Entrega | Estado |
|---|---|---|
| M2-02 | Contratación con pasarela simulada (07, 07b) | **Hecho** |
| M2-03 | Mi suscripción: vigencia, consumo, renovar (08) | **Hecho** |
| M2-04 | Cambiar plan: ascenso cobrado, descenso programado (08) | **Hecho** (aplicar el descenso al vencer es M2-05) |

**Esta semana:** archivar `feat-m2-schema-nucleo` y `feat-m2-contratacion-suscripcion`; seed de demo con `vencida@deploya.app` y `suspendida@deploya.app` para M5-03 (**lunes 5**); revisar los PRs que tocan `prisma/`. Si sobra tiempo, adelantar M2-05 (ciclo §4.4) **sin prometerlo**: es lo que más pesa del Avance 3.

**Presenta:** contratar Starter con la tarjeta de prueba (aprobada y rechazada), Mi suscripción con la vigencia, ascenso y descenso programado; la cuenta Vencida bloqueando «Desplegar».

### Eduardo — proyectos y experiencia (8 pts)

| Id | Entrega | Terminado cuando |
|---|---|---|
| M7-01 | Ruta `/projects/[proyecto]/despliegues/[n]` con 12, 12b y 12c: cabecera, riel grande, bitácora con `desde=` cada 3 s, «Copiar», línea del error y aviso de la versión anterior; «Desplegar» lleva a 12 | `hola-deploya` se ve de Encolado a Saludable sin recargar; la rama `roto` resalta la línea del error |
| M3-03 | Variables cifradas: 11c en el alta y 17 con Guardar / Guardar y desplegar / Mostrar; AES-256-GCM con `CLAVE_CIFRADO_VARIABLES` | En la base solo hay `v1:…`; cambiar `SALUDO` y desplegar cambia la página sin corte |

También: textos de 11a y 11e con la detección de stack (`LectorFuenteGitHub`, contrato v2) y el banner de bloqueo en 11d y 17 (M5-03). Revisa los PRs con UI de los demás.

**Presenta:** alta con `SALUDO` → riel y bitácora en vivo → 12b con URL y digest; la rama `roto` en 12c; cambiar la variable en 17 y «Guardar y desplegar».

**Entrega a otros:** `VariablesProyectoService.descifradasDe` exportado el **miércoles 7 a las 12:00** (Derek lo conecta al contenedor).

### Derek — motor (12 pts)

| Id | Entrega | Terminado cuando |
|---|---|---|
| M6-01 | Subdominio `<proyecto>.localhost` vía `EnrutamientoPuerto` (ya corre desde el A1): pruebas de sus escenarios y recorrido verificado desde la API | Alta desde la web → la app responde en su subdominio |
| M5-02 | Conmutación sin corte (ya corre) + reiniciar y detener por una cola de operación; eliminar proyecto borra contenedor, imágenes y ruta | Detener → el subdominio deja de responder; reiniciar → vuelve; `docker ps -a` limpio tras eliminar |
| M5-03 | `BloqueosService`: Vencida o Suspendida bloquean; construcciones del mes (I7) contra `construccionesMes` | `vencida@deploya.app` recibe 409 `suscripcion-no-permite`; la construcción 31 de Sandbox, `cuota-construcciones-agotada` |
| M4-03 | Detección de stack: recetas Node, Python, Go y estático; el `Dockerfile` propio manda | La rama `sin-dockerfile` termina Saludable con receta `node` y la bitácora lo dice |

**Presenta:** la rama `sin-dockerfile` detectada y en línea; «Guardar y desplegar» sin corte (dos pestañas: la app nunca da error); detener y reiniciar; el bloqueo por cuota; el diagrama de actividad de la detección contra lo que corre.

**Entrega a otros:** contrato de despliegues **v2.1** (ya en `docs/contratos/despliegues.md`); `GET /proyectos/:id/despliegues/:numero` el **lunes 5 a las 12:00** (Eduardo); `BloqueosService` el **martes 6 a las 12:00** (Eduardo lo usa en el alta); `DeteccionStackService` el **martes 6** (Eduardo, 11a); rama `sin-dockerfile` y `server.js` con `SALUDO` publicados en el repo público `hola-deploya`.

### Deuda del Avance 1 (antes del lunes 5)

| Qué | Quién |
|---|---|
| `/opsx-archive` de los changes del A1 ya mergeados, en este orden: `feat-m10-correo-verificacion`, `feat-m1-registro-verificacion`, `feat-m1-sesion`, `feat-m2-schema-nucleo`, `feat-m3-alta-proyecto`, `feat-m4-motor-construccion` (tras su tarea 8.2), `feat-m3-eliminar-proyecto` (tras `feat-m5-acciones-contenedor`) | Cada dueño |
| Tarea 8.2 de `feat-m4-motor-construccion`: recorrido desde la API en compose | Derek |
| Tareas 7.8 y 7.9 de `feat-m1-registro-verificacion`: ilustración de 01 y revisión en claro y oscuro | Eddy |

### Calendario hasta el viernes 9

| Día | Qué |
|---|---|
| Vie 2 – dom 4 | Cada quien lee su guía y **revisa** su change (ya propuesto); archivar lo del A1. Contrato v2.1 publicado |
| Lun 5 | **12:00** `RolGuard` (Eddy), consulta por número (Derek) y seed de demo (Javier) en `main`. Recetas de stack (Derek). Vista 12 contra la API (Eduardo). Recuperación (Eddy) |
| Mar 6 | **12:00** `BloqueosService` y `DeteccionStackService` en `main` (Derek). Variables: dominio, cifrado y API (Eduardo). Reiniciar y detener (Derek). Reenvío y 403 (Eddy) |
| Mié 7 | **12:00** `VariablesProyectoService` en `main` (Eduardo). Variables al contenedor (Derek). 11c, 17, 11a y banners (Eduardo) |
| Jue 8 | **20:00** todo en `main`. **21:00** ensayo completo y video de respaldo |
| Vie 9 | Ensayo corto sobre `main` limpio. **Entrega y presentación** |

### Guion de la presentación (≈ 12 min)

1. **Qué cambió (Derek, 1 min):** retroalimentación de la entrega 1 (detección de stack y reversión al núcleo) y el porcentaje con la tabla de arriba.
2. **Cuentas (Eddy, 2 min):** recuperar contraseña con Mailpit; reenvío con cuenta atrás; 403.
3. **Cobro (Javier, 2 min):** contratar Starter con la tarjeta de prueba, rechazo, Mi suscripción, cambiar de plan.
4. **Proyecto en vivo (Eduardo, 3 min):** alta con `SALUDO` → riel y bitácora → 12b; `roto` en 12c; variables en 17.
5. **Motor (Derek, 3 min):** `sin-dockerfile` → stack detectado; Guardar y desplegar sin corte; detener y reiniciar; cuenta Vencida bloqueada.
6. **Proceso y calidad (Javier, 1 min):** changes de OpenSpec, pruebas por escenario en CI, SOLID y patrones por historia.

Plan B: el video grabado el jueves en el ensayo.

## Avance 3 — 80 %

Recorrido: todo + ciclo §4.4 (vencida bloquea, suspendida detiene), historial de pagos, administración de usuarios con suspensión, configuración y borrado de proyecto, **revertir a una versión anterior en segundos sin reconstruir**, plataforma en el VPS con HTTPS.

| Persona | Historias |
|---|---|
| Eddy | M1-06 Perfil · M1-07 Seguridad |
| Javier | M2-05 ciclo §4.4 · M2-06 historial · M9-01 usuarios · M9-02 suspender |
| Eduardo | M7-02 resumen e historial · M3-04 configuración y eliminar · WEB-02 estados del sistema · M7-03 consumo y actividad |
| Derek | M4-02 cancelar, reintentar, redesplegar · **M5-04 reversión sin reconstruir** · M6-02 VPS con HTTPS · ADR |

## Entrega final — 100 %

Pruebas e2e (Eddy), requisitos y manual de usuario (Javier), guion, video y accesibilidad (Eduardo), diseño final y manual técnico (Derek), estabilización y ensayo (todos).

Solo después de la entrega del Avance 3, y si el núcleo está estable, se toma algo de [Fuera de alcance · solo si da el tiempo](alcance.md#fuera-de-alcance--solo-si-da-el-tiempo), en su orden.
