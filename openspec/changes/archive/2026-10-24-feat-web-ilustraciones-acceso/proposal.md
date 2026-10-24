# Proposal

Change: `feat/web-ilustraciones-acceso`. Módulo dueño: **web (auth)** — Eddy. Specs tocadas: `identidad`. Historias: **SP-01 (2 pts)** (sprint fuera de alcance, [plan-avances.md § Sprint fuera de alcance](../../../docs/plan-avances.md#sprint-fuera-de-alcance)). Pantallas: 01 Registro y 03 Iniciar sesión (artboard e idea a elección de Eddy).

## Why

Las ilustraciones de 01 y 03 ya tienen un poco de movimiento (`dy-flota`, `dy-giro-lento`). Eddy quiere experimentar con más, sin salirse del canvas. Es la única parte del producto donde el design system permite ilustraciones, así que es donde se puede dar personalidad sin tocar el resto.

## What Changes

- Eddy elige el artboard y la idea: animar las ilustraciones actuales, rehacerlas o partir del «Plano del servicio» de Deploya V4. La propuesta se sube al canvas antes de construir.
- `ilustracion-registro.tsx` e `ilustracion-ingreso.tsx` con el movimiento nuevo.
- Si sale una utilidad reutilizable (`dy-…`), va a `globals.css` y a la tabla Movimiento de `docs/diseno/README.md`.

## Non-goals

- Ilustraciones fuera de las pantallas de acceso (01, 03 y, si Eddy quiere, 31).
- Librerías nuevas: `framer-motion` ya está instalado.
- Cambios en los formularios, su copy o su validación.

## Capabilities

### New Capabilities

- (ninguna)

### Modified Capabilities

- `identidad`: «Ilustraciones de acceso».

## Impact

- Web: `app/(auth)/registro/ilustracion-registro.tsx`, `app/(auth)/ingresar/ilustracion-ingreso.tsx`; quizá `globals.css` (utilidad `dy-…`) y `docs/diseno/README.md` (tabla Movimiento).
- Sin API ni datos.
