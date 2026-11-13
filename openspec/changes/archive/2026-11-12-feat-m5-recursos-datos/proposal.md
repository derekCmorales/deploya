# Proposal

Change: `feat/m5-recursos-datos`. Módulo dueño: **datos** (nuevo, dentro de M5 · motor) — Derek. Specs tocadas: `datos` (nueva), `orquestacion`, `proyectos`, `motor-construccion`, `suscripciones`. Contrato: [recursos-datos.md](../../../docs/contratos/recursos-datos.md). Pantalla: pestaña *Datos* del proyecto (web, en paralelo).

## Why

Una app real casi nunca vive sola: el monorepo **Nimbo** (api, worker, worker-optimizer y web) necesita PostgreSQL con pgvector, Redis y un almacenamiento S3, y hoy Deploya solo corre el contenedor de la app, sin estado. Además Nimbo pasa de 50 variables, su build tarda más de 10 minutos y sus workers comparten imagen con la api y solo cambian el comando de arranque.

## What Changes

- **Recursos de datos por proyecto** (`postgres` = `pgvector/pgvector:pg17`, `redis` = `redis:7-alpine` con AOF, `s3` = `pgsty/silo` compatible con S3): contenedor de imagen fija con **volumen persistente**, en la red del proyecto dueño y, si se comparte, en la de otros proyectos del mismo usuario. Sobrevive a redespliegues, reversiones y reinicios.
- **API** bajo `proyectos/:id/datos` (listar, crear, conexión, compartir, dejar de compartir, eliminar con confirmación) y `GET /datos/health`. 409 `LIMITE_RECURSOS_DATOS`, `TIPO_YA_CONECTADO`, `SUSCRIPCION_BLOQUEADA`.
- **Cola `datos`** (BullMQ, Command): la API valida y encola; el trabajador crea, conecta, detiene, inicia, elimina (contenedor + volumen) y mide el disco cada 5 min. La API nunca llama a Docker.
- **Variables inyectadas** en el siguiente despliegue: `DATABASE_URL`, `PG*`, `REDIS_URL`, `S3_*` (ganan las del usuario) y las `DEPLOYA_*` (siempre). La bitácora nombra los recursos y cuenta las variables, sin valores.
- **S3 público** en `https://<subdominio>-s3.<dominio>` con el certificado comodín; bucket `app` con versionado. Un proyecto nuevo cuyo subdominio termina en `-s3` se rechaza.
- **Plan (M2)**: `maxRecursosDatos` (1/3/10/25) y `discoDatosMb` (512/2048/10240/25600) en la tabla, el seed y el catálogo; en autoalojado sin tope.
- **Ciclo de vida**: suspender la suscripción o la cuenta detiene los recursos (`detenido`, volumen intacto) y reactivar los inicia; eliminar el proyecto dueño los borra; eliminar uno compartido solo los desconecta.
- **Proyecto**: `comandoInicio` (≤ 512, sin shell) en `PATCH /proyectos/:id` y en el `Cmd` del contenedor, también en reversiones; `MAXIMO_VARIABLES` = 150.
- **Motor**: `MOTOR_TIEMPO_MAXIMO_CONSTRUCCION_MIN` (por omisión 20).

## Non-goals

- Respaldos, restauración o exportación de los volúmenes; réplicas o alta disponibilidad.
- Otros motores (MySQL, Mongo) o versiones a elección.
- Puertos de los recursos publicados en el host o acceso desde fuera de Deploya (salvo el S3 por HTTPS).
- Cortar un recurso que excede `discoDatosMb`: solo se mide y se avisa.
- La UI (otro PR del mismo change, contra el contrato).

## Capabilities

### New Capabilities

- `datos`: recursos de datos administrados con volumen persistente.

### Modified Capabilities

- `orquestacion`: variables inyectadas, suspensión de los recursos y limpieza al eliminar.
- `proyectos`: comando de inicio, 150 variables y subdominios `-s3` reservados.
- `motor-construccion`: tiempo de construcción configurable.
- `suscripciones`: límites de recursos de datos en el plan y el catálogo.

## Impact

- Prisma: `RecursoDatos`, `RecursoDatosCompartido`, enums `TipoRecursoDatos` y `EstadoRecursoDatos`, `Plan.maxRecursosDatos`, `Plan.discoDatosMb`, `Proyecto.comandoInicio` (migración `20261112120000_recursos_datos`).
- Código: `modules/datos` (nuevo), `PasoEjecucion`, `EliminarManejador`, `ContenedoresClienteM5`, `OrquestacionService`, `ContenedorDocker`, `PasoConstruccion`, adaptadores en `adapters/` (Docker, Prisma, memoria, BullMQ), `trabajador.ts`.
- Compose: `MOTOR_TIEMPO_MAXIMO_CONSTRUCCION_MIN` en el trabajador; `DOMINIO_BASE` y `ESQUEMA_PUBLICO` también en la API.
- `clases-unificado.mmd`.
