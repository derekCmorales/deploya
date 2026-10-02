# Prompts · Avance 2 (50 %)

> **Para cada integrante:** copia **tu** sección completa como primer mensaje a tu agente (Claude Code, Cursor, Copilot) dentro del repo `derekCmorales/deploya`, con `main` actualizado. Los changes de OpenSpec **ya están propuestos**: el agente los revisa, ajusta con `/opsx-update` si algo no cuadra y los implementa con `/opsx-apply`. Si un contrato no te cuadra, **no lo cambies en silencio**: avisa a su dueño antes de mergear.
>
> Fuentes: [plan-avances.md § Avance 2](../plan-avances.md#avance-2--50--cierre-de-f3-viernes-9-de-octubre), [ingenieria.md §5.4](../ingenieria.md#54-pruebas-mínimas-del-avance-2), [contratos/despliegues.md](../contratos/despliegues.md) v2.1, [contratos/datos-nucleo.md](../contratos/datos-nucleo.md) 1.1 y el canvas Deploya v4.1, página **Avance 2 · 50 % · guía**. Si difieren de este archivo, manda el repo.

## Lo común a los cuatro (va al principio de cada prompt)

```text
Eres el agente de <nombre> en el repo derekCmorales/deploya (NestJS + Next.js, monolito modular).
Antes de escribir código lee, en este orden: AGENTS.md, docs/alcance.md, docs/plan-avances.md
(sección Avance 2), el change de OpenSpec que se indica abajo (proposal, design, tasks y specs),
docs/ingenieria.md (§5.4 son tus pruebas mínimas) y, si hay UI, docs/diseno/README.md,
docs/diseno/guia-construccion.md y la ficha de cada pantalla en docs/diseno/pantallas/.

Reglas que no se negocian:
- Nunca commits a main. Una rama por change: feat/m<n>-<slug>. Conventional Commits: feat(m1): …
- Puertos como abstract class sin prefijo I; el servicio recibe puertos por constructor.
  Nunca new de Prisma, Docker, SMTP ni Date.now() en el dominio (usa Reloj).
- Una prueba unitaria por cada Scenario del spec delta; el nombre del it(...) es el del escenario.
  Sin Docker, red, base ni reloj reales. pnpm test en verde antes de marcar una tarea.
- UI solo con componentes de apps/web/src/components y tokens de globals.css: nada de hex,
  otra paleta, otro shell ni otros iconos.
- Si cambias un puerto, clase o estado: docs/diagramas/compartido/clases-unificado.mmd y
  pnpm diagramas:sync en el mismo PR.
- Antes de pedir revisión: pnpm check. PR con la plantilla. Tras el merge: /opsx-archive.
- Plazo: jueves 8 de octubre a las 20:00 todo en main; ensayo a las 21:00.
```

---

## Eddy

```text
Eres el agente de Eddy (@EddyPoroj106), dueño de M1 Identidad, M10 Notificaciones y CI.
Historias del Avance 2 (6 pts):

1) Change openspec/changes/feat-m1-estados-roles — M1-04 (2 pts). Rama feat/m1-estados-roles.
   - POST /identidad/verificacion/reenvio neutro, cuenta atrás de 60 s (429 EsperaReenvio con segundos).
   - CuentaSuspendida con motivo y fecha (Usuario.motivoSuspension, estadoDesde) para 03b.
   - RolGuard + @Roles("administrador") exportados por IdentidadModule; AdministracionController
     los usa (403 SoloAdministracion). PRIMERO esto: Javier lo necesita el lunes 5 a las 12:00.
   - Web: 02 y 03b con «Reenviar correo» y cuenta atrás; 28 con 403 y «Sesión expirada».

2) Change openspec/changes/feat-m1-recuperacion — M1-05 (3 pts) y M10-02 (1 pt). Rama feat/m1-recuperacion.
   - POST /identidad/recuperacion (202 neutro) y POST /identidad/recuperacion/restablecer (204).
   - Token de 30 min, un uso, uno vivo por cuenta; restablecer revoca TODAS las sesiones.
   - PlantillaRecuperacion sobre PlantillaCorreo (Template Method), con enlace en texto plano.
   - Web: /recuperar y /restablecer?token= según docs/diseno/pantallas/04-Recuperar.md.

Antes del lunes: /opsx-archive de feat-m10-correo-verificacion, feat-m1-registro-verificacion y
feat-m1-sesion (en ese orden), y las tareas 7.8 y 7.9 de feat-m1-registro-verificacion.

Presentas el viernes: «Olvidé mi contraseña» → Mailpit (localhost:8025) → nueva contraseña →
el otro navegador pierde la sesión; un Cliente en /admin ve 403.
```

---

## Javier

```text
Eres el agente de Javier, dueño de M2 Suscripciones, M9 Administración y prisma/.
Tu Avance 2 (M2-02, M2-03, M2-04, 11 pts) YA está en main (PR #15). Esta semana:

1) /opsx-archive de feat-m2-schema-nucleo y feat-m2-contratacion-suscripcion.
2) Seed de demo para M5-03 (change openspec/changes/feat-m5-bloqueos-cuota, tareas 1.1 y 1.2),
   lunes 5 a las 12:00: vencida@deploya.app con la suscripción Vencida y suspendida@deploya.app
   con la suscripción Suspendida, misma contraseña de demo que cliente@deploya.app. El seed sigue
   idempotente (prueba de dos corridas). Contrato: docs/contratos/datos-nucleo.md v1.1.
3) Revisar los PRs que tocan prisma/ y el de Eddy que agrega RolGuard a AdministracionController.
4) Si sobra tiempo, sin prometerlo: abrir el change de M2-05 (ciclo §4.4, tarea diaria) con
   /opsx-propose. Es lo que más pesa del Avance 3 y desbloquea «Suspensión» de M5.

Presentas el viernes: contratar Starter con la tarjeta de prueba (aprobada y rechazada),
Mi suscripción, ascenso y descenso programado; y la cuenta Vencida bloqueando «Desplegar».
```

---

## Eduardo

```text
Eres el agente de Eduardo (@Portillo17e), dueño de M3 Proyectos, M7 Observabilidad y apps/web.
Historias del Avance 2 (8 pts):

1) Change openspec/changes/feat-m7-vista-despliegue — M7-01 (5 pts). Rama feat/m7-vista-despliegue.
   - Layout /projects/[proyecto] (cabecera y pestañas de 13–19; Resumen y Despliegues como
     «llega en el Avance 3») y página despliegues/[n] con 12, 12b y 12c.
   - GET /proyectos/:id/despliegues/:numero (lo hace Derek, lunes 12:00) y luego sondeo por id:
     GET /despliegues/:id y GET /despliegues/:id/bitacora?desde=n cada 3 s hasta terminado = true.
   - Funciones puras en lib/despliegues.ts (fusionarLineas, lineaDeError, textoParaCopiar,
     tiempoTranscurrido) con node --test. Reutiliza RielEtapas, Bitacora, useSondeo.
   - «Desplegar» (11d) y una fila de 10 llevan a 12. «Cancelar» NO se muestra (es del Avance 3).

2) Change openspec/changes/feat-m3-variables-cifradas — M3-03 (3 pts). Rama feat/m3-variables-cifradas.
   - ClaveVariable, CifradorVariables (AES-256-GCM, v1:<iv>:<tag>:<cifrado>, CLAVE_CIFRADO_VARIABLES),
     RepositorioVariables, VariablesProyectoService; rutas GET/PUT /proyectos/:id/variables y
     GET /proyectos/:id/variables/:clave; POST /proyectos acepta variables (11c).
   - Exporta VariablesProyectoService.descifradasDe el miércoles 7 a las 12:00 (Derek lo conecta).
   - Web: 11c en el asistente y 17 (borrador, Descartar, Guardar, Guardar y desplegar → 12, Mostrar).

3) Con Derek: textos de 11a y 11e con la detección de stack (feat-m4-deteccion-stack, tareas 4.1 y
   4.2: LectorFuenteGitHub) y el banner de bloqueo en 11d y 17 (feat-m5-bloqueos-cuota, tarea 3.2:
   POST /proyectos llama a BloqueosService.verificar ANTES de persistir).

Antes del lunes: /opsx-archive de feat-m3-alta-proyecto.
Contrato: docs/contratos/despliegues.md v2.1 (tabla «Qué cambia para la web»).

Presentas el viernes: alta con la variable SALUDO → riel y bitácora en vivo → 12b con URL y
digest; la rama roto en 12c con la línea resaltada; cambiar SALUDO en 17 y «Guardar y desplegar».
```

---

## Derek

```text
Eres el agente de Derek (@derekCmorales), dueño de M4, M5, M6, compose, adapters, contratos y
diagramas. Historias del Avance 2 (12 pts), en este orden:

1) Lunes 12:00: GET /proyectos/:id/despliegues/:numero y RepositorioDespliegues.porNumero
   (tareas 1.x de openspec/changes/feat-m7-vista-despliegue) para Eduardo.
2) Change feat-m4-deteccion-stack — M4-03 (5 pts). DeteccionStackService exportado el martes 6.
3) Change feat-m5-bloqueos-cuota — M5-03 (2 pts). PoliticaDespliegue pura, BloqueosService
   exportado el martes 6 a las 12:00; construcciones del mes = invariante I7 (mes calendario UTC,
   disparador ≠ reversion). Filtro 409 con los dos códigos del contrato.
4) Change feat-m5-acciones-contenedor — M5-02 (3 pts) y cierre de M6-01 (2 pts). Cola «operacion»
   (Command + Strategy por tipo), reiniciar, detener (202), eliminar borra contenedor, imágenes y
   ruta. Pruebas de los escenarios de subdominio y conmutación que ya corren. Tarea 8.2 de
   feat-m4-motor-construccion: recorrido desde la API en compose.
5) Miércoles 7: VariablesEntornoPuerto en M5 sobre VariablesProyectoService de Eduardo
   (feat-m3-variables-cifradas, tareas 3.x); PasoEjecucion deja de pasar {}.

Repo público hola-deploya: publicar server.js con SALUDO y la rama sin-dockerfile
(ejemplos/hola-deploya/README.md). Contratos ya publicados: despliegues v2.1 y datos-nucleo 1.1.
Revisa todos los PRs que tocan el motor, adapters, compose y contratos.

Presentas el viernes: sin-dockerfile → «Stack detectado: Node.js 22» → en línea; Guardar y
desplegar sin corte; detener y reiniciar; vencida@deploya.app bloqueada.
```
