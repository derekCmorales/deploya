# Design

## Context

`PlantillaCorreo` ya es un Template Method con verificación y recuperación. El pipeline ya anuncia `DespliegueTerminado` a los `OyenteDespliegue` registrados (retención de artefactos). `CicloSuscripcionService` ya calcula las transiciones con `PoliticaCiclo`.

## Decisions

### 1. Un oyente más, no un `if` en el pipeline

`AvisoDespliegueOyente` implementa `OyenteDespliegue` y filtra Saludable/Fallido; el pipeline no cambia.

### 2. Avisar solo en la transición

El ciclo compara el estado anterior con el nuevo; solo si cambia llama al puerto. Así la tarea diaria es idempotente también para correos.

### 2b. Un módulo propio para los avisos

`AvisosCorreo` necesita el correo del titular, que es de M1 (regla 1 de `datos-nucleo.md`: se lee por el servicio que exporta el dueño). `IdentidadModule` ya importa `NotificacionesModule` para el correo de verificación, así que el puerto no puede salir de `NotificacionesModule` sin un ciclo. `AvisosModule` importa los dos y exporta `AvisosPuerto`; lo importan `ConstruccionTrabajadorModule` (M4) y el módulo del ciclo (M2), que no son importados por identidad. M10 define `DestinatariosPuerto`; `DestinatariosDeIdentidad` lo implementa sobre `DirectorioCuentas`.

### 2c. El esqueleto de 24 gana ganchos opcionales

`PlantillaCorreo` suma ganchos con valor por defecto vacío (`etiqueta`, `estado`, `notas`, `detalles`, `lineas`) para lo que 24b agrega: rótulo, «5 / 5 · Saludable», filas «Versión / Duración / URL», párrafo de lo que se conserva y las últimas líneas de la bitácora. Verificación y recuperación no los usan y salen igual que antes.

### 3. Nunca romper a quien avisa

`AvisosCorreo` atrapa el error de `CorreoPuerto`, lo registra y resuelve. En autoalojado sin SMTP, el adaptador de consola (ADR 0001).

## Diseño: SOLID y patrones

| Clase / puerto | Patrón | Principio | Por qué |
|---|---|---|---|
| `AvisosPuerto` / `AvisosCorreo` | Adapter + Facade | D, I | Quien avisa no sabe de SMTP ni de plantillas |
| `DestinatariosPuerto` / `DestinatariosDeIdentidad` | Adapter | D | M10 no conoce `Usuario`; lee por `DirectorioCuentas` de M1 |
| `AvisoDespliegueOyente` | Observer | O | Se agrega sin tocar el pipeline |
| `Plantilla*` | Template Method | S, O | Cada plantilla define asunto, cuerpo y enlace |
| `CicloSuscripcionService` | State (ya existe) | S | El aviso sale de la transición |

Cambios de clases y puertos: `AvisosPuerto`, `AvisosCorreo`, `DestinatariosPuerto`, `DestinatariosDeIdentidad`, `DirectorioCuentas` (M1), `AvisoDespliegueOyente`, cuatro `Plantilla*` → `docs/diagramas/compartido/clases-unificado.mmd` en el mismo PR (`pnpm diagramas:sync`).

## Risks / Trade-offs

- **Correo masivo:** muchos despliegues seguidos mandan muchos correos; aceptable en el alcance (un correo por despliegue terminado).
- **Entregabilidad:** SPF y DKIM ya están en el VPS (M6-02).
