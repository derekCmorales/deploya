# Design

## Context

El motor hoy es `health` + stubs globales en `AdaptersModule` (C3), una cola concreta sin puerto (C1) y firmas distintas entre código, diagrama y canvas (C2). El schema de arranque no tiene `Artefacto`, `EtapaDespliegue` ni `LineaBitacora`: llegan con DB-01 según [datos-nucleo.md](../../../docs/contratos/datos-nucleo.md). El contrato HTTP v1 ya está publicado y Eduardo lo consume el martes. Diagramas de este change (ya al día): [c4-componentes-motor](../../../docs/diagramas/compartido/c4-componentes-motor.mmd), [clases-unificado](../../../docs/diagramas/compartido/clases-unificado.mmd), [estados](../../../docs/diagramas/m1-m10/m4-m5-m6-estados-despliegue.mmd), [secuencia](../../../docs/diagramas/m1-m10/m4-m5-m6-secuencia-despliegue.mmd), [actividad](../../../docs/diagramas/m1-m10/m4-m5-m6-actividad-motor.mmd), [módulos](../../../docs/diagramas/m1-m10/m4-m5-m6-componentes.mmd), [infraestructura](../../../docs/diagramas/compartido/despliegue-infraestructura.mmd).

## Goals / Non-Goals

**Goals:** un despliegue real de punta a punta en `docker compose up` (Saludable o Fallido con código de salida), bitácora paginada, límites del plan visibles en `docker inspect`, app abierta en `<subdominio>.localhost`, y los puertos con una sola firma y un stub cada uno.

**Non-Goals:** detección de stack, reversión, acciones del cliente, bloqueos por suscripción, HTTPS (ver proposal).

## Decisions

### 1. Dos procesos, una imagen ([ADR 0002](../../../docs/adr/0002-cola-bullmq-y-trabajador-aparte.md))

`main.ts` (API) produce; `trabajador.ts` crea un contexto Nest con `TrabajadorModule` y consume la cola `despliegues` con concurrencia 1. Solo el worker monta `docker.sock` y tiene `git`.

### 2. Pipeline por etapas

`PipelineDespliegue.ejecutar(trabajo)` carga el `ContextoDespliegue` y recorre los pasos del plan. Cada paso marca su etapa En curso → Completada / Fallida y registra la duración; un error de dominio corta el recorrido y lleva el despliegue a Fallido.

| Plan | Pasos |
|---|---|
| `construccion` | `PasoRecepcion` → `PasoConstruccion` → `PasoEjecucion` → `PasoEnrutamiento` → `PasoOperacion` |
| `reversion` (change M5-04) | Recepción y Construcción `omitida` → `PasoEjecucion` → `PasoEnrutamiento` → `PasoOperacion` |

| Estado | Etapa en curso |
|---|---|
| encolado | — (todas pendientes) |
| construyendo | recepción, luego construcción |
| aprovisionando | ejecución (contenedor + salud) |
| publicando | enrutamiento |
| saludable | operación completada |

### 3. Firma única de los puertos (cierra C1, C2, B6)

```ts
// apps/api/src/compartido/reloj.ts
export abstract class Reloj { abstract ahora(): Date; }

// M4
export abstract class ColaConstruccionPuerto {
  abstract encolar(trabajo: TrabajoDespliegue): Promise<void>;
}
export abstract class ClonadorRepositorioPuerto {
  abstract clonar(s: { url: string; rama: string; commitSha?: string; destino: string }): Promise<CommitClonado>;
}
export abstract class ConstructorImagenPuerto {
  // lanza ConstruccionFallida(codigoSalida, detalle) o TiempoConstruccionAgotado
  abstract construir(
    s: { directorio: string; rutaDockerfile: string; etiqueta: string; tiempoMaximoMs: number },
    alLinea: (texto: string) => void,
  ): Promise<{ digest: string; tamanoBytes: number }>;
}
export abstract class RepositorioDespliegues {
  abstract crear(nuevo: NuevoDespliegue): Promise<Despliegue>;             // numero = max + 1 en transacción
  abstract porId(id: string): Promise<Despliegue | null>;
  abstract cambiarEstado(id: string, estado: EstadoDespliegue, cambios?: CambiosDespliegue): Promise<void>;
  abstract marcarEtapa(id: string, etapa: Etapa, estado: EstadoEtapa, marca: Date): Promise<void>;
  abstract agregarLineas(id: string, lineas: LineaNueva[]): Promise<void>;
  abstract lineasDesde(id: string, desde: number, limite: number): Promise<LineaBitacora[]>;
}
export abstract class RepositorioArtefactos {
  abstract registrar(a: NuevoArtefacto): Promise<Artefacto>;
}

// M5
export abstract class ContenedorPuerto {
  abstract crear(e: {
    nombre: string; imagen: string; red: string; puertoInterno: number;
    cpus: number; memoriaMb: number; variables: Record<string, string>;
  }): Promise<{ id: string; host: string }>;
  abstract detener(contenedorId: string): Promise<void>;
  abstract eliminar(contenedorId: string): Promise<void>;
}
export abstract class VerificacionEntornoPuerto {
  abstract saludable(o: { host: string; puerto: number; ruta: string; tiempoMaximoMs: number }):
    Promise<{ ok: boolean; estadoHttp: number | null; milisegundos: number; detalle: string }>;
}

// M6
export abstract class EnrutamientoPuerto {
  abstract publicar(r: { subdominio: string; host: string; puerto: number }): Promise<{ url: string }>;
  abstract retirar(subdominio: string): Promise<void>;
}
```

`ContenedorPuerto.crear` deja de recibir `{ imagen, cpu, memoriaMb }` y `saludable(contenedorId)` pasa a recibir el objetivo HTTP: se cambian los stubs y el diagrama en este mismo change. `reiniciar` y `eliminarImagen` se agregan con M5-02 y M5-04.

### 4. Un solo punto de binding (cierra C3)

`AdaptersModule.forRoot()` lee `MOTOR_ADAPTADORES=docker|stub`. `docker` en compose y en el VPS; `stub` en pruebas y en el smoke de CI si no hay socket. Los stubs viven junto a su puerto y se usan en las pruebas unitarias.

### 5. Construcción con dockerode

`ClonadorGit` usa `git clone --depth 1 --branch <rama>` con `execFile` (sin shell, argumentos como lista) en `/tmp/deploya/<despliegueId>` y lo borra al terminar. `ConstructorDocker` empaqueta el directorio con `tar-fs`, llama a `buildImage` con `t: deploya/<subdominio>:<n>` y `dockerfile: rutaDockerfile`, sigue el stream (`stream` → `alLinea`, `errorDetail.code` → `ConstruccionFallida`), aborta con `AbortController` a los 10 min y lee digest y tamaño con `getImage().inspect()`.

### 6. Contenedor y salud

`ContenedorDocker` asegura la red `deploya-p-<subdominio>`, conecta `TRAEFIK_CONTENEDOR` y `TRABAJADOR_CONTENEDOR`, y crea `deploya-<subdominio>-<n>` con `NanoCpus = cpus × 1e9`, `Memory = MemorySwap = memoriaMb × 2^20`, `CapDrop: ["ALL"]`, `SecurityOpt: ["no-new-privileges"]`, `RestartPolicy: unless-stopped`, `PORT` y las variables descifradas. `VerificacionHttp` hace `GET http://<nombre>:<puerto>/` cada 1 s hasta 60 s; cualquier estado < 500 es salud. `Reloj` y la espera se inyectan para probar sin tiempo real.

### 7. Enrutamiento local ([ADR 0005](../../../docs/adr/0005-traefik-proveedor-de-archivo.md))

`EnrutamientoTraefikArchivo` escribe `${TRAEFIK_DINAMICO}/<subdominio>.yml` de forma atómica (archivo temporal + `rename`). URL = `${ESQUEMA_APPS}://<subdominio>.${DOMINIO_APPS}` (`http` y `localhost` en compose).

### 8. Bitácora por lotes ([ADR 0006](../../../docs/adr/0006-polling-en-vez-de-websocket.md))

`BitacoraEnLotes` junta líneas y las persiste cada 500 ms o 50 líneas; `n` lo asigna el worker en memoria (un solo worker por despliegue). Las líneas de más de 4 000 caracteres se cortan.

### 9. Constantes (sin números mágicos)

`motor.constantes.ts`: `TIEMPO_MAXIMO_CONSTRUCCION_MS = 600_000`, `TIEMPO_MAXIMO_SALUD_MS = 60_000`, `INTERVALO_SALUD_MS = 1_000`, `LINEAS_POR_PAGINA = 500`, `LOTE_BITACORA_MS = 500`, `LOTE_BITACORA_LINEAS = 50`, `PUERTO_POR_DEFECTO = 8080`.

### 10. Errores de dominio → HTTP

| Error | HTTP |
|---|---|
| `DespliegueNoEncontrado`, `ProyectoNoEncontrado` (o ajeno) | 404 |
| `TransicionInvalida` | 409 |
| `ConstruccionFallida`, `TiempoConstruccionAgotado`, `ClonFallido`, `DockerfileAusente`, `SaludNoAlcanzada` | no salen por HTTP: dejan el despliegue Fallido con `codigoSalida` y `motivoFallo` |

## Diseño: SOLID y patrones

| Clase / puerto | Patrón | Principio | Por qué |
|---|---|---|---|
| `ConstruccionService` | Facade | S, I | Única puerta que exporta M4 a M3 y a la web; oculta cola, repositorio y política |
| `TransicionesDespliegue` | State (función pura) | S | Una sola fuente de verdad de estados; se prueba sin Nest |
| `PipelineDespliegue` + `PasoPipeline` | Chain of Responsibility / Template Method | O, S | Cada etapa es una clase; la reversión es otra lista de pasos, sin `if` por tipo |
| `TrabajoDespliegue` | Command | D | Trabajo serializable; la cola no conoce la lógica |
| `ColaConstruccionPuerto` → `ColaBullMq` | Adapter, productor / consumidor | D | La API no conoce BullMQ |
| `ClonadorRepositorioPuerto`, `ConstructorImagenPuerto`, `ContenedorPuerto`, `VerificacionEntornoPuerto`, `EnrutamientoPuerto` | Adapter | D, I | Git, dockerode, HTTP y Traefik detrás de puertos estrechos |
| `RepositorioDespliegues` → Prisma / memoria | Repository | D, L | Mismo contrato para producción y pruebas |
| `DespliegueTerminado` | Observer | S | La operación no conoce a quien reacciona (retención en M5-04; M10 si algún día hay correo) (cierra B4) |
| `AdaptersModule.forRoot()` | Factory | O | Stub o real se elige en un solo lugar (cierra C3) |
| `Reloj` | Inyección de dependencias | D | Sin `Date.now()` en dominio ni servicios |

Cambios a puertos, clases y estados: todos reflejados en `clases-unificado.mmd` y `erd-unificado.mmd` en este change.

## Risks / Trade-offs

- **DB-01 llega el lunes 12:00.** Mitigación: `RepositorioDesplieguesMemoria` para pruebas y desarrollo del pipeline; el adaptador Prisma se escribe contra [datos-nucleo.md](../../../docs/contratos/datos-nucleo.md) y se conecta al entrar el schema.
- **`cuotaDe` llega el lunes.** Mitigación: `CuotaStub` con la fila Sandbox del seed en pruebas; nunca constantes en el servicio.
- **`docker.sock` = root en el nodo.** Aceptado y documentado en ADR 0002; solo el worker lo monta.
- **Smoke de CI con Docker-in-Docker.** El runner de GitHub trae Docker; si el build de ejemplo tarda, el smoke solo verifica `health` y el despliegue real se prueba en el ensayo.
- **La pantalla 12b muestra la salud en Operación.** Aquí la salud se verifica en Ejecución, antes de publicar, que es lo que permite conmutar sin corte; en Operación la bitácora registra «contenedor #n-1 detenido · #n atiende el tráfico».

## Open Questions

- Hash de contraseña del seed (lo decide Eddy; no bloquea el motor).
- ¿El smoke de CI levanta el despliegue real de `hola-deploya`? Propuesta: no en el Avance 1; sí en QA-01.
