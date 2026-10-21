# Contribuir a Deploya

## Proponer un change

OpenSpec va primero. Antes de codear, proponer un change con `/opsx-propose` en el chat del repositorio. El change queda en `openspec/changes/` (proposal, spec delta, design y tasks) y su nombre es el de la rama. Luego `/opsx-apply`. Tras el merge, `/opsx-archive` pasa el delta al spec del módulo en `openspec/specs/<modulo>/`.

Un change por pull request. La integración es solo por PR, con la plantilla [`.github/PULL_REQUEST_TEMPLATE.md`](.github/PULL_REQUEST_TEMPLATE.md).

## Nombrar la rama

Nunca commits ni push a `main`. La rama sale de `origin/main` actualizado:

| Prefijo | Cuándo |
|---|---|
| `feat/m<n>-<slug>` | Historia de un módulo |
| `fix/` | Corrección |
| `docs/` | Solo documentación |
| `chore/` | CI, dependencias, andamiaje |

## Commits

[Conventional Commits](https://www.conventionalcommits.org/) con ámbito: `feat(m1):`, `fix(m4):`, `docs:`, `chore:`.

## Antes de pedir revisión

`pnpm check` en verde (pruebas, build y diagramas; lo mismo que CI).

El flujo del equipo está en [docs/guia-equipo.md](docs/guia-equipo.md).
