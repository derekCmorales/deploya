# Tasks

Requiere `feat/m4-motor-construccion` en `main` (ya está). Pruebas web con `node --test`; API con Jest y repositorio en memoria.

## 1. Motor (Derek)

- [x] 1.1 `RepositorioDespliegues.porNumero` (Prisma y memoria) y `GET /proyectos/:id/despliegues/:numero`
- [x] 1.2 Pruebas: «Consultar por número», «Número inexistente o proyecto ajeno»

## 2. Lógica web pura

- [x] 2.1 `lib/despliegues.ts`: `fusionarLineas`, `lineaDeError`, `textoParaCopiar`, `tiempoTranscurrido`, `avisoVersionAnterior`
- [x] 2.2 Pruebas: «Construcción en curso» (las líneas nuevas se agregan en orden sin duplicar), «Construcción fallida» (línea del error y aviso de la versión anterior), «Copiar bitácora», tiempo transcurrido con `ahora` fijo

## 3. Hooks

- [x] 3.1 `useBitacora(id)` con cursor `desde`; ambos hooks paran al terminar
- [x] 3.2 Pruebas: «El polling termina con el despliegue» con un `pedirApi` doble

## 4. Pantallas 12, 12b y 12c

- [x] 4.1 Layout `/projects/[proyecto]` (cabecera y pestañas; Resumen y Despliegues como «llega en el Avance 3»), página `despliegues/[n]` con los tres estados
- [x] 4.2 «Desplegar» en 11d y la fila de 10 llevan a 12
- [ ] 4.3 Revisión contra los artboards 12, 12b y 12c en claro y oscuro; solo componentes de `apps/web/src/components`

## 5. Cierre

- [ ] 5.1 `pnpm check` en verde
- [ ] 5.2 Demo en compose: `hola-deploya` de punta a punta en 12; rama `roto` termina en 12c con la línea resaltada
- [ ] 5.3 `/opsx-archive` después del merge
