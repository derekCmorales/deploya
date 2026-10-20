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
- Con Eddy (dueño de .github/workflows): paso de gitleaks en CI para cada PR.

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
     (docs/contratos/instalacion.md § Scripts). shellcheck y bats en CI con Eddy.
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

Eduardo tiene cuatro historias fijas (9 pts) y dos **si da tiempo** (6 pts). Van en prompts separados para que cada sesión del agente trabaje sobre un solo change y cierre con su propia revisión. Orden: **E0 → E1 → E2 → E3 → E4**; **E5** y **E6** solo si las fijas están en `main`. **E7** es la autorrevisión de cada PR (úsala al final de cada uno).

### E0 · Arranque y revisión de los changes (antes de escribir código)

```text
Eres el agente de Eduardo (@Portillo17e): M3 Proyectos, M7 Observabilidad y apps/web (design
system v4.1). Hoy no escribes código: revisas el plan y los changes del sprint y me dices si
están listos para implementar.

1. Lee docs/plan-avances.md § Sprint fuera de alcance completo. Mis historias: SP-10, SP-11,
   SP-14, SP-15 (fijas) y SP-12, SP-13 (si da tiempo). Anota de quién dependo y qué día:
   Derek entrega GET /proyectos/:id/metricas el día 3 y tiemposDe el día 4.
2. Lee docs/diseno/README.md, sobre todo § Principios, § Color, § Movimiento y § Gráficas.
   Resume en 10 líneas las reglas de las gráficas que voy a construir.
3. Lee estos changes completos (proposal, design, specs/*/spec.md, tasks):
   openspec/changes/feat-m7-metricas, feat-m7-tiempo-por-etapa, feat-m7-ritmo-construcciones,
   feat-m7-bitacoras-ejecucion, feat-m9-infraestructura.
4. Lee docs/contratos/metricas.md y compáralo con lo que piden los specs. Lista cualquier
   campo que falte o sobre.
5. Lee las fichas docs/diseno/pantallas/16-Proyecto-metricas.md, 13c-Resumen-ultimas-24h.md,
   14c-Despliegues-tiempo-por-etapa.md, 08c-Suscripcion-ritmo.md, 15-Proyecto-bitacoras.md y
   27-Admin-infraestructura.md.
6. Mira el código que voy a tocar y dime qué hay hoy:
   - apps/web/src/components/deploya/ (mapa-actividad.tsx es el modelo de SVG a mano,
     consumo-periodo.tsx y actividad-proyecto.tsx son míos de M7-03, punto-vivo.tsx, index.ts)
   - apps/web/src/app/(projects)/projects/_componentes/marco-proyecto.tsx (pestañas del proyecto)
   - apps/web/src/app/(projects)/projects/[proyecto]/ (page.tsx = 13, despliegues/ = 14)
   - apps/web/src/app/(billing)/suscripcion/_componentes/panel-consumo.tsx (08)
   - apps/web/src/app/sistema/ (catálogo) y apps/web/test/*.test.mjs (cómo se prueba la web)
   - apps/api/src/modules/observabilidad/ (consumo/, actividad/, resumen/)

Entrégame:
- Una tabla «Change · Qué entiendo · Dudas · Ajuste propuesto».
- Si algo no cuadra, el /opsx-update concreto que propones (no lo apliques sin que yo diga sí).
- El orden de trabajo de los próximos días con lo que puedo adelantar antes del día 3
  (la familia de gráficas con datos de ejemplo no depende de Derek).

Checklist de esta sesión:
[ ] Leí los 5 changes, el contrato y las 6 fichas
[ ] Sé qué día llega cada dato de Derek
[ ] Listé dudas concretas, no genéricas
[ ] No cambié ningún archivo
```

### E1 · Familia de gráficas (SP-10, parte 1 · `feat-m7-metricas`)

```text
Eres el agente de Eduardo. Change: openspec/changes/feat-m7-metricas, tareas de la sección
«Gráficas». Rama feat/m7-metricas. Puedes empezar antes de tener la API: usa datos de ejemplo.

Objetivo: tres componentes de presentación reutilizables, hechos a mano en SVG (como
apps/web/src/components/deploya/mapa-actividad.tsx), SIN librerías de gráficas:
  - GraficaUso      — uso contra el límite (CPU, memoria). Prop compacta para tarjetas.
  - GraficaEtapas   — columnas apiladas por etapa del riel (la usas en E3).
  - GraficaRitmo    — acumulado del mes contra la cuota con proyección (la usas en E4).

Estructura sugerida (ajústala a lo que ya hay en el repo):
  apps/web/src/components/deploya/graficas/
    escalas.ts        escalaLineal(dominio, rango), ticks(maximo, n)
    series.ts         puntosDeSerie(muestras, ventana) (un hueco > 2 min corta la línea),
                      tonoDeUso(valor, limite) → "normal" | "aviso" (aviso desde 0.8),
                      eventoEnX(evento, ventana, ancho) (fuera de rango → null)
    ejes.tsx, chip-evento.tsx, punto-vivo-svg.tsx, tooltip.tsx   (piezas compartidas)
    grafica-uso.tsx, grafica-etapas.tsx, grafica-ritmo.tsx
  y exporta desde apps/web/src/components/deploya/index.ts.

Reglas visuales (docs/diseno/README.md § Gráficas; compáralas con los artboards 16 y 13c del
canvas, página «Sprint · fuera de alcance»):
  1. Serie en var(--foreground) a 2 px; área plana al 5 %. Nada de gradientes ni sombras.
  2. Zona de aviso 80–100 %: banda de --warn muy suave, línea punteada --warn, y el tramo de
     la serie que entra ahí en --warn (clipPath). El límite: línea discontinua
     --muted-foreground con el valor en mono a la derecha («512 MB · límite»).
  3. Señal SOLO en el punto «ahora» (dato en vivo), con pulso que se apaga con
     prefers-reduced-motion (agrega la utilidad a globals.css si no existe y anótala en la
     tabla Movimiento del README).
  4. Despliegues como eventos: línea vertical punteada y chip mono «#14».
  5. Ejes y valores en Geist Mono, clase tnum en números que cambian.
  6. Hover: cruz + tooltip con hora, valor, % del límite y versión; zona de hover por columna
     (más ancha que la marca). Teclado: la gráfica es enfocable y las flechas mueven el punto.
  7. Una sola escala por gráfica. Nunca doble eje.
  8. role="img" con aria-label que resuma (p. ej. «Memoria 24 h: de 328 a 430 MB; límite
     512 MB»), y un botón «Ver tabla» que muestra los mismos datos en Table.

Catálogo: agrega las tres a apps/web/src/app/sistema con datos de ejemplo (los del canvas) en
claro y oscuro, incluida la variante compacta y el estado sin datos.

Pruebas (apps/web/test/graficas.test.mjs con node --test, como los demás *.test.mjs):
  - «Un hueco corta la línea»
  - «Tono de aviso desde el 80 %» (0.79 normal, 0.80 aviso, 1.0 aviso)
  - «Los eventos caen en su hora» y uno fuera de rango no se dibuja
  - escalaLineal en los extremos y ticks redondos

Antes de abrir el PR, autorrevisión (E7) y además:
[ ] Ningún color fuera de tokens: grep -nE "#[0-9a-fA-F]{3,8}|rgb\(|hsl\(" en graficas/ da 0
[ ] Ninguna dependencia nueva en apps/web/package.json
[ ] Las tres en /sistema se ven bien en claro y oscuro; con el SO en movimiento reducido el
    punto no late
[ ] Tab llega a la gráfica, las flechas mueven el tooltip, Esc lo cierra
[ ] Con lector de pantalla se oye el resumen del aria-label
[ ] docs/diseno/README.md § Gráficas sigue siendo verdad (si cambiaste algo, actualízalo)
```

### E2 · Pestaña Métricas y tarjeta del Resumen (SP-10 parte 2 y SP-11 · `feat-m7-metricas`)

```text
Eres el agente de Eduardo. Mismo change (openspec/changes/feat-m7-metricas), sección
«Pantallas». Necesitas GET /proyectos/:id/metricas de Derek (día 3, contrato en
docs/contratos/metricas.md). Si aún no está, trabaja con un doble y deja el adaptador listo.

Construye:
1) Pestaña Métricas (ficha docs/diseno/pantallas/16-Proyecto-metricas.md, artboard 16):
   - apps/web/src/app/(projects)/projects/[proyecto]/metricas/page.tsx dentro del layout del
     proyecto.
   - Agrega «Métricas» a las pestañas en
     apps/web/src/app/(projects)/projects/_componentes/marco-proyecto.tsx (después de
     Despliegues) con aria-current igual que las demás.
   - Banner warn (componente Banner) cuando la memoria ≥ 80 %: «La memoria está al 84 % del
     límite de Starter» + «Subió unos N MB desde la versión #14» (usa promedioPorVersion) +
     acciones «Comparar #13 y #14» y «Cambiar plan».
   - Segmented 1 h / 24 h; «En vivo · una muestra por minuto» con PuntoVivo; leyenda; consulta
     cada 30 s (reutiliza el patrón de polling de la vista de despliegue, lib/reintento.ts si
     aplica); «Ver tabla».
   - Dos tarjetas: Memoria y CPU, cada una con GraficaUso, valor grande, «de 512 MB», badge de
     estado con palabra e icono, delta («▲ 89 MB desde #14») y la nota de promedios/pico.
   - Sin datos (proyecto Detenido o sin despliegue Saludable): «El contenedor no está
     corriendo», sin gráfica vacía.
   - Lógica en un archivo puro apps/web/src/lib/metricas.ts: textoBanner(...), deltaPorVersion(...),
     estadoEnPalabra(pct) → «Holgada» | «Cerca del límite» | «Al límite».
2) Tarjeta «Últimas 24 h» en el Resumen (ficha 13c-Resumen-ultimas-24h.md, artboard 13c):
   debajo de Actividad de despliegues y Último despliegue en [proyecto]/page.tsx, con dos
   GraficaUso compacta, el estado en palabra y «Ver métricas». Si no hay datos, la tarjeta
   no aparece.

Pruebas (apps/web/test/metricas.test.mjs) con los nombres EXACTOS de los escenarios del spec
openspec/changes/feat-m7-metricas/specs/observabilidad/spec.md:
  «Memoria cerca del límite», «Despliegue en la ventana», «Sin datos», «Hover y teclado»,
  «Resumen de 24 h» (+ textoBanner y estadoEnPalabra en sus bordes: 79 %, 80 %, 100 %).

Revisión visual contra el canvas, en este orden: 16 en claro, 16 en oscuro, 13c en claro y
oscuro, y la pantalla a 1280 px de ancho (no debe haber scroll horizontal).

Checklist del PR (además de E7):
[ ] La pestaña Métricas aparece en todas las páginas del proyecto y marca aria-current
[ ] El banner solo sale con memoria ≥ 80 % y dice la versión correcta
[ ] Cambiar de 24 h a 1 h no deja la gráfica vieja un instante (Skeleton mientras carga)
[ ] El chip #14 cae en la hora del despliegue (compara con la tabla de 14)
[ ] Con el proyecto Detenido: mensaje, sin errores en consola
[ ] Los textos coinciden con la ficha (copia exacta salvo datos)
[ ] tasks.md de feat-m7-metricas con todo marcado; /opsx-archive después del merge
```

### E3 · Tiempo por etapa en Despliegues (SP-14 · `feat-m7-tiempo-por-etapa`)

```text
Eres el agente de Eduardo. Change openspec/changes/feat-m7-tiempo-por-etapa. Rama
feat/m7-tiempo-por-etapa. Necesitas RepositorioDespliegues.tiemposDe de Derek (día 4).

API (apps/api/src/modules/observabilidad/tiempos/):
  - TiemposService (Facade de lectura por el puerto de M4) y
    GET /proyectos/:id/despliegues/tiempos?ultimos=14 según docs/contratos/metricas.md
    § Tiempo por etapa. Proyecto ajeno → 404, como el resto de observabilidad.
  - Funciones puras en observabilidad/dominio: medianaDe(totales) (solo Saludables, sin
    reversiones), porcentajeDe(etapa, despliegues).
  - Pruebas *.spec.ts con los escenarios del spec: «Mediana», «Dónde falló», «Reversión».

Web (ficha docs/diseno/pantallas/14c-Despliegues-tiempo-por-etapa.md, artboard 14c):
  - Tarjeta encima de la tabla en [proyecto]/despliegues/page.tsx con GraficaEtapas.
  - Cabecera: Mediana, Construcción «N % del tiempo», Fallos «2 de 14», Reversión «X s · sin
    construir». Leyenda con las cinco etapas en el orden del riel, «Donde falló» y «↺ Reversión».
  - Tonos: tinta en el orden del riel (Construcción la más oscura); la etapa donde falló en
    --bad; la reversión sin Recepción ni Construcción. Etiqueta «activa» bajo la versión activa.
  - Tooltip por columna con las cinco etapas y su duración («omitida» si es 0).
  - Pie: el consejo del Dockerfile con caché (texto de la ficha).

Checklist del PR (además de E7):
[ ] Con un proyecto de un solo despliegue la tarjeta se ve bien (sin mediana rara)
[ ] Un Fallido en Recepción tiene una columna muy corta pero visible (alto mínimo)
[ ] Los colores de etapa se distinguen también en oscuro; el fallo no depende solo del color
    (la palabra «falló» bajo la columna)
[ ] La mediana coincide con la que calcula la API (misma función o misma prueba)
[ ] Pruebas «Mediana», «Dónde falló», «Reversión» en verde
```

### E4 · Ritmo de construcciones en Mi suscripción (SP-15 · `feat-m7-ritmo-construcciones`)

```text
Eres el agente de Eduardo. Change openspec/changes/feat-m7-ritmo-construcciones. Rama
feat/m7-ritmo-construcciones. No dependes de nadie: amplías tu M7-03.

API: ConsumoService.diario en apps/api/src/modules/observabilidad/consumo/ y
GET /observabilidad/consumo/diario → { desde, reinicia, cuota, diarios } con el MISMO período
que el bloqueo (periodoDe: mes calendario UTC). La reversión no cuenta (prueba).

Web (ficha docs/diseno/pantallas/08c-Suscripcion-ritmo.md, artboard 08c):
  - GraficaRitmo dentro de apps/web/src/components/deploya/consumo-periodo.tsx (lo monta
    Javier en 08: no cambies su pantalla, cambia tu componente) debajo de los dos Meter.
  - Cabecera: «Usadas 84 de 150», «Promedio 4.2 por día», «Al cierre, a este ritmo ~130» con
    Badge warn «En zona de aviso» cuando la proyección ≥ 80 % de la cuota.
  - Acumulado en tinta, columnas diarias muy suaves, proyección punteada desde hoy al último
    día del mes, zona de aviso, punto «hoy» en Señal (es el dato en vivo) y chip «hoy · 20 oct».
  - La frase del pie: si la proyección no llega a la cuota, «No te quedas sin construcciones
    antes del 1 nov…»; si la pasa, «A este ritmo te quedas sin construcciones el 27 oct».
  - Función pura apps/web/src/lib/proyeccion.ts: proyectar(diarios, diasDelMes) y
    diaEnQueSeAcaba(diarios, cuota, diasDelMes).

Pruebas (web, node --test) con los escenarios del spec: «Proyección en zona de aviso» (84 en
20 de 31 con cuota 150 → ~130), «Se acaba antes», «Primer día» (no proyecta).

Checklist del PR (además de E7):
[ ] El reinicio que dice la tarjeta es el mismo que el Meter de construcciones («1 nov»)
[ ] Febrero (28/29 días) y meses de 30 no rompen la proyección (prueba)
[ ] Javier vio su pantalla 08 con la tarjeta nueva y está de acuerdo (pídelo en el PR)
```

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
prompt (E1…E6) deba saber.
```
