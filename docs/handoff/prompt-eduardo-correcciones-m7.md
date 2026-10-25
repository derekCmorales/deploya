# Prompt · Eduardo · Correcciones de M7 (PRs #45, #49, #50)

> **Este archivo reemplaza a E0–E4** de [prompt-sprint-fuera-de-alcance.md](prompt-sprint-fuera-de-alcance.md). Tu trabajo actual se queda: **corriges encima de tus ramas**, no empiezas de cero.
>
> **Cómo se usa:** una sesión de agente por PR, en orden **C1 → C2 → C3**. Pega primero el bloque **«Común»** y luego el bloque del PR. Al final de cada sesión pega **«Cierre»**. No pases al siguiente PR hasta que el anterior cumpla su «Hecho cuando».
>
> Revisión que origina esto: comentarios de Derek en #45, #49 y #50 (léelos en GitHub; cada bloque de abajo los resume).

## El problema en una frase

Las tres pantallas **usan datos fijos y no llaman a la API**. Además, las pruebas tienen el nombre de los escenarios pero no los verifican, y los `any` esconden errores reales. Las APIs de datos de métricas y tiempos **ya están en `main`**. Lo que falta lo construyes tú.

---

## Común (pégalo al inicio de cada sesión)

```text
Trabajas en derekCmorales/deploya (NestJS en apps/api + Next.js en apps/web, pnpm). Eres el
agente de Eduardo. Vas a CORREGIR un PR que ya existe, sobre su misma rama: no lo reescribas
desde cero ni hagas force-push. Commits nuevos encima, Conventional Commits feat(m7)/fix(m7).

Lee antes de tocar código, en este orden, y no te saltes ninguno:
  1. AGENTS.md
  2. docs/handoff/prompt-eduardo-correcciones-m7.md (este archivo, el bloque de tu PR)
  3. El change de OpenSpec del PR: proposal.md, specs/observabilidad/spec.md, tasks.md
  4. docs/contratos/metricas.md (la forma EXACTA de los datos)
  5. docs/diseno/README.md § Gráficas (10 reglas) y la ficha de la pantalla en
     docs/diseno/pantallas/
  6. Los comentarios de revisión del PR en GitHub

Reglas duras. Si rompes una, el PR vuelve:
  R1. CERO datos fijos en pantalla. Todo número, fecha, versión, nombre de plan o mes sale de
      la API o del reloj. Los textos de la ficha que traen números son EJEMPLOS, no copia.
      Si la petición falla: estado de error. Nunca datos inventados de respaldo.
  R2. CERO `any`, `as any`, `as unknown as` o `// @ts-ignore`. Si no compila sin eso, hay un
      error de tipos real: arréglalo.
  R3. Cada Scenario del spec delta tiene UNA prueba con el nombre EXACTO del escenario, y la
      prueba IMPORTA el código de producción y fallaría si ese código estuviera mal.
      Una prueba que no importa nada del repo no cuenta.
  R4. No toques código de otros dueños salvo lo que este archivo autoriza explícitamente.
      En particular: no cambies Despliegue, traduccion-motor.ts ni pruebas de M7-02.
  R5. La lógica va en funciones puras (apps/web/src/lib/*.ts en la web, dominio/*.ts en la
      API). Los componentes solo pintan. Los servicios reciben puertos por constructor; el
      reloj es `Reloj`, nunca `new Date()` en dominio ni servicio.
  R6. UI: solo componentes de apps/web/src/components y tokens (foreground, muted-foreground,
      warn, bad, signal…). Nada de hex, `bg-primary/40`, `bg-destructive` para avisos ni
      pulsos fuera del punto en vivo. Textos idénticos a la ficha salvo los datos.
  R7. Sin dependencias npm nuevas.

Forma de trabajar:
  - Primero dame un plan corto: qué archivos tocas y qué prueba cubre cada escenario.
    Espera mi «sí».
  - Después implementa tarea por tarea de tasks.md y márcala solo cuando su prueba pase.
  - Antes de decir «listo», corre las verificaciones del bloque «Hecho cuando» y pégame la
    salida.
```

---

## C1 · PR #45 · Métricas (16 y 13c) · rama `feat/m7-metricas`

```text
Change: openspec/changes/feat-m7-metricas. Fichas: 16-Proyecto-metricas.md y
13c-Resumen-ultimas-24h.md. Endpoint (YA EXISTE en main):
  GET /proyectos/:id/metricas?rango=1h|24h
  → { limite:{cpu,memoriaMb}, serie:[{en,cpu,memoriaMb}], pico:{cpu,memoriaMb},
      aviso: string|null, despliegues:[{en,version}], promedioPorVersion:[{version,memoriaMb,cpu}] }
  Ejemplo vivo del mismo patrón de petición: apps/web/src/components/deploya/consumo-periodo.tsx
  (pedirApi + ErrorApi de lib/api.ts).

Antes de nada: git merge origin/main en la rama (sin force-push).

1. lib/metricas.ts (puro, sin React). Agrega, conservando lo que ya hay:
   - el tipo RespuestaMetricas igual al contrato;
   - vistaMetricas(respuesta) → todo lo que la pantalla pinta: % y valor actual de memoria
     y CPU (último punto de serie / límite), estado en palabra, delta desde la primera muestra
     de la versión actual, texto del banner, plan, pico, eventos;
   - si aviso !== null, la pantalla muestra «El contenedor no está corriendo» sin calcular la vista.
   Constantes con nombre: UMBRAL_AVISO = 0.8, etc.

2. GraficaUso (components/deploya/graficas/grafica-uso.tsx):
   - Eje X POR TIEMPO: escala de [inicio de ventana, ahora] a [0, ancho]. Las muestras, los
     eventos (usa eventoEnX, que ya escribiste) y el punto «ahora» usan esa misma escala.
     Borra `escalaX(eIdx * 2)`.
   - Tramo dentro de la zona de aviso en var(--warn) con un clipPath. El id lo da useId(),
     no el título.
   - Área plana al 5 % bajo la serie. Ejes con Ejes/ticks (Y: 0…límite; X: horas).
   - Hover con puntero (onPointerMove, con zona de hover más ancha que la marca) además del
     teclado. El tooltip recibe la versión vigente de ese punto.
   - puntosDeSerie devuelve el índice o la hora con cada punto (quita muestras.indexOf).

3. GraficaEtapas y GraficaRitmo: NO van en este PR. Se retiran también del índice de
   exportaciones y se rehacen en C2 y C3.

4. Pantalla 16 (projects/[proyecto]/metricas/page.tsx):
   - Pide el endpoint al montar y al cambiar el rango. Vuelve a pedir cada 60 s. Skeleton
     mientras carga; si falla, ErrorConexionApi (components/estados/). Borra el setTimeout y
     todas las constantes fijas.
   - Segmented (components/ui/segmented.tsx) para 1 h / 24 h, no dos Button.
   - Banner warn solo si memoria ≥ 80 %, con el título y cuerpo de la ficha armados con
     datos. «Cambiar plan» enlaza a /planes.
   - Leyenda (Uso · Límite del plan · Zona de aviso · Despliegue · Ahora). Dos Card (Memoria
     y CPU) con valor grande, «de N», estado en palabra e icono, delta, y la línea de
     promedios por versión y pico.
   - Si la respuesta trae aviso: muéstralo en lugar de las gráficas.

5. Tarjeta 13c en el Resumen (_componentes/panel-resumen.tsx o la page del proyecto): dos
   GraficaUso compacta (24 h), estado en palabra y enlace «Ver métricas». Si no corre, la
   tarjeta no aparece.

6. Catálogo /sistema (app/sistema/page.tsx): GraficaUso normal, compacta y sin datos, con
   datos de ejemplo. Esto es lo ÚNICO donde se permiten datos de ejemplo.

7. Pruebas en apps/web/test/metricas.test.mjs y graficas.test.mjs. Nombres exactos:
   «Memoria cerca del límite», «Despliegue en la ventana», «Sin datos», «Hover y teclado»,
   «Resumen de 24 h», «Resumen sin muestras», «Los eventos caen en su hora».
   Prueba vistaMetricas, eventoEnX y las funciones de hover/teclado (sácalas a series.ts).
   Las pruebas de escalas, hueco y tono que ya tienes se quedan.

8. Arreglos menores: graficas/index.ts (sobra `../graficas/`, o bórralo si nadie lo usa),
   salto de línea final en todos los archivos.

Hecho cuando:
  [ ] grep -rnE "\bany\b|as any|@ts-ignore" en los archivos del PR → 0
  [ ] grep -nE "[0-9]{2,}" en metricas/page.tsx solo muestra clases de Tailwind o
      constantes con nombre, ningún dato
  [ ] Con la API local (pnpm dev:api, seed) dos proyectos distintos muestran números distintos
  [ ] El chip #N cae a la hora que dice la tabla de Despliegues
  [ ] Proyecto Detenido → «El contenedor no está corriendo», sin errores en consola
  [ ] Los 7 escenarios tienen prueba con su nombre exacto y pasan
  [ ] pnpm check en verde
  [ ] PR: título «feat(m7): métricas del proyecto y últimas 24 h (SP-10, SP-11)», plantilla
      llena, capturas en claro y oscuro, tasks.md marcado
```

---

## C2 · PR #49 · Tiempo por etapa (14c) · rama `feat/m7-tiempo-por-etapa`

```text
Change: openspec/changes/feat-m7-tiempo-por-etapa. Ficha: 14c-Despliegues-tiempo-por-etapa.md.
Ya existe en main: RepositorioDespliegues.tiemposDe(proyectoId, ultimos) → TiemposDespliegue[]
(apps/api/src/modules/construccion/dominio/tiempos-despliegue.ts):
  { numero, creado, estado, reversion, etapas: Record<Etapa, ms>, falloEn: Etapa|null }

Antes de nada: git merge origin/feat/m7-metricas (o origin/main si #45 ya entró).
En GitHub, cambia la base del PR a feat/m7-metricas mientras #45 no entre.

API. Copia el patrón de observabilidad/metricas/ (lectura-metricas.service.ts y
metricas-proyecto.controller.ts):
  1. observabilidad/tiempos/dominio/tiempos.dominio.ts sobre TiemposDespliegue (no sobre
     { etapas: Record<string, number> }):
       medianaSaludables(tiempos)   → ms, solo estado "saludable" y sin reversiones
       porcentajeConstruccion(tiempos)
       fallos(tiempos)              → { fallidos, total }
       ultimaReversion(tiempos)     → { numero, ms } | null
       resumenTiempos(tiempos)      → todo lo anterior junto
     Sin `as number`.
  2. TiemposService(DetalleProyectoPuerto, RepositorioDespliegues): exigirDueno (proyecto
     ajeno → ProyectoNoEncontrado) y luego tiemposDe(proyectoId, ULTIMOS_DESPLIEGUES = 14).
     Devuelve { despliegues: TiemposDespliegue[], resumen } (anótalo en
     docs/contratos/metricas.md § Tiempo por etapa con una fila en el historial, v1.2).
  3. TiemposController: GET /proyectos/:id/despliegues/tiempos?ultimos=14, con SesionGuard y
     el mismo filtro 404 que métricas. Regístralo en observabilidad.module.ts. Ese módulo se
     carga antes que construcción en app.module.ts, y eso evita que «tiempos» caiga en
     /despliegues/:numero. No cambies ese orden; comprueba con curl que responde 200.
  4. Pruebas (observabilidad/tiempos/*.spec.ts, describe «SP-14 · Tiempo por etapa»), con
     RepositorioDesplieguesMemoria o TiemposDespliegue armados a mano, sin base:
       «Mediana»      → 11 Saludables + 1 Fallido + 1 reversión: la mediana solo usa los 11
       «Dónde falló»  → #11 con falloEn "construccion": etapas posteriores en 0 y falloEn
                        correcto en la respuesta
       «Reversión»    → #7 con reversion true: recepcion y construccion en 0
     + proyecto ajeno → 404 (servicio).

Web:
  5. Rehaz GraficaEtapas (components/deploya/graficas/grafica-etapas.tsx) en SVG, como
     GraficaUso:
     - props: despliegues: TiemposDespliegue[] (en ms), numeroActivo
     - UNA columna por despliegue, apilada en el orden del riel (recepcion, construccion,
       ejecucion, enrutamiento, operacion) con tonos de tinta (foreground con opacidades
       distintas); la etapa de falloEn en var(--bad) y la palabra «falló» debajo; la reversión
       con «↺» y sin recepción ni construcción; «activa» bajo numeroActivo; mediana como línea
       punteada; eje Y en minutos; alto mínimo visible para columnas muy cortas
     - tooltip por columna con las cinco etapas («omitida» si vale 0); teclado con flechas
     - role="group" + aria-roledescription="gráfica" + aria-label con resumen + «Ver tabla»
     - sin animate-pulse, sin bg-destructive
  6. lib/tiempos.ts (puro): textos de la cabecera a partir de resumen: «2 min 44 s»,
     «72 % del tiempo», «2 de 14», «38 s · sin construir». Formato de duración en una función.
  7. despliegues/page.tsx: tarjeta Card ENCIMA de PanelHistorial (componente cliente aparte,
     p. ej. _componentes/tarjeta-tiempos.tsx) que pide el endpoint, con Skeleton y error.
     Título «Tiempo por etapa», subtítulo «Últimos 14 despliegues de {nombre}», cuatro datos,
     leyenda (las cinco etapas · Donde falló · ↺ Reversión, sin construir) y la gráfica.
     Borra el «Consejo» y el `as any`. Con 0 despliegues, la tarjeta no aparece.
  8. Borra apps/web/test/tiempos-etapa.test.mjs actual y escribe uno que importe
     lib/tiempos.ts: formato de duración (segundos, minutos, 0) y los cuatro textos.

Hecho cuando:
  [ ] curl con sesión a /proyectos/<id>/despliegues/tiempos → 200 con despliegues y resumen;
      con un proyecto ajeno → 404
  [ ] grep -rnE "\bany\b|as any|as number" en los archivos del PR → 0
  [ ] En la pantalla 14 hay N columnas (N = despliegues, máx. 14), un Fallido se ve en rojo
      con «falló» y una reversión con ↺
  [ ] Las 3 pruebas de escenario + 404 pasan; cobertura ≥ 80 % de tiempos/
      (pnpm --filter @deploya/api test:cov)
  [ ] pnpm check en verde
  [ ] PR: título «feat(m7): tiempo por etapa (SP-14)», plantilla llena, capturas, tasks.md marcado
```

---

## C3 · PR #50 · Ritmo de construcciones (08c) · rama `feat/m7-ritmo-construcciones`

```text
Change: openspec/changes/feat-m7-ritmo-construcciones. Ficha: 08c-Suscripcion-ritmo.md.
Contrato: GET /observabilidad/consumo/diario → { desde, reinicia, cuota, diarios: number[] }.

Antes de nada: git merge origin/feat/m7-tiempo-por-etapa (o origin/main si ya entraron).
En GitHub, cambia la base del PR a feat/m7-tiempo-por-etapa mientras #49 no entre.

0. REVIERTE lo que tocaste del dominio de M4 (vuelve esos archivos a como están en main):
     git checkout origin/main -- \
       apps/api/src/modules/construccion/dominio/despliegue.ts \
       apps/api/src/adapters/prisma/traduccion-motor.ts \
       apps/api/src/adapters/memoria/repositorio-despliegues.memoria.ts \
       apps/api/src/modules/observabilidad/resumen/linea-tiempo-despliegue.spec.ts
   La fecha de un despliegue es `creado`. No existen `fecha`, `creadoEn` ni `esReversion`.

API. Autorizado por Derek: puedes agregar UN método al puerto de construcción.
  1. En construccion/puertos/repositorio-despliegues.puerto.ts, junto a
     contarConstruccionesDesde y con el MISMO criterio (invariante I7: todos los despliegues
     del usuario desde `desde`, salvo disparador "reversion"):
       abstract fechasDeConstruccionDesde(usuarioId: string, desde: Date): Promise<Date[]>;
     Impleméntalo en adapters/memoria/repositorio-despliegues.memoria.ts y
     adapters/prisma/repositorio-despliegues.prisma.ts copiando el filtro de
     contarConstruccionesDesde (findMany con select: { creado: true }).
     Agrega el método a docs/diagramas/compartido/clases-unificado.mmd y corre
     pnpm diagramas:sync. Pon a Derek de revisor.
  2. observabilidad/dominio/ritmo.ts (puro): diariosDe(fechas, periodo, hoy) → number[] con
     un elemento por día transcurrido del mes (día 1 … hoy, UTC).
  3. ConsumoService.diario(usuarioId): reloj → periodoDe → en paralelo permisoDe y
     fechasDeConstruccionDesde(usuarioId, periodo.desde) → diariosDe. Borra el código actual
     de diario() (historialDe, `d: any`, esReversion).
  4. ConsumoController: @Get("consumo/diario").
  5. Pruebas en consumo.service.spec.ts y en una spec de ritmo.ts:
       «la reversión no cuenta» (una reversión el día 3 no suma)
       diariosDe: día 1 → [n]; despliegues de otro mes no cuentan; febrero

Web:
  6. lib/proyeccion.ts:
       diasDelMes(desde, reinicia) → del contrato, no 31 fijo
       proyectar(diarios, diasDelMes) → number | null; null si diarios.length <= 1
         (escenario «Primer día»: no se dibuja proyección)
       enZonaAviso(proyeccion, cuota) → proyeccion >= cuota * UMBRAL_AVISO
       diaEnQueSeAcaba(...) → se queda
       fraseRitmo(...) → la frase de la ficha según el caso, con fechas de verdad
  7. Rehaz GraficaRitmo (components/deploya/graficas/grafica-ritmo.tsx) según la ficha y el
     README: línea de acumulado en foreground; columnas por día suaves (foreground al ~15 %),
     escaladas al máximo y no con `val * 10`; proyección punteada de hoy al último día;
     banda warn del 80 % y línea de cuota; punto «hoy» con pulso (signal, el único);
     eje Y (0…cuota); fechas en X; hover y teclado por día; «Ver tabla».
  8. consumo-periodo.tsx: si /consumo/diario falla, la tarjeta de ritmo NO aparece (los dos
     Meter sí). Borra el arreglo de respaldo, el catch vacío y los literales «20 oct»,
     «1 nov» y «oct». Cabecera con los datos de la ficha: «Usadas N de M», «Promedio X por
     día», «Al cierre, a este ritmo ~P». Badge variant="warn" (no bg-destructive).
     Usa la frase exacta de la ficha y el botón «Ver planes». Las fechas con el formato de
     textoReinicio (lib/actividad.ts).
  9. apps/web/test/proyeccion.test.mjs, con nombres exactos:
       «Proyección en zona de aviso»: enteros que sumen 84 en 20 días, mes de 31, cuota 150
         → ~130 y enZonaAviso true
       «Se acaba antes»: diaEnQueSeAcaba devuelve el día correcto
       «Primer día»: proyectar([n], 31) === null
     + febrero y mes de 30.

Hecho cuando:
  [ ] git diff origin/main -- apps/api/src/modules/construccion/dominio/despliegue.ts → vacío
  [ ] grep -rnE "\bany\b|as any|esReversion|creadoEn" en los archivos del PR → 0
  [ ] curl con sesión a /observabilidad/consumo/diario → 200, y sum(diarios) es igual a
      construcciones.usadas de /observabilidad/consumo
  [ ] Con la API apagada, Mi suscripción muestra los Meter y NO muestra la tarjeta de ritmo
  [ ] Las pruebas de escenario pasan; pnpm check en verde (incluye diagramas)
  [ ] PR: título «feat(m7): ritmo de construcciones (SP-15)», plantilla llena, capturas,
      tasks.md marcado; revisores Derek (puerto) y Javier (pantalla 08)
```

---

## Cierre (pégalo al final de cada sesión)

```text
Antes de decirme que terminaste:
1. Lista los Scenario del spec delta y, al lado, el nombre de la prueba y el archivo. Si
   falta uno, no terminaste.
2. Corre y pega el resumen de: pnpm check, y los grep del bloque «Hecho cuando».
3. Abre la pantalla en local (pnpm dev:api + pnpm dev:web, con seed) y confirma que los datos
   cambian entre dos proyectos o usuarios. Si no puedes levantarla, dímelo, no lo supongas.
4. Relee tu diff entero (git diff origin/main...HEAD) buscando datos fijos, any, archivos de
   otros dueños y código muerto (funciones o componentes que nadie usa). Arréglalo.
5. Actualiza el título y el cuerpo del PR con la plantilla y marca tasks.md.
6. Dame: qué hiciste, qué quedó pendiente y por qué.
```
