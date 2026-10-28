# Design

## Context

El ciclo §4.4 ya tiene una tarea diaria en BullMQ (`cola-ciclo.bullmq.ts`, `upsertJobScheduler`) y un endpoint de admin para correrla a mano. Las tablas a limpiar ya tienen las columnas de fecha (`expira`, `usadoEn`, `ultimaActividad`, `revocadaEn`, `vence`, `revocada`).

## Decisions

### 1. Misma forma que el ciclo

Cola propia (`limpieza`), programador repetible y endpoint de admin. Quien conoce el ciclo conoce esto.

### 2. Los plazos los decide el dominio

`PoliticaLimpieza` calcula las tres fechas de corte desde `Reloj.ahora()`. El adaptador solo recibe fechas y hace `deleteMany`; no sabe de reglas.

### 3. Un adaptador para tres tablas de dos módulos

La purga es mantenimiento de infraestructura, no una regla de M1. El puerto vive en M9 y el adaptador Prisma toca las tres tablas; M1 no cambia. Se avisa a Eddy porque son sus tablas.

## Diseño: SOLID y patrones

| Clase / puerto | Patrón | Principio | Por qué |
|---|---|---|---|
| `PoliticaLimpieza` | Policy (regla pura) | S | Fechas de corte sin base ni reloj |
| `LimpiezaService` | Service Layer | S | Orquesta política, puerto y registro |
| `PurgaDatosVencidosPuerto` | Puerto (abstract class) | D, I | Tres métodos estrechos; doble en memoria para las pruebas |
| `PurgaDatosVencidosPrisma` | Adapter / Repository | L | Mismo contrato que el doble |
| `ColaLimpiezaBullmq` | Adapter | D | Igual que `ColaCicloBullmq` |

Cambios de clases y puertos → `docs/diagramas/compartido/clases-unificado.mmd` en el mismo PR (`pnpm diagramas:sync`).

## Risks / Trade-offs

- Borrar sesiones viejas quita el historial de «Sesiones» de 05b más allá de 14 días; 05b solo muestra las vigentes, así que no se nota.
