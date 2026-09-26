# Cómo trabajamos

Una pasada. Alcance: [docs/alcance.md](docs/alcance.md). Entregas y porcentajes: [docs/plan-avances.md](docs/plan-avances.md). Git y OpenSpec: [docs/guia-equipo.md](docs/guia-equipo.md).

## Scrum — ciclos de dos semanas

El equipo usa Scrum adaptado a cuatro personas con dedicación parcial. Cada ciclo **dura dos semanas** y cierra con un incremento funcional evaluable (alineado a las entregas del curso).

| Ceremonia | Cuándo | Para qué |
|---|---|---|
| Planificación | Inicio de ciclo | Elegir y estimar historias |
| Sincronización | Dos veces por semana | Avance e impedimentos |
| Revisión | Cierre de ciclo | Demo del incremento |
| Retrospectiva | Cierre de ciclo | Acta de una página con acuerdos |

### Avances del curso

Cada entrega evaluada (30 %, 50 %, 80 %, final) cierra un ciclo. El porcentaje se calcula con los puntos de [docs/plan-avances.md](docs/plan-avances.md): solo cuentan historias que cumplen la definición de terminado. Lo de *fuera de alcance* no suma.

### Definición de terminado

Una historia **no está terminada** hasta que el código está:

1. Implementado  
2. Probado  
3. Documentado  
4. Revisado en un PR  
5. Desplegado en el entorno de pruebas (compose en `main`; desde el Avance 3, el VPS)  
6. Demostrable con la pantalla v4.1 que le corresponde  

## OpenSpec antes de codear

En el chat del **repo** (no en un plan suelto):

```
/opsx-propose  →  /opsx-apply  →  /opsx-archive
```

1. **Propose** — change `feat/m<n>-<slug>` bajo el spec del módulo.  
2. **Apply** — implementar las tareas del change.  
3. **Archive** — fusionar el delta al spec principal cuando el PR entra.

Specs semilla: `openspec/specs/<modulo>/`. Guía: [docs/guia-equipo.md](docs/guia-equipo.md).

## Ramas y PRs — nunca a `main`

| Prefijo | Uso |
|---|---|
| `feat/m<n>-<slug>` | Historia de un módulo (`feat/m1-registro`) |
| `fix/` | Corrección |
| `docs/` | Solo documentación |
| `chore/` | Herramientas, CI, deps |

- **Nunca** hagas commit ni push directo a `main`.  
- Commits: Conventional Commits con ámbito de módulo, p. ej. `feat(m1): verificar correo`.  
- Todo entra por **PR** con al menos **una revisión** (dueño del módulo; Derek en infra/motor).  
- Plantilla: `.github/PULL_REQUEST_TEMPLATE.md`.

## Dueños de módulo

| Rol | Persona | GitHub | Toca | No toca (salvo PR conjunta) |
|---|---|---|---|---|
| Arquitecto | Derek | [@derekCmorales](https://github.com/derekCmorales) | M4 M5 M6, compose, adaptadores, VPS | UI de producto, auth, pagos |
| Cuentas | Eddy | [@EddyPoroj106](https://github.com/EddyPoroj106) | M1 M10, `(auth)`, CI | Motor, Prisma de producto, UI de proyectos |
| Monetización | Javier | [@Javier-r04](https://github.com/Javier-r04) | M2 M9, `(billing)` `(admin)`, Prisma | Motor Docker, identidad |
| Proyectos | Eduardo | [@Portillo17e](https://github.com/Portillo17e) | M3 M7, `(projects)`, `apps/web` | Auth real, pagos, cola M4 |

Kit de una pantalla: [docs/roles/](docs/roles/).

## Estado del repo

- El **design system v4.1** está migrado ([docs/diseno/](docs/diseno/README.md)): tokens, componentes y catálogo en `/sistema`. Las rutas de producto aún son stubs; cada historia construye su pantalla encima, sin paleta nueva.  
- Terminó el bootstrap: stubs + health por módulo. Desde el Avance 1 entra el dominio real, historia por historia ([docs/plan-avances.md](docs/plan-avances.md)).  
- Lo que no es ni será (salvo que sobre tiempo): la lista *fuera de alcance* de [docs/alcance.md](docs/alcance.md).
