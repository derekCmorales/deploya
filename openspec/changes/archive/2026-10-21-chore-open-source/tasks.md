# Tasks

Sin Docker, red, base ni reloj reales en las pruebas unitarias. Cada `Scenario` del spec delta tiene su `it(...)` con el mismo nombre.

## 0. Primero

- [x] 0.1 `gitleaks detect` sobre todo el historial; rotar en el VPS cualquier secreto que aparezca (el repo ya es público). Dos hallazgos de `generic-api-key` en el commit `2eed9d6d0a26d119df17dc5b5ce4bc966cf9b0dc`: rutas de módulo `observabilidad/tiempos/` y `observabilidad/consumo/`, no secretos. Allowlist con motivo en `.gitleaks.toml`. No se rotó nada y no se reescribió historia.

## 1. Documentos

- [x] 1.1 `LICENSE`, `README.md`, `CONTRIBUTING.md`, `SECURITY.md`
- [x] 1.2 Prueba: «Contribuir» (revisión por otra persona del equipo)

## 2. Seguridad

- [x] 2.1 `gitleaks` sobre el historial y en CI. El historial ya lo cubren 0.1 y la prueba «Historial sin secretos». Hecho por Derek (acordado con Eddy): paso de gitleaks en CI (job `secretos` de `.github/workflows/ci.yml`: `fetch-depth: 0`, binario oficial 8.30.1 con checksum verificado, `--config .gitleaks.toml --log-opts=--all --redact`; sin acciones de terceros).
- [x] 2.2 Prueba: «Historial sin secretos». Usa `gitleaks` del PATH si es 8.30.1 o superior; si no, baja gitleaks 8.30.1 para linux x64/arm64 o darwin x64/arm64 y comprueba el SHA-256 oficial; otra plataforma falla con cómo instalarlo. Solo completa un clon superficial con `fetch --unshallow` si `CI` está definido. Sin dependencia npm nueva.

## 3. Cierre

- [x] 3.1 Revisión contra el canvas (página «Sprint · fuera de alcance») en claro y oscuro, si hay UI. Este change no tiene UI (pantallas: —); no hay pantalla que revisar.
- [x] 3.2 `clases-unificado.mmd` si cambió un puerto o una clase; `pnpm check` en verde. No cambió ningún puerto ni clase. `pnpm check` en verde.
- [x] 3.3 `/opsx-archive`: archivado en el PR #41 antes del merge
