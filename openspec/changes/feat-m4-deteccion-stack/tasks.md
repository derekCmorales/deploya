# Tasks

Requiere `feat/m4-motor-construccion` en `main`. Pruebas con mapas de archivos en memoria; sin red ni Docker.

## 1. Recetas (dominio puro)

- [x] 1.1 `RecetaStack`, `MapaArchivos`, `RecetaDockerfile`, `RecetaNode`, `RecetaPython`, `RecetaGo`, `RecetaEstatica`, `plantillas.ts`, `StackNoReconocido`
- [x] 1.2 Pruebas: «El Dockerfile manda», «Proyecto Node sin Dockerfile», «Proyecto Python sin Dockerfile», «Proyecto Go sin Dockerfile», «Sitio estático», «Stack no reconocido», «Node sin script start»; cada plantilla contiene `PORT=8080` y un `USER` sin privilegios

## 2. Servicio y lectores

- [x] 2.1 `DeteccionStackService` + provider `RECETAS_STACK`; `LectorFuente` y `LectorFuenteLocal`
- [x] 2.2 Pruebas: el servicio lee solo los archivos declarados; respeta el orden; `LectorFuenteLocal` con un directorio temporal falso (stub de `fs`)
- [x] 2.3 Exportar `DeteccionStackService` y `LectorFuente` en `construccion.module.ts`; avisar a Eduardo (contrato v2)

## 3. Trabajador

- [x] 3.1 `PasoRecepcion` detecta, escribe `Dockerfile.deploya`, guarda `Proyecto.receta`; `PasoConstruccion` usa la ruta recibida; el artefacto guarda `receta`
- [x] 3.2 Pruebas: «Construcción con receta» con stubs de clon y constructor; la bitácora registra el stack detectado

## 4. Alta (con Eduardo)

- [ ] 4.1 Eduardo: `LectorFuenteGitHub` y llamada en 11a; textos de 11a y 11e según el contrato v2
- [ ] 4.2 Pruebas de M3 (Eduardo): «Repositorio sin Dockerfile con stack reconocido», «Falta el Dockerfile y no se reconoce el stack»

## 5. Cierre

- [ ] 5.1 `pnpm check` en verde; cobertura ≥ 80 % en `construccion/deteccion`
- [ ] 5.2 En compose: rama `sin-dockerfile` de `hola-deploya` termina Saludable con receta `node`
- [ ] 5.3 Quitar «detección de stack» de *Fuera de alcance* en `openspec/specs/proyectos/spec.md` y `motor-construccion/spec.md` al archivar; ADR 0003 a Aceptado
