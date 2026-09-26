# Adaptadores del motor (Derek)

La API no llama a Docker ni al enrutador de borde: los servicios dependen de estos puertos (`abstract class`, sin `I`) y `adapters.module.ts` decide qué implementación se inyecta.

| Puerto | Hoy | Llega en |
|---|---|---|
| `ContenedorPuerto` | `ContenedorStub` | M5-01: adaptador dockerode con límites del plan |
| `VerificacionEntornoPuerto` | `VerificacionEntornoStub` | M5-01: salud HTTP |
| `EnrutamientoPuerto` | `EnrutamientoStub` | M6-01: etiquetas de Traefik |
| Cola de construcción | `ColaConstruccionStub` (sin puerto todavía) | M4-01: `ColaConstruccionPuerto` + BullMQ |

Los stubs se quedan para las pruebas unitarias; el binding stub/real se cambia solo aquí. Pendientes de diseño: [AUDITORIA_SOLID_CLEAN.md](../../../../docs/AUDITORIA_SOLID_CLEAN.md) (C1–C3).
