# Tasks

Sin red ni navegador reales en las pruebas. Cada `Scenario` del spec delta tiene su prueba con el mismo nombre (`node --test` en `apps/web`).

## 1. Errores y carga

- [ ] 1.1 `error.tsx` en la raíz y en los cinco grupos, `global-error.tsx`, todos con `ErrorConexionApi` y `reset()`
- [ ] 1.2 `loading.tsx` en `(projects)` con `EsqueletoProyectos` y en los demás grupos con `Skeleton`
- [ ] 1.3 Pruebas: «Error inesperado en una pantalla», «Carga entre rutas»

## 2. Cabeceras, títulos e ícono

- [ ] 2.1 `headers()` en `next.config.ts`
- [ ] 2.2 `title.template`, título en cada `page.tsx`, `openGraph` y `app/icon.svg` con el `Wordmark`
- [ ] 2.3 Pruebas: «Cabeceras de seguridad», «Título por página»

## 3. Accesibilidad

- [ ] 3.1 Correcciones pequeñas de la tabla de DOC-02 (desde el lunes 2), solo atributos y tokens

## 4. Cierre

- [ ] 4.1 Revisión en claro y oscuro de 10c, 28 y del error de un grupo
- [ ] 4.2 `pnpm check` en verde
- [ ] 4.3 `/opsx-archive` después del merge
