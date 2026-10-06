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
| `ColaOperacionPuerto` | `ColaOperacionBullMq` (cola `operacion`, 3 reintentos) | `ColaOperacionMemoria` | M5 |
| `LectorFuente` (trabajador) | `LectorFuenteLocal` vía `ClonadorGit.lector` | `LectorFuenteMemoria` | M4 |
| `RepositorioDespliegues`, `RepositorioArtefactos` | `*Prisma` | `*Memoria` | M4 |
| `ProyectosLecturaPuerto` | `RepositorioProyectosPrisma` (el mismo almacén de M3) | `ProyectosLecturaMemoria` | M4 |
| `RecetaProyectoPuerto` | `RecetaProyectoPrisma` (`Proyecto.receta`) | `RecetaProyectoMemoria` | M4 |
| `ContenedorPuerto` | `ContenedorDocker` (límites, `CapDrop ALL`, red por proyecto) | `ContenedorStub` | M5 |
| `VerificacionEntornoPuerto` | `VerificacionHttp` (cada 1 s, máx. 60 s) | `VerificacionEntornoStub` | M5 |
| `CuotaPlanPuerto` | `CuotaPlanSuscripciones` sobre `cuotaDe` de M2 (en el módulo de M5) | `CuotaPlanStub` (Sandbox) | M5 |
| `VariablesEntornoPuerto` | `VariablesEntornoPendientes` (sin variables) hasta que M3-03 exporte `descifradasDe` | `VariablesEntornoStub` | M5 |
| `EnrutamientoPuerto` | `EnrutamientoTraefikArchivo` (ADR 0005) | `EnrutamientoStub` | M6 |

Los stubs cumplen el mismo contrato que los reales (LSP) y se usan en las pruebas unitarias (`src/pruebas/motor.ts`).

La API y el trabajador comparten despliegues, artefactos y proyectos por PostgreSQL (los repositorios en memoria quedan para las pruebas). **Pendiente de otros equipos:** el adaptador de `VariablesEntornoPuerto` sobre `VariablesProyectoService.descifradasDe` (M3-03, Eduardo).
