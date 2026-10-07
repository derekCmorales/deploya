# Design

## Context

`VariableEntorno { proyectoId, clave, valorCifrado, actualizado }` con `@@unique([proyectoId, clave])` ya existe. [datos-nucleo.md](../../../docs/contratos/datos-nucleo.md) fija AES-256-GCM y el formato `v1:<iv>:<tag>:<cifrado>`. `OrquestacionService.aprovisionar` ya recibe `variables: Record<string, string>`; hoy `PasoEjecucion` le pasa `{}`. La pantalla 17 vive en el layout del proyecto que crea `feat/m7-vista-despliegue`.

## Goals / Non-Goals

**Goals:** valores nunca en claro en la base, en logs ni en la bitácora; los cambios aplican en el próximo despliegue; el contenedor recibe las variables descifradas.

**Non-Goals:** entornos, importación, rotación (ver proposal).

## Decisions

1. **Reemplazo del conjunto, no CRUD por variable.** La pantalla 17 edita en borrador y guarda todo junto («2 cambios sin aplicar»). `PUT` con el conjunto completo hace una transacción: inserta, actualiza y borra lo que falta. Una entrada sin `valor` conserva el cifrado actual (así la web no necesita conocer valores que nunca mostró).
2. **IV aleatorio de 12 bytes por valor**; la etiqueta GCM detecta manipulación: descifrar un valor alterado lanza `VariableIlegible`, y el despliegue falla con ese motivo en vez de arrancar con basura.
3. **Descifrar solo en el trabajador**, justo antes de crear el contenedor, a través de `VariablesEntornoPuerto`. La API descifra únicamente para «Mostrar», y solo para el dueño.
4. **`PORT` reservada:** el motor la inyecta con `puertoInterno`; si el cliente la escribe, se rechaza con `ClaveReservada`.
5. **Constantes con nombre:** `MAXIMO_VARIABLES = 50`, `MAXIMO_BYTES_VALOR = 4096`, `MAXIMO_LARGO_CLAVE = 128`.

## Diseño: SOLID y patrones

| Clase / puerto | Patrón | Principio | Por qué |
|---|---|---|---|
| `CifradorVariables` → `CifradorAesGcm`, `CifradorFalso` | Adapter / Strategy | D, L | El servicio no conoce `node:crypto`; las pruebas usan un cifrador reversible trivial con el mismo contrato |
| `ClaveVariable`, `ConjuntoVariables` | Value Object | S | Validación en el dominio; el controlador solo adapta |
| `RepositorioVariables` | Repository | D, I | `deProyecto`, `reemplazar` (transaccional), `valorCifrado` |
| `VariablesProyectoService` (M3, exportado) | Facade | I | M5 ve un solo método: `descifradasDe(proyectoId)` |
| `VariablesEntornoPuerto` (M5) | Port + Adapter sobre M3 | D | El motor no importa servicios internos de M3 |

Cambios para `clases-unificado.mmd`: las cinco piezas anteriores y el uso en `PasoEjecucion`.

## Risks / Trade-offs

- **Perder `CLAVE_CIFRADO_VARIABLES` deja ilegibles todas las variables.** Se documenta en el README de compose y en el manual técnico; en el VPS va en el gestor de secretos.
- **Valor visible con «Mostrar»:** solo el dueño, con sesión, y la web lo oculta otra vez al salir de la pestaña.

## Open Questions

- ¿Guardar y desplegar cuando hay un despliegue en curso? Propuesta: se guarda y se encola uno nuevo; el motor ya procesa en orden.
