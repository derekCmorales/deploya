# Design

## Context

El ciclo §4.4 ya tiene una tarea diaria en BullMQ (`cola-ciclo.bullmq.ts`, `upsertJobScheduler`) y un endpoint de admin para correrla a mano. Las tablas a limpiar ya tienen las columnas de fecha (`expira`, `usadoEn`, `ultimaActividad`, `revocadaEn`, `vence`, `revocada`).

## Decisions

### 1. Misma forma que el ciclo

Cola propia (`limpieza`), programador repetible y endpoint de admin. Quien conoce el ciclo conoce esto.

### 2. Los plazos los decide el dominio

`PoliticaLimpieza` calcula las tres fechas de corte desde `Reloj.ahora()`. El adaptador solo recibe fechas y hace `deleteMany`; no sabe de reglas.

### 3. El registro va en su propio puerto

`RegistroLimpiezaPuerto` (`guardar`, `ultima`) escribe `ultimaLimpieza` y `filasLimpiadas` en `ConfiguracionInstalacion`. No se agranda `RepositorioConfiguracionInstalacion`, que ya usan M1 y M2 (I). En la nube la fila no existía: el `upsert` la crea solo con estas dos columnas, y el resto queda en sus valores por defecto. La tarea corre en los dos modos; 32 sigue siendo solo de autoalojado.

### 4. Un adaptador para tres tablas de dos módulos

La purga es mantenimiento de infraestructura, no una regla de M1. El puerto vive en M9 y el adaptador Prisma toca las tres tablas; M1 no cambia. Se avisa a Eddy porque son sus tablas.

## Diseño: SOLID y patrones

| Clase / puerto | Patrón | Principio | Por qué |
|---|---|---|---|
| `PoliticaLimpieza` | Policy (regla pura) | S | Fechas de corte sin base ni reloj |
| `LimpiezaService` | Service Layer | S | Orquesta política, puerto y registro |
| `PurgaDatosVencidosPuerto` | Puerto (abstract class) | D, I | Tres métodos estrechos; doble en memoria para las pruebas |
| `PurgaDatosVencidosPrisma` | Adapter / Repository | L | Mismo contrato que el doble |
| `RegistroLimpiezaPuerto` / `RegistroLimpiezaPrisma` | Puerto + Adapter | I, D | Última corrida en `ConfiguracionInstalacion` sin tocar el repositorio de M2 |
| `ColaLimpiezaBullMq` / `ColaLimpiezaMemoria` | Adapter | D, L | Igual que `ColaCicloBullMq`; la memoria deja disparar la corrida en las pruebas |
| `TareaLimpiezaDiaria` | Scheduler (hook de Nest) | S | Programa al arrancar el trabajador y solo delega en el servicio |

Cambios de clases y puertos → `docs/diagramas/compartido/clases-unificado.mmd` en el mismo PR (`pnpm diagramas:sync`).

## Risks / Trade-offs

- Borrar sesiones viejas quita el historial de «Sesiones» de 05b más allá de 14 días; 05b solo muestra las vigentes, así que no se nota.
