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

Nada de `Date.now()` en la regla: quien la usa le pasa `Reloj.ahora()`.

### 5. El límite vive en los servicios

Los controladores solo pasan el `origen` (`req.ip`, con `trust proxy`; helper `origen-solicitud.ts`, el mismo del asistente 31). `SesionService`, `IdentidadService` y `RecuperacionService` reciben `LimitesIdentidad` por constructor y deciden. Sin `origen` no hay límite de sesión ni de registro: el asistente 31 inicia la sesión del administrador recién creado sin pasar por él. El inicio de sesión solo cuenta `CredencialesInvalidas`; una contraseña correcta limpia el conteo aunque la cuenta esté pendiente o suspendida. El registro cuenta cada intento, se cree o no la cuenta.

### 6. Correos: una clave por tipo, y el reenvío conserva su cuenta atrás

`verificacion|correo` y `recuperacion|correo` llevan cuentas separadas de 3 por hora. El reenvío sigue respondiendo 429 `EsperaReenvio` dentro de los 60 s de M1-04 (02 muestra la cuenta atrás); el límite por hora se aplica después y en silencio.

### 7. La web lee `segundos` del cuerpo

La API manda `Retry-After` y, como `EsperaReenvio`, `segundos` en el cuerpo. La web usa el cuerpo: entre orígenes el navegador no deja leer `Retry-After` sin `exposedHeaders` en `main.ts`, que queda fuera del change. 04 no recibe 429 (decisión 3), así que el aviso va en 01 y 03.

## Diseño: SOLID y patrones

| Clase / puerto | Patrón | Principio | Por qué |
|---|---|---|---|
| `LimiteIntentos` | Policy (regla pura) | S | Decide sin saber de HTTP |
| `LimitesIdentidad` (proveedor con las tres instancias) | Factory | O | Un límite nuevo es otra instancia, no otro `if` |
| `ErroresIdentidadFilter` | Adapter | S | Traduce `DemasiadosIntentos` a 429 + `Retry-After` |
| `Reloj` | Puerto (ya existe) | D | Pruebas sin reloj real |

Cambios de clases: `LimiteIntentos` cambia de carpeta, `registrarFallo` pasa a `registrar` y gana `limpiar`; `LimitesIdentidad` (Factory, también da el límite del código de SP-17); error de dominio `DemasiadosIntentos` → `docs/diagramas/compartido/clases-unificado.mmd` en el mismo PR (`pnpm diagramas:sync`).

## Risks / Trade-offs

- En memoria: un reinicio de la API borra los conteos. Aceptable con un solo proceso.
- Una red con NAT comparte el límite de registro; 10 por hora alcanza para un salón de clase.
