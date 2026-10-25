# Design

## Context

Instalado: `framer-motion` ^13.4 (lo usa `components/magic/border-beam.tsx`), utilidades `dy-flota` (4.2 s) y `dy-giro-lento` (18 s) en `globals.css` que ya se apagan con `prefers-reduced-motion`, Next 15, React 19, Tailwind v4 con tokens como variables CSS.

## Decisions

### 1. Libertad creativa con lineamientos

La idea es de Eddy. Lo que no cambia: solo tokens (sin hex ni gradientes), Señal como un solo acento, `transform`/`opacity` para no mover el layout ni retrasar el primer render, `aria-hidden`, quieto con movimiento reducido.

### 1b. La idea elegida: animar las ilustraciones actuales

Mismas formas de los artboards 01 y 03 del canvas v4.1. Al abrir, una entrada corta y una sola vez: las piezas aparecen escalonadas y la barra de Señal (01) y el horizonte (03) crecen y se quedan. Después, movimiento lento: la órbita gira (01), el arco oscila bajo la cúpula (03), el punto de Señal flota y respira, y el cuadro de Señal de 03 flota desfasado. La vista previa se revisó con Derek antes de construir.

Utilidades nuevas en `globals.css`, junto a `dy-flota` y `dy-giro-lento`: `dy-aparece`, `dy-crece-x`, `dy-crece-centro`, `dy-respira` y `dy-oscila`. Las de entrada toman `--retraso` para escalonar las piezas y usan `--ease-out-dy`. Con movimiento reducido no hay animación y cada pieza queda en su estado final (el halo, oculto). No hizo falta `usarMovimientoReducido`: la media query de CSS basta.

### 2. Sin dependencias nuevas

`framer-motion` o CSS cubren el caso. Si hiciera falta otra librería, se justifica aquí y se avisa en el PR.

## Diseño: SOLID y patrones

| Clase / puerto | Patrón | Principio | Por qué |
|---|---|---|---|
| `IlustracionRegistro`, `IlustracionIngreso` | Componente de presentación | S | Solo dibujan; no saben del formulario |

Cambios de clases y puertos: ninguno (solo componentes web) → `docs/diagramas/compartido/clases-unificado.mmd` en el mismo PR (`pnpm diagramas:sync`).

## Risks / Trade-offs

- **Rendimiento:** animar SVG grandes en equipos lentos; se limita a `transform`/`opacity` y bucles largos.
- **Estilo:** se revisa con el canvas antes de construir.
