# Tasks

Contrato: [recursos-datos.md](../../../docs/contratos/recursos-datos.md). Sin Docker, Redis, base ni reloj reales en las unitarias; la integración con Docker real corre aparte (`DEPLOYA_PRUEBAS_DOCKER=1`).

## 1. Esquema y plan (con Javier)

- [x] 1.1 Prisma: `RecursoDatos`, `RecursoDatosCompartido`, enums, `Plan.maxRecursosDatos`, `Plan.discoDatosMb`, `Proyecto.comandoInicio`; migración `20261112120000_recursos_datos` con los valores por plan
- [x] 1.2 Seed, `Plan`, `Cuota`, `catalogoDe` y `cuotaDeInstalacion` (autoalojado sin tope)
- [x] 1.3 Pruebas: «Límites de recursos de datos por plan», «Autoalojado sin tope», catálogo con los campos nuevos

## 2. Dominio de datos

- [x] 2.1 `TipoRecursoDatos` (Strategy) con `PostgresRecurso`, `RedisRecurso`, `S3Recurso`; `PoliticaRecursosDatos`; `ComandoDatos`; `vistaRecurso`; cuerpos de la API
- [x] 2.2 Pruebas: variables por tipo, «Límite del plan», «Un tipo por proyecto», «Suscripción bloqueada», vista sin secretos

## 3. Puertos y adaptadores

- [x] 3.1 `RepositorioRecursosDatos` (Prisma y memoria), `ColaDatosPuerto` (BullMQ y memoria), `RecursosDatosPuerto` (dockerode y stub), `CuotaDatosPuerto`, `GeneradorSecretos`, `ColaMedicionDiscoPuerto`
- [x] 3.2 Pruebas: «Sin puertos publicados y capacidades mínimas», preparación con reintentos, `du -sm`, liberar proyecto, `P2002` → `TipoYaConectado` (L)

## 4. API

- [x] 4.1 `DatosModule`: `DatosService` (Facade), `DatosController` con `GET /datos/health`, `ErroresDatosFilter`
- [x] 4.2 Pruebas: «Crear un Postgres», «Proyecto ajeno», «Conexión para copiar», «Compartir con otro proyecto del mismo usuario», «Compartir con un proyecto que ya tiene ese tipo», «Compartir con un proyecto de otro usuario», «Dejar de compartir», «Eliminar desde el dueño», «Eliminar desde un compartido», «Confirmación que no coincide»; controlador y filtro

## 5. Trabajador

- [x] 5.1 `MotorDatosService` (crear, eliminar, detener, iniciar, conectar, desconectar, `paraDespliegue`, `liberarProyecto`, `medirDiscos`), `TareaMedicionDisco`, consumidor en `trabajador.ts`
- [x] 5.2 Pruebas: «La red se crea aunque el proyecto no tenga despliegue», «Imagen que no arranca», «Ruta pública del S3», «Bucket con versionado», «Medición periódica», «Sobre el límite no corta»

## 6. Integración con M5

- [x] 6.1 `RecursosDatosDespliegue` en `PasoEjecucion` y `EliminarManejador`; `ContenedoresClienteM5` con `DatosService`; `fusionarVariables`
- [x] 6.2 Pruebas: «Variables inyectadas», «Variables del usuario ganan», «Las DEPLOYA_* siempre se inyectan», «Bitácora sin valores», «Sobrevive al redespliegue», «Suspensión detiene», «Reactivación inicia», «Eliminar proyecto dueño», «Eliminar proyecto con el que se comparte»

## 7. Proyecto y motor

- [x] 7.1 `comandoInicio` en `CambiosProyecto`, `VistaConfiguracion`, `EspecContenedor.comando` y `ContenedorDocker` (`Cmd`); `argumentosDeComando`; `MAXIMO_VARIABLES = 150`; subdominios `-s3` reservados; `MOTOR_TIEMPO_MAXIMO_CONSTRUCCION_MIN`
- [x] 7.2 Pruebas: «Comando de inicio», «Comando de inicio en la reversión», «Comando de inicio demasiado largo», «Comando con comilla sin cerrar», «Hasta 150 variables», «Subdominio que choca con una ruta S3», «Tiempo de construcción configurable»

## 8. Cierre

- [x] 8.1 Prueba de integración con Docker real: postgres + `CREATE EXTENSION vector`, datos que persisten al recrear app y contenedor de datos, redis `PING` (también compartido), s3 con versionado, eliminar borra el volumen
- [x] 8.2 `clases-unificado.mmd` y `pnpm diagramas:sync`; compose y `.env` de ejemplo
- [ ] 8.3 Web: pestaña *Datos*, `comandoInicio` en Configuración y campos del plan en /planes (PR de la web)
- [ ] 8.4 `pnpm check` en verde y `/opsx-archive` tras el merge
