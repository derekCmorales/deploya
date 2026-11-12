# Design

## Context

La API no llama a Docker (ADR 0002): produce comandos y el trabajador los ejecuta. Cada proyecto tiene su red `deploya-p-<subdominio>` a la que se conectan Traefik y el trabajador (ADR 0005); la crea `asegurarRed` en el primer despliegue. El cifrado AES-GCM de `VariableEntorno` ya existe (`CifradorVariables`). Traefik se configura por archivo con un certificado comodín DNS-01 (ADR 0007), así que `<subdominio>-s3.<dominio>` no pide certificado nuevo. M2 y M9 detienen y reanudan a un cliente por `ContenedoresClientePuerto`.

## Goals / Non-Goals

**Goals:** bases administradas con datos que sobreviven a todo menos a su eliminación; variables listas sin que el usuario las copie; el mismo bloqueo por suscripción que los despliegues; cero Docker en la API.

**Non-Goals:** ver proposal (respaldos, otros motores, puertos en el host, cortar por disco).

## Decisions

1. **Módulo `datos` aparte**, con dos caras: `DatosModule` (API: controlador + `DatosService`) y `DatosTrabajadorModule` (trabajador: `MotorDatosService`). Así M5 no crece en un *God service* y el dominio de datos no depende de despliegues.
2. **Cola propia `datos`**, concurrencia 1 y **sin `jobId` fijo**: el orden entre `detener → iniciar → detener` importa y un `jobId` deduplicaría el segundo `detener`. Crear no se reintenta (el recurso queda en `error` con el detalle); el resto reintenta 3 veces como la cola `operacion`.
3. **Nombres deterministas** `deploya-datos-<subdominio-dueño>-<tipo>` para contenedor, host y volumen, y etiqueta `app.deploya.datos=<subdominio-dueño>`: eliminar funciona aunque la fila ya cayó en cascada, y `eliminarContenedoresDe` (que filtra por `app.deploya.proyecto`) nunca toca un recurso de datos.
4. **Eliminar proyecto**: las filas caen en cascada (Prisma) pero Docker no; `EliminarManejador` llama a `RecursosDatosDespliegue.liberarProyecto(subdominio)`, que borra por etiqueta los recursos propios con su volumen, desconecta de esa red los ajenos y retira la ruta `<subdominio>-s3`.
5. **Variables**: la estrategia de cada tipo devuelve `base` y `prefijadas`; `fusionarVariables` (dominio de M5) pone `base` debajo de las del usuario y `DEPLOYA_*` encima. La contraseña (32 `[A-Za-z0-9]`, `GeneradorSecretos`) se guarda con `CifradorVariables`.
6. **Conexión de red en Ejecución**: antes de crear la app, `paraDespliegue` asegura que cada recurso disponible esté en la red del proyecto (idempotente). Crear el recurso también llama a `asegurarRed`, aunque el proyecto no tenga despliegue.
7. **Preparación por `docker exec`** hasta salir con 0 (máx. 180 s por comando): `pg_isready -h 127.0.0.1` (el servidor temporal de `initdb` no escucha en TCP) y `CREATE EXTENSION vector`; `redis-cli ping`; en S3, `mc alias set`, `mc mb --ignore-existing local/app` y `mc version enable` (`mc` viene en `pgsty/silo`).
8. **Seguridad**: sin `PortBindings`, `CapDrop ALL` + `CHOWN, SETUID, SETGID, FOWNER, DAC_OVERRIDE`, `no-new-privileges`, memoria del tipo y `unless-stopped`. Verificado con Docker real (prueba de integración).
9. **Disco**: `du -sm <ruta>` cada 5 min con un `JobScheduler` de BullMQ (como el muestreo de métricas). Solo avisa.
10. **Plan**: `maxRecursosDatos` cuenta los recursos **de la cuenta** (un compartido ocupa un lugar). En autoalojado `LimitesDeInstalacion` da `Infinity` (en JSON, `null`) y el disco del plan «Autoalojado».
11. **`comandoInicio`** se parte con `argumentosDeComando` (comillas simples y dobles, sin shell) y viaja como `EspecContenedor.comando` → `Cmd`; la reversión crea el contenedor con el comando actual del proyecto.
12. **`-s3` reservado**: `ProyectosService.crear` rechaza con `SubdominioEnUso` un subdominio que termina en `-s3` para no quitarle la ruta al S3 de otro proyecto.

## Diseño: SOLID y patrones

| Clase / puerto | Patrón | Principio | Por qué |
|---|---|---|---|
| `TipoRecursoDatos` ← `PostgresRecurso`, `RedisRecurso`, `S3Recurso` | **Strategy** | O, S | Imagen, puerto, memoria, ruta, arranque, variables y post-creación por tipo; un tipo nuevo es una clase y una fila, sin `switch` |
| `DatosService` | **Facade** | S, D | Una puerta para el controlador y para M5 (suspender/reanudar); valida y encola |
| `PoliticaRecursosDatos` (`verificarAlta`, `verificarTipoLibre`) | **Specification** pura | S | Suscripción → tope del plan → tipo libre, probada sin Nest ni base |
| `ComandoDatos` + tabla `manejadores` en `MotorDatosService` | **Command** | O | La API describe, el trabajador ejecuta; una acción nueva es una entrada de la tabla |
| `RepositorioRecursosDatos` ← `…Prisma`, `…Memoria` | **Repository** | D, L | El servicio no conoce Prisma; mismo error `TipoYaConectado` en ambos |
| `RecursosDatosPuerto` ← `RecursosDatosDocker`, `RecursosDatosStub` | **Adapter** | D, L, I | dockerode detrás de un puerto del dominio (no expone Docker tal cual) |
| `ColaDatosPuerto` ← `ColaDatosBullMq`, `ColaDatosMemoria`; `ColaMedicionDiscoPuerto` | **Adapter**, productor/consumidor | D | Igual que las colas existentes |
| `CuotaDatosPuerto` ← `CuotaDatosSuscripciones` | **Adapter** | I | Solo estado y límites de datos de `cuotaDe` |
| `GeneradorSecretos` ← `GeneradorSecretosCrypto`, `…Fijo` | **Strategy** (azar como dependencia) | D | Contraseñas probables en pruebas |
| `RecursosDatosDespliegue` ← `RecursosDatosMotor` | **Adapter** | I, D | M5 ve dos métodos; no conoce el módulo de datos por dentro |
| `ContenedoresClienteM5` (con `DatosService`) | **Adapter** compuesto | O | M2 y M9 no cambian: el mismo puerto detiene apps y bases |
| `ConexionesDatos` | Service Layer | S | Una regla de variables compartida por API (copiar) y trabajador (inyectar) |
| `ErroresDatosFilter` | Exception Filter | S | Errores con nombre → `{ codigo, mensaje }` con 409/404/400 |

Cambios en `clases-unificado.mmd`: el bloque «M5 Recursos de datos», `RecursosDatosDespliegue`, `EspecContenedor.comando`, `Cuota.maxRecursosDatos/discoDatosMb`, `CambiosProyecto.comandoInicio` y estados `EstadoRecursoDatos` (≠ despliegue ≠ suscripción).

## Risks / Trade-offs

- **Un proyecto con subdominio de más de 60 caracteres** no puede publicar `<subdominio>-s3` (la etiqueta DNS pasa de 63): el S3 queda en `error` con el detalle del enrutador.
- **`pgsty/silo` sin etiqueta fija**: es lo que pide el contrato; conviene fijar una versión cuando el proveedor publique etiquetas estables.
- **Proyectos existentes que ya terminan en `-s3`** no se renombran (el subdominio es inmutable); el choque solo se evita para los nuevos.
- **Crear y eliminar casi a la vez**: la cola es FIFO con concurrencia 1, así que `eliminar` siempre corre después de `crear`.

## Open Questions

- ¿Avisar por correo (M10) cuando un recurso pasa del 90 % de `discoDatosMb`? Fuera de este change.
