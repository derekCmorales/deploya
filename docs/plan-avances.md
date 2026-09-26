# Plan de avances — alcance núcleo v4.1

Qué entrega cada quien en cada avance. Alcance: [alcance.md](alcance.md). Rituales y definición de terminado: [METODOLOGIA.md](../METODOLOGIA.md).

## Cómo se mide el porcentaje

Cada historia del núcleo tiene puntos (1 = medio día, 5 = casi una semana a tiempo parcial). El porcentaje de un avance es la suma acumulada de puntos **terminados** (según la definición de terminado) sobre el total del núcleo. Lo de "solo si da el tiempo" no suma ni resta.

| Entrega | Puntos nuevos | Acumulado | % del sistema |
|---|---|---|---|
| Ya entregado (bootstrap, diagramas, design system v4.1) | 13 | 13 | 9 % |
| **Avance 1** | 33 | 46 | **34 %** |
| Avance 2 | 32 | 78 | 57 % |
| Avance 3 | 37 | 115 | 84 % |
| Entrega final | 22 | 137 | 100 % |

El Avance 1 queda en 34 % a propósito: si una historia no llega, el equipo sigue por encima del 30 %.

| Persona | Hecho | A1 | A2 | A3 | Final | Total |
|---|---|---|---|---|---|---|
| Eddy | — | 10 | 6 | 4 | 5 | 25 |
| Javier | — | 5 | 11 | 13 | 3 | 32 |
| Eduardo | 3 | 8 | 8 | 10 | 3 | 32 |
| Derek | 5 | 10 | 7 | 10 | 3 | 35 |
| Todos | 5 | — | — | — | 8 | 13 |

Javier tiene menos puntos en el Avance 1 porque su schema bloquea a todos: tiene que estar en `main` el lunes.

## Backlog del núcleo

| Id | Historia | Pantallas | Dueño | Pts | Entrega |
|---|---|---|---|---|---|
| H-01 | Monorepo, compose, CI y stubs `health` | — | Derek | 3 | Hecho |
| H-02 | Kit visual canónico en `apps/web` | — | Eduardo | 3 | Hecho |
| H-03 | Diagramas UML, ERD y C4 + specs OpenSpec | — | Todos | 5 | Hecho |
| M10-01 | `CorreoPuerto` + adaptador Mailpit + correo de verificación | 24 | Eddy | 2 | **A1** |
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
| M4-02 | Cancelar, reintentar y redesplegar | 12, 12c, 14 | Derek | 3 | A3 |
| M6-02 | VPS con `*.deploya.app` y HTTPS comodín | — | Derek | 5 | A3 |
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
| M10-01 | `CorreoPuerto` + adaptador Mailpit + plantilla de verificación (pantalla 24) | El correo aparece en Mailpit con el enlace |
| M1-01 | Registro (01, 01b): validación de contraseña, correo único, cuenta *pendiente* | Correo repetido muestra el error de 01b |
| M1-02 | Verificación (02): token de 24 h y un solo uso; estados válido y expirado | El enlace activa la cuenta una sola vez |
| M1-03 | Iniciar y cerrar sesión (03) + `SesionGuard` y `@UsuarioActual()` para el resto de módulos | Cuenta sin verificar no entra; `/projects` exige sesión |

**Presenta:** registro en vivo → correo en Mailpit → cuenta activa → login. Muestra el intento con contraseña débil y con cuenta sin verificar. Enseña las pruebas unitarias del servicio de identidad.

**Entrega a otros:** el guard y el decorador el **martes a las 12:00** a más tardar. Hasta entonces Eduardo usa el usuario del seed.

### Javier — monetización (5 pts)

| Id | Entrega | Terminado cuando |
|---|---|---|
| DB-01 | Schema Prisma del núcleo: `Usuario`, `TokenCuenta`, `Sesion`, `Plan`, `Suscripcion`, `Pago`, `Proyecto`, `VariableEntorno`, `Despliegue`, `LineaBitacora`. Seed de los cuatro planes v4.1 y del admin. Suscripción Sandbox al crear la cuenta | Migración aplicada en compose; seed idempotente |
| M2-01 | Catálogo público de planes (06) con la tabla de recursos y el cambio 30 / 365 días | `/billing/planes` lee de la base, no de constantes |

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

**Presenta:** el diagrama de estados de despliegue y la secuencia contra lo que corre, la bitácora en la base, `docker inspect` con los límites y la app respondiendo. Si M6-01 llega antes, la URL `<proyecto>.localhost`.

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

## Avance 2 — 50 %

Recorrido: todo lo del Avance 1 + contratar un plan con la tarjeta de prueba, ver el despliegue en el riel de cinco etapas con bitácora, abrirlo en su subdominio, cambiar variables y redesplegar sin corte.

| Persona | Historias |
|---|---|
| Eddy | M1-04 estados de login, reenviar, roles y 403 · M1-05 recuperar contraseña · M10-02 correo de recuperación |
| Javier | M2-02 contratación · M2-03 Mi suscripción · M2-04 cambiar plan |
| Eduardo | M7-01 vista de despliegue · M3-03 variables cifradas |
| Derek | M6-01 subdominio · M5-02 conmutación sin corte, reiniciar, detener · M5-03 bloqueos por suscripción y cuota de construcciones |

## Avance 3 — 80 %

Recorrido: todo + ciclo §4.4 (vencida bloquea, suspendida detiene), historial de pagos, administración de usuarios con suspensión, configuración y borrado de proyecto, plataforma en el VPS con HTTPS.

| Persona | Historias |
|---|---|
| Eddy | M1-06 Perfil · M1-07 Seguridad |
| Javier | M2-05 ciclo §4.4 · M2-06 historial · M9-01 usuarios · M9-02 suspender |
| Eduardo | M7-02 resumen e historial · M3-04 configuración y eliminar · WEB-02 estados del sistema · M7-03 consumo y actividad |
| Derek | M4-02 cancelar, reintentar, redesplegar · M6-02 VPS con HTTPS · ADR |

## Entrega final — 100 %

Pruebas e2e (Eddy), requisitos y manual de usuario (Javier), guion, video y accesibilidad (Eduardo), diseño final y manual técnico (Derek), estabilización y ensayo (todos).

Solo después de la entrega del Avance 3, y si el núcleo está estable, se toma algo de [Fuera de alcance · solo si da el tiempo](alcance.md#fuera-de-alcance--solo-si-da-el-tiempo), en su orden.
