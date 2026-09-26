## Qué cambia

<!-- Módulo (M1–M10), dueño, y una frase. -->

- Módulo:
- Dueño:
- Change OpenSpec (`feat/m<n>-<slug>`):
- Historia (`M<n>-<nn>`) e issue:

## Cómo probar

- [ ] `pnpm check` en verde (pruebas, build y diagramas; lo mismo que CI)
- [ ] `docker compose up --build` levanta y la historia se puede demostrar
- [ ] `GET /health` y health del módulo tocado
- [ ] Pasos extra:

## Checklist

- [ ] Rama `feat/` `fix/` `docs/` o `chore/` — **no** `main`
- [ ] Conventional Commit `feat(mN):` / `fix(mN):`
- [ ] Spec OpenSpec actualizado o change enlazado
- [ ] **SOLID y patrones** ([docs/ingenieria.md](../docs/ingenieria.md)): servicios dependen de puertos inyectados; sin `new` de Docker/Prisma/SMTP ni `Date.now()` en el dominio; patrones nombrados en el `design.md`
- [ ] **Clean code**: nombres del dominio, funciones cortas, sin números mágicos, errores de dominio con nombre, sin `any`
- [ ] **Pruebas unitarias**: una por cada escenario del spec delta; `pnpm test` en verde; cobertura de dominio/servicios tocados ≥ 80 % (`pnpm --filter @deploya/api test:cov`)
- [ ] Si cambió un puerto, clase o estado: `clases-unificado.mmd` actualizado
- [ ] Si hay UI: sigue [docs/diseno/README.md](../docs/diseno/README.md) y la ficha de tu pantalla en `docs/diseno/pantallas/` — solo componentes y tokens del sistema; revisado en claro y oscuro
