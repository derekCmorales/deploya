# Tasks

Requiere `feat/m4-motor-construccion` en `main` (ya está). Sin Docker, Redis ni Traefik reales en las unitarias.

## 1. Subdominio y conmutación (cierre de M6-01)

- [ ] 1.1 Pruebas de los escenarios que ya corren: «Publicación», «Renombrar no cambia la URL», «Nuevo despliegue», «Salud fallida no conmuta»
- [ ] 1.2 Recorrido desde la API en compose: alta → `hola-deploya.localhost` responde (tarea 8.2 de `feat/m4-motor-construccion`)

## 2. Puertos y cola

- [ ] 2.1 `AccionContenedor`, `ColaOperacionPuerto`, `ColaOperacionBullmq`, `ColaOperacionMemoria`; `ContenedorPuerto.iniciar` y `eliminarImagenesDe` (dockerode y stub)
- [ ] 2.2 Pruebas: la cola en memoria entrega en orden; los stubs cumplen el contrato (L)

## 3. Servicio y trabajador

- [ ] 3.1 `AccionesContenedorService` y sus tres manejadores; registro en `trabajador.ts`
- [ ] 3.2 Pruebas: «Detener», «Reiniciar», «Reiniciar un proyecto detenido», «Reinicio que no pasa la salud», «Eliminar borra contenedor, imágenes y ruta», eliminar dos veces no falla

## 4. API

- [ ] 4.1 `POST /proyectos/:id/reiniciar` y `/detener` con `SesionGuard`; errores `SinDespliegueActivo` y `AccionNoPermitida`; `ProyectosService.eliminar` encola `eliminar` (avisar a Eduardo)
- [ ] 4.2 Pruebas del controlador: 202, 404 de proyecto ajeno, «Sin despliegue activo» (409)

## 5. Web (con Eduardo)

- [ ] 5.1 «Reiniciar» y «Detener» en 12b; deshabilitados mientras el despliegue está en curso
- [ ] 5.2 Revisión contra el artboard 12b

## 6. Cierre

- [ ] 6.1 `clases-unificado.mmd`, `m4-m5-m6-estados-despliegue.mmd` y `pnpm diagramas:sync`; contrato v2.1
- [ ] 6.2 `pnpm check` en verde; cobertura ≥ 80 % en `orquestacion/` y `enrutamiento/`
- [ ] 6.3 Demo en compose: detener → el subdominio deja de responder; reiniciar → vuelve; eliminar → `docker ps -a` y `docker images` sin restos
- [ ] 6.4 `/opsx-archive` después del merge (y marcar la tarea 7 de `feat/m3-eliminar-proyecto`)
