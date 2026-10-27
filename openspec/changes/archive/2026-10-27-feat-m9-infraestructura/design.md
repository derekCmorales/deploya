# Design

## Context

Depende de `feat-m5-muestreo-metricas` (muestras) y de la familia de gráficas de `feat-m7-metricas`.

## Decisions

### 1. Solo lectura

Igual que en Deploya V4: este módulo observa, no orquesta.

### 2. El nodo se lee en la API, sin docker.sock

`MetricasNodoSistema` usa `os.cpus()`, `os.totalmem()`/`freemem()` y `statfs("/")`: dentro del contenedor de la API, `/proc` y la raíz ven el host, así que no hacen falta privilegios. La CPU es la fracción ocupada entre dos lecturas (la primera, el promedio desde el arranque).

### 3. La cola sale de `Despliegue`

El `jobId` de BullMQ es el `despliegueId` y el trabajador mantiene el estado del despliegue, así que la tabla ya es la cola con nombres de proyecto: `encolado` = en espera; `construyendo`, `aprovisionando`, `publicando`, `revirtiendo` = en curso; fallidas = `fallido` con `terminado` en 24 h. Evita abrir Redis desde M9 y se prueba con un doble del repositorio.

### 4. La serie del nodo la arma la web

La API no guarda historia del nodo. La pantalla consulta cada 5 s y suma cada lectura a la serie de `GraficaUso compacta` (últimas 60, `acumularSerie`, pura). Una muestra de entorno de más de 2 min (dos rondas del muestreo) se muestra como «—».

## Diseño: SOLID y patrones

| Clase / puerto | Patrón | Principio | Por qué |
|---|---|---|---|
| `MetricasNodoPuerto` | Adapter | I, D | Leer el nodo detrás de un puerto |
| `InfraestructuraService` | Facade de lectura | S | Junta nodo, cola y muestras |
| `ConsultaInfraestructuraPuerto` | Repository de lectura (CQRS ligero) | S, D | Una consulta para cola y entornos, como `ConsultaUsuariosPuerto` |
| `vistaInfraestructura` | Función pura | S | Orden de la cola, tiempos y vigencia de la muestra sin base ni reloj |

Cambios de clases y puertos: `MetricasNodoPuerto`, `ConsultaInfraestructuraPuerto`, `InfraestructuraService` → `docs/diagramas/compartido/clases-unificado.mmd` en el mismo PR (`pnpm diagramas:sync`).

## Risks / Trade-offs

- **Permisos del contenedor de la API** para leer el nodo: se usa lo que expone Docker, sin privilegios extra.
