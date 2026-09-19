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
- [ ] Si hay UI: sigue [docs/kit-visual.md](../docs/kit-visual.md) (tokens, AppShell, claro/oscuro) — las pantallas de validación no son el producto de tu módulo
