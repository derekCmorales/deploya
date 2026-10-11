# Prompts · Avance 3 (85 %)

> **Para cada integrante:** copia **tu** sección completa como primer mensaje a tu agente (Claude Code, Cursor, Copilot) dentro del repo `derekCmorales/deploya`, con `main` actualizado. Los changes de OpenSpec **ya están propuestos**: el agente los revisa, ajusta con `/opsx-update` si algo no cuadra y los implementa con `/opsx-apply`. Si un contrato no te cuadra, **no lo cambies en silencio**: avisa a su dueño antes de mergear.
>
> Fuentes: [plan-avances.md § Avance 3](../plan-avances.md#avance-3--85--entrega-viernes-23-de-octubre-en-la-noche), [ingenieria.md §5.5](../ingenieria.md#55-pruebas-mínimas-del-avance-3), [contratos/despliegues.md](../contratos/despliegues.md) v3, [contratos/datos-nucleo.md](../contratos/datos-nucleo.md) 1.3 y el canvas Deploya v4.1, página **Avance 3 · 85 % · guía**. Si difieren de este archivo, manda el repo.

## Lo común a los cuatro (va al principio de cada prompt)

```text
Eres el agente de <nombre> en el repo derekCmorales/deploya (NestJS + Next.js, monolito modular).
Antes de escribir código lee, en este orden: AGENTS.md, docs/alcance.md, docs/plan-avances.md
(sección Avance 3), el change de OpenSpec que se indica abajo (proposal, design, tasks y specs),
docs/ingenieria.md (§5.5 son tus pruebas mínimas) y, si hay UI, docs/diseno/README.md,
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
- Plazo: viernes 23 de octubre a las 20:00 todo en main y desplegado en el VPS; el martes 20
  a las 20:00 ya debe estar en main para probarlo en el VPS.
```

---

## Eddy

```text
Eres el agente de Eddy (@EddyPoroj106), dueño de M1 Identidad, M10 Notificaciones y CI.
Historias del Avance 3 (4 pts):

1) Change openspec/changes/feat-m1-cuenta — M1-06 (2 pts) y M1-07 (2 pts). Rama feat/m1-cuenta.
   - NombreCuenta (VO, 1–64, recorta); el registro pasa a usarlo.
   - GET y PATCH /identidad/cuenta; POST /identidad/cuenta/contrasena { actual, nueva } que revoca
     las OTRAS sesiones (RepositorioSesiones.revocarTodasMenos) y no la actual;
     DELETE /identidad/sesiones revoca TODAS y borra la cookie.
   - Web: /cuenta (05) y /cuenta/seguridad (05b) según docs/diseno/pantallas/05-*.md.

Jueves 15: con Derek, variables SMTP del proveedor de correo en el VPS (ADR 0001: solo variables).
CI verde en cada PR. Si sobra tiempo, sin prometerlo: esqueleto del recorrido e2e de QA-01.

Demuestras en la entrega: Mi cuenta, cambiar la contraseña con dos navegadores (el otro pierde la
sesión), «Cerrar todas», y el correo de verificación llegando a un buzón real desde el VPS.
```

---

## Javier

```text
Eres el agente de Javier, dueño de M2 Suscripciones, M9 Administración y prisma/.
Historias del Avance 3 (13 pts), en este orden:

1) Change openspec/changes/feat-m2-ciclo-suscripcion — M2-05 (5 pts). Rama feat/m2-ciclo-suscripcion.
   - PoliticaCiclo pura (DIAS_POR_VENCER = 7, DIAS_GRACIA = 5, DIAS_HASTA_CANCELAR = 30; Sandbox no
     vence; un salto por corrida; descenso programado al vencer).
   - CicloSuscripcionService.ejecutar(), tarea diaria BullMQ 00:05 UTC en el trabajador y
     POST /admin/ciclo/ejecutar (RolGuard) para la demo.
   - ContenedoresClientePuerto { detenerTodos, reanudarTodos }: el adaptador lo entrega Derek el
     martes 13 a las 12:00 (tarea 3); hasta entonces usa el doble.
   - Panel «Suscripción suspendida» de 28.

2) Change openspec/changes/feat-m9-usuarios-suspension — M9-01 (3) y M9-02 (2). Rama feat/m9-usuarios-suspension.
   - GET /admin/usuarios (correo, suscripcion, pagina) y GET /admin/usuarios/:id con
     ConsultaUsuariosPuerto; POST /admin/usuarios/:id/suspension { motivo, detalle }:
     estadoCuenta, motivoSuspension, sesiones revocadas, AccionAdministrativa y detener contenedores.
   - Web: /admin/usuarios (25) y Dialog 25b; borra el stub /admin y actualiza nav-panel.tsx.

3) Change openspec/changes/feat-m2-historial-pagos — M2-06 (3 pts). Rama feat/m2-historial-pagos.
   - GET /suscripciones/pagos y GET /suscripciones/pagos/:id/comprobante.pdf con
     ComprobantePdfPuerto (adaptador de PDF + ComprobanteTextoFalso para las pruebas).
   - Web: /pagos (09) y vacío (09b).

Monta <ConsumoPeriodo /> de Eduardo en 08 cuando esté en main (jueves 15).
Revisa los PRs que tocan prisma/. Contrato de datos: 1.3 (sin cambios de tablas).

Demuestras en la entrega: comprobante PDF; ejecutar el ciclo con vencida@ y suspendida@
(banner, contenedores detenidos, renovar y vuelven); admin busca, abre y suspende una cuenta.
```

---

## Eduardo

```text
Eres el agente de Eduardo (@Portillo17e), dueño de M3 Proyectos, M7 Observabilidad y apps/web.
Historias del Avance 3 (4 pts):

1) Change openspec/changes/feat-m3-estados-sistema — WEB-02 (2 pts). Rama feat/m3-estados-sistema.
   - 10c: en /projects, si /suscripciones/mia dice «vencida», el banner con la fecha de gracia
     (reutiliza _componentes/banner-bloqueo.tsx) y «Nuevo proyecto» / «Desplegar» deshabilitados.
   - 28: not-found.tsx con el diseño; ErrorApi con reintento a los 8, 16 y 30 s; esqueleto de la
     lista con Skeleton. Funciones puras finDeGracia, textoVencida y esperaDeReintento con node --test.

2) Change openspec/changes/feat-m7-consumo-actividad — M7-03 (2 pts). Rama feat/m7-consumo-actividad.
   - GET /observabilidad/consumo y GET /proyectos/:id/actividad (84 días, UTC).
   - Componentes <ConsumoPeriodo /> (dos Meter) y <ActividadProyecto proyectoId /> (MapaActividad),
     en main el jueves 15 a las 20:00: Javier los monta en 08 y Derek en 13.

Revisa los PRs con UI de los demás contra docs/diseno/.

Demuestras en la entrega: la lista con la cuenta Vencida, el consumo en 08, el mapa de actividad
en 13 y el estado de error de la API.
```

---

## Derek

```text
Eres el agente de Derek (@derekCmorales), dueño de M4, M5, M6, compose, adapters, contratos,
diagramas y ADR. En el Avance 3 también construyes las pantallas 13, 14, 19 y 19b.
Historias del Avance 3 (19 pts). Sigue los pasos 0 a 8 de docs/plan-avances.md § Derek (Avance 3);
en resumen:

0) Lunes 12: el PR #31 ya está en main. Demo del A2 en compose (8.2 motor, 5.2 detección,
   6.3 acciones, 4.3 bloqueos, 5.2 vista, 5.3 variables) y /opsx-archive en orden: motor →
   detección → acciones → bloqueos → vista de despliegue → variables.
1) Lunes 12 – martes 13: dominio, DNS (A para la raíz y *), VPS con Docker; docker-compose.vps.yml
   y Traefik con Let's Encrypt por DNS-01 (change feat-m6-vps-https, tareas 1.x).
2) Martes 13, 12:00: AccionesProyectoService.detenerTodosDe / reanudarTodosDe y el adaptador
   ContenedoresClienteM5 (change feat-m2-ciclo-suscripcion, tarea 3). Avisar a Javier.
3) Martes 13 – miércoles 14: change feat-m5-reversion-instantanea — M5-04 (3 pts). Retención de 5,
   ReversionService, PlanPipeline.reversion, POST /proyectos/:id/reversiones, GET /proyectos/:id/artefactos.
4) Miércoles 14 – jueves 15: change feat-m4-acciones-despliegue — M4-02 (3 pts). Cancelar con
   CancelacionesPuerto + VigiaCancelacion + AbortSignal en docker build; reintentar; redesplegar
   con checkout del commit. «Cancelar» en 12 y «Reintentar» en 12c.
5) Jueves 15 – sábado 17: change feat-m7-resumen-historial — M7-02 (3 pts). API de resumen e
   historial (cursor antesDe); pantallas 13 y 14 dentro de MarcoProyecto; accionDeFila; monta
   <ActividadProyecto /> de Eduardo en 13.
6) Sábado 17 – domingo 18: change feat-m3-configuracion-proyecto — M3-04 (3 pts). PATCH /proyectos/:id
   con CambiosProyecto; pantalla 19 con borrador y el Dialog 19b que ya existe.
7) Lunes 19 – martes 20: ConfiguracionEnrutamiento (DOMINIO_BASE, ESQUEMA_PUBLICO, CERT_RESOLVER),
   CertificadoPuerto, scripts/desplegar-vps.sh; SMTP del proveedor con Eddy; ADR 0007 y ADR
   0002/0003/0005/0006 a Aceptado (M6-02, 5 pts, y ADR, 2 pts).
8) Miércoles 21: pruebas en el VPS. Jueves 22: ensayo completo y video de respaldo. Viernes 23 20:00: main congelado y desplegado.

Contrato ya publicado: despliegues v3. Revisa todos los PRs que tocan motor, adapters, compose y contratos.

Demuestras en la entrega: todo desde https://…deploya.app; 13 y 14 con datos reales; revertir a #1
en segundos sin reconstruir; cancelar en Construyendo; reintentar roto; cambiar la rama en 19 y
eliminar el proyecto.
```
