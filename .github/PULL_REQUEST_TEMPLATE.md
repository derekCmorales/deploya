## Qué cambia

<!-- Módulo (M1–M10), dueño, y una frase. -->

- Módulo:
- Dueño:
- Change OpenSpec (`feat/m<n>-<slug>`):

## Cómo probar

- [ ] `docker compose up --build` (o `pnpm --filter @deploya/api test` + web)
- [ ] `GET /health` y health del módulo tocado
- [ ] Pasos extra:

## Checklist

- [ ] Rama `feat/` `fix/` `docs/` o `chore/` — **no** `main`
- [ ] Conventional Commit `feat(mN):` / `fix(mN):`
- [ ] Spec OpenSpec actualizado o change enlazado
- [ ] UI del panel usa el kit canónico (`apps/web`) o no toca superficies visuales
