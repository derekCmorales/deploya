# Tasks

Requiere `feat-m3-eliminar-proyecto` y el layout del proyecto (PR #31) en `main`. Sin base ni red reales.

## 1. API

- [ ] 1.1 `CambiosProyecto` y errores `NombreRepetido`, `RutaInvalida`, `PuertoInvalido` (reusa `RepositorioInaccesible` y `RamaInexistente`)
- [ ] 1.2 Pruebas: cada regla del VO con valores límite
- [ ] 1.3 `RepositorioProyectos.actualizar` (Prisma y memoria), `ProyectosService.configurar`, `PATCH /proyectos/:id`
- [ ] 1.4 Pruebas: «Renombrar no cambia el subdominio», «Cambiar la rama aplica en el próximo despliegue», «Rama inexistente», «Nombre repetido», proyecto ajeno → 404

## 2. Web

- [ ] 2.1 `/projects/[proyecto]/configuracion` (19) con borrador, «Descartar», «Guardar cambios» y «Zona de peligro»; el `Dialog` 19b con conteos reales; quitar «Eliminar proyecto» del detalle de la lista
- [ ] 2.2 Pruebas `node --test`: `cambiosDe` (solo lo que cambió), `confirmacionCoincide` (ya existe; se mueve)
- [ ] 2.3 Revisión contra los artboards 19 y 19b en claro y oscuro

## 3. Cierre

- [ ] 3.1 `clases-unificado.mmd`; `pnpm check` en verde; cobertura ≥ 80 % en `proyectos/`
- [ ] 3.2 Demo: cambiar la rama de `hola-deploya` a `sin-dockerfile` → Desplegar → «Stack detectado: Node.js 22»; eliminar desde 19b y `docker ps -a` limpio
- [ ] 3.3 `/opsx-archive` después del merge (después de `feat-m3-eliminar-proyecto`)
