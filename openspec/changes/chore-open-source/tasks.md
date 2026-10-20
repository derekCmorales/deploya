# Tasks

Sin Docker, red, base ni reloj reales en las pruebas unitarias. Cada `Scenario` del spec delta tiene su `it(...)` con el mismo nombre.

## 1. Documentos

- [ ] 1.1 `LICENSE`, `README.md`, `CONTRIBUTING.md`, `SECURITY.md`
- [ ] 1.2 Prueba: «Contribuir» (revisión por otra persona del equipo)

## 2. Seguridad

- [ ] 2.1 `gitleaks` sobre el historial y en CI (con Eddy)
- [ ] 2.2 Prueba: «Historial sin secretos»

## 3. Cierre

- [ ] 3.1 Revisión contra el canvas (página «Sprint · fuera de alcance») en claro y oscuro, si hay UI
- [ ] 3.2 `clases-unificado.mmd` si cambió un puerto o una clase; `pnpm check` en verde
- [ ] 3.3 `/opsx-archive` después del merge
