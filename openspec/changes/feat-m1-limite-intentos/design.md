# Design

## Context

SP-17 dejó `LimiteIntentos`, una regla pura en memoria con `espera(origen, ahora)` y `registrarFallo(origen, ahora)`, y `trust proxy` para que `req.ip` sea la IP real detrás de Traefik. Falta aplicarla a las rutas públicas de M1.

## Decisions

### 1. Reusar la regla, no agregar `@nestjs/throttler`

Sin dependencias nuevas. La regla ya está probada; solo se parametriza y se le agrega `limpiar(origen)` para el inicio correcto.

### 2. Clave según el riesgo

Inicio de sesión: `ip|correo` (no bloquea a toda una red por un usuario). Registro: `ip`. Correos: `correo` normalizado (el abuso es contra la bandeja, no contra la IP).

### 3. Correos sin 429

Un 429 en recuperación o reenvío diría que la cuenta existe. Se responde igual y se omite el envío.

### 4. Reloj inyectado

Los controladores pasan `Reloj.ahora()`; nada de `Date.now()` en la regla.

## Diseño: SOLID y patrones

| Clase / puerto | Patrón | Principio | Por qué |
|---|---|---|---|
| `LimiteIntentos` | Policy (regla pura) | S | Decide sin saber de HTTP |
| `LimitesIdentidad` (proveedor con las tres instancias) | Factory | O | Un límite nuevo es otra instancia, no otro `if` |
| `ErroresIdentidadFilter` | Adapter | S | Traduce `DemasiadosIntentos` a 429 + `Retry-After` |
| `Reloj` | Puerto (ya existe) | D | Pruebas sin reloj real |

Cambios de clases: `LimiteIntentos` cambia de carpeta y gana `limpiar`; error de dominio `DemasiadosIntentos` → `docs/diagramas/compartido/clases-unificado.mmd` en el mismo PR (`pnpm diagramas:sync`).

## Risks / Trade-offs

- En memoria: un reinicio de la API borra los conteos. Aceptable con un solo proceso.
- Una red con NAT comparte el límite de registro; 10 por hora alcanza para un salón de clase.
