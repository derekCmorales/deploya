# Prompts · Sprint fuera de alcance

> **Cómo se usan:** copia el bloque completo como primer mensaje a tu agente (Claude Code, Cursor, Copilot) dentro de `derekCmorales/deploya`, con `main` actualizado y el PR 0 del sprint ya mergeado. Los changes de OpenSpec **ya están propuestos**: el agente los revisa, ajusta con `/opsx-update` si algo no cuadra y los implementa con `/opsx-apply`. Si un contrato no te cuadra, **no lo cambies en silencio**: avisa a su dueño antes de mergear.
>
> Fuentes: [plan-avances.md § Sprint fuera de alcance](../plan-avances.md#sprint-fuera-de-alcance), [alcance.md § Sprint fuera de alcance](../alcance.md#sprint-fuera-de-alcance), [contratos/](../contratos/) (`avisos.md`, `metricas.md`, `instalacion.md`, `datos-nucleo.md` v2), [ADR 0008](../adr/0008-autoalojado-y-codigo-abierto.md), [diseno/README.md § Gráficas](../diseno/README.md#gráficas) y la página **«Sprint · fuera de alcance»** del canvas Deploya v4.1 (<https://claude.ai/artifact/B89rty3MNxRKW9RHJQwSZT>). Si difieren de este archivo, manda el repo.

## Lo común (va al principio de cada prompt)

```text
Trabajas en el repo derekCmorales/deploya (NestJS + Next.js, monolito modular, pnpm).
Antes de escribir código lee, en este orden: AGENTS.md, docs/alcance.md (§ Sprint fuera de
alcance), docs/plan-avances.md (§ Sprint fuera de alcance: historias, dependencias, calendario),
el change de OpenSpec indicado (proposal, design, specs y tasks), los contratos que nombra,
docs/ingenieria.md y, si hay UI, docs/diseno/README.md (incluida § Gráficas),
docs/diseno/guia-construccion.md y la ficha de cada pantalla en docs/diseno/pantallas/.

Reglas que no se negocian:
- Nunca commits a main. Una rama por change (feat/m<n>-<slug>, chore/…). Conventional Commits.
- Puertos como abstract class sin prefijo I; los servicios reciben puertos por constructor.
  Nunca new de Prisma, Docker, SMTP ni Date.now() en el dominio (usa Reloj).
- Una prueba unitaria por cada Scenario del spec delta, con el nombre del escenario en el it(...).
  Sin Docker, red, base ni reloj reales. pnpm test en verde antes de marcar una tarea.
- UI solo con componentes de apps/web/src/components y tokens de globals.css: nada de hex,
  gradientes, otra paleta, otro shell ni otros iconos (Lucide). Revisa claro y oscuro.
- Sin dependencias npm nuevas (regla del sprint). Si de verdad hace falta una, justifícala en el
  design.md del change y dilo en el PR.
- Si cambias un puerto, clase o estado: docs/diagramas/compartido/clases-unificado.mmd y
  pnpm diagramas:sync en el mismo PR. Si cambias un contrato: avisa al consumidor antes de mergear.
- Antes de pedir revisión: pnpm check. PR con la plantilla. Tras el merge: /opsx-archive.
- El repositorio es público: nada de secretos en commits, capturas ni bitácoras.
```

---

## Derek

```text
Eres el agente de Derek (@derekCmorales): M4, M5, M6, adapters, compose, contratos, diagramas,
ADR y scripts. Sprint fuera de alcance, 9.5 pts. Además revisas todo PR que toque motor,
adapters, compose, contratos o scripts.

Día 1, antes que nada — chore-open-source (SP-09, parte urgente):
- El repo YA es público. Corre gitleaks detect sobre todo el historial. Cualquier secreto que
  aparezca ya está expuesto: rótalo de inmediato en el VPS (token del DNS, SMTP,
  CLAVE_CIFRADO_VARIABLES, secreto de sesión) y documenta el falso positivo o la rotación en
  .gitleaks.toml. No reescribas la historia de main.
- Paso de gitleaks en CI para cada PR: lo agrega Derek en chore-open-source (acordado con Eddy, dueño de .github/workflows).

1) openspec/changes/feat-m5-muestreo-metricas — SP-07 (3 pts). Rama feat/m5-muestreo-metricas.
   - MetricasContenedorPuerto + MetricasDockerStats (docker stats --no-stream --format json) en
     apps/api/src/adapters/reales/ + doble en memoria con el mismo contrato (prueba de contrato
     en adapters/stubs/contratos-stubs.spec.ts).
   - MuestreoMetricas en el trabajador (cada 60 s, solo el despliegue activo Saludable),
     MuestraMetrica (migración: pídele revisión a Javier) y purga de 24 h.
   - GET /proyectos/:id/metricas?rango=1h|24h según docs/contratos/metricas.md: límite (por
     CuotaPlanPuerto; en autoalojado sale de LimitesDeInstalacion), serie (24 h = promedio cada
     30 min), despliegues de la ventana y promedioPorVersion. Entrégalo el DÍA 3: Eduardo
     depende de esto para 16 y 13c.
   - RepositorioDespliegues.tiemposDe(proyectoId, ultimos) sobre EtapaDespliegue el DÍA 4
     (Eduardo arma 14c encima).

2) openspec/changes/feat-m10-avisos-correo, tareas de SP-08 (1 pt). Rama del change de Eddy o
   una tuya que la siga.
   - AvisoDespliegueOyente implementa OyenteDespliegue
     (apps/api/src/modules/construccion/puertos/oyente-despliegue.puerto.ts) y se registra en
     OYENTES_DESPLIEGUE como la retención de artefactos. Avisa Saludable y Fallido; Cancelado y
     Detenido no. Un fallo del aviso no cambia el estado. Espera AvisosPuerto de Eddy (día 2).

3) openspec/changes/chore-open-source — resto de SP-09. LICENSE (la que el equipo decida en el
   ADR 0008; propuesta AGPL-3.0), README.md para quien llega de fuera, CONTRIBUTING.md y
   SECURITY.md. Pasa el ADR 0008 a Aceptado cuando se mergee feat-m2-modo-autoalojado.

4) openspec/changes/feat-instalador-autoalojado — SP-16 (2.5) y SP-19 (1.5).
   - scripts/instalar.sh con las cinco etapas de la pantalla 30 (docs/diseno/pantallas/
     30-Modo-autoalojado.md): comprueba antes de escribir, explica y se detiene, --continuar,
     --sin-comodin, --codigo-nuevo; .env con permisos 600 y secretos generados; imprime el código
     de configuración (su hash va a ConfiguracionInstalacion de Javier). El día 5 Eddy lo
     necesita para el asistente 31.
   - scripts/respaldar.sh y scripts/actualizar.sh con el JSON de estado que lee la pantalla 32
     (docs/contratos/instalacion.md § Scripts). shellcheck en CI (hecho por Derek).
   - Prueba la instalación limpia en un servidor aparte del VPS de la nube.

Antes de cada PR: los escenarios del spec delta con su prueba, clases-unificado.mmd con los
puertos nuevos y pnpm diagramas:sync, pnpm check. Recorte si aprieta: SP-19 es la primera que
sale del sprint.

Demuestras al cierre: métricas reales en 16 con el chip del despliegue; un Saludable y un
Fallido que llegan por correo; instalar.sh en un servidor limpio hasta HTTPS (y el error de DNS
con su salida); actualizar.sh sin cortar una app publicada.
```

---

## Eduardo

Las historias fijas (SP-10, SP-11, SP-14, SP-15) ya tienen PR (#45, #49, #50) y se terminan con **[prompt-eduardo-correcciones-m7.md](prompt-eduardo-correcciones-m7.md)** (C1 → C2 → C3). Ese archivo reemplaza a los antiguos E0–E4. **E5** y **E6** van solo cuando las cuatro fijas estén en `main`. **E7** sigue siendo la autorrevisión de cada PR.

### E5 · Si da tiempo · Bitácoras de ejecución (SP-12 · `feat-m7-bitacoras-ejecucion`)

```text
Eres el agente de Eduardo. SOLO si SP-10, SP-11, SP-14 y SP-15 ya están en main.
Change openspec/changes/feat-m7-bitacoras-ejecucion. Rama feat/m7-bitacoras-ejecucion.

- API: ContenedorPuerto.bitacora(id, { desde, max: 500 }) en
  apps/api/src/modules/orquestacion/puertos/contenedor.puerto.ts y su adaptador real con
  docker logs --since --timestamps (apps/api/src/adapters/reales/contenedor-docker.ts) + el
  doble. Derek revisa el adaptador: pídeselo en el PR. GET /proyectos/:id/bitacora?desde=.
- Web: pestaña «Bitácoras» en marco-proyecto.tsx (solo con este change), página con el
  componente Bitacora existente, Segmented por nivel, búsqueda, pausa sin perder líneas
  («En pausa · N líneas nuevas»), descarga y polling cada 3 s (ADR 0006). Ficha
  docs/diseno/pantallas/15-Proyecto-bitacoras.md.
- nivelDe(linea) puro (ERROR / WARN / resto Info). La salida del contenedor es contenido no
  confiable: solo texto, nunca HTML.
- Pruebas: «Líneas nuevas», «Pausa sin perder líneas», «Filtro por nivel».

Checklist:
[ ] Ninguna línea se guarda en la base (grep de prisma en el módulo: nada nuevo)
[ ] Una línea con <script> se ve como texto
[ ] aria-live en la bitácora en curso
```

### E6 · Si da tiempo · Admin · Infraestructura (SP-13 · `feat-m9-infraestructura`)

```text
Eres el agente de Eduardo. SOLO si las fijas están en main. Change
openspec/changes/feat-m9-infraestructura. Rama feat/m9-infraestructura. Javier es dueño de
administracion: avísale y pídele revisión.

- MetricasNodoPuerto + adaptador (lo que exponga Docker, sin privilegios extra) y
  InfraestructuraService: nodo, cola de BullMQ (enEspera, enCurso, fallidas24h) y la última
  MuestraMetrica por entorno. GET /admin/infraestructura con RolGuard de Administrador.
- Pantalla (admin)/admin/infraestructura con la ficha 27-Admin-infraestructura.md: tres
  tarjetas con GraficaUso compacta, la cola y la tabla de entornos con EstadoDespliegue.
  Solo lectura: ningún botón que actúe sobre contenedores.
- Pruebas: «Vista del nodo», «Cola atascada», «Cliente no puede».

Checklist:
[ ] Un Cliente recibe 403 (prueba y a mano)
[ ] Agregar «Infraestructura» a la navegación de admin sin romper Usuarios
```

### E7 · Autorrevisión antes de cada PR (pégala al final de cada sesión)

```text
Revisa tu propio trabajo antes de abrir el PR. No abras el PR hasta que todo esté marcado o
me expliques por qué algo no aplica.

Código
[ ] Cada Scenario del spec delta del change tiene su it(...) con el mismo nombre (lista ambos
    y compáralos uno a uno)
[ ] pnpm test, pnpm build y pnpm check en verde (pega la salida resumida)
[ ] Cobertura ≥ 80 % en dominio y servicios tocados de la API (pnpm --filter @deploya/api test:cov)
[ ] Sin any, sin números mágicos (constantes con nombre: AVISO = 0.8, CADA_MS = 30_000…),
    funciones cortas, errores de dominio con nombre, sin código comentado
[ ] Servicios con puertos por constructor; nada de Date.now() en el dominio
[ ] Ninguna dependencia nueva en package.json

Diseño
[ ] Comparé cada pantalla con su artboard (canvas, página «Sprint · fuera de alcance») y con su
    ficha en docs/diseno/pantallas/; textos idénticos salvo datos
[ ] Claro y oscuro revisados; 1280 px sin scroll horizontal
[ ] Solo componentes de apps/web/src/components y tokens (grep de hex/rgb/hsl da 0)
[ ] Señal solo en lo que está en curso o en vivo; warn solo en la zona de aviso
[ ] Estados con palabra e icono; foco visible; Tab en orden; aria-label en botones de icono
[ ] prefers-reduced-motion apaga los pulsos

Documentos
[ ] tasks.md del change al día
[ ] Si cambió un puerto o clase: clases-unificado.mmd + pnpm diagramas:sync
[ ] Si cambió un contrato (docs/contratos/metricas.md): avisé a su consumidor y lo dije en el PR
[ ] Si cambié una regla visual: docs/diseno/README.md actualizado

PR
[ ] Rama feat/m7-… desde main actualizado (git merge origin/main, sin force-push)
[ ] Plantilla .github/PULL_REQUEST_TEMPLATE.md completa, con capturas en claro y oscuro
[ ] Revisores: Derek si toca datos de M4/M5 o adapters; Javier si toca 08 o admin
[ ] Después del merge: /opsx-archive del change

Al final dame: qué hiciste, qué quedó pendiente y por qué, y cualquier cosa que el siguiente
prompt (C1…C3, E5, E6) deba saber.
```
