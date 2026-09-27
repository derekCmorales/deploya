# Adaptadores del motor (Derek)

La API no llama a Docker ni al enrutador de borde: los servicios dependen de puertos (`abstract class`, sin `I`, definidos en `modules/<modulo>/puertos/`) y `adapters.module.ts` es **el único lugar** que decide qué implementación se inyecta (cierra C3).

- `AdaptersModule.paraApi()` — proceso API: cola, persistencia y reloj. Nunca recibe adaptadores de Docker.
- `AdaptersModule.paraTrabajador()` — proceso worker (`node dist/trabajador.js`): además clonar, construir, contenedores, salud y rutas.
- `MOTOR_ADAPTADORES=docker` elige los reales; cualquier otro valor (o ninguno) elige stubs. Pruebas y CI usan stubs.

| Puerto | Real (`reales/`) | Stub / memoria | Módulo |
|---|---|---|---|
| `ColaConstruccionPuerto` | `ColaBullMq` (cola `despliegues`) | `ColaMemoria` | M4 |
| `ClonadorRepositorioPuerto` | `ClonadorGit` (`execFile`, solo https públicos) | `ClonadorStub` | M4 |
| `ConstructorImagenPuerto` | `ConstructorDocker` (dockerode, 10 min) | `ConstructorImagenStub` | M4 |
| `RepositorioDespliegues`, `RepositorioArtefactos` | Prisma **cuando DB-01 esté en `main`** | `*Memoria` | M4 |
| `ProyectosLecturaPuerto` | sobre lo que exporte M3 (Eduardo) | `ProyectosLecturaMemoria` | M4 |
| `ContenedorPuerto` | `ContenedorDocker` (límites, `CapDrop ALL`, red por proyecto) | `ContenedorStub` | M5 |
| `VerificacionEntornoPuerto` | `VerificacionHttp` (cada 1 s, máx. 60 s) | `VerificacionEntornoStub` | M5 |
| `CuotaPlanPuerto` | sobre `cuotaDe` de M2 (Javier) | `CuotaPlanStub` (Sandbox) | M5 |
| `EnrutamientoPuerto` | `EnrutamientoTraefikArchivo` (ADR 0005) | `EnrutamientoStub` | M6 |

Los stubs cumplen el mismo contrato que los reales (LSP) y se usan en las pruebas unitarias (`src/pruebas/motor.ts`).

**Pendiente de otros equipos:** mientras DB-01 (Prisma), `cuotaDe` (M2) y el alta de M3 no estén en `main`, despliegues, artefactos y proyectos viven en memoria **dentro de cada proceso**. La API y el worker no comparten estado todavía, así que el recorrido completo en compose espera al adaptador Prisma (tarea 4.3 del change).
