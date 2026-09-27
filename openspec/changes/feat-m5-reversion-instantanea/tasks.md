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

- [ ] 4.1 Prueba del escenario «Redesplegar reconstruye» cuando llegue M4-02

## 5. Web (Eduardo, A3)

- [ ] 5.1 `estados.ts` con `revirtiendo`; acción «Revertir a esta versión» en 14; riel con etapas `omitida`

## 6. Cierre

- [ ] 6.1 `pnpm check` en verde; cobertura ≥ 80 % en `orquestacion/`
- [ ] 6.2 En compose: tres despliegues de `hola-deploya`, revertir al primero en segundos y ver la app anterior
- [ ] 6.3 Quitar «Reversión instantánea» de *Fuera de alcance* en `openspec/specs/orquestacion/spec.md` y `motor-construccion/spec.md` al archivar; ADR 0004 a Aceptado
