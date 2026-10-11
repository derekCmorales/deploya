# Tasks

Requiere PR #31 en `main` (`banner-bloqueo.tsx`). Pruebas web con `node --test`.

## 1. 10c

- [ ] 1.1 `finDeGracia` y `textoVencida`; banner en `/projects` y botones deshabilitados con la suscripción Vencida
- [ ] 1.2 Pruebas: «Suscripción vencida» (texto con plan, fecha de vencimiento y fin de la gracia), Activa sin banner

## 2. 28

- [ ] 2.1 404 en `app/not-found.tsx` con el diseño de 28
- [ ] 2.2 `ErrorApi` con reintento automático y `esperaDeReintento`; usado en la lista y en el layout del proyecto
- [ ] 2.3 `EsqueletoProyectos` mientras carga la lista
- [ ] 2.4 Pruebas: «Error de conexión con la API» (8, 16, 30, 30 s), «Página inexistente» (muestra la ruta pedida)

## 3. Cierre

- [ ] 3.1 Revisión contra los artboards 10c y 28 en claro y oscuro
- [ ] 3.2 `pnpm check` en verde; `/opsx-archive` después del merge y después de `feat-m5-bloqueos-cuota` (los dos modifican «Límite y estado de la suscripción»)
