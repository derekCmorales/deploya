# 18 · Proyecto · Datos

| | |
|---|---|
| Ruta | `/projects/[proyecto]/datos` |
| Dueño | Eduardo (datos: Derek) |
| Historias | `feat/m5-recursos-datos` |
| Entrega | Sprint |
| Diseño | Sin artboard propio en el canvas Deploya v4.1: sigue el patrón F (detalle de proyecto) y los mismos componentes que 17 y 19 |
| Datos | [recursos-datos.md](../../contratos/recursos-datos.md) · `GET/POST /proyectos/:id/datos` · `…/:recursoId/conexion` · `…/:recursoId/compartir` · `DELETE …/:recursoId` |

## Qué es

Pestaña nueva del proyecto, entre Variables y Configuración. Bases de datos administradas por Deploya (PostgreSQL 17 + pgvector, Redis 7, almacenamiento S3) con volumen persistente: sobreviven a redespliegues, reversiones y reinicios de la app.

- **Cabecera**: título, explicación y `Meter` con `usados / maximo` del plan (`tonoAlLimite="warn"`). Al llegar al tope, enlace «Ver planes».
- **Agregar**: una `Card` por tipo que la API ofrece (`tiposDisponibles`) o que ya está conectado. Deshabilitada con «Ya conectado» si el proyecto ya tiene uno de ese tipo (propio o compartido) o con «Límite del plan» si se llegó al tope. Con la suscripción Vencida o Suspendida, deshabilitadas y el `BannerBloqueo` de «Renovar».
- **Vacío**: `Card` con el texto explicativo (abajo).
- **Lista**: una `Card` por recurso con `EstadoRecursoDatos` (Creando · Disponible · Detenido · Error, con `detalle`), host:puerto interno en mono, URL pública (`CopyField`, solo S3), disco con `Meter` (aviso `warn` desde el 90 %; nunca corta), nombres de las variables inyectadas (`Badge` mono), «Compartido con» con quitar por proyecto. Si el proyecto no es el dueño: `Badge outline` «Pertenece a <proyecto>» y solo «Desconectar».
- **Ver conexión**: `Dialog` que pide los valores reales al abrir y los muestra con `CopyField`; aviso de que aplican en el siguiente despliegue y `BotonDesplegar`.
- **Compartir con otro proyecto**: `Dialog` con `Select` de los proyectos del usuario que aún no lo tienen.
- **Eliminar**: `Dialog` de 19b con confirmación escrita del **tipo** (`postgres`, `redis`, `s3`); advierte que los datos se pierden para siempre y lista los proyectos con los que se comparte.
- **Errores 409**: `LIMITE_RECURSOS_DATOS` (`Banner warn` + «Cambiar de plan»), `TIPO_YA_CONECTADO` (`Banner warn`), `SUSCRIPCION_BLOQUEADA` (`BannerBloqueo`).
- Mientras algún recurso está **Creando**, sondeo cada 3 s (`useSondeo`).

Relacionadas: tarjeta «Datos» en el Resumen (13), nota en 11d, «Comando de inicio» en 19, «Pegar .env» y tope de 150 en 17, filas «Bases de datos» y «Disco por base» en 06.

## Componentes

- `AppShell`, `TabsNav`
- `Card`, `Meter`, `Banner`, `Badge`, `Button`
- `EstadoRecursoDatos` (nuevo, `components/deploya`; vocabulario `ESTADOS_RECURSO_DATOS` en `estados.ts`, ≠ despliegue y ≠ suscripción)
- `CopyField`, `Dialog`, `Field`, `Input`, `Select`, `Skeleton`
- `BannerBloqueo`, `BotonDesplegar` (de `(projects)/_componentes`)

Todos en `apps/web/src/components` (catálogo vivo en `/sistema`). Reglas: [../README.md](../README.md). Cómo armarla: [../guia-construccion.md](../guia-construccion.md).

## Textos de la pantalla

En orden de aparición. Los datos (nombres, hosts, tamaños) son de ejemplo: vienen de la API.

```text
Resumen
Despliegues
Métricas
Bitácoras
Variables
Datos
Configuración
Bases de datos
Sus datos sobreviven a redespliegues, reversiones y reinicios de la app.
Bases de datos del plan
1 / 3 bases de datos del plan
Ver planes
PostgreSQL 17 + pgvector
Base relacional con búsqueda vectorial. Inyecta DATABASE_URL y PG*.
Redis 7
Caché y colas en memoria, con persistencia en disco. Inyecta REDIS_URL.
Almacenamiento S3
Archivos compatibles con S3, con URL pública. Inyecta S3_*.
Agregar
Ya conectado
Límite del plan
Agrega una base de datos administrada: PostgreSQL con pgvector, Redis o almacenamiento S3. Sus datos sobreviven a redespliegues y reversiones.
Creando
Disponible
Detenido
Error
Pertenece a api-tienda
Host interno
deploya-datos-api-tienda-postgres:5432
URL pública
Disco
1.9 GB / 2 GB
El disco está al 93 % de 2 GB. No cortamos el servicio, pero libera espacio o cambia de plan.
Variables inyectadas
DATABASE_URL
Compartido con
Solo este proyecto
Ver conexión
Compartir con otro proyecto
Eliminar
Desconectar
Conexión · PostgreSQL 17 + pgvector
Se aplican en el siguiente despliegue
Las variables se aplican en el siguiente despliegue de cada proyecto conectado. Tus variables con el mismo nombre ganan.
Desplegar
Compartir PostgreSQL 17 + pgvector
Elige un proyecto
No tienes otros proyectos con los que compartirla.
Eliminar PostgreSQL 17 + pgvector
Borra el contenedor y su volumen. Los datos se pierden para siempre y no se puede deshacer.
Escribe postgres para confirmar
Eliminar para siempre
Llegaste al límite de bases de datos de tu plan
Elimina una que no uses o cambia de plan para agregar otra.
Cambiar de plan
Ese proyecto ya tiene una base de ese tipo
Tu suscripción no permite crear bases de datos
```
