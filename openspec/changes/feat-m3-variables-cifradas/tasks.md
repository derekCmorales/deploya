# Tasks

Requiere el layout del proyecto de `feat/m7-vista-despliegue` para la pantalla 17 (o crearlo aquí si llega antes). Sin base, red ni Docker reales.

## 1. Dominio y cifrado (Eduardo)

- [ ] 1.1 `ClaveVariable`, `ConjuntoVariables`, errores `ClaveInvalida`, `ClaveReservada`, `ValorDemasiadoLargo`, `DemasiadasVariables`, `VariableIlegible`; constantes
- [ ] 1.2 Pruebas: «Clave inválida», «PORT es reservada», límites de valor y cantidad
- [ ] 1.3 `CifradorVariables`, `CifradorAesGcm`, `CifradorFalso`; lectura de `CLAVE_CIFRADO_VARIABLES`
- [ ] 1.4 Pruebas: ida y vuelta, IV distinto en cada cifrado, valor alterado → `VariableIlegible`, clave de largo incorrecto rechazada

## 2. Repositorio, servicio y API (Eduardo)

- [ ] 2.1 `RepositorioVariables` (Prisma y memoria); `VariablesProyectoService` (`listar`, `mostrar`, `reemplazar`, `descifradasDe`); rutas de la proposal; `POST /proyectos` con `variables`
- [ ] 2.2 Pruebas: «Guardar variable» (en la base solo `v1:…`), «Guardar y desplegar», «Mostrar valor», «Variable de otro cliente», una entrada sin valor conserva el anterior

## 3. Al contenedor (Derek)

- [ ] 3.1 `VariablesEntornoPuerto` en M5, adaptador sobre `VariablesProyectoService`, `PasoEjecucion` las pasa a `aprovisionar`; la bitácora registra solo la cantidad (**hecho salvo el adaptador**: hoy el binding es `VariablesEntornoPendientes`; falta cambiarlo por el adaptador sobre `descifradasDe` cuando M3-03 esté en `main`, que traduce `VariableIlegible` a `VariablesIlegibles`)
- [x] 3.2 Pruebas: «Variables llegan al contenedor», «La bitácora no muestra valores», «Variable ilegible»

## 4. Web (Eduardo)

- [ ] 4.1 11c en el asistente (tabla clave / valor enmascarado, «Añadir variable», aviso de `PORT`); 17 con borrador, Descartar, Guardar, Guardar y desplegar (lleva a 12), Mostrar / Ocultar
- [ ] 4.2 Pruebas `node --test`: validación de clave en el cliente, conteo de «cambios sin aplicar», armado del cuerpo del `PUT`
- [ ] 4.3 Revisión contra los artboards 11c y 17 en claro y oscuro

## 5. Cierre

- [ ] 5.1 `CLAVE_CIFRADO_VARIABLES` en `docker-compose.yml` y `.env.example`; `clases-unificado.mmd` y `pnpm diagramas:sync`
- [ ] 5.2 `pnpm check` en verde; cobertura ≥ 80 % en `proyectos/` y `orquestacion/`
- [ ] 5.3 Demo en compose: `hola-deploya` muestra `SALUDO`; cambiarla en 17 → Guardar y desplegar → la app nueva responde con el valor nuevo sin corte
- [ ] 5.4 `/opsx-archive` después del merge
