# Diagramas compartidos

Un solo artefacto por vista. Nadie duplica ERD ni C4 en su módulo.

| Archivo | Qué es |
|---|---|
| [c4-contexto.mmd](c4-contexto.mmd) | C4 nivel 1 — contexto |
| [c4-contenedores.mmd](c4-contenedores.mmd) | C4 nivel 2 — contenedores |
| [c4-componentes-motor.mmd](c4-componentes-motor.mmd) | C4 nivel 3 — motor M4–M6 |
| [erd-unificado.mmd](erd-unificado.mmd) | ERD único del núcleo; firmado en [contratos/datos-nucleo.md](../../contratos/datos-nucleo.md) |
| [clases-unificado.mmd](clases-unificado.mmd) | Clases únicas (puertos `abstract class` sin `I`, una sola firma) |
| [despliegue-infraestructura.mmd](despliegue-infraestructura.mmd) | Servicios de compose, redes por proyecto y volúmenes |
| [secuencia-recorrido-e2e.mmd](secuencia-recorrido-e2e.mmd) | Recorrido de punta a punta del Avance 1, módulo por módulo |

Desde 2026-09-27 el C4, el ERD y las clases están recortados al núcleo v4.1 ([alcance.md](../../alcance.md)), con detección de stack y reversión sin reconstruir dentro. Lo de la propuesta completa (M8, modelo de lenguaje, complementos, dominios, miembros, métricas) sigue en el historial de git.

Versión pulida: `ContenedorPuerto`, `EnrutamientoPuerto`, `VerificacionEntornoPuerto`, `PasarelaPago`, `ProveedorFuente`.
