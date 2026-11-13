# Design

## Contexto

El alta (`ProyectosService.crear`) guarda el proyecto y encola el despliegue #1 en la misma llamada. Todo lo que
el cliente configura después (comando de inicio en 19, recursos en 18, variables con la UX de 17) llega tarde: el
despliegue #1 ya corrió sin ello. Este change mueve esa configuración **antes** del despliegue #1, sin cambiar lo
que pasa después.

## Decisiones

### 1. Un solo `POST /proyectos`, datos incluidos

El alta acepta `datos: TipoRecurso[]`. El orden dentro de `crear` es:

1. cupo de proyectos, bloqueos de la suscripción (sin cambios);
2. validar repositorio, subdominio y variables (sin cambios);
3. **`RecursosDatosAlta.verificar(usuarioId, tipos)`**: suscripción, límite y repetidos, sin escribir nada;
4. guardar proyecto (con `comandoInicio` y `comandoConstruccion`) y variables;
5. **`RecursosDatosAlta.crear(usuarioId, proyectoId, tipos)`**: `DatosService.crear` por cada tipo (persiste en
   `creando` y encola en la cola `datos`);
6. `crearDespliegue(id, "alta")`.

Alternativa descartada: orquestar en la web (`desplegar: false` + `POST /datos` + `POST /despliegues`). Deja
proyectos a medias si la red falla a mitad y reparte una regla de negocio entre el navegador y la API.

### 2. Esperar a los recursos en Ejecución

Los recursos se crean en el trabajador mientras el despliegue #1 se clona y construye, normalmente en paralelo.
Si al llegar a Ejecución alguno sigue en `creando`, `MotorDatosService.paraDespliegue` vuelve a leerlo cada 2 s
(puerto `Espera`) hasta 2 min. Al tope se inyecta igual y la bitácora lo avisa: no se falla el despliegue por
algo que puede estar a segundos de terminar.

### 3. Comando de construcción como opción de receta

`RecetaStack.dockerfile(archivos, opciones)` recibe `OpcionesReceta { comandoConstruccion: string | null }`. Cada
receta decide dónde va la línea (Node reemplaza `npm run build`, Python después de `pip install`, Go antes de
`go build`); la estática y la de `Dockerfile` la ignoran y `aplicaComandoConstruccion` lo dice. `PasoRecepcion`
pasa el comando del proyecto a `DeteccionStackService.detectar` y escribe el aviso cuando no aplica. El comando
se rechaza si trae saltos de línea: en un Dockerfile un `\n` abriría otra instrucción.

### 4. Web: un asistente con estado explícito

`GET /proyectos` agrega `datos: { usados, maximo }` de la cuenta para que el paso Datos muestre el límite antes de
que el proyecto exista (la pestaña 18 solo lo da por proyecto).

`lib/alta.ts` (puro) define los pasos, el orden y las transiciones (`pasoSiguiente`, `pasoAnterior`), qué paso
tiene error y el cuerpo de `POST /proyectos`. `useAltaProyecto` solo guarda estado y llama a la API. Los pasos
Variables del alta y la pestaña 17 comparten `TablaVariables` y `PegarEnv`; la tabla no sabe si edita un borrador
de alta o variables guardadas. Las dos ganan «Quitar» por fila (17 no tenía forma de borrar una variable).

## Diseño: SOLID y patrones

| Pieza | Patrón | SOLID |
|---|---|---|
| `RecursosDatosAlta` (puerto, `abstract class` en `proyectos/puertos`) y `RecursosDatosAltaDatos` (adaptador) | **Adapter** sobre la **Facade** `DatosService`; traduce `ErrorDatos` a `RecursosDatosNoPermitidos` de M3 | **D**: `ProyectosService` depende del puerto; **I**: tres métodos (`verificar`, `limite`, `crear`), lo único que el alta usa |
| `DatosService.verificarAltaInicial` + `verificarAltaInicial` (política pura) y `DatosService.limiteDe` | **Specification** (como `verificarAlta`) | **S**: la regla del plan vive en `politica-recursos-datos.ts`, no en M3 |
| `OpcionesReceta` en `RecetaStack.dockerfile` | **Strategy** (cada receta) | **O**: cada receta decide su línea; no hay `switch (receta)` en Recepción. **L**: todas aceptan las mismas opciones |
| `Espera` (puerto en `compartido/espera.ts`) | Inyección de dependencias | **D**: la espera de 2 s se prueba con `EsperaInstantanea`, sin reloj real |
| `lib/alta.ts` | **State** (transiciones explícitas, como `lib/asistente.ts`) | **S**: el hook no decide el orden de los pasos |
| `TablaVariables` (presentacional) compartida por 11c y 17 | **Container / Presentational** | **S** y DRY: una sola tabla de variables |

### Cambios a puertos, clases y estados

- Nuevo puerto `RecursosDatosAlta` (M3) y su adaptador.
- Nuevo puerto compartido `Espera` (se mueve desde `suscripciones/puertos/espera.puerto.ts`, que lo reexporta).
- `RecetaStack.dockerfile` gana el parámetro `opciones`.
- `Proyecto` gana `comandoConstruccion`.
- Sin estados nuevos.

`docs/diagramas/compartido/clases-unificado.mmd` se actualiza en este change.

## Riesgos

- **Recurso lento** (primera descarga de `pgvector/pgvector:pg17`): el tope de 2 min puede no bastar en un VPS
  frío. Mitigación: se inyecta igual y la app suele reintentar la conexión; la bitácora lo dice.
- **Migración**: columna nueva nullable, sin datos que migrar.
