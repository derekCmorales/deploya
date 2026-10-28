# Plan de avances — alcance núcleo v4.1

Qué entrega cada quien en cada avance. Alcance: [alcance.md](alcance.md). Rituales y definición de terminado: [METODOLOGIA.md](../METODOLOGIA.md).

## Cómo se mide el porcentaje

Cada historia del núcleo tiene puntos (1 = medio día, 5 = casi una semana a tiempo parcial). El porcentaje de un avance es la suma acumulada de puntos **terminados** (según la definición de terminado) sobre el total del núcleo. Lo de "solo si da el tiempo" no suma ni resta.

| Entrega | Puntos nuevos | Acumulado | % del sistema |
|---|---|---|---|
| Ya entregado (bootstrap, diagramas, design system v4.1) | 13 | 13 | 9 % |
| **Avance 1** | 33 | 46 | **32 %** |
| Avance 2 | 37 (11 ya en `main`) | 83 | 57 % |
| **Avance 3** | 40 | 123 | **85 %** |
| Entrega final | 22 | 145 | 100 % |

El Avance 1 queda por encima del 30 % a propósito. Con la detección de stack (M4-03, 5 pts) y la reversión sin reconstruir (M5-04, 3 pts), que volvieron al núcleo por la retroalimentación de la entrega 1, el total pasa de 137 a 145 puntos y el Avance 1 baja de 34 % a 32 %: sigue habiendo margen, pero ahora es de una historia pequeña.

| Persona | Hecho | A1 | A2 | A3 | Final | Total |
|---|---|---|---|---|---|---|
| Eddy | — | 10 | 6 | 4 | 2 | 22 |
| Javier | — | 5 | 11 | 13 | 2 | 31 |
| Eduardo | 3 | 8 | 8 | 4 | 2 | 25 |
| Derek | 5 | 10 | 12 | 19 | 16 | 62 |
| Todos | 5 | — | — | — | — | 5 |

Javier tiene menos puntos en el Avance 1 porque su schema bloquea a todos: tiene que estar en `main` el lunes. En la entrega final (28 de octubre) Derek toma toda la documentación y el e2e, y el equipo solo escribe código ([§ Entrega final](#entrega-final--100--entrega-y-exposición-viernes-6-de-noviembre)).

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
| QA-01 | Pruebas e2e del recorrido completo en CI | — | Derek | 5 | Final |
| DB-01 | Schema Prisma del núcleo + seed (planes v4.1, admin) + Sandbox al registrarse | — | Javier | 3 | **A1** |
| M2-01 | Catálogo de planes (público) | 06 | Javier | 2 | **A1** |
| M2-02 | Contratación con pasarela simulada | 07, 07b | Javier | 5 | A2 |
| M2-03 | Mi suscripción: vigencia, consumo, renovar | 08 | Javier | 3 | A2 |
| M2-04 | Cambiar plan (ascenso / descenso) | 08 | Javier | 3 | A2 |
| M2-05 | Ciclo §4.4 (tarea diaria) y bloqueos | 10c, 28 | Javier | 5 | A3 |
| M2-06 | Historial de pagos y comprobante PDF | 09, 09b | Javier | 3 | A3 |
| M9-01 | Admin · Usuarios | 25 | Javier | 3 | A3 |
| M9-02 | Admin · Suspender cuenta | 25b | Javier | 2 | A3 |
| DOC-01 | Documento de requisitos y manual de usuario | — | Derek | 3 | Final |
| WEB-01 | Design system v4.1 migrado: tokens, componentes, shell, `/sistema` y `docs/diseno` | Main | Derek | 2 | Hecho |
| M3-01 | Lista de proyectos y primer proyecto | 10, 10b | Eduardo | 3 | **A1** |
| M3-02 | Nuevo proyecto: repositorio, revisar y desplegar | 11a, 11d, 11e | Eduardo | 5 | **A1** |
| M7-01 | Vista de despliegue: riel de etapas y bitácora | 12, 12b, 12c | Eduardo | 5 | A2 |
| M3-03 | Variables de entorno cifradas | 11c, 17 | Eduardo | 3 | A2 |
| M7-02 | Resumen e historial del proyecto | 13, 14 | Derek | 3 | A3 |
| M3-04 | Configuración y eliminar proyecto | 19, 19b | Derek | 3 | A3 |
| WEB-02 | Estados del sistema + banner de vencida | 10c, 28 | Eduardo | 2 | A3 |
| M7-03 | Consumo del período y actividad | 08, 13 | Eduardo | 2 | A3 |
| DOC-02 | Guion de demo, video y revisión de accesibilidad | — | Derek | 3 | Final |
| ENG-01 | Compose: trabajador, Traefik y Mailpit | — | Derek | 2 | **A1** |
| M4-01 | Cola + clonar + `docker build` + artefacto + bitácora | 12 | Derek | 5 | **A1** |
| M5-01 | Ejecutar contenedor con límites + verificación de salud | 12b | Derek | 3 | **A1** |
| M6-01 | Subdominio `<proyecto>.localhost` vía `EnrutamientoPuerto` | 12b | Derek | 2 | A2 |
| M5-02 | Conmutación sin corte, reiniciar y detener | 12b, 13 | Derek | 3 | A2 |
| M5-03 | Bloqueos por suscripción y cuota de construcciones | 10c | Derek | 2 | A2 |
| M4-03 | Detección de stack sin `Dockerfile` (Node, Python, Go, estático) con recetas de Deploya | 11a, 11e, 12 | Derek (+ Eduardo en 11a/11e) | 5 | A2 |
| M4-02 | Cancelar, reintentar y redesplegar | 12, 12c, 14 | Derek | 3 | A3 |
| M5-04 | Versionado con retención (5 artefactos) y reversión sin reconstruir (estado Revirtiendo) | 13, 14 | Derek | 3 | A3 |
| M6-02 | VPS con `*.deploya.app`, HTTPS comodín y credenciales SMTP del proveedor de correo (SPF/DKIM) | — | Derek | 5 | A3 |
| ADR | ADR: Dockerfile, cola, polling, Traefik | — | Derek | 2 | A3 |
| DOC-03 | Documento de diseño final y manual técnico | — | Derek | 3 | Final |
| EST-01 | Estabilización, corrección de errores y ensayo (2 pts cada uno: EST-01a a EST-01d) | — | Todos | 8 | Final |

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

## Avance 2 — 50 % (entrega: miércoles 7 de octubre en la noche)

La versión visual de esta sección (resumen, una hoja por persona, integración y calidad, con las pantallas de cada quien y el estado de cada historia) está en la página **Avance 2 · 50 % · guía** del canvas Deploya v4.1 (<https://claude.ai/artifact/B89rty3MNxRKW9RHJQwSZT>). Entrega: **miércoles 7 de octubre en la noche**, sin ensayo por ahora. Todo tiene que estar en `main` ese día a las 20:00.

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
| `feat-m2-contratacion-suscripcion` | M2-02, M2-03, M2-04 | Javier | **Hecho y archivado** (7 de octubre) |
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

**Demuestra en la entrega:** «Olvidé mi contraseña» → Mailpit → nueva contraseña → el otro navegador pierde la sesión; un Cliente en `/admin` (403).

**Entrega a otros:** `RolGuard` y `@Roles()` el **domingo 4** (Javier los usa en M9, Avance 3). CI verde en cada PR (dueño de workflows).

### Javier — monetización (11 pts, ya en `main`)

| Id | Entrega | Estado |
|---|---|---|
| M2-02 | Contratación con pasarela simulada (07, 07b) | **Hecho** |
| M2-03 | Mi suscripción: vigencia, consumo, renovar (08) | **Hecho** |
| M2-04 | Cambiar plan: ascenso cobrado, descenso programado (08) | **Hecho** (aplicar el descenso al vencer es M2-05) |

**Esta semana:** archivar `feat-m2-schema-nucleo` y `feat-m2-contratacion-suscripcion`; seed de demo con `vencida@deploya.app` y `suspendida@deploya.app` para M5-03 (**domingo 4**); revisar los PRs que tocan `prisma/`. Si sobra tiempo, adelantar M2-05 (ciclo §4.4) **sin prometerlo**: es lo que más pesa del Avance 3.

**Demuestra en la entrega:** contratar Starter con la tarjeta de prueba (aprobada y rechazada), Mi suscripción con la vigencia, ascenso y descenso programado; la cuenta Vencida bloqueando «Desplegar».

### Eduardo — proyectos y experiencia (8 pts)

| Id | Entrega | Terminado cuando |
|---|---|---|
| M7-01 | Ruta `/projects/[proyecto]/despliegues/[n]` con 12, 12b y 12c: cabecera, riel grande, bitácora con `desde=` cada 3 s, «Copiar», línea del error y aviso de la versión anterior; «Desplegar» lleva a 12 | `hola-deploya` se ve de Encolado a Saludable sin recargar; la rama `roto` resalta la línea del error |
| M3-03 | Variables cifradas: 11c en el alta y 17 con Guardar / Guardar y desplegar / Mostrar; AES-256-GCM con `CLAVE_CIFRADO_VARIABLES` | En la base solo hay `v1:…`; cambiar `SALUDO` y desplegar cambia la página sin corte |

También: textos de 11a y 11e con la detección de stack (`LectorFuenteGitHub`, contrato v2) y el banner de bloqueo en 11d y 17 (M5-03). Revisa los PRs con UI de los demás.

**Demuestra en la entrega:** alta con `SALUDO` → riel y bitácora en vivo → 12b con URL y digest; la rama `roto` en 12c; cambiar la variable en 17 y «Guardar y desplegar».

**Entrega a otros:** `VariablesProyectoService.descifradasDe` exportado el **martes 6 a las 12:00** (Derek lo conecta al contenedor).

### Derek — motor (12 pts)

| Id | Entrega | Terminado cuando |
|---|---|---|
| M6-01 | Subdominio `<proyecto>.localhost` vía `EnrutamientoPuerto` (ya corre desde el A1): pruebas de sus escenarios y recorrido verificado desde la API | Alta desde la web → la app responde en su subdominio |
| M5-02 | Conmutación sin corte (ya corre) + reiniciar y detener por una cola de operación; eliminar proyecto borra contenedor, imágenes y ruta | Detener → el subdominio deja de responder; reiniciar → vuelve; `docker ps -a` limpio tras eliminar |
| M5-03 | `BloqueosService`: Vencida o Suspendida bloquean; construcciones del mes (I7) contra `construccionesMes` | `vencida@deploya.app` recibe 409 `suscripcion-no-permite`; la construcción 31 de Sandbox, `cuota-construcciones-agotada` |
| M4-03 | Detección de stack: recetas Node, Python, Go y estático; el `Dockerfile` propio manda | La rama `sin-dockerfile` termina Saludable con receta `node` y la bitácora lo dice |

**Demuestra en la entrega:** la rama `sin-dockerfile` detectada y en línea; «Guardar y desplegar» sin corte (dos pestañas: la app nunca da error); detener y reiniciar; el bloqueo por cuota; el diagrama de actividad de la detección contra lo que corre.

**Entrega a otros:** contrato de despliegues **v2.1** (ya en `docs/contratos/despliegues.md`); `GET /proyectos/:id/despliegues/:numero` el **domingo 4 a las 20:00** (Eduardo); `BloqueosService` y `DeteccionStackService` el **lunes 5 a las 12:00** (Eduardo los usa en el alta y en 11a); rama `sin-dockerfile` y `server.js` con `SALUDO` publicados en el repo público `hola-deploya`.

### Deuda del Avance 1 (antes del domingo 4)

| Qué | Quién |
|---|---|
| `/opsx-archive` de los changes del A1 ya mergeados, en este orden: `feat-m10-correo-verificacion`, `feat-m1-registro-verificacion`, `feat-m1-sesion`, `feat-m2-schema-nucleo`, `feat-m3-alta-proyecto`, `feat-m4-motor-construccion` (tras su tarea 8.2), `feat-m3-eliminar-proyecto` (tras `feat-m5-acciones-contenedor`) | Cada dueño |
| Tarea 8.2 de `feat-m4-motor-construccion`: recorrido desde la API en compose | Derek |
| Tareas 7.8 y 7.9 de `feat-m1-registro-verificacion`: ilustración de 01 y revisión en claro y oscuro | Eddy |

### Calendario hasta el miércoles 7

| Día | Qué |
|---|---|
| Vie 2 – sáb 3 | Cada quien lee su guía y **revisa** su change (ya propuesto); archivar lo del A1. Contrato v2.1 publicado |
| Dom 4 | **20:00** en `main`: consulta por número (Derek), `RolGuard` (Eddy) y seed de demo (Javier) |
| Lun 5 | **12:00** `BloqueosService` y `DeteccionStackService` en `main` (Derek). Recuperación (Eddy). Vista 12 contra la API y variables: dominio, cifrado y API (Eduardo). Reiniciar y detener (Derek) |
| Mar 6 | **12:00** `VariablesProyectoService` en `main` (Eduardo). Variables al contenedor (Derek). Reenvío y 403 (Eddy). 11c, 17, 11a y banners (Eduardo) |
| Mié 7 | **20:00** todo en `main` y cada quien comprueba su parte en `docker compose up` limpio. **Entrega en la noche** |

### Guion de la demo, si se presenta (≈ 12 min)

1. **Qué cambió (Derek, 1 min):** retroalimentación de la entrega 1 (detección de stack y reversión al núcleo) y el porcentaje con la tabla de arriba.
2. **Cuentas (Eddy, 2 min):** recuperar contraseña con Mailpit; reenvío con cuenta atrás; 403.
3. **Cobro (Javier, 2 min):** contratar Starter con la tarjeta de prueba, rechazo, Mi suscripción, cambiar de plan.
4. **Proyecto en vivo (Eduardo, 3 min):** alta con `SALUDO` → riel y bitácora → 12b; `roto` en 12c; variables en 17.
5. **Motor (Derek, 3 min):** `sin-dockerfile` → stack detectado; Guardar y desplegar sin corte; detener y reiniciar; cuenta Vencida bloqueada.
6. **Proceso y calidad (Javier, 1 min):** changes de OpenSpec, pruebas por escenario en CI, SOLID y patrones por historia.

Sin ensayo por ahora; si se agenda una presentación, se graba un video de respaldo antes.

## Avance 3 — 85 % (entrega: viernes 23 de octubre en la noche)

La versión visual de esta sección (resumen, una hoja por persona, integración y calidad, con las pantallas de cada quien) está en la página **Avance 3 · 85 % · guía** del canvas Deploya v4.1 (<https://claude.ai/artifact/B89rty3MNxRKW9RHJQwSZT>). Entrega: **viernes 23 de octubre en la noche** (cierre de la fase F4 de la propuesta). Todo en `main` ese día a las 20:00 y **desplegado en el VPS**.

### Dónde estamos (11 de octubre)

| | Puntos | Acumulado | % |
|---|---|---|---|
| En `main`: Avance 1, cobro de Javier, cuentas de Eddy y motor de Derek | 75 | 75 | 52 % |
| PR #31 (M7-01 y M3-03, 8 pts), en `main` desde el 11 de octubre | 8 | 83 | 57 % |
| **Avance 3** (este plan) | 40 | 123 | **85 %** |
| Entrega final | 22 | 145 | 100 % |

El 85 % es el techo del Avance 3: no hay margen para historias de *Fuera de alcance*. Lo que más pesa: M2-05 ciclo §4.4 (5), M6-02 VPS con HTTPS (5) y las tres de 3 puntos alrededor de la pantalla 14 (M4-02, M5-04, M7-02), que van juntas.

### Regla de calidad (igual que en los avances 1 y 2)

Cada historia entra con su change de OpenSpec (diseño en SOLID y patrones en el `design.md`) y con **una prueba unitaria por escenario** en verde en CI. Los mínimos por historia están en [ingenieria.md §5.5](ingenieria.md#55-pruebas-mínimas-del-avance-3). Sin eso la historia no suma.

### Qué se demuestra

> Todo lo del Avance 2, ahora en **`https://<proyecto>.deploya.app`** en el VPS, y además: el cliente edita su nombre y cambia su contraseña (la otra sesión cae); descarga el **comprobante PDF** de su pago; abre el **resumen** y el **historial** de su proyecto, **revierte a la versión #1 en segundos sin reconstruir**, cancela un despliegue en curso, reintenta uno fallido y redespliega un commit; cambia la rama en **Configuración** y elimina un proyecto. Con la tarea diaria, una suscripción pasa a **Vencida** (la lista avisa y bloquea) y luego a **Suspendida** (sus contenedores se detienen); al renovar, vuelven. El administrador busca una cuenta, ve su detalle y la **suspende**: no entra (ve el motivo) y su app deja de responder.

### Changes de OpenSpec del Avance 3 (ya propuestos)

Están en `openspec/changes/` y validan con `openspec validate --all`. Cada dueño los **revisa** (si algo no le cuadra, `/opsx-update`) y luego `/opsx-apply`.

| Change | Historias | Dueño | Toca a |
|---|---|---|---|
| `feat-m1-cuenta` | M1-06, M1-07 | Eddy | — · **Hecho y archivado** (18 de octubre, PR #34) |
| `feat-m2-ciclo-suscripcion` | M2-05 | Javier (+ Derek, tarea 3) | Derek (`detenerTodosDe`, `reanudarTodosDe`) · **Hecho y archivado** (17 de octubre) |
| `feat-m2-historial-pagos` | M2-06 | Javier | — · **Hecho y archivado** (17 de octubre) |
| `feat-m9-usuarios-suspension` | M9-01, M9-02 | Javier | Eddy (`RolGuard`, ya en `main`), Derek (contenedores) · **Hecho y archivado** (17 de octubre) |
| `feat-m5-reversion-instantanea` | M5-04 | Derek | — · **Hecho y archivado** (18 de octubre) |
| `feat-m4-acciones-despliegue` | M4-02 | Derek | — · **Hecho y archivado** (18 de octubre) |
| `feat-m7-resumen-historial` | M7-02 | Derek | Eduardo (monta `ActividadProyecto`) · **Hecho y archivado** (18 de octubre) |
| `feat-m3-configuracion-proyecto` | M3-04 | Derek | — · **Hecho y archivado** (18 de octubre) |
| `feat-m6-vps-https` | M6-02, ADR | Derek | Eddy (SMTP del proveedor) · **Hecho y archivado** (18 de octubre) |
| `feat-m7-consumo-actividad` | M7-03 | Eduardo | Javier (08) y Derek (13) montan sus componentes · **Hecho y archivado** (18 de octubre) |
| `feat-m3-estados-sistema` | WEB-02 | Eduardo | — · **Hecho y archivado** (18 de octubre) |

### Eddy — cuentas (4 pts)

| Id | Entrega | Terminado cuando |
|---|---|---|
| M1-06 | Mi cuenta · Perfil (05): `GET`/`PATCH /identidad/cuenta`, nombre de 1 a 64 caracteres, correo y rol de solo lectura | El nombre nuevo aparece en el encabezado; 65 caracteres se rechazan |
| M1-07 | Mi cuenta · Seguridad (05b): cambiar contraseña con la actual (cierra las **otras** sesiones), «Cerrar todas» (incluida la actual) | Con dos navegadores, cambiar la contraseña en uno cierra el otro; «Cerrar todas» lleva a 03 |

También: CI verde en cada PR (dueño de workflows); variables SMTP del proveedor en el VPS con Derek (jueves 15). Si sobra tiempo, **sin prometerlo**: el esqueleto del recorrido e2e de QA-01 (entrega final).

**Demuestra en la entrega:** Mi cuenta, cambiar la contraseña con dos navegadores, «Cerrar todas»; el correo de verificación llegando a un buzón real desde el VPS.

### Javier — monetización y administración (13 pts)

| Id | Entrega | Terminado cuando |
|---|---|---|
| M2-05 | Ciclo §4.4: `PoliticaCiclo` pura, `CicloSuscripcionService`, tarea diaria (BullMQ 00:05 UTC) y `POST /admin/ciclo/ejecutar` para la demo; descenso programado al vencer; renovar una Suspendida la reactiva; panel «Suscripción suspendida» de 28 | `suspendida@` con un proyecto Saludable: ejecutar el ciclo → su app deja de responder; renovar → vuelve |
| M2-06 | Historial de pagos (09, 09b) y comprobante PDF detrás de `ComprobantePdfPuerto` | Contratar Starter y descargar el PDF con número, vigencia, método y total; una cuenta nueva ve 09b |
| M9-01 | Admin · Usuarios (25): búsqueda por correo, filtro por suscripción, detalle con proyectos y pagos | Filtrar por Vencida solo muestra cuentas vencidas; un Cliente recibe 403 |
| M9-02 | Admin · Suspender (25b): motivo de la lista, detalle, sesiones revocadas, `AccionAdministrativa` y contenedores detenidos | La cuenta suspendida no entra (03b con el motivo) y su app deja de responder |

Orden sugerido: M2-05 primero (es lo que más pesa y lo usa la demo de todos), luego M9-01/M9-02 y al final M2-06. Monta `<ConsumoPeriodo />` de Eduardo en 08 cuando esté (jueves 15).

**Demuestra en la entrega:** comprobante PDF; ejecutar el ciclo con las cuentas de demo (Vencida → banner en 10c; Suspendida → contenedores detenidos → renovar); admin busca, abre y suspende una cuenta.

### Eduardo — proyectos y experiencia (4 pts)

| Id | Entrega | Terminado cuando |
|---|---|---|
| WEB-02 | Estados del sistema: banner de vencida en la lista (10c) reutilizando `banner-bloqueo.tsx`; 404, error de conexión con la API (reintento a los 8, 16 y 30 s) y esqueleto de carga de 28 | Con `vencida@` la lista avisa con la fecha de gracia y bloquea «Nuevo proyecto»; apagar la API muestra el error y se recupera sola |
| M7-03 | Consumo y actividad: `GET /observabilidad/consumo` y `GET /proyectos/:id/actividad`; componentes `<ConsumoPeriodo />` (dos `Meter`) y `<ActividadProyecto />` (`MapaActividad`) | 08 muestra construcciones usadas y «Se reinicia el 1 nov»; 13 muestra «12 semanas · N despliegues · M con fallo» |

También: revisa los PRs con UI de los demás contra el design system.

**Demuestra en la entrega:** la lista con la cuenta Vencida, el consumo en 08, el mapa de actividad en 13 y el estado de error de la API.

**Entrega a otros:** `<ConsumoPeriodo />` y `<ActividadProyecto />` el **jueves 15 a las 20:00** (Javier los monta en 08 y Derek en 13).

### Derek — motor, operación del proyecto y VPS (19 pts)

Es la parte más larga del avance, así que va con más detalle: qué es cada historia, en qué orden, qué archivos tocar, cómo se prueba y cómo saber que quedó.

| Id | Entrega | Terminado cuando |
|---|---|---|
| M5-04 | Reversión sin reconstruir: retención de 5 artefactos, `POST /proyectos/:id/reversiones`, `GET /proyectos/:id/artefactos`, estado Revirtiendo | Tres despliegues de `hola-deploya`, revertir a #1 en segundos y la app vieja responde; `docker images` muestra a lo sumo 5 + el activo |
| M4-02 | Cancelar (Encolado, Construyendo, Revirtiendo), reintentar (Fallido) y redesplegar un commit (reconstruye) | Cancelar en Construyendo no deja un `docker build` colgado; reintentar `roto` crea #n+1 con el mismo commit |
| M7-02 | Pantallas 13 (Resumen) y 14 (Despliegues) con `GET /proyectos/:id/resumen` y `GET /proyectos/:id/despliegues?filtro=&antesDe=`; acciones por fila | 14 filtra fallidos, «Cargar más» no repite filas y cada fila ofrece revertir, redesplegar o reintentar según su estado |
| M3-04 | Pantalla 19 (Configuración) con `PATCH /proyectos/:id` y el diálogo 19b (ya existe) movido a «Zona de peligro» | Cambiar la rama a `sin-dockerfile` y desplegar detecta Node; eliminar deja `docker ps -a` limpio |
| M6-02 | VPS con `*.deploya.app`, HTTPS comodín por DNS-01, correo del proveedor (SPF/DKIM) y `scripts/desplegar-vps.sh` | `https://hola-deploya.deploya.app` con candado; el correo de verificación llega a un buzón real |
| ADR | ADR 0007 (certificado comodín por DNS-01); 0002, 0003, 0005 y 0006 a Aceptado; 0004 al archivar la reversión | Índice de `docs/adr/README.md` sin «Por escribir» |

#### Paso 0 · lunes 12: cerrar el Avance 2

1. **PR #31 ya está en `main`** (M7-01 y M3-03, 8 pts; reemplazó a #23, #28, #29 y #30, que quedaron cerrados). En `docker compose down -v && docker compose up --build`, corre la demo que dice el PR: alta con `SALUDO`, riel hasta Saludable, rama `roto` en 12c, «Guardar y desplegar», `vencida@` con el banner.
2. **Tareas de compose pendientes del A2:** 8.2 de `feat-m4-motor-construccion` (recorrido desde la API), 5.2 de `feat-m4-deteccion-stack` (`sin-dockerfile` Saludable con receta `node`), 6.3 de `feat-m5-acciones-contenedor` (detener / reiniciar / eliminar) y 4.3 de `feat-m5-bloqueos-cuota`. Márcalas solo si las viste funcionar.
3. **Archivar en orden** (`/opsx-archive`) cuando su demo en compose esté hecha: `feat-m4-motor-construccion` → `feat-m4-deteccion-stack` → `feat-m5-acciones-contenedor` → `feat-m5-bloqueos-cuota` → `feat-m7-vista-despliegue` → `feat-m3-variables-cifradas`. Ya están archivados `feat-m1-estados-roles`, `feat-m1-recuperacion`, `feat-m3-alta-proyecto` y `feat-m3-eliminar-proyecto`.

#### Paso 1 · lunes 12 – martes 13: VPS y dominio (M6-02, parte de infraestructura)

Se arranca primero porque depende de terceros (DNS y certificados tardan) y es lo que más puede fallar.

- **Qué haces:** compra o usa el dominio (`deploya.app` o el que esté disponible; el nombre real va en `.env.vps`), crea los registros A de la raíz y de `*` hacia la IP del VPS (2 vCPU, 4 GB, Ubuntu 24.04, Docker, usuario sin root). Pide un token del proveedor DNS con permiso **solo** sobre esa zona.
- **Archivos:** `docker-compose.vps.yml` (extiende el de desarrollo: Traefik en 80/443, web en la raíz, API en `api.`, sin Mailpit), `infra/traefik/traefik.vps.yml` (resolvedor Let's Encrypt por **DNS-01** y redirección 80 → 443), `.env.vps.example` (sin secretos).
- **Cómo sabes que quedó:** `curl -I https://algo.deploya.app` devuelve el certificado de `*.deploya.app` (aunque responda 404 de Traefik).
- **Cuidado:** HTTP-01 emitiría un certificado por proyecto y choca con los límites de Let's Encrypt; por eso DNS-01 (va en el ADR 0007).

#### Paso 2 · martes 13 a las 12:00: contenedores de un cliente para Javier (tarea 3 de `feat-m2-ciclo-suscripcion`)

- **Qué es:** cuando M2 suspende una suscripción o M9 una cuenta, M5 detiene todos los contenedores del cliente; al renovar, los vuelve a arrancar.
- **Qué haces:** en `orquestacion/acciones/acciones-proyecto.service.ts`, `detenerTodosDe(usuarioId)` y `reanudarTodosDe(usuarioId)`: por cada proyecto del usuario con despliegue activo Saludable encola `detener`; con Detenido, `reiniciar`. Reutiliza la cola `operacion` y los manejadores que ya existen (no hay `switch` nuevo). Exporta el adaptador `ContenedoresClienteM5` para que M2 y M9 lo inyecten por su puerto `ContenedoresClientePuerto`.
- **Pruebas:** «Suscripción suspendida» (un `detener` por proyecto Saludable, los demás se omiten), «Reanudar al renovar», «Proyecto sin despliegue activo». Con la cola en memoria.
- **Avísale a Javier** en cuanto esté en `main`: lo necesita para M2-05 y M9-02.

#### Paso 3 · martes 13 – miércoles 14: reversión sin reconstruir (M5-04, `feat-m5-reversion-instantanea`)

- **Qué es:** cada construcción ya deja un artefacto `deploya/<subdominio>:<n>`. Revertir es crear un despliegue nuevo que **reusa** esa imagen: se saltan Recepción y Construcción (`omitida`) y sigue Ejecución → Enrutamiento → Operación con la misma conmutación sin corte. No gasta construcciones del mes.
- **Qué haces, en orden:** (1) dominio: `revirtiendo` en `TransicionesDespliegue` (ya está en `transiciones-despliegue.ts`, revisa que aparezca también en `estados.ts` de la web), `PoliticaRetencion.aRetirar` y `ARTEFACTOS_RETENIDOS = 5`; (2) `ReversionService` + `POST /proyectos/:id/reversiones` + `GET /proyectos/:id/artefactos`; (3) `PlanPipeline.reversion = [PasoEjecucion, PasoEnrutamiento, PasoOperacion]`: `PasoEjecucion` toma la imagen del artefacto en vez de la construcción; (4) `RetencionArtefactos` escucha `DespliegueTerminado` y llama a `ContenedorPuerto.eliminarImagen`.
- **Pruebas** (todas con dobles): «Revertir a una versión disponible», «No consume construcciones», «Artefacto no disponible», «Artefacto ya activo», «Despliegue en curso», «Reversión que no pasa la salud», «Retención de cinco», «El activo nunca se retira».
- **Cómo sabes que quedó:** en compose, tres despliegues con `SALUDO` distinto, `curl -X POST …/reversiones` al artefacto #1 y la página vuelve a decir el primer saludo en segundos; `docker images deploya/hola-deploya` no pasa de 6.

#### Paso 4 · miércoles 14 – jueves 15: cancelar, reintentar y redesplegar (M4-02, `feat-m4-acciones-despliegue`)

- **Cancelar:** desde Encolado, `ColaConstruccionPuerto.quitar(id)`; desde Construyendo o Revirtiendo la API escribe una señal (`CancelacionesPuerto`, clave Redis `cancelacion:<id>`) y el trabajador la ve con `VigiaCancelacion` (cada 1 s), aborta el `AbortController` del despliegue y `ConstructorImagenDocker` mata el `docker build`. El trabajador escribe `cancelado`. Desde Aprovisionando → 409 `ya-no-se-puede-cancelar`.
- **Reintentar y redesplegar:** los dos llaman a `crearDespliegue(proyectoId, disparador, { commitSha })`; `PasoRecepcion` hace `git checkout <sha>`. Pasan por `BloqueosService` y cuentan como construcción.
- **Pruebas:** la tabla de `PoliticaAcciones`, «Cancelar encolado», «Cancelar» en Construyendo (la señal aborta y la versión activa no cambia), «Cancelar tarde», «Reintentar un fallido», «Reintentar uno saludable», «Redesplegar reconstruye», «Commit desconocido».
- **Web:** «Cancelar» en 12 y «Reintentar» en 12c (la página ya existe por #31); `accionesDe(estado)` como función pura con su prueba.

#### Paso 5 · jueves 15 – sábado 17: pantallas 13 y 14 (M7-02, `feat-m7-resumen-historial`)

- **API primero (jueves):** `RepositorioDespliegues.historialDe(proyectoId, filtro, antesDe, 20)` y `GET /proyectos/:id/despliegues`; `ResumenProyectoService` en `observabilidad/` y `GET /proyectos/:id/resumen`, con `LineaTiempoDespliegue` (los cuatro hitos de 13 con textos fijos de la ficha).
- **Web 13 (viernes):** `app/(projects)/projects/[proyecto]/page.tsx` dentro del layout que ya existe (`MarcoProyecto`). Lee la ficha [13-Proyecto-resumen.md](diseno/pantallas/13-Proyecto-resumen.md): `RielEtapas`, `CopyField`, versión activa, imagen, recursos, `LineaTiempo` y las acciones Visitar / Reiniciar / Detener / Desplegar (ya tienen API). Deja el hueco donde va `<ActividadProyecto />` de Eduardo.
- **Web 14 (sábado):** `despliegues/page.tsx` con `Segmented`, `Table`, fila activa, «Cargar más» (cursor `antesDe`) y la acción por fila con `accionDeFila(fila)`: revertir, redesplegar, reintentar, «imagen retirada» o «Versión activa». Revertir y redesplegar piden confirmación con `Dialog` y llevan a 12 del despliegue nuevo.
- **Pruebas:** API «Filtrar fallidos», «Cargar más», «Fila activa marcada», «Proyecto saludable», «Proyecto sin despliegue Saludable», «Línea de tiempo»; web `accionDeFila` y el armado de la consulta.
- **Revisión visual:** contra los artboards 13 y 14 en claro y oscuro, solo con componentes de `apps/web/src/components` (guía: [diseno/guia-construccion.md](diseno/guia-construccion.md)).

#### Paso 6 · sábado 17 – domingo 18: configuración (M3-04, `feat-m3-configuracion-proyecto`)

- **API:** `CambiosProyecto` (VO que reutiliza las reglas del alta), `ProyectosService.configurar` y `PATCH /proyectos/:id`. Si cambian repositorio o rama, valida con `ProveedorFuente` como en el alta. El subdominio no está en el tipo de `actualizar`: no se puede cambiar por error. No despliega al guardar.
- **Web:** `configuracion/page.tsx` (19) con borrador, `cambiosDe(original, borrador)`, «Descartar», «Guardar cambios» y «Zona de peligro» que abre el diálogo 19b que ya existe (`eliminar-proyecto.tsx`), ahora con conteos reales; se quita «Eliminar» del detalle de la lista.
- **Pruebas:** «Renombrar no cambia el subdominio», «Cambiar la rama aplica en el próximo despliegue», «Rama inexistente», «Nombre repetido», `cambiosDe`.

#### Paso 7 · lunes 19 – martes 20: HTTPS en el código y `main` en el VPS (M6-02 y ADR)

- **Código:** `ConfiguracionEnrutamiento { dominioBase, esquema, certResolver }` (variables `DOMINIO_BASE`, `ESQUEMA_PUBLICO`, `CERT_RESOLVER`); `EnrutamientoTraefikArchivo` agrega `tls` solo si hay resolvedor; la URL del despliegue sale de la configuración. `CertificadoPuerto` con `CertificadoAcmeArchivo` (lee `acme.json`) y `CertificadoAusente` (desarrollo) para mostrar el vencimiento en 12b.
- **Pruebas:** «Certificado comodín» (la ruta lleva `tls.certResolver`), «Desarrollo sin TLS» (igual que hoy), «Vencimiento visible».
- **Publicar:** `scripts/desplegar-vps.sh` (pull, compose con los dos archivos, `prisma migrate deploy`, seed). Con Eddy, las variables SMTP del proveedor (Resend o Brevo) con SPF y DKIM.
- **ADR:** 0007 con la decisión DNS-01; 0002, 0003, 0005 y 0006 a Aceptado. `despliegue-infraestructura.mmd` con el VPS.

#### Paso 8 · miércoles 21 – viernes 23: pruebas en el VPS, ensayo y entrega

Miércoles: cada quien comprueba su parte en el VPS y se corrige. Jueves: recorrido completo **en el VPS** con las cuentas de demo y video de respaldo. Viernes 20:00: `main` congelado, `scripts/desplegar-vps.sh` una última vez y comprobar `https://hola-deploya.deploya.app`.

**Entrega a otros:** contrato de despliegues **v3** (ya en `docs/contratos/despliegues.md`); `detenerTodosDe` y `reanudarTodosDe` el **martes 13 a las 12:00** (Javier); el VPS con HTTPS el **martes 20** para que todos prueben ahí; revisa todos los PRs que tocan motor, adapters, compose y contratos.

**Demuestra en la entrega:** todo desde `https://…deploya.app`: 13 y 14 con datos reales, revertir a #1 en segundos (con la app abierta en otra pestaña: nunca da error), cancelar un despliegue en Construyendo, reintentar `roto`, cambiar la rama en 19 y eliminar el proyecto.

### Deuda del Avance 2 (lunes 12)

| Qué | Quién |
|---|---|
| PR #31 a `main`; #23, #28, #29 y #30 cerrados | **Hecho** (11 de octubre) |
| `/opsx-archive` de `feat-m1-estados-roles`, `feat-m1-recuperacion`, `feat-m3-alta-proyecto`, `feat-m3-eliminar-proyecto` | **Hecho** (11 de octubre) |
| Demo en compose y revisión visual: 8.2 motor, 5.2 detección, 6.3 acciones, 4.3 bloqueos, 5.2 vista de despliegue, 5.3 variables | Derek |
| `/opsx-archive` de `feat-m4-motor-construccion`, `feat-m4-deteccion-stack`, `feat-m5-acciones-contenedor`, `feat-m5-bloqueos-cuota`, `feat-m7-vista-despliegue`, `feat-m3-variables-cifradas` (tras la demo) | Derek |

### Estado de Derek al miércoles 14 de octubre (rama `Entrega-85%`)

Todo el código de Derek del Avance 3 está en la rama `Entrega-85%` (un commit por historia, `pnpm check` en verde). **18 de octubre:** el dueño dio por hechas las demos en compose, la revisión visual y el VPS; sus tareas quedaron marcadas y los changes del Avance 2 y del Avance 3 (incluido `feat-m1-cuenta`, PR #34) están sincronizados a los specs y archivados. ADR 0004 y 0007 pasan a Aceptado. La tabla queda como registro de lo que faltaba al 17 de octubre.

| Paso | Historia | Estado | Qué falta |
|---|---|---|---|
| 0 | Cerrar el Avance 2 | **Pendiente** | Demos en compose (8.2, 5.2, 6.3, 4.3, 5.2, 5.3) y `/opsx-archive` de los seis changes: solo se marcan tras verlas funcionar |
| 1 | VPS y dominio | **Archivos listos** | `docker-compose.vps.yml`, `traefik.vps.yml`, `plataforma.vps.yml`, `.env.vps.example`, [infra-vps.md](infra-vps.md). Falta comprar el dominio, los registros A, el VPS y el token DNS |
| 2 | `detenerTodosDe` / `reanudarTodosDe` (Javier) | **Hecho** | `ContenedoresClientePuerto` en `orquestacion/`: M2 y M9 lo inyectan desde un módulo que importe `OrquestacionModule` (contrato 3.1) |
| 3 | M5-04 reversión | **Hecho (API y web)** | Demo en compose con tres despliegues; ADR 0004 queda Propuesto hasta verla |
| 4 | M4-02 cancelar, reintentar, redesplegar | **Hecho (API y web)** | Demo en compose: cancelar en Construyendo sin `docker build` colgado |
| 5 | M7-02 pantallas 13 y 14 | **Hecho** (revisadas contra el canvas el 17 de octubre) | Montar `<ActividadProyecto />` de Eduardo cuando entre su PR (M7-03); demo en compose |
| 6 | M3-04 pantalla 19 | **Hecho** (19 y 19b revisadas contra el canvas el 17 de octubre) | Demo: rama `sin-dockerfile` → «Stack detectado: Node.js 22» |
| 7 | M6-02 HTTPS y ADR 0007 | **Código y script hechos** | Correr `scripts/desplegar-vps.sh` en el VPS, SMTP con Eddy, `https://hola-deploya.<dominio>` con candado |

**Revisión del 17 de octubre (rama `Entrega-85%`).** 13, 14, 19 y 19b quedaron iguales a sus artboards en claro y oscuro: cabecera del proyecto con ruta en mono, metadatos con iconos, riel y «Más acciones» (`Menu` nuevo del sistema: «Cambiar rama» y «Eliminar proyecto»); en 13, «Reiniciar» y «Detener» en la cabecera y la versión activa, la imagen y la publicación como celdas al pie de «Estado actual»; en 14, «Versión activa» como `Badge` de Señal y el pie con «Cargar más» dentro del panel (`Table footer`); en 19, filas de 280px con iconos en los campos y «Zona de peligro» como en el canvas; «Cancelar despliegue» (12) en fantasma y «Reintentar» (12c) con su icono. `pnpm check` en verde. Siguen pendientes las demos en compose y el VPS (no se pueden hacer sin Docker con red ni sin el dominio).

### Estado de Javier al sábado 17 de octubre (rama `Entrega-85%`)

Las cuatro historias del Avance 3 (13 pts) están en la rama, con su change sincronizado a los specs y archivado. `pnpm test` en verde (API y web) y diagramas al día. Las demos se corrieron con Postgres y Redis reales (adaptadores del motor en stub) y, para el contenedor, con Docker, Traefik y BullMQ en el PR #36.

| Historia | Estado | Evidencia |
|---|---|---|
| M2-05 ciclo §4.4 | **Hecho** | `PoliticaCiclo` en tabla; vencida → suspendida → cancelada y dos corridas el mismo día sin cambios; `POST /admin/ciclo/ejecutar` 403 a un Cliente; renovar reactiva (`ReactivacionService`); panel «Suscripción suspendida» de 28 |
| M2-06 historial y PDF | **Hecho** | Cuenta nueva ve 09b; aprobado + rechazado en 09; PDF `DPY-AAAA-NNNNNN.pdf`; ajeno o rechazado → 404 |
| M9-01 usuarios | **Hecho** | Búsqueda, filtro por Vencida (solo `vencida@`), detalle; Cliente → 403 |
| M9-02 suspender | **Hecho** | Sesiones revocadas, `AccionAdministrativa`, 03b con el motivo; administrador 403, repetida 409, motivo fuera de la lista 400 |
| Montar el consumo de M7-03 en 08 | **Hecho (contrato)** | 08 lee `GET /observabilidad/consumo` y dibuja Construcciones con porcentaje; si el endpoint aún no responde, muestra el límite del plan. Se verá el conteo real cuando el PR de M7-03 esté en la rama |

### Calendario hasta el viernes 23

| Día | Qué |
|---|---|
| Dom 11 | PR #31 y este plan en `main` (PR 0). Cada quien lee su guía y **revisa** sus changes |
| Lun 12 | Demo del A2 en compose y archivar lo que falta (Derek). Dominio, DNS y VPS (Derek). Política del ciclo (Javier). Perfil (Eddy). Banner de 10c (Eduardo) |
| Mar 13 | **12:00** `detenerTodosDe` / `reanudarTodosDe` en `main` (Derek). Reversión: dominio y servicio (Derek). Servicio del ciclo y tarea diaria (Javier). Seguridad (Eddy). 404, error de API y carga (Eduardo) |
| Mié 14 | Reversión en compose y M4-02 (Derek). M9-01 usuarios (Javier). Consumo y actividad: API (Eduardo) |
| Jue 15 | **20:00** `ConsumoPeriodo` y `ActividadProyecto` en `main` (Eduardo). API de 13 y 14 (Derek). M9-02 suspender (Javier). SMTP del proveedor con Derek (Eddy) |
| Vie 16 – sáb 17 | Pantallas 13 y 14 (Derek). M2-06 pagos y PDF (Javier). Revisión visual de los PRs con UI (Eduardo) |
| Dom 18 | Configuración 19 (Derek). Últimas historias de cada quien |
| Lun 19 | HTTPS en el código y `scripts/desplegar-vps.sh` (Derek). Correcciones de revisión |
| Mar 20 | **20:00** todo en `main` y el VPS con HTTPS listo para que todos prueben |
| Mié 21 | `main` en el VPS; cada quien comprueba su parte en `https://…deploya.app` y corrige |
| Jue 22 | **Ensayo completo en el VPS** y video de respaldo |
| Vie 23 | **20:00** `main` congelado y desplegado. **Entrega en la noche** |

### Guion de la demo (≈ 14 min)

1. **Qué cambió (Derek, 1 min):** plataforma en el VPS con HTTPS; porcentaje con la tabla de arriba.
2. **Cuentas (Eddy, 2 min):** Mi cuenta; cambiar la contraseña con dos navegadores; «Cerrar todas»; correo real desde el VPS.
3. **Cobro y ciclo (Javier, 3 min):** comprobante PDF; ejecutar el ciclo: Vencida bloquea, Suspendida detiene, renovar reanuda.
4. **Proyecto (Eduardo, 2 min):** banner de vencida en 10c, consumo en 08, actividad en 13, estado de error de la API.
5. **Operar el proyecto (Derek, 4 min):** 13 y 14; **revertir a #1 en segundos sin reconstruir**; cancelar y reintentar; cambiar la rama en 19; eliminar.
6. **Administración (Javier, 1 min):** buscar, ver el detalle y suspender una cuenta; el login muestra el motivo.
7. **Proceso y calidad (Eddy, 1 min):** changes archivados, pruebas por escenario en CI, SOLID y patrones por historia, ADR.

Plan B: el video del martes y compose local, por si el VPS o la red fallan durante la presentación.

## Entrega final — 100 % (entrega y exposición: viernes 6 de noviembre)

Sprint de cierre del miércoles 28 de octubre al viernes 6 de noviembre (fase F5 de la propuesta). La versión visual (resumen y una hoja por persona) está en la página **«Entrega final · 100 %»** del canvas Deploya v4.1 (<https://claude.ai/artifact/B89rty3MNxRKW9RHJQwSZT>). Prompts para los agentes: [handoff/prompt-entrega-final.md](handoff/prompt-entrega-final.md).

### Dónde estamos (28 de octubre)

| Qué | Estado |
|---|---|
| Núcleo v4.1 | **123 de 145 pts (85 %)**: A1, A2 y A3 en `main`, sus changes archivados |
| Sprint fuera de alcance | **Cerrado** (PR #59): las 19 historias en `main`, incluidas SP-12 y SP-13; `openspec/changes/` sin changes activos |
| Calidad de `main` | 146 suites y 1069 pruebas de la API en verde; 96.8 % de líneas cubiertas |
| Faltan | Los 22 pts de abajo y el lanzamiento en el VPS |

### Regla del sprint: el equipo escribe código, Derek documenta y lanza

- **Eddy, Javier y Eduardo solo escriben código**: un change pequeño de endurecimiento cada uno (2 pts, ya propuesto en `openspec/changes/`) y los errores P1 de su módulo. No escriben documentos ni tocan el VPS, DNS, correo, CI de despliegue ni el e2e.
- **Derek hace toda la documentación final, el e2e y el lanzamiento**: QA-01, DOC-01, DOC-02, DOC-03 y los pasos L0–L10.
- **No entran funciones nuevas** fuera de los tres changes. Nada de pantallas nuevas, dependencias nuevas ni cambios de contrato (salvo la columna de `feat-m9-limpieza-diaria`, avisada en su proposal).
- Un error encontrado en el VPS va a un issue con la plantilla «error» y la etiqueta `final`. Derek lo clasifica cada noche: **P1** (rompe la demo o pierde datos) lo corrige el dueño del módulo o Derek; P2 y P3 pasan a `despues-de-entrega`.
- Misma definición de terminado que el núcleo: change, una prueba por escenario, PR revisado, `pnpm check` en verde y `/opsx-archive` tras el merge.

### Historias

| Id | Historia | Dueño | Pts | Terminado cuando |
|---|---|---|---|---|
| EST-01a | Límite de intentos en iniciar sesión, registro, verificación y recuperación (`feat-m1-limite-intentos`) | Eddy | 2 | El sexto fallo de contraseña responde 429 con `Retry-After`; la recuperación repetida no revela la cuenta ni manda correo; 03 dice cuántos minutos faltan |
| EST-01b | Limpieza diaria de tokens, sesiones e invitaciones vencidas (`feat-m9-limpieza-diaria`) | Javier | 2 | La tarea corre a las 00:35 UTC y a mano desde admin; borra solo lo vencido; 32 muestra la última limpieza |
| EST-01c | Web lista para el público: errores, carga, cabeceras, títulos, ícono y accesibilidad (`feat-web-lanzamiento`) | Eduardo | 2 | Un error de render muestra «Reintentar» dentro del shell; la web manda las cabeceras; cada pestaña tiene su título; corregido lo pequeño de la tabla de DOC-02 |
| EST-01d | Triar errores, corregir los P1 sin dueño disponible y dos ensayos | Derek | 2 | Cero P1 abiertos el jueves 5 y dos ensayos completos |
| QA-01 | Recorrido e2e de la API en CI, sin dependencias nuevas | Derek | 5 | `e2e/recorrido.mjs` en el job «Smoke compose»: registro → enlace de Mailpit → verificar → sesión → Starter → `hola-deploya` → despliegue encolado; negativos 403 sin verificar, 403 Cliente en admin, 404 proyecto ajeno, y 429 al sexto fallo cuando entre EST-01a |
| DOC-01 | Documento de requisitos y manual de usuario | Derek | 3 | `docs/entrega-final/01-requisitos.md` (RF y RNF con spec y pantalla de origen, casos de uso y trazabilidad) y `docs/entrega-final/04-manual-usuario.md` (Cliente y Administrador, con capturas); PDF en `docs/entrega-final/pdf/` |
| DOC-02 | Guion de demo, video de respaldo y revisión de accesibilidad | Derek | 3 | `docs/entrega-final/guion-demo.md`, video de ≤ 15 min grabado en el VPS y `docs/entrega-final/accesibilidad.md` (pantalla × criterio); la tabla está lista el domingo 1 para que Eduardo corrija |
| DOC-03 | Documento de diseño final y manual técnico | Derek | 3 | `docs/entrega-final/02-diseno.md` (arquitectura, módulos, puertos, patrones, ADR 0001–0009, diagramas, diccionario de datos) y `docs/entrega-final/03-manual-tecnico.md` (compose, VPS, autoalojado, respaldos, actualizar, variables, problemas comunes) |

| Persona | Pts | Qué escribe | Tiempo estimado |
|---|---|---|---|
| Eddy | 2 | Código (M1, `(auth)`) | ~2 tardes |
| Javier | 2 | Código (M9, Prisma) | ~2 tardes |
| Eduardo | 2 | Código (`apps/web`) | ~2 tardes |
| Derek | 16 | Documentación, e2e, triaje y lanzamiento | resto del sprint |
| **Total** | **22** | | 123 + 22 = **145 pts (100 %)** |

### Lanzamiento (Derek, sin puntos)

| Paso | Qué | Cuándo |
|---|---|---|
| L0 | Este plan y los tres changes en `main` | Mié 28 |
| L1 | VPS al día con `main` (`scripts/desplegar-vps.sh`): HTTPS comodín y las comprobaciones de [infra-vps.md §3](infra-vps.md#3-cómo-saber-que-quedó) | Jue 29 |
| L2 | Correo real del proveedor con SPF, DKIM y DMARC: verificación, recuperación y los cuatro avisos de 24b llegan a una bandeja real, no a spam | Jue 29 |
| L3 | Datos de la demo: `hola-deploya` con tres despliegues, cuentas `cliente@`, `vencida@`, `suspendida@` y el administrador; contraseñas fuera del repo | Vie 30 |
| L4 | Operación: `respaldar.sh` diario por `cron` con retención de 7 días y una restauración probada; `docker image prune` semanal; vigilancia de `api.<dominio>/health` cada 5 min | Vie 30 |
| L5 | **Vie 30 a las 20:00: URL del VPS al equipo** para probar su parte | Vie 30 |
| L6 | Triar los issues `final` cada noche | Sáb 31 – mar 3 |
| L7 | Recorrido del despliegue en el VPS (`e2e/vps.mjs`, a mano): `hola-deploya` Saludable con HTTPS, revertir a #1 y volver, cancelar uno en Construyendo | Lun 2 |
| L8 | Instalación limpia en un servidor aparte con `instalar.sh` → asistente (31) → primer despliegue; `actualizar.sh` y `--volver` | Mié 4 |
| L9 | `v1.0.0`: `main` congelado, `CHANGELOG.md`, etiqueta y *release* en GitHub, despliegue final y comprobación de §3 | Jue 5, 20:00 |
| L10 | Plan B: video, compose local con los mismos datos y capturas en las diapositivas | Jue 5 |

### Calendario

| Día | Eddy | Javier | Eduardo | Derek |
|---|---|---|---|---|
| Mié 28 | Lee su prompt y su change | Lee su prompt y su change | Lee su prompt y su change | L0 |
| Jue 29 | EST-01a: regla y API | EST-01b: política, puerto y servicio | EST-01c: `error.tsx` y `loading.tsx` | L1, L2, QA-01 |
| Vie 30 | EST-01a: web y pruebas; PR | EST-01b: Prisma, cola y endpoint | EST-01c: cabeceras, títulos e ícono | L3, L4, **20:00 URL al equipo** |
| Sáb 31 – dom 1 | Prueba 1 (1 h): cuentas y correos en el VPS | Prueba 1: planes, ciclo y admin; PR | Prueba 1: proyectos y métricas; PR | DOC-02 (tabla de accesibilidad), capturas, triaje |
| Lun 2 | P1 propios, si hay | P1 propios, si hay | Correcciones de accesibilidad | L7, DOC-01 |
| Mar 3 | P1 propios, si hay | P1 propios, si hay | P1 propios, si hay | DOC-03. **20:00 todo en `main`** |
| Mié 4 | Prueba 2 y ensayo 1 | Prueba 2 y ensayo 1 | Prueba 2 y ensayo 1 | L8, video, ensayo 1 |
| Jue 5 | Ensayo 2 | Ensayo 2 | Ensayo 2 | **20:00** L9 y L10 |
| Vie 6 | **Entrega y exposición** | | | |

### Guion de la demo (≈ 15 min)

1. **Producto y número (Derek, 1 min):** Deploya en `https://<dominio>`, 145 de 145 puntos, código abierto y autoalojable.
2. **Cuentas (Eddy, 2 min):** registro, correo real, verificar, iniciar sesión; el límite de intentos; Mi cuenta con «Último cambio»; las ilustraciones de acceso.
3. **Cobro y ciclo (Javier, 2 min):** contratar Starter, comprobante PDF; correr el ciclo: «Por vencer» llega por correo, Vencida bloquea, renovar reanuda.
4. **Desplegar (Derek, 3 min):** alta de un repo sin `Dockerfile` → «Stack detectado», etapas en vivo, `https://hola-deploya.<dominio>` con candado; correo de Saludable; **revertir a #1 en segundos sin reconstruir**.
5. **Observar (Eduardo, 2 min):** Métricas, 13c, bitácoras (15), tiempo por etapa (14c) y ritmo (08c).
6. **Administrar (Javier, 1 min):** suspender con motivo y reactivar; Infraestructura (27); limpieza diaria en 32.
7. **Autoalojado (Derek, 2 min):** grabación corta de `instalar.sh` y el asistente (31) en un servidor limpio; `actualizar.sh` con respaldo.
8. **Calidad y proceso (Eddy, 2 min):** CI con pruebas por escenario y el recorrido e2e, changes archivados, ADR, SOLID y patrones por historia.

Plan B: el video del miércoles 4 y compose local con los mismos datos.

### Qué no se hace

M8, pantallas nuevas, dependencias nuevas, refactors sin un P1 detrás y cambios de contrato fuera de los tres changes. Lo que alguien quiera agregar va a un issue con la etiqueta `despues-de-entrega`.

## Sprint fuera de alcance

**Aprobado el 20 de octubre**, después de la entrega del 85 %. La versión visual (resumen, una hoja por persona y las 11 pantallas nuevas) está en la página **«Sprint · fuera de alcance»** del canvas Deploya v4.1 (<https://claude.ai/artifact/B89rty3MNxRKW9RHJQwSZT>). Alcance y modo autoalojado: [alcance.md § Sprint fuera de alcance](alcance.md#sprint-fuera-de-alcance).

Prompts para los agentes de cada persona: [handoff/prompt-sprint-fuera-de-alcance.md](handoff/prompt-sprint-fuera-de-alcance.md).

### Reglas

- Los puntos del sprint **no** cuentan para el porcentaje del núcleo (145 pts): se suman aparte.
- Cada historia entra con su change de OpenSpec (ya propuestos en `openspec/changes/`, validan con `openspec validate --all`), una prueba unitaria por escenario y su revisión contra el canvas en claro y oscuro. Misma definición de terminado que el núcleo.
- Si el sprint aprieta, se recorta en este orden: **SP-19, SP-15, SP-14**. Si una historia no entra, las dos **si da tiempo** (SP-12 y SP-13) pasan a fijas.
- Sin dependencias npm nuevas: las gráficas son SVG a mano, como `MapaActividad`. Las ilustraciones usan `framer-motion`, que ya está instalado. Si alguien necesita una librería, lo justifica en el `design.md` de su change y lo dice en el PR.
- La landing pública (nube vs. autoalojado) la hace Derek aparte y no suma puntos aquí.

### Dependencias nuevas

| Dónde | Qué | Para qué | Quién la agrega |
|---|---|---|---|
| `apps/web`, `apps/api` (npm) | **Ninguna** | Gráficas en SVG a mano; ilustraciones con `framer-motion` ^13.4 (ya instalado) | — |
| CI (`.github/workflows`) | `shellcheck` (las pruebas de shell van con `node --test`, sin bats) | Revisar y probar `instalar.sh`, `respaldar.sh`, `actualizar.sh` | Derek (`feat-instalador-autoalojado`) |
| CI (`.github/workflows`) | `gitleaks` | Historial y PRs sin secretos (el repo ya es público) | Derek (`chore-open-source`) |
| Servidor autoalojado | Docker 24+, Docker Compose v2, `curl`, `dig`, `openssl` | Requisitos que comprueba la etapa 1 del instalador | Documentado en el README (`chore-open-source`) |
| Servicios externos | Proveedor DNS con API (Cloudflare u otro soportado por Traefik) o `--sin-comodin` | Certificado comodín por DNS-01 (ADR 0007) | Quien instala |

### Historias

| Id | Historia | Pantallas | Dueño | Change | Pts | Prioridad |
|---|---|---|---|---|---|---|
| SP-01 | Ilustraciones de acceso con movimiento (idea y artboard a elección de Eddy) | 01, 03 | Eddy | `feat-web-ilustraciones-acceso` | 2 | Sprint |
| SP-02 | Plantillas de avisos y `AvisosPuerto` | 24b | Eddy | `feat-m10-avisos-correo` | 3 | Sprint |
| SP-03 | «Último cambio» de la contraseña (columna: Javier; pantalla: Eddy) | 05b | Eddy + Javier | `feat-m1-ultimo-cambio-contrasena` | 1 | Sprint |
| SP-04 | El ciclo §4.4 avisa Por vencer y Suspendida | 24b | Javier | `feat-m10-avisos-correo` | 1 | Sprint |
| SP-05 | Reactivar una cuenta suspendida | 25c | Javier | `feat-m9-reactivar-cuenta` | 2 | Sprint |
| SP-06 | Modo autoalojado: plan sin cobro, límites de instalación y primer admin con código | 30 | Javier | `feat-m2-modo-autoalojado` | 2 | Sprint |
| SP-07 | Muestreo de CPU y memoria y `GET /proyectos/:id/metricas` | 16 | Derek | `feat-m5-muestreo-metricas` | 3 | Sprint |
| SP-08 | El pipeline avisa Saludable y Fallido (un `OyenteDespliegue` más) | 24b | Derek | `feat-m10-avisos-correo` | 1 | Sprint |
| SP-09 | Código abierto: licencia, README, CONTRIBUTING, SECURITY, historial sin secretos | — | Derek | `chore-open-source` | 1.5 | Sprint |
| SP-10 | Familia de gráficas y pestaña Métricas | 16 | Eduardo | `feat-m7-metricas` | 4 | Sprint |
| SP-11 | Tarjeta «Últimas 24 h» en el Resumen | 13c | Eduardo | `feat-m7-metricas` | 1 | Sprint |
| SP-12 | Bitácoras de ejecución | 15 | Eduardo | `feat-m7-bitacoras-ejecucion` | 3 | Si da tiempo |
| SP-13 | Admin · Infraestructura | 27 | Eduardo | `feat-m9-infraestructura` | 3 | Si da tiempo |
| SP-14 | Tiempo por etapa en Despliegues | 14c | Eduardo | `feat-m7-tiempo-por-etapa` | 2 | Sprint |
| SP-15 | Ritmo de construcciones en Mi suscripción | 08c | Eduardo | `feat-m7-ritmo-construcciones` | 2 | Sprint |
| SP-16 | Instalador por etapas con comprobaciones | 30 | Derek | `feat-instalador-autoalojado` | 2.5 | Sprint |
| SP-17 | Asistente de primera configuración | 31 | Eddy | `feat-m1-asistente-instalacion` | 2 | Sprint |
| SP-18 | Admin · Instalación: estado, registro, límites y respaldos | 32 | Javier | `feat-m9-ajustes-instalacion` | 3 | Sprint |
| SP-19 | Actualizar y respaldar con un comando | 32 | Derek | `feat-instalador-autoalojado` | 1.5 | Sprint |

| Persona | Sprint | Si da tiempo |
|---|---|---|
| Eddy | 7.5 (SP-01, SP-02, SP-03 pantalla, SP-17) | — |
| Javier | 8.5 (SP-03 columna, SP-04, SP-05, SP-06, SP-18) | — |
| Eduardo | 9 (SP-10, SP-11, SP-14, SP-15) | 6 (SP-12, SP-13) |
| Derek | 9.5 (SP-07, SP-08, SP-09, SP-16, SP-19) | — |
| **Total** | **34.5** | **6** |

### Dependencias entre personas

Quién espera a quién. Los contratos están en [contratos/](contratos/); cambiarlos exige avisar al consumidor antes de mergear.

| Quién entrega | Qué | A quién | Cuándo | Contrato |
|---|---|---|---|---|
| Javier | Columna `Usuario.contrasenaCambiadaEn` (migración) | Eddy (SP-03) | Día 1 | [datos-nucleo.md](contratos/datos-nucleo.md) |
| Eddy | `AvisosPuerto` exportado por `NotificacionesModule` | Derek (SP-08), Javier (SP-04) | Día 2 | [avisos.md](contratos/avisos.md) |
| Eduardo | `GraficaUso`, `GraficaEtapas`, `GraficaRitmo` en `/sistema` | Eduardo (SP-11, SP-14, SP-15, SP-13) | Día 3 | [diseno/README.md § Gráficas](diseno/README.md#gráficas) |
| Derek | `GET /proyectos/:id/metricas` y `MuestrasMetricas` | Eduardo (SP-10, SP-11, SP-13) | Día 3 | [metricas.md](contratos/metricas.md) |
| Derek | `RepositorioDespliegues.tiemposDe(proyectoId, ultimos)` (lee `EtapaDespliegue`) | Eduardo (SP-14, arma `GET /proyectos/:id/despliegues/tiempos`) | Día 4 | [metricas.md](contratos/metricas.md) |
| Eduardo | `GET /observabilidad/consumo/diario` (amplía M7-03) | Eduardo (SP-15) | Día 6 | [metricas.md](contratos/metricas.md) |
| Javier | `MODO_INSTALACION`, `ConfiguracionInstalacion`, límites y código de configuración | Eddy (SP-17), Derek (SP-16) | Día 3 | [instalacion.md](contratos/instalacion.md) |
| Javier | Política de registro e `Invitacion` | Eddy (registro en 01) | Día 7 | [instalacion.md](contratos/instalacion.md) |
| Derek | El instalador escribe `.env` y el código de configuración | Eddy (SP-17), Javier (SP-06) | Día 5 | [instalacion.md](contratos/instalacion.md) |
| Derek | `respaldar.sh` y `actualizar.sh` dejan su estado en JSON | Javier (SP-18) | Día 8 | [instalacion.md](contratos/instalacion.md) |

### Calendario (10 días)

| Días | Qué |
|---|---|
| 0 | PR 0 en `main` (este plan, los changes, contratos, fichas y ADR 0008). Cada quien **revisa** sus changes (`/opsx-update` si algo no le cuadra) |
| 1–3 | Columna y «Último cambio» · plantillas y `AvisosPuerto` · muestreo y lectura de métricas · familia de gráficas · licencia y README · modo autoalojado |
| 4–6 | Ganchos del pipeline y del ciclo · reactivar · pestaña Métricas y 13c · instalador por etapas · asistente (31) · propuesta de ilustraciones en el canvas |
| 7–9 | 14c y 08c · Admin · Instalación (32) · actualizar y respaldar · correos en el VPS · si da tiempo: 15 y 27 |
| 10 | Demo del sprint en el VPS e instalación limpia en un servidor aparte |

### Qué se demuestra

Métricas de un proyecto con el chip `#14` donde subió la memoria; tiempo por etapa y ritmo de construcciones; un despliegue Saludable y uno Fallido que llegan por correo; el ciclo manda «vence en 7 días» una sola vez; reactivar una cuenta suspendida; 05b con «Último cambio»; las ilustraciones nuevas. Después, en un servidor limpio: `./scripts/instalar.sh`, el asistente con el código de configuración, registro con invitación, límites por proyecto, `actualizar.sh` y un respaldo.

### Eddy (7.5 pts)

| Id | Terminado cuando |
|---|---|
| SP-01 | Su propuesta está en el canvas y luego en 01 y 03; con `prefers-reduced-motion` no se mueve nada; `pnpm check` en verde |
| SP-02 | Las cuatro plantillas de 24b pasan sus pruebas y `AvisosPuerto` está exportado; un error del SMTP no se propaga |
| SP-03 | 05b muestra «Último cambio: …» o «Nunca la has cambiado» |
| SP-17 | En una instalación limpia, el asistente pide el código, crea el administrador y termina con correo probado o «sin correo» |

Las ilustraciones son libres: Eddy elige el artboard y la idea. Lineamientos en la hoja del canvas y en `feat-web-ilustraciones-acceso`: solo pantallas de acceso, solo tokens, animar `transform` y `opacity`, todo quieto con movimiento reducido, `aria-hidden`, sin librerías nuevas sin avisar.

### Javier (8.5 pts)

| Id | Terminado cuando |
|---|---|
| SP-03 | Migración con `contrasenaCambiadaEn` aplicada en compose (día 1) |
| SP-04 | Correr el ciclo dos veces manda un solo correo de «Por vencer» y uno de «Suspendida» |
| SP-05 | Reactivar a `suspendida@` la deja entrar; con la suscripción vigente sus apps vuelven |
| SP-06 | En autoalojado no hay Suscripción ni planes; sin código de configuración no se crea administrador |
| SP-18 | Cambiar el registro a «Con invitación» y entrar con un enlace; sin enlace, 403. Los límites aplican en el próximo despliegue |

### Eduardo (9 pts + 6 si da tiempo)

| Id | Terminado cuando |
|---|---|
| SP-10 | Métricas (16) con 1 h / 24 h, zona de aviso, chips de despliegue, punto en vivo, tooltip y «Ver tabla»; las tres gráficas en `/sistema` |
| SP-11 | 13c en el Resumen con las dos gráficas compactas y el estado en palabra |
| SP-14 | 14c encima de la tabla de 14: mediana, % de Construcción, fallos y reversiones sin Construcción |
| SP-15 | 08c dentro de `ConsumoPeriodo`: acumulado del mes calendario, proyección al cierre y zona de aviso |
| SP-12 | *Si da tiempo.* 15 con la salida del contenedor cada 3 s, pausa, filtro y descarga |
| SP-13 | *Si da tiempo.* 27 solo para Administrador, con CPU, memoria y disco del VPS y la cola |

### Derek (9.5 pts)

| Id | Terminado cuando |
|---|---|
| SP-07 | Una muestra por minuto por contenedor Saludable, purga de 24 h y la lectura con los despliegues de la ventana |
| SP-08 | Un Saludable y un Fallido mandan su correo; un Cancelado no; un fallo del aviso no cambia el estado |
| SP-09 | `gitleaks` sobre todo el historial **el día 1** y rotación inmediata de lo que aparezca (el repo ya es público); `LICENSE`, README, `CONTRIBUTING.md` y `SECURITY.md` |
| SP-16 | En un servidor limpio, `instalar.sh` llega a HTTPS; con el DNS mal se detiene sin escribir nada y `--continuar` retoma |
| SP-19 | `actualizar.sh` respalda antes, migra y no corta las apps publicadas; `--volver` restaura |

### Cierre del sprint (27 de octubre)

Las 17 historias fijas (34.5 pts) están en `main` y sus changes archivados. Las dos **si da tiempo** también entraron (6 pts): **SP-12** (pantalla 15, `GET /proyectos/:id/bitacora`, la API pide `docker logs` al trabajador por la cola `bitacoras`) y **SP-13** (pantalla 27, `GET /admin/infraestructura`). Total del sprint: **40.5 pts**. Los seis changes que quedaban abiertos (`feat-m1-asistente-instalacion`, `feat-m7-metricas`, `feat-m7-tiempo-por-etapa`, `feat-m7-ritmo-construcciones`, `feat-m7-bitacoras-ejecucion`, `feat-m9-infraestructura`) se sincronizaron a sus specs y se archivaron en el mismo PR. `openspec/changes/` queda sin changes activos.

