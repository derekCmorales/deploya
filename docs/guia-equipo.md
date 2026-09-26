# Guía de equipo — git y OpenSpec

Cómo entra el código. Producto: [propuesta.md](propuesta.md). Rituales: [METODOLOGIA.md](../METODOLOGIA.md).

## OpenSpec

El harness ya está: comandos `opsx-*` y skills generados por OpenSpec para cada herramienta (`.agents/`, `.claude/`, `.cursor/`, `.github/`, `.opencode/`). **No se editan a mano.**

Flujo en el chat del **repositorio**:

| Paso | Comando | Qué produce |
|---|---|---|
| 1. Plan | `/opsx-propose` | Change con proposal, spec delta, design, tasks |
| 2. Código | `/opsx-apply` | Implementa las tareas |
| 3. Cerrar | `/opsx-archive` | Tras merge: el delta pasa al spec principal |

Nombre del change = rama: `feat/m1-verificacion-correo`.

El spec vive bajo el módulo: `openspec/specs/identidad/`, `notificaciones/`, `suscripciones/`, `administracion/`, `proyectos/`, `observabilidad/`, `motor-construccion/`, `orquestacion/`, `enrutamiento/`, `herramientas/`.

Los specs base ya reflejan el **alcance núcleo v4.1** ([alcance.md](alcance.md)); cada uno tiene su sección *Fuera de alcance · solo si da el tiempo*. Extiéndelos con changes; no los sustituyas por un spec único del producto. Tomar algo de esa sección exige un change propio y haber terminado lo **Debe** del módulo.

UI: si la historia pinta en `apps/web`, el spec delta **debe** reutilizar el design system ([diseno/README.md](diseno/README.md)) y construirse con la [guía](diseno/guia-construccion.md) y la ficha de su pantalla. No inventar paleta. Las rutas actuales son stubs del kit, no el producto de cada módulo.

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

1. Rama desde `main` actualizado: `git fetch origin && git switch -c feat/m1-registro origin/main`.
2. Para ponerte al día a mitad de camino: `git merge origin/main` (no `rebase` sobre una rama que otro ya revisó; nunca force-push a `main`).
3. Antes de pedir revisión: `pnpm check` (pruebas, build y diagramas, lo mismo que CI).
4. PR con la plantilla: módulo, dueño, change OpenSpec, cómo probar y el checklist de calidad ([ingenieria.md](ingenieria.md)).
5. CI verde (Eddy es dueño de workflows), con las pruebas unitarias de la historia.
6. Review: **dueño del módulo**. Derek revisa infra, compose, adaptadores, motor, contratos y diagramas. CODEOWNERS los asigna solo.
7. Squash o merge según lo que active Derek en GitHub; la protección de `main` la activa él.

Buenas prácticas del equipo:

- **PR pequeño:** una historia por PR; si pasa de ~400 líneas de código (sin lockfile ni generados), pártelo por tarea del change.
- **PR en borrador** apenas tengas algo que mostrar; así los demás ven por dónde vas y el contrato que usas.
- **Revisión en menos de 24 h** (en semana de entrega, el mismo día). El revisor usa el checklist de la plantilla y comenta con propuesta, no solo con el problema.
- **Contratos primero:** si tu historia cambia algo que otro consume (`docs/contratos/`, schema de Prisma, `SesionGuard`, `cuotaDe`), avisa en la sincronización y en el PR antes de mergear.
- **Bloqueado más de 2 horas:** avisa en el grupo con qué necesitas y de quién.
- **Issues:** plantillas *Historia* y *Error* en `.github/ISSUE_TEMPLATE/`; el título lleva el id de la historia (`M1-01: …`).

CODEOWNERS: [../.github/CODEOWNERS](../.github/CODEOWNERS).

## Primer día

1. [README.md](../README.md) — cinco pasos Compose.  
2. [alcance.md](alcance.md) y [plan-avances.md](plan-avances.md) — qué entra y qué te toca en cada avance.  
3. [METODOLOGIA.md](../METODOLOGIA.md).  
4. Tu kit en [roles/](roles/).  
5. [arquitectura.md](arquitectura.md) (C4 + ciclo) e [ingenieria.md](ingenieria.md) (SOLID, clean code, patrones, pruebas).  
6. Tu spec en `openspec/specs/…` y, si hay UI, la ficha de tu pantalla en [diseno/pantallas/](diseno/pantallas/).  
