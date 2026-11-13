# Contrato · Recursos de datos (bases administradas)

**Change:** `feat/m5-recursos-datos` · **Dueño:** Derek (motor) · **Consumidores:** web (`apps/web`, pestaña *Datos* del proyecto), M2 (límites del plan), apps de los usuarios (variables inyectadas).

Un **recurso de datos** es un contenedor de Deploya (imagen fija, no código del usuario) con un **volumen persistente**, que vive en la red de su proyecto dueño y, opcionalmente, en la de otros proyectos del **mismo usuario** con los que se comparte. Sobrevive a redespliegues, reversiones y reinicios de la app. Se borra solo cuando el usuario lo elimina o elimina el proyecto dueño.

## Tipos (Strategy: `TipoRecursoDatos`)

| `tipo` | Imagen | Puerto interno | Memoria | Público | Variables inyectadas en las apps conectadas |
|---|---|---|---|---|---|
| `postgres` | `pgvector/pgvector:pg17` (Postgres 17 + pgvector) | 5432 | 512 MB | no | `DATABASE_URL`, `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE` |
| `redis` | `redis:7-alpine` (`--appendonly yes`) | 6379 | 256 MB | no | `REDIS_URL` |
| `s3` | `pgsty/silo` (MinIO compatible S3) | 9000 | 512 MB | **sí**: `https://<subdominio>-s3.<dominio>` | `S3_ENDPOINT` (interno), `S3_PUBLIC_ENDPOINT` (público), `S3_ACCESS_KEY`, `S3_SECRET_KEY`, `S3_BUCKET`, `S3_REGION` (`us-east-1`) |

- Un proyecto puede tener **a lo sumo un recurso de cada tipo** conectado (propio o compartido). Así las variables no chocan.
- **Las variables del usuario ganan** sobre las inyectadas: si el proyecto ya define `DATABASE_URL`, se respeta la suya.
- Además de las anteriores, siempre se inyectan con prefijo, que nunca se pisan: `DEPLOYA_POSTGRES_URL`, `DEPLOYA_REDIS_URL`, `DEPLOYA_S3_ENDPOINT`, `DEPLOYA_S3_PUBLIC_ENDPOINT`, `DEPLOYA_S3_ACCESS_KEY`, `DEPLOYA_S3_SECRET_KEY`, `DEPLOYA_S3_BUCKET`.
- Nombre del contenedor y host en la red: `deploya-datos-<subdominio-dueño>-<tipo>`. El volumen: `deploya-datos-<subdominio-dueño>-<tipo>`.
- Contraseña aleatoria de 32 caracteres (`[A-Za-z0-9]`), guardada **cifrada** con el mismo cifrado de `VariableEntorno`. Usuario/base de Postgres: `deploya` / `app`. Bucket S3: `app` con versionado activado al crear.
- Las inyecciones aplican **en el siguiente despliegue** de cada proyecto conectado (la UI lo avisa).

## Estados del recurso (≠ estados de despliegue y de suscripción)

`creando` → `disponible` · `detenido` (suspensión de la cuenta o del admin) · `error` (con `detalle`).

## Límites del plan (nuevos campos de `Plan`)

| Recurso | Sandbox | Starter | Pro | Business |
|---|---|---|---|---|
| `maxRecursosDatos` (por cuenta) | 0 | 3 | 10 | 25 |
| `discoDatosMb` (por recurso, se mide y se avisa; no corta) | 512 (sin uso) | 2 048 | 5 120 | 20 480 |

Tarifa de lanzamiento (2026-11-13): Sandbox no trae bases (el usuario usa su propia URL); el seed actualiza los planes existentes en cada despliegue.

Crear por encima de `maxRecursosDatos` → `409 LIMITE_RECURSOS_DATOS`. Con la suscripción Vencida o Suspendida no se crean recursos (`409 SUSCRIPCION_BLOQUEADA`, mismo bloqueo que los despliegues).

## Otros campos de proyecto (mismo change)

- `Proyecto.comandoInicio: string | null` — sobrescribe el `CMD` de la imagen (p. ej. `node dist/worker-optimizer.main.js`). Se parte en argumentos respetando comillas simples y dobles; no pasa por un shell. Máx. 512 caracteres. Editable en `PATCH /proyectos/:id` y en Configuración.
- `MAXIMO_VARIABLES` pasa de 50 a **150**.
- `TIEMPO_MAXIMO_CONSTRUCCION_MS` sale de configuración `MOTOR_TIEMPO_MAXIMO_CONSTRUCCION_MIN` (por omisión **20**).

## API HTTP (requiere sesión; solo el dueño del proyecto)

Todas bajo el controlador del módulo nuevo `datos` (`GET /datos/health` como los demás).

| Método y ruta | Cuerpo | Respuesta |
|---|---|---|
| `GET /proyectos/:id/datos` | — | `200 { recursos: VistaRecursoDatos[], limite: { usados, maximo }, tiposDisponibles: TipoRecurso[] }` |
| `POST /proyectos/:id/datos` | `{ tipo: "postgres" \| "redis" \| "s3" }` | `201 VistaRecursoDatos` · `409 LIMITE_RECURSOS_DATOS` · `409 TIPO_YA_CONECTADO` · `409 SUSCRIPCION_BLOQUEADA` |
| `GET /proyectos/:id/datos/:recursoId/conexion` | — | `200 { variables: Record<string,string> }` (valores reales; para copiar) |
| `POST /proyectos/:id/datos/:recursoId/compartir` | `{ proyectoId }` (otro proyecto del mismo usuario) | `200 VistaRecursoDatos` · `409 TIPO_YA_CONECTADO` · `404` |
| `DELETE /proyectos/:id/datos/:recursoId/compartir/:proyectoId` | — | `204` |
| `DELETE /proyectos/:id/datos/:recursoId` | `{ confirmacion: "<tipo>" }` (texto escrito, como eliminar proyecto) | `204` · borra contenedor **y volumen**. Si el recurso es compartido con `:id` (no es su dueño), solo lo desconecta. |

```ts
type TipoRecurso = "postgres" | "redis" | "s3";
interface VistaRecursoDatos {
  id: string;
  tipo: TipoRecurso;
  nombre: string;               // "PostgreSQL 17 + pgvector" | "Redis 7" | "Almacenamiento S3"
  estado: "creando" | "disponible" | "detenido" | "error";
  detalle: string | null;
  host: string;                 // host interno en la red
  puerto: number;
  urlPublica: string | null;    // solo s3
  esDueno: boolean;             // false si :id solo lo usa compartido
  proyectoDueno: { id: string; nombre: string };
  compartidoCon: { id: string; nombre: string }[];
  usoDiscoMb: number | null;    // última medición
  limiteDiscoMb: number;
  variablesInyectadas: string[]; // solo nombres
  creado: string;               // ISO
}
```

## Ciclo de vida con el resto

| Evento | Recurso |
|---|---|
| Despliegue / reversión / reiniciar / detener la app | no se toca |
| Eliminar proyecto dueño | se elimina (contenedor + volumen) y se desconecta de los compartidos |
| Eliminar proyecto con el que se comparte | solo se desconecta |
| Suspensión de suscripción o de cuenta (admin) | `detenido` (contenedor parado, volumen intacto) |
| Reactivación / renovación | vuelve a `disponible` (se inicia de nuevo) |

## Seguridad

- Sin ruta pública salvo `s3`. Sin puertos publicados en el host.
- Los contenedores de datos son imágenes fijas de Deploya: llevan `CapDrop: ALL` más solo `CHOWN`, `SETUID`, `SETGID`, `FOWNER`, `DAC_OVERRIDE` (los que exige el arranque de Postgres), `no-new-privileges`, límite de memoria y `RestartPolicy unless-stopped`. El código del usuario sigue sin capacidades.
- La bitácora del despliegue dice qué recursos se conectaron y cuántas variables se inyectaron, nunca sus valores.

## Desviaciones

Lo que la implementación del motor (`apps/api`, change `feat-m5-recursos-datos`) fija donde el contrato no decía o no podía cumplirse al pie de la letra. Nada cambia nombres ni formas de arriba.

- **`limite.maximo` en autoalojado es `null`.** El plan de una instalación autoalojada no tiene tope de recursos (`Infinity` en la API, que JSON serializa como `null`), igual que `maximo` de `GET /proyectos`. La web debe leer `null` como «sin límite» (ojo: en JS `n >= null` es `true`).
- **`tiposDisponibles`** son los tipos que el proyecto **todavía no tiene conectados** (propios o compartidos), en el orden `postgres`, `redis`, `s3`. Llegar al tope del plan no los quita: eso lo dice `limite`.
- **Códigos de los demás errores** (`{ codigo, mensaje }`): `404 PROYECTO_NO_ENCONTRADO` (proyecto ajeno o inexistente, también el destino de compartir), `404 RECURSO_NO_ENCONTRADO` (recurso que no está conectado a `:id`), `400 CONFIRMACION_NO_COINCIDE` y `400 DATOS_INVALIDOS` (tipo desconocido o cuerpo sin `proyectoId`).
- **Compartir** solo se hace desde el proyecto **dueño** (desde uno compartido → 404). Compartir otra vez con el mismo proyecto es idempotente (200 con la vista). Compartir con el propio dueño → 409 `TIPO_YA_CONECTADO`. **Dejar de compartir** se puede desde el dueño o desde el propio proyecto compartido.
- **Subdominios `-s3` reservados.** Un proyecto **nuevo** cuyo subdominio termina en `-s3` se rechaza con `409 subdominio-en-uso` (M3), para no quitarle la ruta pública al S3 de otro proyecto. Si el subdominio del dueño pasa de 60 caracteres, `<subdominio>-s3` no cabe en una etiqueta DNS: el S3 queda en `error` con el detalle del enrutador.
- **Formatos de las variables:** `DATABASE_URL = postgresql://deploya:<contraseña>@<host>:5432/app`, `REDIS_URL = redis://default:<contraseña>@<host>:6379`, `S3_ENDPOINT = http://<host>:9000`, `S3_ACCESS_KEY = deploya` y `S3_SECRET_KEY` = la contraseña. `S3_PUBLIC_ENDPOINT` usa `ESQUEMA_PUBLICO` y `DOMINIO_BASE` (`http://<subdominio>-s3.localhost` en desarrollo). Un recurso en `error` no se inyecta.
- **Postgres** sale con la extensión `vector` ya creada en la base `app` (`CREATE EXTENSION IF NOT EXISTS vector` al crearlo); el usuario `deploya` es superusuario de su instancia, así que una migración que la cree igual no falla.
- **Capacidades:** las del contrato bastan. Verificado con Docker real (29.x): `pgvector/pgvector:pg17` inicializa y baja a `postgres`, `redis:7-alpine` y `pgsty/silo` arrancan con `CapDrop ALL` + `CHOWN, SETUID, SETGID, FOWNER, DAC_OVERRIDE` y `no-new-privileges`.
- **S3:** `pgsty/silo` sin etiqueta (= `latest`, como dice la tabla); arranca con `server /data --address :9000` y `MINIO_BROWSER=off` (sin consola web). El bucket y el versionado se crean con `mc`, que viene en la imagen.
- **Comando de inicio inválido** (más de 512 caracteres, comilla sin cerrar o no texto) → `400 comando-invalido` en `PATCH /proyectos/:id`. Vacío o `null` vuelve al `CMD` de la imagen; la vista lo devuelve como `null`.
- **Alta guiada** (`feat-m3-alta-guiada`): `POST /proyectos` con `datos` llama a `DatosService.verificarAltaInicial(usuarioId, tipos)` antes de guardar y a `crear` por cada tipo después. Los errores de M5 llegan como `409 datos-no-permitidos` de M3 con el código original en `motivo`. `DatosService.limiteDe(usuarioId)` da `{ usados, maximo }` de la cuenta para `GET /proyectos`.
- **Espera en Ejecución:** `paraDespliegue` vuelve a leer cada 2 s los recursos en `creando` del proyecto, hasta 2 min. Al tope se inyectan igual y `InyeccionDatos.pendientes` los nombra; la bitácora lo avisa.
- **Disco:** el trabajador mide con `du -sm` cada 5 minutos (y al terminar de crear). Un recurso detenido conserva su última medición.
