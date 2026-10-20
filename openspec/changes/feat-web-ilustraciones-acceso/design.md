# Design

## Context

Instalado: `framer-motion` ^13.4 (lo usa `components/magic/border-beam.tsx`), utilidades `dy-flota` (4.2 s) y `dy-giro-lento` (18 s) en `globals.css` que ya se apagan con `prefers-reduced-motion`, Next 15, React 19, Tailwind v4 con tokens como variables CSS.

## Decisions

### 1. Libertad creativa con lineamientos

La idea es de Eddy. Lo que no cambia: solo tokens (sin hex ni gradientes), Señal como un solo acento, `transform`/`opacity` para no mover el layout ni retrasar el primer render, `aria-hidden`, quieto con movimiento reducido.

### 2. Sin dependencias nuevas

`framer-motion` o CSS cubren el caso. Si hiciera falta otra librería, se justifica aquí y se avisa en el PR.

## Diseño: SOLID y patrones

| Clase / puerto | Patrón | Principio | Por qué |
|---|---|---|---|
| `IlustracionRegistro`, `IlustracionIngreso` | Componente de presentación | S | Solo dibujan; no saben del formulario |
| `usarMovimientoReducido` (si se necesita) | Hook | S, D | Una sola fuente para la preferencia de movimiento |

Cambios de clases y puertos: ninguno (solo componentes web) → `docs/diagramas/compartido/clases-unificado.mmd` en el mismo PR (`pnpm diagramas:sync`).

## Risks / Trade-offs

- **Rendimiento:** animar SVG grandes en equipos lentos; se limita a `transform`/`opacity` y bucles largos.
- **Estilo:** se revisa con el canvas antes de construir.
