# Tasks

Requiere `feat/m4-motor-construccion` en `main`. Pruebas sin Docker, red, base ni reloj reales.

## 1. Dominio

- [ ] 1.1 `TransicionesDespliegue` con `revirtiendo`; `PoliticaRetencion.aRetirar`; constante `ARTEFACTOS_RETENIDOS = 5`; errores `ArtefactoNoDisponible`, `ArtefactoYaActivo`, `DespliegueEnCurso`
- [ ] 1.2 Pruebas: transiciones de `revirtiendo`; «Retención de cinco»; «El activo nunca se retira»

## 2. Reversión

- [ ] 2.1 `ReversionService`, `AccionesController` (`POST /proyectos/:id/reversiones`, `GET /proyectos/:id/artefactos`), `PlanPipeline.reversion`
- [ ] 2.2 Pruebas: «Revertir a una versión disponible», «No consume construcciones», «Artefacto no disponible», «Artefacto ya activo», «Despliegue en curso», «Reversión que no pasa la salud»

## 3. Retención

- [ ] 3.1 `DespliegueTerminado`, `RetencionArtefactos`, `ContenedorPuerto.eliminarImagen` (real y stub), `RepositorioArtefactos.disponiblesDe` y `marcarNoDisponible`
- [ ] 3.2 Pruebas: la retención corre solo tras Saludable; un fallo al borrar una imagen no cambia el despliegue

## 4. Acciones de M4

- [ ] 4.1 «Redesplegar reconstruye» queda en `feat-m4-acciones-despliegue` (M4-02); aquí solo se comprueba que la reversión no pasa por `PasoConstruccion`

## 5. Web (Derek, A3)

- [ ] 5.1 `estados.ts` con `revirtiendo` (mismo tono que *Construyendo*); riel con etapas `omitida` en 12
- [ ] 5.2 En 14, por fila: «Revertir a esta versión» si el artefacto está `disponible` y no es el activo; «imagen retirada» deshabilitado si no; confirma con `Dialog` y lleva a 12 del despliegue nuevo
- [ ] 5.3 Pruebas `node --test`: `accionDeFila(fila)` (revertir, imagen retirada, versión activa)

## 6. Cierre

- [ ] 6.1 `pnpm check` en verde; cobertura ≥ 80 % en `orquestacion/`
- [ ] 6.2 En compose: tres despliegues de `hola-deploya`, revertir al primero en segundos y ver la app anterior
- [ ] 6.3 `pnpm diagramas:sync` si cambió `clases-unificado.mmd`
- [ ] 6.4 Quitar «Reversión instantánea» de *Fuera de alcance* en `openspec/specs/orquestacion/spec.md` y `motor-construccion/spec.md` al archivar; ADR 0004 a Aceptado
