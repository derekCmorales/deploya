# Contrato · Métricas, tiempos y ritmo (M5, M4 → M7 → web)

Versión 1.1 · 2026-10-21 · dueños: Derek (muestreo M5 y tiempos M4), Eduardo (lectura M7 y web) · consumidores: Eduardo (16, 13c, 14c, 08c, 27). Cambiarlo exige avisar antes de mergear. Changes: `feat-m5-muestreo-metricas`, `feat-m7-metricas`, `feat-m7-tiempo-por-etapa`, `feat-m7-ritmo-construcciones`, `feat-m9-infraestructura`. Specs: [orquestacion](../../openspec/specs/orquestacion/spec.md), [observabilidad](../../openspec/specs/observabilidad/spec.md). Datos: [datos-nucleo.md § versión 2](datos-nucleo.md#sprint-fuera-de-alcance--versión-2).

## Muestreo (M5, trabajador)

```ts
export abstract class MetricasContenedorPuerto {          // adaptador: MetricasDockerStats
  abstract muestra(contenedorId: string): Promise<{ cpu: number; memoriaMb: number }>;
}
export abstract class MuestrasMetricas {                   // Prisma y memoria
  abstract guardar(m: { despliegueId: string; tomada: Date; cpu: number; memoriaMb: number }): Promise<void>;
  abstract deProyecto(proyectoId: string, desde: Date): Promise<Muestra[]>;
  abstract purgarAntesDe(fecha: Date): Promise<number>;
}
```

- `MuestreoMetricas` corre cada **60 s** en el trabajador (`CADA_MS_MUESTREO = 60_000`), solo para el despliegue activo **Saludable** de cada proyecto. Detenido o en curso no se muestrea.
- Mide en lotes de **5** contenedores a la vez (`CONTENEDORES_EN_PARALELO`): un contenedor colgado o ilegible no frena al resto ni hace que el tick pase de 60 s.
- Purga lo de más de **24 h** (`RETENCION_MUESTRAS_MS`). Reloj inyectado.

## Lectura (M7)

```http
GET /proyectos/:id/metricas?rango=1h|24h
200 {
  "limite": { "cpu": 0.5, "memoriaMb": 512 },
  "serie": [{ "en": "2026-10-20T17:30:00Z", "cpu": 0.12, "memoriaMb": 430 }],   // 1h: por minuto · 24h: promedio de cada cubo de 30 min
  "pico": {                                                                      // máximo de las muestras crudas de la ventana (no de los promedios)
    "cpu": { "valor": 0.27, "en": "2026-10-20T03:30:20Z" },
    "memoriaMb": { "valor": 452, "en": "2026-10-20T14:00:40Z" }
  },
  "aviso": null,                                                                 // "El contenedor no está corriendo" si no corre
  "despliegues": [{ "en": "2026-10-20T12:06:23Z", "version": 14 }],              // los que entraron en la ventana: chips de la gráfica
  "promedioPorVersion": [{ "version": 13, "memoriaMb": 328, "cpu": 0.08 }, { "version": 14, "memoriaMb": 417, "cpu": 0.10 }]
}
404 proyecto ajeno
```

- **Cubos de 24 h alineados.** Los 48 cubos van de 30 min y arrancan en :00 o :30 UTC. El último es el que contiene `ahora` (`inicio = floor(ahora / 30 min) × 30 min`, parcial hasta `ahora`) y los demás van hacia atrás; el primero empieza 23,5 h antes del último. `serie[].en` es el inicio del cubo, así que la gráfica no se corre entre peticiones. Un cubo sin muestras no entra (no se rellena con 0). La ventana de 24 h (serie, `pico`, `despliegues`, `promedioPorVersion`) empieza en el primer cubo. En 1 h, `en` es el minuto truncado y la ventana son los 60 min previos.
- **`pico`.** CPU y memoria se calculan por separado sobre las muestras crudas (una por minuto) de la ventana del rango; `en` es la hora de esa muestra. En un empate gana la más antigua. Va `{ "cpu": null, "memoriaMb": null }` si no hay muestras o si el despliegue activo no está Saludable.
- **`aviso`.** `"El contenedor no está corriendo"` cuando no hay despliegue activo o no está Saludable (`serie` y `pico` van vacíos); `null` si corre, aunque todavía no haya muestras.

`limite` sale de `CuotaPlanPuerto` en la nube y de `LimitesDeInstalacion` en autoalojado ([instalacion.md](instalacion.md)).

## Tiempo por etapa (M4 → M7)

```ts
// M4 · Derek: lee EtapaDespliegue (iniciada/terminada), no agrega tablas
RepositorioDespliegues.tiemposDe(proyectoId: string, ultimos: number): Promise<TiemposDespliegue[]>
```

```http
GET /proyectos/:id/despliegues/tiempos?ultimos=14
200 [{ "numero": 14, "creado": "…", "estado": "saludable", "reversion": false,
       "etapas": { "recepcion": 1400, "construccion": 112000, "ejecucion": 21000, "enrutamiento": 9000, "operacion": 17600 },
       "falloEn": null }]                               // ms; etapa omitida = 0; falloEn = etapa donde terminó un Fallido
```

## Ritmo de construcciones (M7, amplía M7-03)

```http
GET /observabilidad/consumo/diario
200 { "desde": "2026-10-01", "reinicia": "2026-11-01", "cuota": 150, "diarios": [6, 4, 2, …] }   // mes calendario UTC, igual que el bloqueo (I7)
```

La proyección (`acumulado / díasTranscurridos × díasDelMes`) se calcula en la web con una función pura; la reversión no cuenta.

## Infraestructura (si da tiempo, M9)

```ts
export abstract class MetricasNodoPuerto { abstract nodo(): Promise<{ cpu: { usado; total }; memoriaMb: { usado; total }; discoGb: { usado; total } }>; }
```

`GET /admin/infraestructura` → nodo, cola de BullMQ (`enEspera`, `enCurso`, `fallidas24h`) y la última muestra por entorno. Solo Administrador.

## Historial

| Versión | Fecha | Cambio |
|---|---|---|
| 1 | 2026-10-20 | Sprint fuera de alcance (SP-07, SP-10, SP-11, SP-13, SP-14, SP-15) |
| 1.1 | 2026-10-21 | SP-07: pico, aviso y cubos alineados a :00/:30; aditivo, Eduardo avisado |
