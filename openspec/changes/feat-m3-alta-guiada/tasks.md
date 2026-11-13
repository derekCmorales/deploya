# Tasks

Sin Docker, red, base ni reloj reales en las unitarias. Cada `Scenario` del spec delta tiene su `it(...)`.

## 1. Construcción (M4)

- [x] 1.1 `OpcionesReceta` en `RecetaStack.dockerfile`; Node, Python y Go agregan la línea; estática y
  `Dockerfile` la ignoran (`aplicaComandoConstruccion`)
- [x] 1.2 `DeteccionStackService.detectar` recibe las opciones; `PasoRecepcion` pasa `proyecto.comandoConstruccion`
  y escribe «Comando de construcción ignorado: el Dockerfile manda»
- [x] 1.3 Pruebas: «Node con comando de construcción», «Python con comando de construcción», «Go con comando de
  construcción», «Comando de construcción con Dockerfile propio», «Receta sin comando de construcción»

## 2. Datos (M5)

- [x] 2.1 `Espera` en `compartido/espera.ts` (suscripciones lo reexporta); `MotorDatosService.paraDespliegue`
  espera a los recursos en `creando` (2 s, tope 2 min) y avisa en la bitácora
- [x] 2.2 `verificarAltaInicial` (política), `DatosService.verificarAltaInicial` y `limiteDe` (para `GET /proyectos`)
- [x] 2.3 Pruebas: «Recurso creado durante la construcción», «Recurso que no termina a tiempo», «Verificar el
  alta inicial»

## 3. Proyectos (M3)

- [x] 3.1 Migración `comandoConstruccion`; `Proyecto`, repositorio Prisma y `traduccion-motor` lo llevan
- [x] 3.2 `validarAltaProyecto` acepta `comandoInicio`, `comandoConstruccion` y `datos`; `cambiosProyectoDe` acepta
  `comandoConstruccion`; `comandoConstruccionDe` rechaza saltos de línea
- [x] 3.3 Puerto `RecursosDatosAlta` + adaptador `RecursosDatosAltaDatos`; `ProyectosService.crear` verifica,
  guarda, crea recursos y despliega en ese orden; `RecursosDatosNoPermitidos` → 409
- [x] 3.4 Pruebas: «Alta con PostgreSQL y Redis», «Alta con más recursos de los que admite el plan», «Recurso
  repetido en el alta», «Comandos en el alta», «Comando de construcción con salto de línea», «Cambiar el comando
  de construcción»

## 4. Web

- [x] 4.1 `lib/alta.ts`: pasos, transiciones, cuerpo del alta, variables inyectadas por los recursos elegidos
- [x] 4.2 `TablaVariables` compartida por 17 y el paso Variables; `PegarEnv` sobre el borrador del alta
- [x] 4.3 Pasos `paso-construccion`, `paso-datos`, `paso-variables` nuevo; `lateral-alta` y `paso-revisar` con
  cinco pasos; `asistente-alta` con la máquina de pasos
- [x] 4.4 Configuración (19): campo «Comando de construcción»
- [x] 4.5 Pruebas `node --test`: «Pegar un .env en el alta», «Variables que inyectan los recursos elegidos»,
  «Comando de construcción sin receta», «Límite de datos del plan en el asistente», transiciones y cuerpo del alta

## 5. Cierre

- [x] 5.1 Contratos `despliegues.md` y `recursos-datos.md`; fichas 11b y 11f nuevas, notas en 11a, 11c, 11d, 17 y 19; `clases-unificado.mmd`
- [x] 5.2 `pnpm check` en verde
- [ ] 5.3 `/opsx-archive` después del merge
