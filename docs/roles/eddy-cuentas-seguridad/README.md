# Kit — Eddy (cuentas y seguridad)

[@EddyPoroj106](https://github.com/EddyPoroj106) · extra: seguridad transversal, pruebas, CI.

## Tus módulos

| Id | Qué | Código |
|---|---|---|
| M1 | Identidad y acceso: registro, correo, recuperación, auth, sesiones, roles, auditoría | `apps/api/src/modules/identidad` |
| M10 | Notificaciones: cuenta, resultado de despliegue, vencimiento de plan | `apps/api/src/modules/notificaciones` |

Web: `apps/web/src/app/(auth)/` · CI: `.github/workflows/`

UI de cuenta: mismo kit que el resto del panel — [kit-visual.md](../../kit-visual.md). Reutiliza `AppShell` (ya envuelve el layout), primitivos de `@/components/ui` y el toggle claro/oscuro. No inventes paleta. `/auth` hoy es un stub que apunta a esa guía.

## Qué no tocas (salvo PR conjunta)

Motor M4–M6, Prisma de producto (Javier), UI de proyectos, pagos, administración.

## Diagramas tuyos primero

1. [m1-m10-componentes.mmd](../../diagramas/m1-m10/m1-m10-componentes.mmd)
2. [m1-actividad-registro.mmd](../../diagramas/m1-m10/m1-actividad-registro.mmd)
3. [m1-actividad-verificacion-correo.mmd](../../diagramas/m1-m10/m1-actividad-verificacion-correo.mmd)
4. [m1-actividad-recuperacion-contrasena.mmd](../../diagramas/m1-m10/m1-actividad-recuperacion-contrasena.mmd)
5. [m1-m10-casos-de-uso-autenticacion.mmd](../../diagramas/m1-m10/m1-m10-casos-de-uso-autenticacion.mmd)

El resto del sistema: [C4 / ERD](../../diagramas/compartido/).

## Specs OpenSpec

- [openspec/specs/identidad/spec.md](../../../openspec/specs/identidad/spec.md)
- [openspec/specs/notificaciones/spec.md](../../../openspec/specs/notificaciones/spec.md)

## Primeras historias (no las implementes en el bootstrap)

1. Registro con correo pendiente de verificación.  
2. Verificación de correo y sesión.  
3. Recuperación de contraseña.  
4. Aviso M10 al verificar cuenta.

Rama: `feat/m1-<slug>`. Commit: `feat(m1):`.

## Reviewer

Tú en M1/M10 y workflows. **Derek** en infra/CI transversal.
