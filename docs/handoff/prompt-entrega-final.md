# Prompts · Entrega final (100 %)

> **Cómo se usan:** copia «Lo común» y tu sección como primer mensaje a tu agente (Claude Code, Cursor, Copilot) dentro de `derekCmorales/deploya`, con `main` actualizado. En este sprint **el equipo solo escribe código**: un change pequeño cada uno, **ya propuesto** en `openspec/changes/`, y los errores P1 de su módulo. Toda la documentación final, el e2e, el VPS y la versión `v1.0.0` son de Derek.
>
> Fuentes: [plan-avances.md § Entrega final](../plan-avances.md#entrega-final--100--entrega-y-exposición-viernes-6-de-noviembre), el change de cada quien, [ingenieria.md](../ingenieria.md) y, si hay UI, [diseno/README.md](../diseno/README.md). Si difieren de este archivo, manda el repo.

## Lo común (va al principio de cada prompt)

```text
Trabajas en el repo derekCmorales/deploya (NestJS + Next.js, monolito modular, pnpm).
Antes de escribir código lee, en este orden: AGENTS.md, docs/plan-avances.md (§ Entrega final:
regla del sprint, historias y calendario), tu change en openspec/changes/ (proposal, design,
specs y tasks), docs/ingenieria.md y, si hay UI, docs/diseno/README.md y
docs/diseno/guia-construccion.md.

Reglas que no se negocian:
- El change ya está propuesto: revísalo, ajusta con /opsx-update solo si algo no cuadra con el
  código real, e impleméntalo con /opsx-apply. Nada fuera de sus tareas.
- Nunca commits a main. Rama con el nombre del change. Conventional Commits: feat(m1): …
- Puertos como abstract class sin prefijo I; los servicios reciben puertos por constructor.
  Nunca new de Prisma, Docker, SMTP ni Date.now() en el dominio (usa Reloj de compartido/).
- Una prueba por cada Scenario del spec delta, con el nombre del escenario en el it(...).
  Sin Docker, red, base ni reloj reales. pnpm test en verde antes de marcar una tarea.
- UI solo con componentes de apps/web/src/components y tokens de globals.css.
- Sin dependencias npm nuevas, sin pantallas nuevas, sin cambios de contrato fuera del change.
- Si cambias un puerto o una clase: docs/diagramas/compartido/clases-unificado.mmd y
  pnpm diagramas:sync en el mismo PR.
- Antes de pedir revisión: pnpm check. PR con la plantilla. Tras el merge: /opsx-archive.
- No escribes documentación de la entrega (la hace Derek). Solo los comentarios y el design.md
  que tu change necesite.
- Errores que encuentres al probar en el VPS: issue con la plantilla «error» y la etiqueta
  `final`. Si Derek lo marca P1 en tu módulo, rama fix/…, con su prueba unitaria.
- Plazo: tu change en main el domingo 1; martes 3 a las 20:00 todo en main; jueves 5 a las
  20:00 se congela.
```

---

## Eddy

```text
Eres el agente de Eddy (@EddyPoroj106): M1, M10 y (auth). Change: openspec/changes/
feat-m1-limite-intentos (EST-01a, 2 pts). Rama: feat/m1-limite-intentos.

Qué haces:
- Mueve LimiteIntentos de identidad/instalacion/ a identidad/dominio/, con el máximo y la
  ventana por parámetro, y agrégale limpiar(origen). El código de configuración (SP-17) debe
  seguir pasando sus pruebas sin cambiar su comportamiento.
- Error de dominio DemasiadosIntentos con los segundos de espera; ErroresIdentidadFilter lo
  traduce a 429 con la cabecera Retry-After.
- Aplica los límites: POST /identidad/sesion (5 fallos por ip|correo en 15 min; el inicio
  correcto limpia), POST /identidad/registro (10 por IP por hora),
  POST /identidad/verificacion/reenvio y POST /identidad/recuperacion (3 por correo por hora,
  misma respuesta de siempre y sin mandar el correo).
- La IP sale de req.ip (trust proxy ya está configurado en main.ts).
- Web: Banner «Demasiados intentos. Vuelve a intentar en N min.» en 01, 03 y 04.
- Pruebas: los seis escenarios del spec delta.

Además: el viernes 30 Derek manda la URL del VPS. Prueba 1 h tu parte (registro, verificación,
login con cada estado, recuperar, Mi cuenta, correos en una bandeja real) el fin de semana y otra
vez el miércoles 4. Cada error, un issue `final`.

Demo: partes 2 (Cuentas) y 8 (Calidad y proceso) del guion.
```

---

## Javier

```text
Eres el agente de Javier (@Javier-r04): M2, M9, (admin) y Prisma. Change: openspec/changes/
feat-m9-limpieza-diaria (EST-01b, 2 pts). Rama: feat/m9-limpieza-diaria.

Qué haces:
- PoliticaLimpieza (regla pura): desde Reloj.ahora() calcula las fechas de corte: tokens de
  cuenta usados o vencidos hace > 7 días; sesiones revocadas hace > 7 días o sin actividad hace
  > 14; invitaciones usadas, revocadas o vencidas hace > 30 días.
- PurgaDatosVencidosPuerto (abstract class) con tres métodos estrechos, su doble en memoria y el
  adaptador en adapters/prisma/ con deleteMany por fecha. No toques ninguna otra tabla.
- LimpiezaService: orquesta y guarda ultimaLimpieza y filasLimpiadas en
  ConfiguracionInstalacion (migración; actualiza docs/contratos/datos-nucleo.md y avisa a Eddy,
  porque Sesion y TokenCuenta son de M1).
- Tarea diaria en BullMQ igual que la del ciclo (mira suscripciones/ciclo/cola-ciclo.bullmq.ts):
  cola «limpieza», upsertJobScheduler a las 00:35 UTC.
- POST /admin/limpieza/ejecutar solo para Administrador (como POST /admin/ciclo/ejecutar).
- Web: una línea «Última limpieza: <fecha> · N filas» en 32.
- Pruebas: los cuatro escenarios del spec delta. Antes del PR, córrela en compose con filas
  viejas sembradas a mano.

Además: el viernes 30 Derek manda la URL del VPS. Prueba 1 h tu parte (catálogo, contratar, Mi
suscripción, cambiar plan, PDF, ciclo, admin) el fin de semana y otra vez el miércoles 4. Cada
error, un issue `final`.

Demo: partes 3 (Cobro y ciclo) y 6 (Administrar) del guion.
```

---

## Eduardo

```text
Eres el agente de Eduardo (@Portillo17e): M3, M7 y apps/web. Change: openspec/changes/
feat-web-lanzamiento (EST-01c, 2 pts). Rama: feat/web-lanzamiento.

Qué haces:
- error.tsx en app/ y en (auth), (billing), (cuenta), (projects) y (admin), y global-error.tsx,
  todos con ErrorConexionApi (components/estados) y «Reintentar» llamando a reset().
- loading.tsx: (projects) con EsqueletoProyectos; los demás grupos con Skeleton.
- next.config.ts con headers(): X-Frame-Options DENY, X-Content-Type-Options nosniff,
  Referrer-Policy strict-origin-when-cross-origin y Permissions-Policy sin cámara, micrófono
  ni ubicación. No agregues HSTS (lo pone Traefik).
- layout.tsx: title.template "%s · Deploya", openGraph; un título en cada page.tsx;
  app/icon.svg con el Wordmark del design system (solo tokens, nada de hex nuevo).
- Desde el lunes 2: las correcciones pequeñas de la tabla de accesibilidad que deja Derek en
  docs/entrega-final/accesibilidad.md (aria-label, foco visible, contraste con tokens). Lo que no
  sea pequeño se queda «Pendiente»; no rediseñes nada.
- Pruebas: los cuatro escenarios del spec delta.

Además: el viernes 30 Derek manda la URL del VPS. Prueba 1 h tu parte (alta, variables,
configuración, Resumen, Despliegues, Métricas, bitácoras, consumo y ritmo) el fin de semana y
otra vez el miércoles 4. Cada error, un issue `final`.

Demo: parte 5 (Observar) del guion.
```

---

## Derek (lista propia)

QA-01, DOC-01, DOC-02, DOC-03, EST-01d y el lanzamiento L0–L10 de [plan-avances.md § Lanzamiento](../plan-avances.md#lanzamiento-derek-sin-puntos). Además:

- La tabla de accesibilidad de DOC-02 lista el domingo 1, para que Eduardo corrija desde el lunes.
- Mandar la URL del VPS y las cuentas de prueba al equipo el viernes 30 a las 20:00 (por el chat del equipo, nunca en el repo).
- Triar los issues `final` cada noche: P1 al dueño (o a Derek si el dueño no puede), P2 y P3 a `despues-de-entrega`.
- Revisar los PRs de los tres changes el mismo día que se abren; agregar a QA-01 el caso de 429 cuando entre EST-01a.
- Jueves 5 a las 20:00: `main` congelado, `CHANGELOG.md`, etiqueta `v1.0.0`, *release* y despliegue final.
