# Tasks

Sin Docker, red, base ni reloj reales en las pruebas unitarias. Cada `Scenario` del spec delta tiene su `it(...)` con el mismo nombre.

## 0. Primero

- [x] 0.1 `gitleaks detect` sobre todo el historial; rotar en el VPS cualquier secreto que aparezca (el repo ya es público). Dos hallazgos de `generic-api-key` en el commit `2eed9d6d0a26d119df17dc5b5ce4bc966cf9b0dc`: rutas de módulo `observabilidad/tiempos/` y `observabilidad/consumo/`, no secretos. Allowlist con motivo en `.gitleaks.toml`. No se rotó nada y no se reescribió historia.

## 1. Documentos

- [x] 1.1 `LICENSE`, `README.md`, `CONTRIBUTING.md`, `SECURITY.md`
- [x] 1.2 Prueba: «Contribuir» (revisión por otra persona del equipo)

## 2. Seguridad

- [ ] 2.1 `gitleaks` sobre el historial y en CI (con Eddy). El historial ya lo cubren 0.1 y la prueba «Historial sin secretos». El paso de gitleaks en `.github/workflows` lo agrega Eddy; este change no edita workflows.
- [x] 2.2 Prueba: «Historial sin secretos». Si falta el binario, el test baja gitleaks 8.30.1 (linux x64) y comprueba el checksum; sin dependencia npm nueva.

## 3. Cierre

- [x] 3.1 Revisión contra el canvas (página «Sprint · fuera de alcance») en claro y oscuro, si hay UI. Este change no tiene UI (pantallas: —); no hay pantalla que revisar.
- [x] 3.2 `clases-unificado.mmd` si cambió un puerto o una clase; `pnpm check` en verde. No cambió ningún puerto ni clase. `pnpm check` en verde.
- [ ] 3.3 `/opsx-archive` después del merge. Queda abierto: lo archiva el equipo tras su auditoría, no este change.
