# Tasks

Requiere M4-03 en `main` (ya está). Todo el código es de M4 (`construccion/`); M3 no cambia. Pruebas sin Docker ni red.

## 1. Patrón Decorator (dominio puro, `construccion/deteccion/`)

- [x] 1.1 `dockerfile-receta.ts`: interfaz `DockerfileReceta`, `DockerfileBase` y `textoDockerfile`; verificar con `dockerfile-receta.spec.ts` (la base devuelve sus líneas y su nombre; el texto termina en salto de línea)
- [x] 1.2 `capas/decorador-dockerfile.ts` (`DecoradorDockerfile` abstracto, campo `wrappee`) y `capas/con-puerto-deploya.ts`, `capas/con-usuario-sin-privilegios.ts`, `capas/con-etiqueta.ts`; verificar con `capas/capas.spec.ts`: cada decorador delega y agrega al final, se pueden apilar, la misma capa se aplica dos veces, y «Un valor de etiqueta con comillas»
- [x] 1.3 `capas/capas-comunes.ts` (`capasComunes`) y `capas/etiquetas-despliegue.ts` (`etiquetasDelDespliegue`, claves como constantes); verificar en `capas.spec.ts` el orden puerto → usuario → etiquetas y que sin `usuarioFinal` no se agrega `USER`

## 2. Recetas y servicio

- [x] 2.1 `plantillas.ts` devuelve `string[]` sin `ENV PORT`, `EXPOSE` ni `USER` final; cada receta declara `usuarioFinal` y su `dockerfile()` devuelve `DockerfileBase` (`RecetaDockerfile` sigue en `null`); `RecetaStack` cambia el tipo
- [x] 2.2 `DeteccionStackService` aplica `capasComunes` y `ResultadoDeteccion.dockerfile` pasa a `DockerfileReceta | null`
- [x] 2.3 Ajustar `deteccion-stack.service.spec.ts` (usa `textoDockerfile`) y agregar «Capas comunes en una receta», «El sitio estático no termina como root» y «Node no recibe un usuario extra»; la prueba de plantillas confirma `PORT` y `EXPOSE` una sola vez y que la última instrucción `USER` no es `root`

## 3. Trabajador

- [x] 3.1 `PasoRecepcion` agrega las etiquetas, escribe `textoDockerfile(plan)` y registra «Capas: …»; con `Dockerfile` propio no escribe la línea
- [x] 3.2 En `pipeline-despliegue.spec.ts`: «Etiquetas del despliegue», «Las capas en la bitácora» y «El Dockerfile propio no se decora», con los stubs de clon y constructor

## 4. Documentación y diagramas

- [x] 4.1 `docs/diagramas/m1-m10/m4-clases-capas-dockerfile.mmd` con el diagrama de `design.md`; fila en `docs/diagramas/m1-m10/README.md`
- [x] 4.2 `clases-unificado.mmd`: clases nuevas, `RecetaStack.usuarioFinal` y el tipo de `dockerfile()`; `pnpm diagramas:sync` y `pnpm validate:mermaid` en verde
- [x] 4.3 `docs/contratos/despliegues.md`: tipo de `ResultadoDeteccion.dockerfile` y fila v3.4 en el historial; patrón Decorator de M4 en `docs/ingenieria.md` §4

## 5. Cierre

- [ ] 5.1 `pnpm test` en verde y cobertura ≥ 80 % en `construccion/deteccion` (`pnpm test:cov`)
- [ ] 5.2 `pnpm check` en verde (pruebas, build y diagramas)

> Estado al 2026-10-23: cobertura de `construccion/deteccion` 98,8 % de líneas (`capas/` 100 %), y `pnpm build` y `pnpm validate:mermaid` en verde. `pnpm test` da 885/886: falla `adapters/reales/clonador-git.spec.ts` («cancelar mata el grupo de procesos…»), que usa procesos reales y **también falla en `main` sin este change**. Queda pendiente aparte; 5.1 y 5.2 se marcan cuando esa prueba pase.
