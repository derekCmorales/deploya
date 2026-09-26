# Kit — Eddy (cuentas y seguridad)

[@EddyPoroj106](https://github.com/EddyPoroj106) · extra: seguridad transversal, pruebas, CI.

Alcance: [alcance.md](../../alcance.md) · Entregas: [plan-avances.md](../../plan-avances.md).

## Tus módulos

| Id | Qué entra (núcleo v4.1) | Código |
|---|---|---|
| M1 | Registro, verificación de correo, iniciar y cerrar sesión, recuperar contraseña, Mi cuenta, roles Cliente / Administrador | `apps/api/src/modules/identidad` |
| M10 | `CorreoPuerto` + dos correos: verificación y recuperación | `apps/api/src/modules/notificaciones` |

Web: `apps/web/src/app/(auth)/` · CI: `.github/workflows/`

## Tus pantallas (canvas Deploya v4.1)

| # | Pantalla | Historia |
|---|---|---|
| 01, 01b | Registro y sus estados | M1-01 |
| 02 | Verifica tu correo (bandeja, válido, expirado) | M1-02, M1-04 |
| 03, 03b | Iniciar sesión y estados (credenciales, sin verificar, suspendida) | M1-03, M1-04 |
| 04 | Recuperar contraseña | M1-05 |
| 05, 05b | Mi cuenta · Perfil y Seguridad | M1-06, M1-07 |
| 24 | Correos del sistema | M10-01, M10-02 |
| 28 (403, sesión expirada) | Estados del sistema | M1-04 |

Reglas que fijan las pantallas: contraseña ≥ 12 con mayúsculas, minúsculas, número y símbolo · verificación 24 h, un uso · recuperación 30 min, un uso, respuesta neutra, cierra otras sesiones · sesión expira tras 7 días sin actividad · correo no se puede cambiar.

## Qué entregas

| Avance | Historias | Pts |
|---|---|---|
| **A1 (30 %)** | M10-01 correo de verificación · M1-01 registro · M1-02 verificación · M1-03 login + guard | 10 |
| A2 (50 %) | M1-04 estados, reenviar, roles, 403 · M1-05 recuperar · M10-02 correo de recuperación | 6 |
| A3 (80 %) | M1-06 Perfil · M1-07 Seguridad | 4 |
| Final | QA-01 pruebas e2e del recorrido en CI | 5 |

Detalle del Avance 1 y lo que presentas: [plan-avances.md § Eddy](../../plan-avances.md#eddy--cuentas-10-pts).

**Dependencia crítica:** el resto de módulos necesita `SesionGuard` y `@UsuarioActual()`. Publícalos pronto, aunque el login todavía no tenga todos los estados.

## Fuera de alcance · solo si da el tiempo

Bitácora de auditoría completa · roles Operador y Soporte · cambio de correo · segundo factor · correos de despliegue y de vencimiento de plan.

## Qué no tocas (salvo PR conjunta)

Motor M4–M6, schema de Prisma (pide tus modelos a Javier), UI de proyectos, pagos, administración.

## Diagramas

1. [m1-m10-componentes.mmd](../../diagramas/m1-m10/m1-m10-componentes.mmd)
2. [m1-actividad-registro.mmd](../../diagramas/m1-m10/m1-actividad-registro.mmd)
3. [m1-actividad-verificacion-correo.mmd](../../diagramas/m1-m10/m1-actividad-verificacion-correo.mmd)
4. [m1-actividad-recuperacion-contrasena.mmd](../../diagramas/m1-m10/m1-actividad-recuperacion-contrasena.mmd)
5. [m1-m10-casos-de-uso-autenticacion.mmd](../../diagramas/m1-m10/m1-m10-casos-de-uso-autenticacion.mmd) — los casos de Operador y Soporte quedan fuera de alcance

## Specs OpenSpec

- [openspec/specs/identidad/spec.md](../../../openspec/specs/identidad/spec.md)
- [openspec/specs/notificaciones/spec.md](../../../openspec/specs/notificaciones/spec.md)

Rama `feat/m1-<slug>` o `feat/m10-<slug>`. Commit `feat(m1):`.

## Reviewer

Tú en M1/M10 y workflows. **Derek** en infra y CI transversal.
