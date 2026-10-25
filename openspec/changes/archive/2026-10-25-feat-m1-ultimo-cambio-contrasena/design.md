# Design

## Context

M1-07 ya cambia la contraseña y revoca las otras sesiones; M1-05 ya restablece. Ambos tienen `Reloj` inyectado.

## Decisions

### 1. La fecha la escribe M1

Javier crea la columna (dueño de `prisma/`), pero el único escritor es M1 (regla 1 de datos-nucleo).

### 2. Nulo = nunca

No se rellena con la fecha de alta: «Nunca la has cambiado» es más honesto.

### 3. El hash y la fecha se escriben juntos

En lugar de un método aparte (`marcarContrasenaCambiada`), `RepositorioUsuarios.cambiarHash` recibe la fecha como tercer argumento obligatorio y la guarda en el mismo `update`. Todo cambio de hash es un cambio de contraseña, así que la fecha no se puede olvidar y no queda un hash nuevo con la fecha vieja si la segunda escritura fallara. Los dos llamadores (`CuentaService.cambiarContrasena` y `RecuperacionService.restablecer`) pasan el `ahora` del `Reloj` que ya usaban para revocar sesiones.

### 4. En la web, la fecha junto al botón

05b lee `GET /identidad/cuenta` y muestra el texto a la izquierda de «Cambiar contraseña», como en el canvas. Tras un cambio correcto se vuelve a leer, así la fecha es la que guardó la API y no la del navegador. Si la lectura falla, la línea no aparece: no bloquea el formulario.

## Diseño: SOLID y patrones

| Clase / puerto | Patrón | Principio | Por qué |
|---|---|---|---|
| `CuentaService`, `RecuperacionService` | Service Layer | S | Un caso de uso por método |
| `RepositorioUsuarios.cambiarHash(id, hash, cambiadaEn)` | Repository | I, D | El puerto no crece: el mismo método guarda el hash y la fecha en una escritura |
| `textoUltimoCambio` (web) | Función pura | S | El texto de 05b se prueba sin navegador |

Cambios de clases y puertos: `RepositorioUsuarios.cambiarHash` (argumento nuevo) → `docs/diagramas/compartido/clases-unificado.mmd` en el mismo PR (`pnpm diagramas:sync`).

## Risks / Trade-offs

- **Migración:** columna nula, sin backfill; sin riesgo para cuentas existentes.
