# Design

## Context

`PlantillaCorreo` ya es un Template Method con verificación y recuperación. El pipeline ya anuncia `DespliegueTerminado` a los `OyenteDespliegue` registrados (retención de artefactos). `CicloSuscripcionService` ya calcula las transiciones con `PoliticaCiclo`.

## Decisions

### 1. Un oyente más, no un `if` en el pipeline

`AvisoDespliegueOyente` implementa `OyenteDespliegue` y filtra Saludable/Fallido; el pipeline no cambia.

### 2. Avisar solo en la transición

El ciclo compara el estado anterior con el nuevo; solo si cambia llama al puerto. Así la tarea diaria es idempotente también para correos.

### 3. Nunca romper a quien avisa

`AvisosCorreo` atrapa el error de `CorreoPuerto`, lo registra y resuelve. En autoalojado sin SMTP, el adaptador de consola (ADR 0001).

## Diseño: SOLID y patrones

| Clase / puerto | Patrón | Principio | Por qué |
|---|---|---|---|
| `AvisosPuerto` / `AvisosCorreo` | Adapter + Facade | D, I | Quien avisa no sabe de SMTP ni de plantillas |
| `AvisoDespliegueOyente` | Observer | O | Se agrega sin tocar el pipeline |
| `Plantilla*` | Template Method | S, O | Cada plantilla define asunto, cuerpo y enlace |
| `CicloSuscripcionService` | State (ya existe) | S | El aviso sale de la transición |

Cambios de clases y puertos: `AvisosPuerto`, `AvisosCorreo`, `AvisoDespliegueOyente`, cuatro `Plantilla*` → `docs/diagramas/compartido/clases-unificado.mmd` en el mismo PR (`pnpm diagramas:sync`).

## Risks / Trade-offs

- **Correo masivo:** muchos despliegues seguidos mandan muchos correos; aceptable en el alcance (un correo por despliegue terminado).
- **Entregabilidad:** SPF y DKIM ya están en el VPS (M6-02).
