# 0012 — Recursos de datos como contenedores con volumen en el mismo nodo

- **Estado:** Propuesto
- **Fecha:** 2026-11-12
- **Autor:** @derekCmorales · **Módulos:** M5 (motor), M2 (límites del plan), web (pestaña *Datos*), transversal (infraestructura)
- **Change de OpenSpec:** `feat/m5-recursos-datos` · contrato: [docs/contratos/recursos-datos.md](../contratos/recursos-datos.md)

## Contexto

Hasta hoy Deploya solo corre **apps sin estado**: el contenedor de una versión se reemplaza en cada despliegue o reversión ([ADR 0004](0004-versionado-y-reversion-sin-reconstruir.md)) y lo que escribe en su disco se pierde. Una app que necesita base de datos tiene que traerla de fuera y pegar la URL como variable.

El caso que lo vuelve urgente es **Nimbo**, el primer proyecto real del piloto: cuatro contenedores de ≈ 1 GB (`api`, `worker`, `optimizer`, `web`) que comparten **PostgreSQL con pgvector**, **Redis** (colas) y un **almacenamiento compatible con S3** (archivos que el navegador descarga por URL). Sin datos administrados, Nimbo no se puede desplegar en Deploya sin pagar servicios aparte, y los demás usuarios tampoco pueden pasar de un «hola mundo».

Fuerzas:

- **Costo:** el piloto vive en una sola EC2 ([ADR 0009](0009-piloto-en-aws-ec2-con-terraform.md)) con un tope de **70 USD/mes**. El ingreso por proyecto es ≈ 1.5 USD ([ADR 0010](0010-escala-con-ecs-y-construcciones-en-fargate.md)); un servicio administrado de AWS por proyecto cuesta más que eso (ver tabla de alternativas y [costos.md](../costos.md)).
- **Arquitectura:** la API no habla con Docker; el worker crea contenedores por `ContenedorPuerto` y Traefik enruta por `EnrutamientoPuerto` ([ADR 0005](0005-traefik-proveedor-de-archivo.md)). Lo nuevo debe entrar por los mismos puertos.
- **Aislamiento:** cada proyecto tiene su red bridge; una base no puede quedar al alcance de los proyectos de otro usuario. Pero Nimbo son **cuatro proyectos del mismo usuario** que necesitan la **misma** base.
- **Seguridad:** las apps de los usuarios corren con `CapDrop ALL`. PostgreSQL no arranca así (hace `chown` del directorio de datos y cambia de usuario).
- **Disco:** todos los volúmenes caen en el mismo EBS del nodo. Docker con overlay2 sobre ext4 no tiene cuota por volumen.
- **Tiempo y equipo:** cuatro personas, núcleo v4.1 cerrado; nada de operadores de Kubernetes ni de un plano de control nuevo.

## Decisión

Usamos **contenedores de datos con imagen fija de Deploya y un volumen Docker con nombre, en el mismo nodo que las apps**:

1. **Tipos como Strategy** (`TipoRecursoDatos`): `postgres` (`pgvector/pgvector:pg17`, 512 MB), `redis` (`redis:7-alpine` con AOF, 256 MB) y `s3` (`pgsty/silo`, compatible con S3, 512 MB). Agregar un tipo es una implementación nueva, no un `switch` (OCP).
2. **Volumen persistente** `deploya-datos-<subdominio>-<tipo>` en `/var/lib/docker/volumes`. Sobrevive a despliegues, reversiones, reinicios de la app y del nodo. Solo se borra al eliminar el recurso o el proyecto dueño, con confirmación escrita.
3. **Red del proyecto:** el contenedor se conecta a la red bridge del proyecto dueño con el alias `deploya-datos-<subdominio>-<tipo>`. **Sin puertos publicados** en el host.
4. **Compartir solo entre proyectos del mismo usuario:** el recurso se conecta además a la red de cada proyecto con el que se comparte (Nimbo: el Postgres de `api` se comparte con `worker` y `optimizer`). Un proyecto tiene a lo sumo un recurso de cada tipo, así las variables inyectadas (`DATABASE_URL`, `REDIS_URL`, `S3_*`) no chocan; las del usuario ganan.
5. **Capacidades mínimas:** `CapDrop ALL` + `CHOWN`, `SETUID`, `SETGID`, `FOWNER`, `DAC_OVERRIDE` (las que exige el arranque de PostgreSQL), `no-new-privileges`, límite de memoria y `unless-stopped`. Es una excepción acotada a **imágenes fijas nuestras**; el código del usuario sigue sin capacidades.
6. **S3 con ruta pública** `https://<subdominio>-s3.<dominio>` por Traefik (el comodín `*.<dominio>` y su certificado ya la cubren, [ADR 0007](0007-certificado-comodin-por-dns-01.md)). Es el único tipo con ruta pública: las URL firmadas que genera la app deben abrirse desde el navegador.
7. **Medir y avisar el disco, no cortar:** el worker mide el uso de cada volumen y lo guarda en `usoDiscoMb`; la UI avisa al acercarse a `discoDatosMb` del plan (512 MB a 25 GB). No hay cuota dura.
8. **Respaldo mínimo fuera del nodo:** snapshot diario del disco con Data Lifecycle Manager, 7 días ([infra/terraform/respaldos.tf](../../infra/terraform/respaldos.tf)); el disco raíz sube a 80 GB por los volúmenes ([variables.tf](../../infra/terraform/variables.tf)). Respaldo y restauración manual de un volumen: [infra-vps.md §5](../infra-vps.md#5-recursos-de-datos-respaldo-restauración-y-disco).

## Alternativas consideradas

| Opción | A favor | En contra |
|---|---|---|
| **Contenedor + volumen en el nodo** (elegida) | Costo marginal casi cero (memoria y disco que ya pagamos); mismo `ContenedorPuerto` y misma red por proyecto; las variables se inyectan solas; cabe en el tope de 70 USD | Datos y apps comparten el punto único de falla del nodo; sin alta disponibilidad; respaldos a nuestro cargo; ruido de vecinos en disco y CPU |
| RDS / ElastiCache / un bucket S3 por proyecto | Respaldos, parches y alta disponibilidad de AWS; nada en el nodo | RDS `db.t4g.micro` ≈ 13.98 USD/mes con 20 GB, ElastiCache Valkey `t4g.micro` ≈ 9.34: ≈ 23 USD por proyecto frente a ≈ 1.5 USD de ingreso. Un bucket por proyecto exige IAM por usuario y credenciales de AWS en manos del cliente. RDS compartido con una base por proyecto es la variante sensata, pero es el ADR 0010, no el piloto |
| Bases externas a cargo del usuario (Neon, Supabase, Upstash…) | Cero operación para nosotros | Nimbo y cualquier app real no se despliegan «con un clic»; cada usuario pelea con redes, TLS y planes gratuitos de terceros; la latencia sale del nodo; no es el producto que vendemos |
| Cuotas duras por volumen (XFS con `pquota`, o un archivo loop por volumen) | El plan corta de verdad; un usuario no llena el disco de todos | Exige reformatear `/var/lib/docker` en XFS con `pquota` (otro disco, otra AMI, migrar lo que hay) o un dispositivo loop por recurso; un Postgres que llega a la cuota se detiene a media escritura, peor que un aviso. En un nodo con un puñado de usuarios conocidos, medir y avisar alcanza |
| Base compartida de la plataforma con un esquema por proyecto | Un solo Postgres que operar | Mezcla datos de clientes con los de Deploya; una consulta pesada de un usuario degrada la API; sin pgvector ni versión propia por proyecto |

## Consecuencias

- **Más fácil:** desplegar Nimbo y cualquier app con estado sin salir de Deploya; las variables de conexión aparecen solas en el siguiente despliegue; el plan sube de valor (la landing puede decir «PostgreSQL, Redis y S3 incluidos»).
- **Más difícil:** el nodo ahora guarda **datos de clientes**. Perder el disco ya no es «redesplegar»: es perder datos.
- **Deuda aceptada:**
  - **Respaldos pendientes.** El snapshot diario de DLM es consistente ante caídas, del disco entero y de 7 días; no hay restauración por recurso desde la UI ni `pg_dump` programado por recurso. La restauración es manual ([infra-vps.md §5](../infra-vps.md#5-recursos-de-datos-respaldo-restauración-y-disco)). Un change propio debe agregar respaldo lógico por recurso a un bucket de S3 fuera del nodo.
  - **Punto único de falla del nodo.** Una zona, un disco, una EC2: si cae, caen las apps **y** sus datos hasta recuperar el snapshot (RPO ≤ 24 h, RTO de horas). Se dice al cliente en la página de planes.
  - **Sin cuota dura de disco.** Un recurso puede pasar su `discoDatosMb`; el aviso al usuario y al operador es la defensa. El operador vigila `df` y `docker system df -v` (infra-vps §5).
  - **Memoria comprometida.** Cada recurso reserva su límite (Nimbo: 1.25 GB de datos más 4 GB de apps). En 8 GB, Nimbo deja poco a los demás: para su piloto conviene `m7i-flex.xlarge` (16 GB) por los días que dure ([costos.md](../costos.md#5-escenario-piloto-con-nimbo)).
- **Migración al ADR 0010:** `RecursoDatosPuerto` (o el que defina el change) tendrá otra implementación: `postgres` → una instancia RDS compartida con una base y un rol por recurso; `redis` → ElastiCache con un prefijo o número de base por recurso, o un contenedor en un nodo de datos; `s3` → un prefijo por recurso en un bucket de S3 con política por prefijo. El contrato con la web y las variables inyectadas (`DATABASE_URL`, `REDIS_URL`, `S3_*`) no cambian; la mudanza de datos es `pg_dump | pg_restore`, `redis-cli --rdb` y `mc mirror`, por recurso, con una ventana de corte.
- **SOLID y patrones:** Strategy por tipo (`TipoRecursoDatos`, OCP); el motor sigue hablando con Docker solo por `ContenedorPuerto` y con Traefik por `EnrutamientoPuerto` (DIP); los estados del recurso (`creando`, `disponible`, `detenido`, `error`) son un State propio, distinto de los de despliegue y de suscripción (§4.4). Conviene que la medición del disco sea un puerto estrecho aparte (ISP), para que un adaptador de ECS/RDS la implemente con CloudWatch sin tocar el resto.

## Validación

- `terraform validate` con `respaldos.tf`; tras el apply, `aws dlm get-lifecycle-policies` muestra la política `ENABLED` y al día siguiente hay un snapshot con la etiqueta `CreadoPor=dlm`.
- En el servidor: crear un Postgres desde la pestaña *Datos*, redesplegar la app y comprobar que los datos siguen; `docker volume ls | grep deploya-datos-`.
- Pruebas unitarias del change (`feat/m5-recursos-datos`): cada `Scenario` del spec con su `it(...)`, con dobles de `ContenedorPuerto`.
