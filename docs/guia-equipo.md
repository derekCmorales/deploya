# Guía de equipo — git y OpenSpec

Cómo entra el código. Producto: [propuesta.md](propuesta.md). Rituales: [METODOLOGIA.md](../METODOLOGIA.md).

## OpenSpec

El harness ya está (comandos `opsx-*` y skills). **No reescribir** `.cursor/skills/openspec-*`.

Flujo en el chat del **repositorio**:

| Paso | Comando | Qué produce |
|---|---|---|
| 1. Plan | `/opsx-propose` | Change con proposal, spec delta, design, tasks |
| 2. Código | `/opsx-apply` | Implementa las tareas |
| 3. Cerrar | `/opsx-archive` | Tras merge: el delta pasa al spec principal |

Nombre del change = rama: `feat/m1-verificacion-correo`.

El spec vive bajo el módulo: `openspec/specs/identidad/`, `notificaciones/`, `suscripciones/`, `administracion/`, `proyectos/`, `observabilidad/`, `motor-construccion/`, `orquestacion/`, `enrutamiento/`, `herramientas/`.

Semillas = alcance §6.1. Extiéndelas; no las sustituyas por un spec único del producto.

UI: si la historia pinta en `apps/web`, el spec delta **debe** reutilizar [kit-visual.md](kit-visual.md) (tokens, AppShell, tema claro/oscuro). No inventar paleta. Las rutas actuales son stubs del kit, no el producto de cada módulo.

## Ramas

```
feat/m<n>-<slug>     historia de módulo
fix/<slug>           corrección
docs/<slug>          solo docs
chore/<slug>         CI, deps, andamiaje
```

Ejemplos: `feat/m2-renovacion`, `fix/m4-cola-redis`, `docs/erd`.

**Nunca commits a `main`.** Integra solo con PR.

## Commits

[Conventional Commits](https://www.conventionalcommits.org/) con ámbito de módulo:

```
feat(m1): registrar cuenta pendiente de verificación
fix(m5): aplicar límite de memoria del plan
docs(m3): enlazar actividad de alta de proyecto
chore: actualizar workflow de CI
```

Ámbitos: `m1` … `m10`, o `web`, `api`, `ci` si el cambio es transversal.

## Pull requests

1. Rama desde `main` actualizado.  
2. PR con la plantilla: módulo, dueño, change OpenSpec, cómo probar.  
3. CI verde (Eddy es dueño de workflows).  
4. Review: **dueño del módulo**. Derek revisa infra, compose, adaptadores y motor.  
5. Squash o merge según lo que active Derek en GitHub; la protección de `main` la activa él.

CODEOWNERS: [../CODEOWNERS](../CODEOWNERS).

## Primer día

1. [README.md](../README.md) — cinco pasos Compose.  
2. [METODOLOGIA.md](../METODOLOGIA.md).  
3. Tu kit en [roles/](roles/).  
4. [arquitectura.md](arquitectura.md) (C4 + ciclo).  
5. Tu spec en `openspec/specs/…`.
